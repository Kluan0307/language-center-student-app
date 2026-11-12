import {router} from 'expo-router';
import {Text,View} from 'react-native';
import {Card,Button,textStyles} from '../../components/ui';
import {displayDate} from '../learning/utils';
import type {Tuition,Receipt} from './types';
import {feeLabels,receiptLabels,methods} from './types';
import {formatMoney} from './utils';
import type {PaymentContext} from '../online/types';
export function MoneyRow({title,value,currency='VND'}:{title:string;value:string|null|undefined;currency?:string}){return <View style={{gap:3}}><Text style={textStyles.body}>{title}</Text><Text style={textStyles.label}>{formatMoney(value,currency)}</Text></View>;}
export function TuitionCard({tuition:t,context}:{tuition:Tuition;context?:PaymentContext}){
  const related=context?.order;
  const title=context?.action==='RESUME'?'Xem phiên thanh toán':context?.action==='SUPPORT'?'Xem khoản cần kiểm tra':context?.action==='PAY'?'Thanh toán':'Xem chi tiết';
  return <Card><Text style={textStyles.section}>{t.enrollmentLabel}</Text><Text style={textStyles.body}>{t.courseName} · {feeLabels[t.status]??'Cần đối soát'}</Text><MoneyRow title="Còn phải đóng" value={t.outstanding} currency={t.currency}/><Text style={textStyles.body}>Hạn đóng: {displayDate(t.dueDate)}</Text>
    {context?.action==='RESUME'&&<Text style={textStyles.body}>Có phiên thanh toán {formatMoney(related?.amount)} đang chờ.</Text>}
    {context?.action==='SUPPORT'&&<Text style={textStyles.body}>{context.message}</Text>}
    {t.verification!=='VERIFIED'&&context?.action!=='SUPPORT'&&<Text style={textStyles.body}>Trung tâm cần xác minh khoản này trước khi xác nhận số dư.</Text>}
    <Button title={title} onPress={()=>router.push(related&&(context?.action==='RESUME'||context?.action==='SUPPORT')?{pathname:'/payment-orders/[id]',params:{id:related.id}}:{pathname:'/tuitions/[id]',params:{id:String(t.id)}})}/>
  </Card>;
}
export function ReceiptCard({receipt:r}:{receipt:Receipt}){return <Card><Text style={textStyles.section}>{r.className??r.receiptNo??'Phiếu #'+r.id}</Text><Text style={textStyles.body}>{r.courseName} · {r.receiptNo??'Phiếu #'+r.id}</Text><Text style={textStyles.body}>{receiptLabels[r.state]} · {methods[r.method]} · {displayDate(r.paidAt.slice(0,10))}</Text><MoneyRow title="Số tiền phiếu gốc" value={r.amount} currency={r.currency}/><MoneyRow title="Còn hiệu lực sau xử lý" value={r.netAmount} currency={r.currency}/><Button title="Xem phiếu thu" onPress={()=>router.push({pathname:'/receipts/[id]',params:{id:String(r.id)}})}/></Card>;}
