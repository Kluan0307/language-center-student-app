import {useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {Text} from 'react-native';
import Checkout from '../online/Checkout';
import {SessionGate} from '../../components/SessionGate';
import {Card,Heading,Screen,StateView,textStyles} from '../../components/ui';
import {useStudentQuery} from '../learning/useStudentQuery';
import {displayDate,validId} from '../learning/utils';
import type {ReceiptDetail,TuitionDetail} from './types';
import {feeLabels,receiptLabels,methods} from './types';
import {MoneyRow} from './components';
import {financialLink} from './utils';
import {TextLink} from './Links';
export default function FinanceDetail({mode}:{mode:'tuitions'|'receipts'}){return <SessionGate><Content mode={mode}/></SessionGate>;}
function Content({mode}:{mode:'tuitions'|'receipts'}){
  const {id}=useLocalSearchParams();const key=validId(id);
  const resource=useStudentQuery<TuitionDetail|ReceiptDetail>(key?'/finance/student/me/'+mode+'/'+key:null);
  const [expanded,setExpanded]=useState(false);const data=resource.data,t=data?.tuition;
  const receipt=data&&'receipt'in data?data.receipt:null;
  return <Screen><Heading title={mode==='tuitions'?'Chi tiết học phí':'Phiếu thu'}/>
    {!key?<StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại khoản học phí hoặc phiếu thu."/>:
      resource.loading?<StateView loading title="Đang tải chi tiết" description="Vui lòng chờ."/>:
      <>{resource.error&&<StateView title="Chưa cập nhật được chi tiết" description={resource.error} action={{title:'Thử lại',onPress:resource.reload}}/>}
      {data&&t&&<>
        <Card><Text style={textStyles.section}>{receipt?(receipt.receiptNo??'Phiếu #'+receipt.id):t.enrollmentLabel}</Text>
          <Text style={textStyles.body}>{t.courseName??'Đang xác minh đăng ký'}{receipt?' · '+t.enrollmentLabel:''}</Text>
          <Text style={textStyles.label}>{receipt?receiptLabels[receipt.state]:feeLabels[t.status]}</Text>
          {receipt?<><MoneyRow title="Số tiền ghi nhận" value={receipt.amount} currency={receipt.currency}/><Text style={textStyles.body}>{displayDate(receipt.paidAt.slice(0,10))} · {receipt.paidAt.slice(11,16)} · {methods[receipt.method]}</Text>
            {(receipt.state!=='VALID'||receipt.refundedAmount!=='0.00'||receipt.voidedAmount!=='0.00')&&<><MoneyRow title="Còn hiệu lực sau xử lý" value={receipt.netAmount} currency={receipt.currency}/><Text style={textStyles.body}>Chi tiết đảo phiếu và hoàn tiền được lưu trong lịch sử xử lý bên dưới.</Text></>}
            <TextLink title="Xem khoản học phí" onPress={()=>router.push({pathname:'/tuitions/[id]',params:{id:String(t.id)}})}/>
          </>:<><MoneyRow title="Còn phải đóng" value={t.outstanding} currency={t.currency}/><Text style={textStyles.body}>Hạn đóng: {displayDate(t.dueDate)}</Text>
            {t.cancelled&&<Text style={textStyles.body}>Khoản đã hủy không cộng vào công nợ hiện tại. Lịch sử thu tiền được giữ nguyên.</Text>}
            {t.enrollmentIds.length>1&&<Text style={textStyles.body}>Đây là khoản học phí dùng chung khi chuyển lớp; không thu lại theo từng lớp.</Text>}
          </>}
          {t.verification!=='VERIFIED'&&<Text style={textStyles.body}>Trung tâm đang kiểm tra khoản học phí; số dư chưa được xác nhận.</Text>}
          {resource.refreshing&&<Text style={textStyles.body}>Đang cập nhật số dư…</Text>}
        </Card>
        {!receipt&&<Checkout key={t.id} tuition={t}/>}
        <Card><TextLink title={expanded?'Ẩn chi tiết và lịch sử':'Chi tiết học phí và lịch sử xử lý'} onPress={()=>setExpanded(v=>!v)}/>
          {expanded&&<>
            {receipt?<><MoneyRow title="Số tiền đảo phiếu" value={receipt.voidedAmount}/><MoneyRow title="Số tiền đã hoàn" value={receipt.refundedAmount}/></>:<><MoneyRow title="Học phí gốc" value={t.originalAmount}/><MoneyRow title="Giảm trừ" value={t.discountAmount}/><MoneyRow title="Học phí sau giảm trừ" value={t.totalAmount}/><MoneyRow title="Đã đóng còn hiệu lực" value={t.netPaid}/><MoneyRow title="Đóng dư" value={t.credit}/></>}
            {'adjustments'in data&&<><Text style={textStyles.label}>Điều chỉnh học phí</Text>{!data.adjustments.length?<Text style={textStyles.body}>Chưa có điều chỉnh.</Text>:data.adjustments.map(a=><Card key={a.id}><Text style={textStyles.body}>{displayDate(a.date.slice(0,10))}</Text><MoneyRow title="Trước điều chỉnh" value={a.oldAmount}/><MoneyRow title="Sau điều chỉnh" value={a.newAmount}/><Text style={textStyles.body}>Hạn đóng: {displayDate(a.oldDueDate)} → {displayDate(a.newDueDate)}</Text></Card>)}</>}
            {'corrections'in data&&<><Text style={textStyles.label}>Xử lý phiếu thu</Text>{!data.corrections.length?<Text style={textStyles.body}>Chưa có đảo phiếu hoặc hoàn tiền.</Text>:data.corrections.map(c=><Card key={c.id}><Text style={textStyles.body}>{c.type==='VOID'?'Đảo phiếu':'Hoàn tiền'} · {displayDate(c.date.slice(0,10))}</Text><MoneyRow title="Số tiền" value={c.amount}/></Card>)}</>}
          </>}
          {!receipt&&<TextLink title="Phiếu thu của khoản này" onPress={()=>router.push({pathname:'/receipts',params:{tuitionId:String(t.id)}})}/>}
        </Card>
        <TextLink title="Cần hỗ trợ về khoản này" onPress={()=>router.push(t.verification==='VERIFIED'?financialLink(receipt?'RECEIPT':'TUITION',receipt?receipt.id:t.id):'/contact')}/>
        <TextLink title="Cập nhật thông tin" onPress={resource.reload}/>
      </>}</>}
  </Screen>;
}
