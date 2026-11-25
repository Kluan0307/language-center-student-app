import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { SessionGate } from '../components/SessionGate';
import { Button, Card, InlineNotice, Screen, StateView, textStyles } from '../components/ui';
import { Pagination } from '../components/Details';
import { ClassContext } from '../features/learning/ClassContext';
import { useStudentQuery } from '../features/learning/useStudentQuery';
import { displayDate, validId } from '../features/learning/utils';
import { shareDocument } from '../features/documents/downloads';
import { useSession } from '../providers/SessionProvider';
type Document = { id: number; title: string; description: string | null; filename: string; mimeType: string; size: number; revision: number; sharedAt: string };
type Page = { content: Document[]; totalPages: number; totalElements: number };
export default function Documents() { const params = useLocalSearchParams(); return <SessionGate><Content key={String(params.enrollmentId)} /></SessionGate>; }
function Content() {
  const { enrollmentId } = useLocalSearchParams(), key = validId(enrollmentId), invalid = enrollmentId !== undefined && !key;
  const [page, setPage] = useState(0), [busy, setBusy] = useState<number | null>(null), [error, setError] = useState<string>();
  const query = useStudentQuery<Page>(invalid ? null : '/teaching/student/me/documents?page=' + page + '&size=20' + (key ? '&enrollmentId=' + key : ''));
  const { api, identity } = useSession(), active = useRef(0), flight = useRef(false);
  useEffect(() => () => { active.current++; }, [identity?.accountId]);
  async function download(document: Document) {
    if (flight.current) return;
    const version = active.current; flight.current = true; setBusy(document.id); setError(undefined);
    try { const bytes = await api<ArrayBuffer>('/teaching/student/me/documents/' + document.id + '/download', { responseType: 'bytes' }); if (version === active.current) await shareDocument(bytes, document.filename, document.mimeType); }
    catch (e) { if (version === active.current) setError(e instanceof Error ? e.message : 'Không thể tải tài liệu.'); }
    finally { flight.current = false; if (version === active.current) setBusy(null); }
  }
  return <Screen onRefresh={invalid ? undefined : query.reload} refreshing={query.fetching}>
    <ClassContext id={key} />
    {error && <InlineNotice tone="warning" title="Chưa mở được tài liệu" description={error} />}
    {invalid ? <StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại lớp." />
      : query.loading ? <StateView loading title="Đang tải tài liệu" description="Vui lòng chờ." />
      : query.error ? <StateView title="Chưa tải được tài liệu" description={query.error} action={{ title: 'Thử lại', onPress: query.reload }} />
      : query.data && <>{!query.data.content.length && <StateView title="Chưa có tài liệu được chia sẻ" description="Tài liệu sẽ xuất hiện khi trung tâm chia sẻ cho lớp hoặc khóa học của bạn." icon="documents-outline" />}
        {query.data.content.map(document => <Card key={document.id}><Text style={textStyles.section}>{document.title}</Text>{document.description && <Text style={textStyles.body}>{document.description}</Text>}
          <Text style={textStyles.body}>{document.filename} · {Math.ceil((document.size ?? 0) / 1024)} KB</Text>
          <Text style={textStyles.body}>Chia sẻ ngày {displayDate(document.sharedAt.slice(0, 10))}</Text>
          <Button title={busy === document.id ? 'Đang tải…' : 'Mở tài liệu'} disabled={busy !== null} onPress={() => void download(document)} />
        </Card>)}<Pagination page={page} totalPages={query.data.totalPages} onChange={setPage} />
      </>}
  </Screen>;
}
