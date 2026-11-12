import {router,useLocalSearchParams} from 'expo-router';
import {Text} from 'react-native';
import {useState} from 'react';
import {SessionGate} from '../../components/SessionGate';
import {Button,Card,Heading,Screen,StateView,textStyles} from '../../components/ui';
import {useStudentQuery} from '../learning/useStudentQuery';
import {formatMoney} from '../finance/utils';
import {displayDate,validId} from '../learning/utils';
import {TextLink} from '../finance/Links';
import {orderLabels,type Order} from './types';
export function OrderCard({order:o}:{order:Order}){
  return <Card><Text style={textStyles.section}>{o.className??'Giao dịch học phí'}</Text><Text style={textStyles.body}>{o.courseName}</Text><Text style={textStyles.label}>{formatMoney(o.amount)}</Text><Text style={textStyles.body}>{orderLabels[o.state]??o.state}{o.reviewRequired?' · Có thông tin cần kiểm tra':''}</Text><Text style={textStyles.body}>{displayDate(o.createdAt.slice(0,10))} · {o.displayCode??'GD-'+o.id.slice(0,8).toUpperCase()}</Text><Button title={o.state==='SUCCEEDED'&&o.receiptId?'Xem kết quả và phiếu thu':'Xem giao dịch'} onPress={()=>router.push({pathname:'/payment-orders/[id]',params:{id:o.id}})}/></Card>;
}
export default function Orders(){return <SessionGate><Content/></SessionGate>;}
function Content(){const [page,setPage]=useState(0);const params=useLocalSearchParams();const tuitionId=validId(params.tuitionId);const invalid=params.tuitionId!==undefined&&!tuitionId;
 const resource=useStudentQuery<{content:Order[];totalPages:number}>(invalid?null:'/finance/student/me/payment-orders?summary=true&page='+page+'&size=20'+(tuitionId?'&tuitionId='+tuitionId:''));
 return <Screen><Heading title="Giao dịch online" subtitle="Các lần thanh toán qua VNPAY và phiếu thu liên quan"/>
  {invalid?<StateView title="Đường dẫn không hợp lệ" description="Hãy mở lại từ Học phí."/>:resource.loading?<StateView loading title="Đang tải giao dịch" description="Vui lòng chờ."/>:<>
  {resource.error&&<StateView title="Chưa cập nhật được giao dịch" description={resource.error} action={{title:'Thử lại',onPress:resource.reload}}/>}
  {resource.data&&<>{!resource.data.content.length&&<StateView title="Chưa có giao dịch online" description="Chọn khoản cần đóng trong Học phí để thanh toán."/>}{resource.data.content.map(o=><OrderCard key={o.id} order={o}/>)}
  {resource.data.totalPages>1&&<><Button secondary title="Trang trước" disabled={!page} onPress={()=>setPage(p=>p-1)}/><Button secondary title="Trang tiếp" disabled={page+1>=resource.data!.totalPages} onPress={()=>setPage(p=>p+1)}/></>}</>}</>}
  <TextLink title="Về học phí" onPress={()=>router.navigate('/tuition')}/><TextLink title="Cập nhật giao dịch" onPress={resource.reload}/>
 </Screen>;
}
