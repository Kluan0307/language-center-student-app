import {useNotificationInbox} from '../../providers/NotificationProvider';
import type {Notice} from '../../features/notifications/types';
import type {Summary} from '../../features/finance/types';
import {formatMoney} from '../../features/finance/utils';
import {Button} from '../../components/ui';
﻿import { router } from "expo-router";
import {
  Card,
  Heading,
  Row,
  Screen,
  StateView,
  textStyles,
} from "../../components/ui";
import { Text } from "react-native";
import { useSession } from "../../providers/SessionProvider";
import { useStudentQuery } from "../../features/learning/useStudentQuery";
import type { NextSession } from "../../features/learning/types";
import { SessionCard } from "../../features/learning/components";
export default function Home() {
  const session = useSession();
  const inbox=useNotificationInbox();
  const fees=useStudentQuery<Summary>('/finance/student/me/tuitions/summary');
  const classes=useStudentQuery<{totalElements:number}>('/academic/student/me/enrollments?group=CURRENT&size=1');
  const changes=useStudentQuery<{content:Notice[]}>('/academic/student/me/notifications?unread=true&category=SCHEDULE&size=3');
  const next = useStudentQuery<NextSession>(
    "/academic/student/me/next-session",
  );
  return (
    <Screen>
      <Heading
        title={
          session.identity?.fullName
            ? "Chào " + session.identity.fullName + "!"
            : "Chào bạn!"
        }
        subtitle="Một nơi để theo dõi hành trình học tập của bạn."
      />
      <Card><Text style={textStyles.section}>Cập nhật của bạn</Text><Row title={inbox.count===null?'Thông báo':inbox.count+' thông báo chưa đọc'} description={inbox.error??'Các cập nhật từ trung tâm'} icon="notifications-outline" onPress={()=>router.push('/notifications')}/>{classes.error?<StateView title="Chưa tải được lớp" description={classes.error} action={{title:'Thử lại',onPress:classes.reload}}/>:classes.loading?<Text style={textStyles.body}>Đang tải lớp học…</Text>:classes.data?<Text style={textStyles.body}>{classes.data.totalElements} đăng ký đang học hoặc bảo lưu</Text>:null}</Card>
      {changes.error?<Card><StateView title="Chưa tải được cập nhật lịch" description={changes.error} action={{title:'Thử lại',onPress:changes.reload}}/></Card>:changes.data?.content.map(n=><Card key={n.id}><Text style={textStyles.section}>{n.title}</Text><Text style={textStyles.body}>{n.body}</Text><Button secondary title="Xem cập nhật lịch" onPress={()=>router.push({pathname:'/notifications/[id]',params:{id:String(n.id)}})}/></Card>)}
      <Card><Text style={textStyles.section}>Học phí của bạn</Text>{fees.loading?<Text style={textStyles.body}>Đang tải công nợ…</Text>:fees.error?<StateView title="Chưa tải được học phí" description={fees.error} action={{title:'Thử lại',onPress:fees.reload}}/>:fees.data?<><Text style={textStyles.label}>{fees.data.coverageComplete?'Còn phải đóng: '+formatMoney(fees.data.outstanding):'Công nợ cần kiểm tra thêm'}</Text><Text style={textStyles.body}>{fees.data.coverageComplete?fees.data.overdueCount+' khoản quá hạn':'Một số khoản chưa được xác minh; mở học phí để xem chi tiết.'}</Text></>:null}<Button secondary title="Xem học phí" onPress={()=>router.navigate('/tuition')}/></Card>
      <Text style={textStyles.section}>Buổi học tiếp theo</Text>
      {next.loading ? (
        <StateView
          loading
          title="Đang tải buổi học"
          description="Vui lòng chờ."
        />
      ) : next.error ? (
        <Card>
          <StateView
            title="Chưa tải được lịch"
            description={next.error}
            action={{ title: "Thử lại", onPress: next.reload }}
          />
        </Card>
      ) : next.data?.session ? (
        <SessionCard session={next.data.session} />
      ) : (
        <Card>
          <StateView
            title={
              next.enabled
                ? "Chưa có buổi học sắp tới"
                : "Đăng nhập để xem lịch cá nhân"
            }
            description={
              next.enabled
                ? "Bạn có thể xem lịch sử trong mục Lịch học hoặc liên hệ trung tâm."
                : "Thông tin chỉ hiển thị với tài khoản học viên."
            }
            icon="calendar-outline"
          />
        </Card>
      )}
      <Button secondary title="Cập nhật trang chủ" onPress={()=>{next.reload();fees.reload();classes.reload();changes.reload();inbox.reload();}}/>
      <Card>
        <Text style={textStyles.section}>Truy cập nhanh</Text>
        <Row
          title="Lịch học của tôi"
          description="Thời gian, phòng học và giáo viên"
          icon="calendar-outline"
          onPress={() => router.navigate("/schedule")}
        />
        <Row
          title="Lớp học của tôi"
          description="Lớp hiện tại và lịch sử học tập"
          icon="school-outline"
          onPress={() => router.navigate("/learning")}
        />
        <Row
          title="Học phí và phiếu thu"
          description="Theo dõi các khoản thanh toán"
          icon="receipt-outline"
          onPress={() => router.navigate("/tuition")}
        />
      </Card>
    </Screen>
  );
}
