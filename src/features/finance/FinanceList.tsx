import {useEffect,useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {Text,View} from 'react-native';
import {SessionGate} from '../../components/SessionGate';
import {Choice} from '../../components/Choice';
import {Button,Card,Heading,Screen,StateView,textStyles} from '../../components/ui';
import {useStudentQuery} from '../learning/useStudentQuery';
import {validId} from '../learning/utils';
import type {Page,Receipt,Summary,Tuition} from './types';
import type {Order,PaymentContext} from '../online/types';
import {feeLabels} from './types';
import {MoneyRow,ReceiptCard,TuitionCard} from './components';
import {OrderCard} from '../online/Orders';
import {TextLink} from './Links';
import {Segments} from './Segments';

export default function FinanceList({mode='tuitions'}:{mode?:'tuitions'|'receipts'}){return <SessionGate><Content mode={mode}/></SessionGate>;}
function Content({mode}:{mode:'tuitions'|'receipts'}){
  const params=useLocalSearchParams();const field=mode==='tuitions'?'enrollmentId':'tuitionId';
  const selected=validId(params[field]),invalid=params[field]!==undefined&&!selected;
  const [tab,setTab]=useState(params.tab==='history'?'history':'due'),[history,setHistory]=useState('receipts');
  const [page,setPage]=useState(0),[status,setStatus]=useState('DUE');
  useEffect(()=>{if(params.tab==='history'||params.tab==='due'){setTab(params.tab);setPage(0);}},[params.tab]);
  const isFees=mode==='tuitions'&&tab==='due';
  const isOrders=mode==='tuitions'&&tab==='history'&&history==='orders';
  const actual=isFees?'tuitions':isOrders?'payment-orders':'receipts';
  const path=invalid?null:'/finance/student/me/'+actual+'?page='+page+'&size=20'+
    (selected?(mode==='receipts'?'&tuitionId='+selected:isFees?'&enrollmentId='+selected:''):'')+
    (isFees&&status?'&status='+status:'')+(isOrders?'&summary=true':'');
  const list=useStudentQuery<Page<Tuition|Receipt|Order>>(path);
  const summary=useStudentQuery<Summary>(mode==='tuitions'&&!invalid?'/finance/student/me/tuitions/summary':null);
  const visibleIds=isFees?list.data?.content.map(row=>row.id).join(','):undefined;
  const contexts=useStudentQuery<PaymentContext[]>(visibleIds?'/finance/student/me/payment-contexts?tuitionIds='+visibleIds:null);
  return <Screen><Heading title={mode==='tuitions'?'Học phí':'Phiếu thu'} subtitle={selected?'Đang xem theo khoản hoặc đăng ký đã chọn':undefined}/>
    {mode==='tuitions'?<>
      {summary.data?<Card><MoneyRow title="Tổng còn phải đóng" value={summary.data.outstanding}/>
        {!summary.data.coverageComplete?<Text style={textStyles.body}>Một số khoản đang được trung tâm kiểm tra. Tổng công nợ chưa được xác nhận; bạn vẫn có thể xem từng khoản.</Text>:<Text style={textStyles.body}>{summary.data.overdueCount>0?summary.data.overdueCount+' khoản quá hạn':'Không có khoản quá hạn'}</Text>}
        <MoneyRow title="Đã đóng cho học phí đang hiệu lực" value={summary.data.netPaid}/>
        {summary.refreshing&&<Text style={textStyles.body}>Đang cập nhật số dư…</Text>}
      </Card>:summary.loading?<StateView loading title="Đang tải học phí" description="Vui lòng chờ."/>:null}
      {summary.error&&<StateView title="Chưa cập nhật được tổng quan" description={summary.error} action={{title:'Thử lại',onPress:summary.reload}}/>}
      <Segments value={tab} options={[{value:'due',label:'Cần đóng'},{value:'history',label:'Lịch sử'}]} onChange={v=>{setTab(v);router.setParams({tab:v});setPage(0);}}/>
      {isFees?<Choice title="Khoản học phí" value={status} options={[{value:'DUE',label:'Cần xử lý'},{value:'',label:'Tất cả'},...Object.entries(feeLabels).map(([value,label])=>({value,label}))]} onChange={v=>{setStatus(v);setPage(0);}}/>:<>
        <Segments value={history} options={[{value:'receipts',label:'Phiếu thu'},{value:'orders',label:'Giao dịch online'}]} onChange={v=>{setHistory(v);setPage(0);}}/>
        <Text style={textStyles.body}>{isOrders?'Theo dõi các lần thanh toán qua VNPAY. Giao dịch thành công có liên kết tới phiếu thu.':'Các khoản tiền đã được trung tâm ghi nhận, gồm thu trực tiếp và thanh toán online.'}</Text>
      </>}
    </>:<TextLink title="Về học phí" onPress={()=>router.navigate('/tuition')}/>}
    {invalid?<StateView title="Đường dẫn không hợp lệ" description="Vui lòng mở lại từ lớp hoặc học phí của bạn."/>:
      list.loading?<StateView loading title="Đang tải dữ liệu" description="Vui lòng chờ."/>:
      <>{list.error&&<StateView title="Chưa cập nhật được dữ liệu" description={list.error} action={{title:'Thử lại',onPress:list.reload}}/>}
      {list.data&&<>
        {list.refreshing&&<Text style={textStyles.body}>Đang cập nhật…</Text>}
        {!list.data.content.length&&<StateView title={isFees?'Không có khoản học phí phù hợp':isOrders?'Chưa có giao dịch online':'Chưa có phiếu thu'} description={isFees?'Các khoản cần đóng sẽ hiển thị tại đây.':'Lịch sử sẽ xuất hiện khi có giao dịch được ghi nhận.'}/>}
        {list.data.content.map(row=>isFees?<TuitionCard key={row.id} tuition={row as Tuition} context={contexts.data?.find(c=>c.tuitionId===row.id)}/>:isOrders?<OrderCard key={row.id} order={row as Order}/>:<ReceiptCard key={row.id} receipt={row as Receipt}/>)}
        {list.data.totalPages>1&&<View style={{gap:8}}><Text style={textStyles.body}>Trang {page+1}/{list.data.totalPages}</Text><Button secondary title="Trang trước" disabled={!page} onPress={()=>setPage(p=>p-1)}/><Button secondary title="Trang tiếp" disabled={page+1>=list.data!.totalPages} onPress={()=>setPage(p=>p+1)}/></View>}
      </>}</>}
    <TextLink title="Cập nhật học phí và lịch sử" onPress={()=>{list.reload();summary.reload();}}/>
  </Screen>;
}
