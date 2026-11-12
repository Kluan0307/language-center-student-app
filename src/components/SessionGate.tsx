import { Redirect, useGlobalSearchParams, usePathname } from "expo-router";
import { useSession } from "../providers/SessionProvider";
import { SessionStatus } from "./SessionStatus";
import { safeReturnTo, scheduleParams } from "../features/learning/utils";
export function SessionGate({ children }: React.PropsWithChildren) {
  const session = useSession();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const schedule = scheduleParams(params);
  const returnTo = safeReturnTo(
    pathname === "/schedule"
      ? pathname +
          "?" +
          new URLSearchParams({
            date: schedule.date,
            view: schedule.view,
            ...(schedule.enrollmentId
              ? { enrollmentId: schedule.enrollmentId }
              : {}),
          }).toString()
      : (pathname === "/documents"||pathname === "/tuition") && typeof params.enrollmentId === "string" ? pathname+"?enrollmentId="+params.enrollmentId : pathname === "/receipts" && typeof params.tuitionId === "string" ? pathname+"?tuitionId="+params.tuitionId : pathname === "/support" && params.category === "PAYMENT" && typeof params.resourceType === "string" && typeof params.resourceId === "string" ? "/support?category=PAYMENT&resourceType="+params.resourceType+"&resourceId="+params.resourceId : pathname,
  );
  if (session.status === "loading" || session.status === "error")
    return <SessionStatus />;
  if (session.status !== "authenticated")
    return (
      <Redirect
        href={{ pathname: "/welcome", params: returnTo ? { returnTo } : {} }}
      />
    );
  if (session.identity?.mustChangePassword)
    return (
      <Redirect
        href={{
          pathname: "/change-password",
          params: returnTo ? { returnTo } : {},
        }}
      />
    );
  return children;
}
