import { Card, Heading, Screen, StateView } from "./ui";
export function Unavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Screen>
      <Heading title={title} subtitle={description} />
      <Card>
        <StateView
          title="Chức năng chưa được kết nối"
          description="Thông tin sẽ xuất hiện khi trung tâm kích hoạt dịch vụ dành cho học viên."
          icon="cloud-offline-outline"
        />
      </Card>
    </Screen>
  );
}
