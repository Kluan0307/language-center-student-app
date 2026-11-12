import {router,useLocalSearchParams,useFocusEffect} from 'expo-router';
import {useCallback,useRef,useState} from 'react';
import {AppState,Platform,Text} from 'react-native';
import {SessionGate} from '../../components/SessionGate';
import {Button,Card,Heading,Screen,StateView,textStyles} from '../../components/ui';
import {useSession} from '../../providers/SessionProvider';
import {useNotificationInbox} from '../../providers/NotificationProvider';
import {formatMoney,financialLink} from '../finance/utils';
import {financeEvents} from '../finance/events';
import {TextLink} from '../finance/Links';
import {validOrderId} from './storage';
import type {Order,PaymentContext} from './types';
import {paymentStage} from './flow';
import {openPayment,reservePaymentWindow,wasPaymentOpened,paymentBrowserError} from './browser';

export default function OrderDetail(){return <SessionGate><Content/></SessionGate>;}
function Content(){
  const {id,returned:returnedParam}=useLocalSearchParams();const key=validOrderId(id)?id:null;
  const {api,identity}=useSession();const account=identity?.accountId;const inbox=useNotificationInbox();
  const cacheKey=account+':'+key;
  const [result,setResult]=useState<{key:string;order:Order}>(),[error,setError]=useState<{key:string;text:string}>();
  const [busy,setBusy]=useState(false),[refreshing,setRefreshing]=useState(false),[details,setDetails]=useState(false),[returned,setReturned]=useState<string>();
  const [paused,setPaused]=useState(false);const generation=useRef(0),flight=useRef(false),announced=useRef<string|undefined>(undefined);
  const checkRef=useRef<()=>void>(()=>{});const data=result?.key===cacheKey?result.order:undefined;
  const message=(error?.key===cacheKey?error.text:undefined)??(account&&key?paymentBrowserError(account,key):undefined);
  const afterBank=returned===cacheKey||returnedParam==='1'||!!(account&&key&&wasPaymentOpened(account,key));
  const stage=data?paymentStage(data,afterBank):null;

  useFocusEffect(useCallback(()=>{
    if(!key||!account)return;const epoch=++generation.current;const controller=new AbortController();setBusy(false);
    let fetching=false,attempts=0,failures=0,deadline=Date.now()+75000,timer:ReturnType<typeof setTimeout>|undefined;
    let last:Order|undefined;
    const active=()=>epoch===generation.current&&!controller.signal.aborted;
    async function refresh(){
      if(!active()||fetching||AppState.currentState!=='active')return;
      fetching=true;setRefreshing(true);clearTimeout(timer);
      try{
        const next=await api<Order>('/finance/student/me/payment-orders/'+key,{signal:controller.signal});if(!active())return;
        failures=0;
        if(!last||next.version>last.version||next.version===last.version&&!(last.state==='EXPIRED'&&next.state==='PENDING'))last=next;
        setResult({key:cacheKey,order:last});setError(undefined);
        if(last.state==='SUCCEEDED'&&announced.current!==cacheKey){announced.current=cacheKey;financeEvents.notify();inbox.reload();}
      }catch{if(active()){failures++;setError({key:cacheKey,text:'Chưa kiểm tra được kết quả mới. Trạng thái đang hiển thị là lần xác nhận gần nhất; không thanh toán lại nếu đã bị trừ tiền.'});}}
      finally{
        fetching=false;if(active()){
          setRefreshing(false);attempts++;
          const pending=!last||last.state==='PENDING'||last.state==='CREATED';
          if(pending&&attempts<10&&Date.now()<deadline&&failures<3){timer=setTimeout(()=>void refresh(),Math.min(3000+attempts*1500,10000));}
          else if(pending)setPaused(true);
        }
      }
    }
    function resume(){if(!active())return;attempts=0;failures=0;deadline=Date.now()+75000;setPaused(false);void refresh();}
    checkRef.current=resume;void refresh();
    const subscription=AppState.addEventListener('change',state=>{if(state==='active')resume();else clearTimeout(timer);});
    const unsubscribe=financeEvents.subscribe(resume);
    const webFocus=()=>resume();if(Platform.OS==='web')window.addEventListener('focus',webFocus);
    return()=>{generation.current++;controller.abort();clearTimeout(timer);subscription.remove();unsubscribe();if(Platform.OS==='web')window.removeEventListener('focus',webFocus);checkRef.current=()=>{};};
  },[api,key,account,cacheKey,inbox.reload]));

  async function bank(){
    if(!data||!account||flight.current)return;
    const epoch=generation.current;const active=()=>epoch===generation.current;
    const reserved=reservePaymentWindow();flight.current=true;setBusy(true);setError(undefined);
    try{
      const context=await api<PaymentContext>('/finance/student/me/tuitions/'+data.tuitionId+'/payment-context');if(!active()){reserved?.close();return;}
      if(context.action!=='RESUME'||context.order?.id!==data.id){reserved?.close();throw Error(context.message);}
      const fresh=await api<Order>('/finance/student/me/payment-orders/'+data.id);if(!active()){reserved?.close();return;}
      setResult({key:cacheKey,order:fresh});
      if(fresh.state!=='PENDING'||fresh.reviewRequired){reserved?.close();checkRef.current();return;}
      setReturned(cacheKey);await openPayment(fresh,account,reserved);
    }catch(e){reserved?.close();if(active())setError({key:cacheKey,text:e instanceof Error?e.message:'Chưa mở được cổng thanh toán. Bạn có thể thử tiếp tục phiên này.'});}
    finally{flight.current=false;if(active()){setBusy(false);checkRef.current();}}
  }

  return <Screen><Heading title="Kết quả thanh toán"/>
    {!key?<StateView title="Đường dẫn không hợp lệ" description="Hãy mở giao dịch từ Học phí."/>:
      !data&&!message?<StateView loading title="Đang kiểm tra giao dịch" description="Vui lòng chờ."/>:
      !data?<StateView title="Chưa kiểm tra được kết quả" description={message!} action={{title:'Kiểm tra lại',onPress:()=>checkRef.current()}}/>:
      <><Card><Text style={textStyles.section}>{stage!.title}</Text><Text style={textStyles.label}>{formatMoney(data.amount)}</Text><Text style={textStyles.body}>{data.className??'Khoản học phí'}{data.courseName?' · '+data.courseName:''}</Text><Text style={textStyles.body}>{stage!.description}</Text>
        <Text style={textStyles.body}>{data.environment==='SANDBOX'?'VNPAY sandbox · Giao dịch thử nghiệm':'Giao dịch thuộc môi trường không được hỗ trợ'}</Text>
        {message&&<Text accessibilityRole="alert" style={textStyles.body}>{message}</Text>}
        {refreshing&&<Text style={textStyles.body}>Đang cập nhật trạng thái…</Text>}
        {data.state==='SUCCEEDED'&&data.receiptId?<Button title="Xem phiếu thu" onPress={()=>router.push({pathname:'/receipts/[id]',params:{id:String(data.receiptId)}})}/>:
          stage!.action==='support'?<Button title="Yêu cầu trung tâm kiểm tra" onPress={()=>router.push(financialLink('TUITION',data.tuitionId))}/>:
          stage!.action==='tuition'?<Button title="Kiểm tra khoản học phí" onPress={()=>router.push({pathname:'/tuitions/[id]',params:{id:String(data.tuitionId)}})}/>:
          stage!.action==='continue'?<Button title={busy?'Đang mở…':'Tiếp tục thanh toán'} disabled={busy} onPress={()=>void bank()}/>:
          <Button title={refreshing?'Đang kiểm tra…':'Kiểm tra lại kết quả'} disabled={refreshing} onPress={()=>checkRef.current()}/>}
        {data.reviewRequired&&data.state==='SUCCEEDED'&&<><Text style={textStyles.body}>Phiếu trên đã được ghi nhận, nhưng có thông tin giao dịch bổ sung cần kiểm tra. Vui lòng liên hệ trung tâm.</Text><TextLink title="Nhờ trung tâm kiểm tra" onPress={()=>router.push(financialLink('TUITION',data.tuitionId))}/></>}
        {data.state==='PENDING'&&!data.reviewRequired&&afterBank&&<TextLink title={busy?'Đang mở…':'Chưa thanh toán? Tiếp tục phiên này'} disabled={busy} onPress={()=>void bank()}/>}
        {paused&&data.state==='PENDING'&&<Text style={textStyles.body}>Ứng dụng đã tạm dừng kiểm tra tự động. Bạn có thể kiểm tra lại sau; không cần tạo giao dịch mới.</Text>}
        <Text style={textStyles.body}>Mã giao dịch: {data.displayCode??'GD-'+data.id.slice(0,8).toUpperCase()}</Text>
      </Card>
      <TextLink title="Xem học phí và số còn phải đóng" onPress={()=>router.push({pathname:'/tuitions/[id]',params:{id:String(data.tuitionId)}})}/>
      <TextLink title="Chi tiết giao dịch" onPress={()=>setDetails(v=>!v)}/>
      {details&&<Card><Text selectable style={textStyles.body}>Mã đầy đủ: {data.id}</Text><Text style={textStyles.body}>Tạo lúc: {data.createdAt.slice(0,19).replace('T',' ')} (giờ Việt Nam)</Text><Text style={textStyles.body}>Hết hạn: {data.expiresAt.slice(0,19).replace('T',' ')} (giờ Việt Nam)</Text><TextLink title="Kiểm tra lại trạng thái" onPress={()=>checkRef.current()}/></Card>}
      {stage!.action!=='support'&&<TextLink title="Cần hỗ trợ về giao dịch" onPress={()=>router.push(financialLink('TUITION',data.tuitionId))}/>}
      </>}
    <TextLink title="Lịch sử thanh toán" onPress={()=>router.navigate({pathname:'/tuition',params:{tab:'history'}})}/>
  </Screen>;
}
