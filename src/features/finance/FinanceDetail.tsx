import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import Checkout from '../online/Checkout';
import { SessionGate } from '../../components/SessionGate';
import { Card, Heading, InlineNotice, Row, Screen, StateView, textStyles } from '../../components/ui';
import { Badge, Disclosure } from '../../components/Details';
import { useStudentQuery } from '../learning/useStudentQuery';
import { displayDate, validId } from '../learning/utils';
import type { ReceiptDetail, TuitionDetail } from './types';
import { feeLabels, receiptLabels, methods } from './types';
import { MoneyRow } from './components';
import { financialLink } from './utils';
import { TextLink } from './Links';
export default function FinanceDetail({ mode }: { mode: 'tuitions' | 'receipts' }) { return <SessionGate><Content mode={mode} /></SessionGate>; }
function Content({ mode }: { mode: 'tuitions' | 'receipts' }) {
  const key = validId(useLocalSearchParams().id);
  const query = useStudentQuery<TuitionDetail | ReceiptDetail>(key ? '/finance/student/me/' + mode + '/' + key : null);
  const data = query.data, tuition = data?.tuition, receipt = data && 'receipt' in data ? data.receipt : null;
  return <Screen onRefresh={key ? query.reload : undefined} refreshing={query.fetching}>
    {!key ? <StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại khoản học phí hoặc phiếu thu." />
      : query.loading ? <StateView loading title="Đang tải chi tiết" description="Vui lòng chờ." />
      : <>{query.error && <InlineNotice tone="warning" title="Chưa cập nhật được chi tiết" description="Số dư cần được kiểm tra lại trước khi thanh toán." action={{ title: 'Thử lại', onPress: query.reload }} />}
        {data && tuition && <>
          <Heading title={receipt ? receipt.receiptNo ?? 'Phiếu #' + receipt.id : tuition.enrollmentLabel} subtitle={tuition.courseName ?? 'Thông tin khóa học đang được xác minh'} />
          <Card><Badge label={receipt ? receiptLabels[receipt.state] ?? 'Cần xác minh' : feeLabels[tuition.status] ?? 'Cần xác minh'} tone={receipt?.state === 'VALID' || tuition.status === 'PAID' ? 'success' : tuition.overdue ? 'danger' : 'info'} />
            <MoneyRow title={receipt ? 'Số tiền ghi nhận' : 'Còn phải đóng'} value={receipt ? receipt.amount : tuition.verification === 'VERIFIED' ? tuition.outstanding : null} currency={receipt?.currency ?? tuition.currency} />
            <Text style={textStyles.body}>{receipt ? displayDate(receipt.paidAt.slice(0, 10)) + ' · ' + receipt.paidAt.slice(11, 16) + ' · ' + (methods[receipt.method] ?? receipt.method) : 'Hạn đóng: ' + displayDate(tuition.dueDate)}</Text>
            {receipt && <Text style={textStyles.body}>Lớp: {tuition.enrollmentLabel}</Text>}
            {receipt && receipt.state !== 'VALID' && <MoneyRow title="Còn hiệu lực sau xử lý" value={receipt.netAmount} currency={receipt.currency} />}
            {tuition.verification !== 'VERIFIED' && <InlineNotice tone="warning" title="Khoản học phí đang được xác minh" description="Liên hệ trung tâm để kiểm tra số dư." />}
            {tuition.cancelled && <Text style={textStyles.body}>Khoản đã hủy được giữ lại để tra cứu lịch sử, không cộng vào công nợ hiện tại.</Text>}
            {query.refreshing && <Text style={textStyles.body}>Đang cập nhật số dư…</Text>}
          </Card>
          {!receipt && <Checkout key={tuition.id} tuition={tuition} />}
          <Card>{receipt ? <Row title="Xem khoản học phí" description="Số dư và các phiếu thu liên quan" icon="wallet-outline" onPress={() => router.push('/tuitions/' + tuition.id)} />
            : <><Row title="Phiếu thu của khoản này" description="Các lần đóng tiền đã được ghi nhận" icon="receipt-outline" onPress={() => router.push({ pathname: '/receipts', params: { tuitionId: String(tuition.id) } })} />
              <Row title="Giao dịch online của khoản này" description="Kiểm tra phiên thanh toán và kết quả" icon="swap-horizontal-outline" onPress={() => router.push({ pathname: '/payment-orders', params: { tuitionId: String(tuition.id) } })} /></>}</Card>
          <Disclosure title="Chi tiết và lịch sử xử lý">
            {receipt ? <><MoneyRow title="Số tiền đảo phiếu" value={receipt.voidedAmount} currency={receipt.currency} /><MoneyRow title="Số tiền đã hoàn" value={receipt.refundedAmount} currency={receipt.currency} /></>
              : <><MoneyRow title="Học phí gốc" value={tuition.originalAmount} currency={tuition.currency} /><MoneyRow title="Giảm trừ" value={tuition.discountAmount} currency={tuition.currency} /><MoneyRow title="Học phí sau giảm trừ" value={tuition.totalAmount} currency={tuition.currency} /><MoneyRow title="Đã đóng còn hiệu lực" value={tuition.netPaid} currency={tuition.currency} /><MoneyRow title="Đóng dư" value={tuition.credit} currency={tuition.currency} /></>}
            {tuition.enrollmentIds.length > 1 && <Text style={textStyles.body}>Khoản học phí được dùng chung khi chuyển lớp; không thu lại theo từng lớp.</Text>}
            {'adjustments' in data && data.adjustments.map((a, i) => <Card key={i}><Text style={textStyles.label}>Điều chỉnh ngày {displayDate(a.date.slice(0, 10))}</Text><MoneyRow title="Trước điều chỉnh" value={a.oldAmount} currency={tuition.currency} /><MoneyRow title="Sau điều chỉnh" value={a.newAmount} currency={tuition.currency} /><Text style={textStyles.body}>Hạn đóng: {displayDate(a.oldDueDate)} → {displayDate(a.newDueDate)}</Text></Card>)}
            {'corrections' in data && data.corrections.map((c, i) => <Card key={i}><Text style={textStyles.label}>{c.type === 'VOID' ? 'Đảo phiếu' : 'Hoàn tiền'} · {displayDate(c.date.slice(0, 10))}</Text><MoneyRow title="Số tiền" value={c.amount} currency={receipt?.currency ?? tuition.currency} /></Card>)}
          </Disclosure>
          <TextLink title="Cần hỗ trợ về khoản này" onPress={() => router.push(tuition.verification === 'VERIFIED' ? financialLink(receipt ? 'RECEIPT' : 'TUITION', receipt ? receipt.id : tuition.id) : '/contact')} />
        </>}
      </>}
  </Screen>;
}
