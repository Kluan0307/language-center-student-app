import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { useEffect, useState } from 'react';
import { SessionGate } from '../../components/SessionGate';
import { Button, Card, Heading, InlineNotice, Screen, StateView, textStyles } from '../../components/ui';
import { Badge, Pagination } from '../../components/Details';
import { Choice } from '../../components/Choice';
import { useStudentQuery } from '../learning/useStudentQuery';
import { formatMoney } from '../finance/utils';
import { displayDate, validId } from '../learning/utils';
import { TextLink } from '../finance/Links';
import { orderLabels, type Order } from './types';
export function OrderCard({ order: order }: { order: Order }) {
  return <Card><Text style={textStyles.section}>{order.className ?? 'Giao dịch học phí'}</Text>{order.courseName && <Text style={textStyles.body}>{order.courseName}</Text>}
    <Text style={[textStyles.label, { fontSize: 22, lineHeight: 30 }]}>{formatMoney(order.amount, order.currency)}</Text>
    <Badge label={order.reviewRequired ? 'Cần trung tâm kiểm tra' : orderLabels[order.state] ?? 'Đang kiểm tra'} tone={order.state === 'SUCCEEDED' ? 'success' : order.reviewRequired || order.state === 'REVIEW_REQUIRED' ? 'warning' : 'info'} />
    <Text style={textStyles.body}>{displayDate(order.createdAt.slice(0, 10))} · {order.displayCode ?? 'GD-' + order.id.slice(0, 8).toUpperCase()}</Text>
    <Button secondary title={order.state === 'SUCCEEDED' && order.receiptId ? 'Xem kết quả và phiếu thu' : 'Kiểm tra giao dịch'} onPress={() => router.push({ pathname: '/payment-orders/[id]', params: { id: order.id } })} />
  </Card>;
}
export default function Orders() { return <SessionGate><Content /></SessionGate>; }
function Content() {
  const [page, setPage] = useState(0), [state, setState] = useState('');
  const params = useLocalSearchParams(), tuitionId = validId(params.tuitionId), invalid = params.tuitionId !== undefined && !tuitionId;
  useEffect(() => { setPage(0); }, [tuitionId, state]);
  const query = useStudentQuery<{ content: Order[]; totalPages: number }>(invalid ? null : '/finance/student/me/payment-orders?summary=true&page=' + page + '&size=20' + (tuitionId ? '&tuitionId=' + tuitionId : '') + (state ? '&state=' + state : ''));
  return <Screen onRefresh={invalid ? undefined : query.reload} refreshing={query.fetching}>
    <Heading title="Giao dịch online" subtitle={tuitionId ? 'Các lần thanh toán của khoản học phí đã chọn.' : 'Kiểm tra các phiên VNPAY và kết quả thanh toán.'} />
    <Choice title="Trạng thái" value={state} options={[{ value: '', label: 'Tất cả' }, ...Object.entries(orderLabels).map(([value, label]) => ({ value, label }))]} onChange={setState} />
    {invalid ? <StateView title="Đường dẫn không hợp lệ" description="Hãy mở lại từ Học phí." />
      : query.loading ? <StateView loading title="Đang tải giao dịch" description="Vui lòng chờ." />
      : <>{query.error && <InlineNotice tone="warning" title="Chưa cập nhật được giao dịch" description="Thông tin đang hiển thị là lần xác nhận gần nhất." action={{ title: 'Thử lại', onPress: query.reload }} />}
        {query.data && <>{!query.data.content.length && <StateView title="Chưa có giao dịch phù hợp" description="Chọn khoản cần đóng trong Học phí để bắt đầu thanh toán." />}
          {query.data.content.map(order => <OrderCard key={order.id} order={order} />)}<Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} /></>}
      </>}
    <TextLink title={tuitionId ? 'Về khoản học phí' : 'Về học phí'} onPress={() => tuitionId ? router.navigate('/tuitions/' + tuitionId) : router.navigate('/tuition')} />
  </Screen>;
}
