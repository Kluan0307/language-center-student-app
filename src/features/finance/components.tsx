import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Card, Button, textStyles } from '../../components/ui';
import { Badge } from '../../components/Details';
import { displayDate } from '../learning/utils';
import type { Tuition, Receipt } from './types';
import { feeLabels, receiptLabels, methods } from './types';
import { formatMoney } from './utils';
import type { PaymentContext } from '../online/types';
export function MoneyRow({ title, value, currency = 'VND' }: { title: string; value: string | null | undefined; currency?: string }) {
  return <View style={{ gap: 3 }}><Text style={textStyles.body}>{title}</Text><Text style={[textStyles.label, { fontSize: 22, lineHeight: 30 }]}>{formatMoney(value, currency)}</Text></View>;
}
export function TuitionCard({ tuition: t, context }: { tuition: Tuition; context?: PaymentContext }) {
  const related = context?.order;
  const title = context?.action === 'RESUME' ? 'Xem giao dịch đang chờ' : context?.action === 'SUPPORT' ? 'Kiểm tra khoản học phí' : context?.action === 'PAY' ? 'Thanh toán' : 'Xem chi tiết';
  return <Card><Text style={textStyles.section}>{t.enrollmentLabel}</Text>{t.courseName && <Text style={textStyles.body}>{t.courseName}</Text>}
    <Badge label={feeLabels[t.status] ?? 'Cần xác minh'} tone={t.status === 'PAID' ? 'success' : t.overdue ? 'danger' : t.verification !== 'VERIFIED' ? 'warning' : 'info'} />
    <MoneyRow title="Còn phải đóng" value={t.verification === 'VERIFIED' ? t.outstanding : null} currency={t.currency} />
    <Text style={textStyles.body}>Hạn đóng: {displayDate(t.dueDate)}</Text>
    {context?.action === 'RESUME' && <Text style={textStyles.body}>Có phiên thanh toán {formatMoney(related?.amount, related?.currency)} đang chờ xác nhận.</Text>}
    {context?.action === 'SUPPORT' && <Text style={textStyles.body}>{context.message}</Text>}
    <Button title={title} onPress={() => router.push(related && (context?.action === 'RESUME' || context?.action === 'SUPPORT') ? { pathname: '/payment-orders/[id]', params: { id: related.id } } : { pathname: '/tuitions/[id]', params: { id: String(t.id) } })} />
  </Card>;
}
export function ReceiptCard({ receipt: r }: { receipt: Receipt }) {
  return <Card><Text style={textStyles.section}>{r.className ?? r.receiptNo ?? 'Phiếu #' + r.id}</Text>
    <Text style={textStyles.body}>{[r.courseName, r.receiptNo].filter(Boolean).join(' · ')}</Text>
    <Badge label={receiptLabels[r.state] ?? 'Cần xác minh'} tone={r.state === 'VALID' ? 'success' : 'warning'} />
    <MoneyRow title="Số tiền ghi nhận" value={r.amount} currency={r.currency} />
    <Text style={textStyles.body}>{methods[r.method] ?? r.method} · {displayDate(r.paidAt.slice(0, 10))}</Text>
    {r.state !== 'VALID' && <MoneyRow title="Còn hiệu lực sau xử lý" value={r.netAmount} currency={r.currency} />}
    <Button secondary title="Xem phiếu thu" onPress={() => router.push({ pathname: '/receipts/[id]', params: { id: String(r.id) } })} />
  </Card>;
}
