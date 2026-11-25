import { Redirect, useGlobalSearchParams, usePathname } from 'expo-router';
import { useSession } from '../providers/SessionProvider';
import { SessionStatus } from './SessionStatus';
import { safeReturnTo, scheduleParams } from '../features/learning/utils';
export function SessionGate({ children }: React.PropsWithChildren) {
  const session = useSession(), pathname = usePathname(), params = useGlobalSearchParams();
  const keys: Record<string, string[]> = {
    '/support': ['category', 'resourceType', 'resourceId', 'resourceKey'], '/documents': ['enrollmentId'],
    '/tuition': ['enrollmentId', 'tab'], '/receipts': ['tuitionId'], '/payment-orders': ['tuitionId'],
  };
  let target = pathname;
  if (pathname === '/schedule') {
    const state = scheduleParams(params);
    target += '?' + new URLSearchParams({ date: state.date, view: state.view, ...(state.enrollmentId ? { enrollmentId: state.enrollmentId } : {}) }).toString();
  } else if (keys[pathname]) {
    const query = new URLSearchParams();
    for (const key of keys[pathname]) if (typeof params[key] === 'string') query.set(key, params[key] as string);
    if (query.size) target += '?' + query.toString();
  }
  const returnTo = safeReturnTo(target);
  if (session.status === 'loading' || session.status === 'error') return <SessionStatus />;
  if (session.status !== 'authenticated') return <Redirect href={{ pathname: '/welcome', params: returnTo ? { returnTo } : {} }} />;
  if (session.identity?.mustChangePassword) return <Redirect href={{ pathname: '/change-password', params: returnTo ? { returnTo } : {} }} />;
  return children;
}
