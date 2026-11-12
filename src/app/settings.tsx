import {useEffect,useState} from 'react';
import {Switch,Text,View} from 'react-native';
import {SessionGate} from '../components/SessionGate';
import {Button,Card,Heading,Screen,StateView,textStyles} from '../components/ui';
import {useStudentQuery} from '../features/learning/useStudentQuery';
import {useSession} from '../providers/SessionProvider';
import type {Preferences} from '../features/notifications/types';
import {enableDevice,disableDevice,nativePushSupported} from '../features/notifications/push';
const labels={pushEnabled:'Nhận thông báo trên thiết bị',schedule:'Lịch học',grades:'Điểm và kết quả',tuition:'Học phí',payment:'Phiếu thu và thanh toán',documents:'Tài liệu học tập',support:'Yêu cầu hỗ trợ'};
export default function Settings(){return <SessionGate><Content/></SessionGate>;}
function Content(){
 const {api,identity}=useSession();const query=useStudentQuery<Preferences>('/academic/student/me/notification-preferences');
 const [draft,setDraft]=useState<Preferences>(),[busy,setBusy]=useState(false),[message,setMessage]=useState<string>();
 useEffect(()=>{setDraft(query.data);},[query.data]);
 const available=draft?.pushAvailable&&nativePushSupported();
 async function save(){if(!draft||busy||!available)return;setBusy(true);setMessage(undefined);try{
   const result=await api<Preferences>('/academic/student/me/notification-preferences',{method:'PUT',body:{pushEnabled:draft.pushEnabled,schedule:draft.schedule,grades:draft.grades,tuition:draft.tuition,payment:draft.payment,documents:draft.documents,support:draft.support,version:draft.version}});
   setDraft(result);query.reload();setMessage('Đã lưu tùy chọn thông báo.');
   if(!result.pushEnabled&&identity?.accountId)try{await disableDevice(api,identity.accountId);}catch{setMessage('Đã lưu tùy chọn. Thiết bị sẽ được đồng bộ khi kết nối lại.');}
 }catch(e){setMessage(e instanceof Error?e.message:'Chưa lưu được tùy chọn.');}finally{setBusy(false);}}
 async function register(){if(!identity||busy||!available)return;setBusy(true);try{setMessage(await enableDevice(api,identity.accountId));}catch(e){setMessage(e instanceof Error?e.message:'Chưa đăng ký được thông báo.');}finally{setBusy(false);}}
 return <Screen><Heading title="Thông báo"/>
  {query.loading?<StateView loading title="Đang tải cài đặt" description="Vui lòng chờ."/>:query.error?<StateView title="Chưa tải được cài đặt" description={query.error} action={{title:'Thử lại',onPress:query.reload}}/>:draft?<>
   <Card><Text style={textStyles.section}>Thông báo trong ứng dụng</Text><Text style={textStyles.body}>Các cập nhật về lịch học, kết quả, học phí và yêu cầu hỗ trợ được lưu tại biểu tượng chuông.</Text></Card>
   {available?<><Card><Text style={textStyles.section}>Thông báo trên thiết bị</Text>{(Object.keys(labels) as (keyof typeof labels)[]).map(k=><View key={k} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:52,gap:12}}><Text style={textStyles.body}>{labels[k]}</Text><Switch accessibilityLabel={labels[k]} value={draft[k]} disabled={busy} onValueChange={v=>setDraft({...draft,[k]:v})}/></View>)}<Button title="Lưu tùy chọn" disabled={busy} onPress={()=>void save()}/></Card>
   <Card><Text style={textStyles.body}>Cho phép thông báo để nhận cập nhật khi không mở ứng dụng.</Text><Button title="Bật thông báo trên thiết bị này" disabled={busy||!query.data?.pushEnabled||JSON.stringify(draft)!==JSON.stringify(query.data)} onPress={()=>void register()}/></Card></>:<Card><Text style={textStyles.body}>Thông báo ngoài ứng dụng chưa khả dụng trên phiên bản này. Bạn vẫn có thể xem đầy đủ cập nhật trong hộp thông báo.</Text></Card>}
  </>:null}{message&&<Text accessibilityRole="alert" style={textStyles.body}>{message}</Text>}
 </Screen>;
}
