import {useCallback,useEffect,useRef,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {router,useFocusEffect} from 'expo-router';
import * as Crypto from 'expo-crypto';
import {Button,Card,InlineNotice,StateView,textStyles} from '../../components/ui';
import {useSession} from '../../providers/SessionProvider';
import {useStudentQuery} from '../learning/useStudentQuery';
import type {Tuition} from '../finance/types';
import {formatMoney,financialLink} from '../finance/utils';
import {TextLink} from '../finance/Links';
import {financeEvents} from '../finance/events';
import {pendingCheckout,type CheckoutIntent} from './storage';
import {parseAmount,withinBalance,type Order,type PaymentContext} from './types';
import {definitelyRejected,paymentError,resolvePayment} from './flow';
import {openPayment,reservePaymentWindow,type PaymentWindow} from './browser';

export default function Checkout({tuition:t}:{tuition:Tuition}){
  const {api,identity,status}=useSession();const account=identity?.accountId;
  const context=useStudentQuery<PaymentContext>('/finance/student/me/tuitions/'+t.id+'/payment-context');
  const [partial,setPartial]=useState(false),[amount,setAmount]=useState(''),[confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string>(),[checking,setChecking]=useState(true);
  const [intent,setIntent]=useState<CheckoutIntent|null>(null),[storageError,setStorageError]=useState(false),[readRevision,setReadRevision]=useState(0);
  const generation=useRef(0),flight=useRef(false);const owner=useRef(account);owner.current=account;
  const balance=context.data?.outstanding??t.outstanding;
  useFocusEffect(useCallback(()=>{const n=++generation.current;setChecking(true);setStorageError(false);setIntent(null);setBusy(false);
    if(account)void pendingCheckout.read(account).then(i=>{if(n===generation.current)setIntent(i);}).catch(()=>{if(n===generation.current){setStorageError(true);setError('Chưa đọc được lần thanh toán trước. Hãy kiểm tra lại trước khi tiếp tục.');}}).finally(()=>{if(n===generation.current)setChecking(false);});
    return()=>{generation.current++;};
  },[account,t.id,readRevision]));
  useEffect(()=>{setConfirm(false);},[balance]);
  async function navigate(order:Order,auto:boolean,reserved:PaymentWindow,current:()=>boolean){
    if(!current()){reserved?.close();return false;}
    if(intent)await pendingCheckout.clearIf(intent.accountId,intent.body.requestId);
    if(!current()){reserved?.close();return false;}
    setIntent(null);
    // The result page owns all following checks. Opening the browser is a user action,
    // not a financial state transition.
    if(auto&&order.checkoutUrl&&order.state==='PENDING'&&!order.reviewRequired){
      const opened=openPayment(order,account!,reserved);
      router.push({pathname:'/payment-orders/[id]',params:{id:order.id,returned:'1'}});
      void opened.catch(()=>{}); // result page always offers a fresh, validated continuation
    }else{reserved?.close();router.push({pathname:'/payment-orders/[id]',params:{id:order.id}});}
    return true;
  }
  async function submit(){
    if(flight.current||!account||status!=='authenticated'||checking||storageError)return;
    const n=generation.current;const current=()=>n===generation.current&&owner.current===account;
    const reserved=reservePaymentWindow();flight.current=true;setBusy(true);setError(undefined);
    let op=intent,handed=false;
    try{
      // Recover the persisted request even when it belongs to another tuition.
      // Never submit the displayed tuition's amount with a different request's identity.
      if(!op){
        const fresh=await api<PaymentContext>('/finance/student/me/tuitions/'+t.id+'/payment-context');if(!current())return;
        if(fresh.action==='RESUME'&&fresh.order){const order=await api<Order>('/finance/student/me/payment-orders/'+fresh.order.id);handed=await navigate(order,true,reserved,current);return;}
        if(fresh.action!=='PAY'){context.reload();throw Error(fresh.message);}
        if(fresh.currency!=='VND')throw Error('Vui lòng liên hệ trung tâm để thanh toán khoản này.');
        const value=partial?parseAmount(amount):parseAmount(fresh.outstanding??'');
        if(!value||!fresh.outstanding||!withinBalance(value,fresh.outstanding)||value==='0.00')throw Error('Nhập số tiền lớn hơn 0 và không vượt số còn phải đóng.');
        if(!partial&&balance!==fresh.outstanding){context.reload();throw Error('Số còn phải đóng đã thay đổi. Vui lòng kiểm tra và xác nhận lại.');}
        op={accountId:account,body:{requestId:Crypto.randomUUID(),tuitionId:t.id,amount:value,currency:'VND'}};
        await pendingCheckout.write(op);if(!current())return;setIntent(op);
      }
      const result=await resolvePayment(api,op,!!intent,current);if(!current())return;
      await pendingCheckout.clearIf(account,op.body.requestId);if(!current())return;
      setIntent(null);financeEvents.notify();
      handed=await navigate(result.order,result.open&&result.order.tuitionId===t.id&&result.order.amount===op.body.amount,reserved,current);
    }catch(e){
      reserved?.close();if(current()){
        if(op&&definitelyRejected(e)){
          try{await pendingCheckout.clearIf(account,op.body.requestId);if(current())setIntent(null);}
          catch{if(current()){setStorageError(true);setError('Chưa cập nhật được lần thanh toán trước trên thiết bị. Hãy kiểm tra lịch sử giao dịch trước khi tiếp tục.');}return;}
        }
        if(current()){setError(paymentError(e));setConfirm(false);context.reload();}
      }
    }finally{if(!handed)reserved?.close();flight.current=false;if(current())setBusy(false);}
  }
  const value=partial?parseAmount(amount):parseAmount(balance??'');
  const validAmount = !!value && !!balance && withinBalance(value,balance);
  const unavailable = !!context.error || !!context.refreshError || context.refreshing || context.data?.currency !== 'VND';
  return <Card><Text style={textStyles.section}>Thanh toán học phí</Text>
    {checking||context.loading?<StateView loading title="Đang kiểm tra thanh toán" description="Vui lòng chờ."/>:context.error&&!context.data?<StateView title="Chưa kiểm tra được thanh toán" description={context.error} action={{title:'Thử lại',onPress:context.reload}}/>:<>
      {context.data?.sandbox&&<Text style={textStyles.body}>VNPAY sandbox · Giao dịch thử nghiệm</Text>}
      {context.error&&<InlineNotice tone="warning" title="Chưa cập nhật được điều kiện thanh toán" action={{title:'Thử lại',onPress:context.reload}}/>}
      {context.refreshing&&<Text style={textStyles.body}>Đang cập nhật điều kiện thanh toán…</Text>}
      {error&&<InlineNotice tone="warning" title="Chưa hoàn tất thao tác" description={error}/>}
      {storageError?<><Button secondary title="Thử kiểm tra lại" onPress={()=>setReadRevision(v=>v+1)}/><TextLink title="Kiểm tra giao dịch trước đó" onPress={()=>router.push('/payment-orders')}/></>:intent?<>
        <Text style={textStyles.body}>{intent.body.tuitionId===t.id?'Lần thanh toán trước cần được kiểm tra.':'Bạn có lần thanh toán trước cho một khoản học phí khác cần kiểm tra.'} Không cần nhập lại số tiền.</Text>
        <Button title={busy?'Đang kiểm tra…':'Kiểm tra lần thanh toán trước'} disabled={busy} onPress={()=>void submit()}/>
      </>:context.data?.action==='RESUME'?<>
        <Text style={textStyles.label}>Có giao dịch đang chờ</Text><Text style={textStyles.body}>{formatMoney(context.data.order?.amount,context.data.currency)} · Tiếp tục phiên hiện có để tránh tạo giao dịch trùng.</Text>
        <Button title={busy?'Đang mở…':'Tiếp tục thanh toán'} disabled={busy||unavailable} onPress={()=>void submit()}/>
        <TextLink title="Tôi đã thanh toán, kiểm tra kết quả" onPress={()=>{if(context.data?.order)router.push({pathname:'/payment-orders/[id]',params:{id:context.data.order.id,returned:'1'}});}}/>
      </>:context.data?.action==='PAY'&&context.data.currency==='VND'?<>
        {!confirm?<>
          <Text style={textStyles.label}>1. Chọn số tiền</Text><Text style={textStyles.body}>Mặc định thanh toán toàn bộ số còn phải đóng.</Text>
          <Text style={[textStyles.section,{fontSize:26,lineHeight:34}]}>{formatMoney(partial?value:balance,context.data.currency)}</Text>
          <TextLink title={partial?'Đóng toàn bộ số còn thiếu':'Đóng một phần'} disabled={busy} onPress={()=>{setPartial(v=>!v);setAmount('');setError(undefined);}}/>
          {partial&&<TextInput accessibilityLabel="Số tiền muốn đóng" placeholder="Nhập số tiền, ví dụ 500000" value={amount} onChangeText={setAmount} editable={!busy} keyboardType="decimal-pad" maxLength={13} style={{borderWidth:1,borderColor:'#CBD5E1',borderRadius:12,padding:14,minHeight:48,color:'#1F2937'}}/>}
          {partial&&amount.length>0&&!validAmount&&<Text style={textStyles.body}>Nhập số tiền lớn hơn 0, không vượt số còn phải đóng.</Text>}
          {!partial&&balance&&!value&&<Text style={textStyles.body}>Số tiền vượt giới hạn một giao dịch. Chọn Đóng một phần hoặc liên hệ trung tâm.</Text>}
          <Button title="Tiếp tục" disabled={busy||unavailable||!validAmount} onPress={()=>setConfirm(true)}/>
        </>:<View style={{gap:12}}><Text style={textStyles.label}>2. Xác nhận thanh toán</Text><Text style={textStyles.body}>Học viên: {identity?.fullName??identity?.username}</Text><Text style={textStyles.label}>{t.enrollmentLabel}</Text><Text style={textStyles.body}>{t.courseName}</Text>
          <Text style={[textStyles.section,{fontSize:26,lineHeight:34}]}>{formatMoney(value,context.data.currency)}</Text><Text style={textStyles.body}>Phương thức: VNPAY. Sau khi thanh toán, quay lại ứng dụng để xem kết quả và phiếu thu.</Text>
          <Button title={busy?'Đang chuẩn bị…':'Thanh toán '+formatMoney(value,context.data.currency)} disabled={busy||unavailable||!validAmount} onPress={()=>void submit()}/>
          <TextLink title="Thay đổi số tiền" disabled={busy} onPress={()=>setConfirm(false)}/>
        </View>}
      </>:<><Text style={textStyles.body}>{context.data?.currency!=='VND'?'Vui lòng liên hệ trung tâm để được hướng dẫn thanh toán khoản này.':context.data?.message}</Text>
        {context.data?.order&&<TextLink title="Xem giao dịch liên quan" onPress={()=>router.push({pathname:'/payment-orders/[id]',params:{id:context.data!.order!.id}})}/>}
        <TextLink title="Liên hệ trung tâm" onPress={()=>router.push('/contact')}/></>}
    </>}
  </Card>;
}
