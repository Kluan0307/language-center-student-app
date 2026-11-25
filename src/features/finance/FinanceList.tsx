import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { SessionGate } from '../../components/SessionGate';
import { Choice } from '../../components/Choice';
import { Card, Heading, InlineNotice, Row, Screen, SegmentedControl, StateView, textStyles } from '../../components/ui';
import { Pagination } from '../../components/Details';
import { ClassContext } from '../learning/ClassContext';
import { useStudentQuery } from '../learning/useStudentQuery';
import { validId } from '../learning/utils';
import type { Page, Receipt, Summary, Tuition } from './types';
import type { PaymentContext } from '../online/types';
import { feeLabels } from './types';
import { MoneyRow, ReceiptCard, TuitionCard } from './components';
import { TextLink } from './Links';

export default function FinanceList({ mode = 'tuitions' }: { mode?: 'tuitions' | 'receipts' }) { return <SessionGate><Content mode={mode} /></SessionGate>; }
function Content({ mode }: { mode: 'tuitions' | 'receipts' }) {
  const params = useLocalSearchParams(), field = mode === 'tuitions' ? 'enrollmentId' : 'tuitionId';
  const selected = validId(params[field]), invalid = params[field] !== undefined && !selected;
  const tab = !selected && params.tab === 'history' ? 'history' : 'due';
  const [page, setPage] = useState(0), [status, setStatus] = useState('DUE');
  useEffect(() => { setPage(0); }, [tab, selected, mode, status]);
  const isFees = mode === 'tuitions' && tab === 'due';
  const query = useStudentQuery<Page<Tuition | Receipt>>(invalid ? null : '/finance/student/me/' + (isFees ? 'tuitions' : 'receipts') + '?page=' + page + '&size=20'
    + (selected ? (isFees ? '&enrollmentId=' : '&tuitionId=') + selected : '') + (isFees && status ? '&status=' + status : ''));
  const summary = useStudentQuery<Summary>(mode === 'tuitions' && !invalid && !selected && tab === 'due' ? '/finance/student/me/tuitions/summary' : null);
  const ids = isFees ? query.data?.content.map(row => row.id).join(',') : '';
  const contexts = useStudentQuery<PaymentContext[]>(ids ? '/finance/student/me/payment-contexts?tuitionIds=' + ids : null);
  function refresh() { query.reload(); summary.reload(); contexts.reload(); }
  return <Screen onRefresh={invalid ? undefined : refresh} refreshing={query.fetching || summary.fetching || contexts.fetching}>
    {invalid ? <StateView title="Đường dẫn không hợp lệ" description="Vui lòng mở lại từ lớp hoặc khoản học phí của bạn." /> : <>
      {mode === 'tuitions' && selected && <><ClassContext id={selected} /><Text style={textStyles.body}>Học phí liên quan đến lớp này. Phiếu thu được lưu trong chi tiết từng khoản.</Text>
        <TextLink title="Xem toàn bộ học phí của tôi" onPress={() => router.setParams({ enrollmentId: undefined, tab: 'due' })} /></>}
      {summary.data && <Card><MoneyRow title="Tổng còn phải đóng" value={summary.data.coverageComplete ? summary.data.outstanding : null} currency={summary.data.currency} />
        {!summary.data.coverageComplete ? <InlineNotice tone="warning" title="Tổng học phí đang được xác minh" description="Bạn vẫn có thể kiểm tra từng khoản bên dưới." />
          : <Text style={textStyles.body}>{summary.data.overdueCount > 0 ? summary.data.overdueCount + ' khoản quá hạn' : 'Không có khoản quá hạn'}</Text>}
        <Text style={textStyles.body}>Tổng hợp toàn bộ học phí đang có hiệu lực của bạn.</Text>
      </Card>}
      {summary.error && <InlineNotice title="Chưa cập nhật được tổng học phí" description="Các khoản bên dưới vẫn có thể xem riêng." action={{ title: 'Thử lại', onPress: summary.reload }} />}
      {mode === 'tuitions' && !selected && <SegmentedControl value={tab} options={[{ value: 'due', label: 'Cần đóng' }, { value: 'history', label: 'Phiếu thu' }]}
        onChange={value => router.setParams({ tab: value })} />}
      {isFees ? <Choice title="Hiển thị" value={status} options={[{ value: 'DUE', label: 'Khoản cần xử lý' }, { value: '', label: 'Tất cả khoản học phí' }, ...Object.entries(feeLabels).map(([value, label]) => ({ value, label }))]} onChange={setStatus} />
        : <Heading title={selected ? 'Phiếu thu của khoản học phí' : 'Phiếu thu đã ghi nhận'} subtitle="Bao gồm thanh toán trực tuyến và tiền đóng tại trung tâm." />}
      {mode === 'tuitions' && !selected && <Card><Row title="Giao dịch online" description="Kiểm tra phiên đang chờ và các lần thanh toán VNPAY" icon="swap-horizontal-outline" onPress={() => router.push('/payment-orders')} /></Card>}
      {query.loading ? <StateView loading title="Đang tải dữ liệu" description="Vui lòng chờ." /> : <>
        {query.error && <InlineNotice tone="warning" title="Chưa cập nhật được dữ liệu" description="Thông tin đang hiển thị, nếu có, là lần tải gần nhất." action={{ title: 'Thử lại', onPress: refresh }} />}
        {contexts.error && <InlineNotice title="Chưa kiểm tra được điều kiện thanh toán" description="Mở chi tiết khoản học phí để kiểm tra lại." />}
        {query.data && <>{query.refreshing && <Text style={textStyles.body}>Đang cập nhật…</Text>}
          {!query.data.content.length && <StateView title={isFees ? 'Không có khoản học phí phù hợp' : 'Chưa có phiếu thu'} description={isFees ? 'Bạn có thể chọn Tất cả khoản học phí để xem thêm.' : 'Phiếu thu xuất hiện khi khoản tiền được trung tâm ghi nhận.'} icon={isFees ? 'wallet-outline' : 'receipt-outline'} />}
          {query.data.content.map(row => isFees ? <TuitionCard key={row.id} tuition={row as Tuition} context={contexts.data?.find(c => c.tuitionId === row.id)} /> : <ReceiptCard key={row.id} receipt={row as Receipt} />)}
          <Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />
        </>}
      </>}
    </>}
  </Screen>;
}
