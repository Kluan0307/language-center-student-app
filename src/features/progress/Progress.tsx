import {useState} from 'react';
import {router,useLocalSearchParams} from 'expo-router';
import {Text,View} from 'react-native';
import {SessionGate} from '../../components/SessionGate';
import {Button,Card,Heading,Screen,StateView,textStyles} from '../../components/ui';
import {useStudentQuery} from '../learning/useStudentQuery';
import {displayDate,validId} from '../learning/utils';
export type Grade={examId:number;examName:string;examType:string;examDate:string;maxScore:number;weight:number;revision:number;publishedAt:string;score:number|null;status:'GRADED'|'NOT_GRADED';studentComment:string|null};
export type Outcome={state:'PENDING'|'CONFIRMED'|'UPDATING';outcome:'PASS'|'FAIL'|null;revision:number|null;confirmedAt:string|null};
export type Attendance={sessionId:number|null;attendanceId:number|null;date:string;startTime:string|null;endTime:string|null;status:'PRESENT'|'ABSENT'|'LATE'|'NOT_RECORDED';hasPermission:boolean;source:'VERIFIED'|'LEGACY_UNVERIFIED'};
export type Summary={eligibleCompleted:number;present:number;late:number;absent:number;notRecorded:number;legacyUnverified:number;coverageComplete:boolean;attendancePercent:number|null};
type Page<T>={content:T[];page:number;size:number;totalElements:number;totalPages:number;summary?:Summary};
import {scoreLabel,percentLabel} from "./utils";
const attendanceLabels={PRESENT:'Có mặt',ABSENT:'Vắng',LATE:'Đi muộn',NOT_RECORDED:'Chưa điểm danh'};
export default function Progress({mode}:{mode:'grades'|'attendance'}){return <SessionGate><Content mode={mode}/></SessionGate>;}
function Content({mode}:{mode:'grades'|'attendance'}){
 const {id}=useLocalSearchParams();const key=validId(id);const [page,setPage]=useState(0);
 const rows=useStudentQuery<Page<Grade|Attendance>>(key?`/${mode==='grades'?'teaching':'academic'}/student/me/enrollments/${key}/${mode}?page=${page}&size=20`:null);
 const outcome=useStudentQuery<Outcome>(key&&mode==='grades'?`/teaching/student/me/enrollments/${key}/final-result`:null);
 const data=rows.data;
 return <Screen><Heading title={mode==='grades'?'Điểm & kết quả':'Chuyên cần cá nhân'} subtitle="Thông tin theo đăng ký học của bạn"/>
 {!key?<StateView title="Đường dẫn không hợp lệ" description="Vui lòng chọn lại lớp học."/>:<>
 <Button secondary title="Về thông tin lớp" onPress={()=>router.navigate({pathname:'/enrollments/[id]',params:{id:key}})}/>
 {mode==='grades'&&<Card><Text style={textStyles.section}>Kết quả cuối khóa</Text>{outcome.loading?<Text style={textStyles.body}>Đang kiểm tra kết quả…</Text>:outcome.error?<StateView title="Chưa tải được kết quả" description={outcome.error} action={{title:'Thử lại',onPress:outcome.reload}}/>:outcome.data?<><Text style={textStyles.label}>{outcome.data.state==='CONFIRMED'?(outcome.data.outcome==='PASS'?'Đạt':'Chưa đạt'):outcome.data.state==='UPDATING'?'Đang cập nhật kết quả':'Chưa có kết quả được xác nhận'}</Text>{outcome.data.confirmedAt&&<Text style={textStyles.body}>Xác nhận: {displayDate(outcome.data.confirmedAt.slice(0,10))} · Phiên bản {outcome.data.revision}</Text>}</>:null}</Card>}
 {rows.loading?<StateView loading title="Đang tải dữ liệu" description="Vui lòng chờ."/>:rows.error?<StateView title="Chưa tải được dữ liệu" description={rows.error} action={{title:'Thử lại',onPress:rows.reload}}/>:data?<>
 {data.summary&&<Card><Text style={textStyles.section}>Tổng quan chuyên cần</Text><Text style={textStyles.section}>{percentLabel(data.summary)}</Text><Text style={textStyles.body}>{data.summary.eligibleCompleted} buổi đã diễn ra đủ điều kiện · {data.summary.present} có mặt · {data.summary.late} đi muộn · {data.summary.absent} vắng</Text><Text style={textStyles.body}>{data.summary.notRecorded} buổi chưa điểm danh · {data.summary.legacyUnverified} bản ghi/buổi cần xác minh</Text><Text style={textStyles.body}>Đi muộn được tính tham dự. Vắng có phép vẫn là vắng. Buổi bị hủy và buổi chưa diễn ra không tính vào tổng số buổi.</Text></Card>}
 {!data.content.length?<StateView title={mode==='grades'?'Chưa có điểm được công bố':'Chưa có bản ghi chuyên cần'} description={mode==='grades'?'Điểm sẽ hiển thị sau khi trung tâm công bố.':'Buổi chưa điểm danh được phân biệt với vắng.'}/>:data.content.map((item,index)=>mode==='grades'?<GradeCard key={(item as Grade).examId} grade={item as Grade}/>:<AttendanceCard key={`${(item as Attendance).sessionId}-${(item as Attendance).attendanceId}-${index}`} attendance={item as Attendance}/>)}
 <View style={{gap:10}}><Text style={textStyles.body}>Trang {page+1} / {Math.max(1,data.totalPages)} · {data.totalElements} bản ghi</Text><Button secondary title="Trang trước" disabled={page===0} onPress={()=>setPage(p=>p-1)}/><Button secondary title="Trang tiếp" disabled={page+1>=data.totalPages} onPress={()=>setPage(p=>p+1)}/><Button secondary title="Tải lại" onPress={()=>{rows.reload();outcome.reload();}}/></View>
 </>:null}</>}
 </Screen>;
}
function GradeCard({grade:g}:{grade:Grade}){return <Card><Text style={textStyles.section}>{g.examName}</Text><Text style={textStyles.body}>{displayDate(g.examDate)} · {g.examType}</Text><Text style={textStyles.section}>{scoreLabel(g)}</Text>{g.studentComment&&<Text style={textStyles.body}>{g.studentComment}</Text>}<Text style={textStyles.body}>Bản công bố {g.revision} · {displayDate(g.publishedAt.slice(0,10))}</Text></Card>;}
function AttendanceCard({attendance:a}:{attendance:Attendance}){return <Card><Text style={textStyles.section}>{displayDate(a.date)}{a.startTime?' · '+a.startTime.slice(0,5)+(a.endTime?' – '+a.endTime.slice(0,5):''):''}</Text><Text style={textStyles.label}>{attendanceLabels[a.status]}{a.status==='ABSENT'&&a.hasPermission?' · Có phép':''}</Text>{a.source==='LEGACY_UNVERIFIED'&&<Text style={textStyles.body}>Dữ liệu cũ cần xác minh, không dùng để tính tỷ lệ chuyên cần.</Text>}{a.sessionId&&<Button secondary title="Chi tiết buổi học" onPress={()=>router.navigate({pathname:'/sessions/[id]',params:{id:String(a.sessionId)}})}/>}</Card>;}
