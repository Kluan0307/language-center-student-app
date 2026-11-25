export type SupportCategory = 'PROFILE' | 'GRADE' | 'ATTENDANCE' | 'PAYMENT' | 'LEAVE' | 'MAKEUP' | 'OTHER';
export type ResourceType = 'PROFILE' | 'ENROLLMENT' | 'SESSION' | 'TUITION' | 'RECEIPT' | 'PAYMENT_ORDER';
export type SupportResource = { type: ResourceType; id: string };
const categories = new Set(['PROFILE', 'GRADE', 'ATTENDANCE', 'PAYMENT', 'LEAVE', 'MAKEUP', 'OTHER']);
const types = new Set(['PROFILE', 'ENROLLMENT', 'SESSION', 'TUITION', 'RECEIPT', 'PAYMENT_ORDER']);
const validNumber = (v: unknown): v is string => typeof v === 'string' && /^[1-9]\d*$/.test(v) && Number.isSafeInteger(Number(v));
const validKey = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v);
export function parseSupportContext(params: Record<string, unknown>): { invalid: boolean; category: SupportCategory; resource?: SupportResource } {
  const category = typeof params.category === 'string' && categories.has(params.category) ? params.category as SupportCategory : 'OTHER';
  if (params.category !== undefined && (typeof params.category !== 'string' || !categories.has(params.category))) return { invalid: true, category };
  if (params.resourceType === undefined && params.resourceId === undefined && params.resourceKey === undefined) return { invalid: false, category };
  const type = params.resourceType, id = type === 'PAYMENT_ORDER' ? params.resourceKey : params.resourceId;
  if (typeof type !== 'string' || !types.has(type) || (type === 'PAYMENT_ORDER' ? !validKey(id) || params.resourceId !== undefined : !validNumber(id) || params.resourceKey !== undefined)) return { invalid: true, category };
  return { invalid: false, category: ['TUITION', 'RECEIPT', 'PAYMENT_ORDER'].includes(type) ? 'PAYMENT' : type === 'PROFILE' ? 'PROFILE' : category, resource: { type: type as ResourceType, id: id as string } };
}
export function supportLink(category: SupportCategory, type: ResourceType, id: string) {
  return { pathname: '/support' as const, params: { category, resourceType: type, ...(type === 'PAYMENT_ORDER' ? { resourceKey: id } : { resourceId: id }) } };
}
export function resourceLabel(resource: SupportResource) {
  const labels = { PROFILE: 'Hồ sơ học viên', ENROLLMENT: 'Lớp học', SESSION: 'Buổi học', TUITION: 'Khoản học phí', RECEIPT: 'Phiếu thu', PAYMENT_ORDER: 'Giao dịch online' };
  return labels[resource.type] + (resource.type === 'PROFILE' ? '' : ' · ' + (resource.type === 'PAYMENT_ORDER' ? 'GD-' + resource.id.slice(0, 8).toUpperCase() : '#' + resource.id));
}
export function contextBody(resource?: SupportResource) {
  return resource ? { resourceType: resource.type, ...(resource.type === 'PAYMENT_ORDER' ? { resourceKey: resource.id } : { resourceId: Number(resource.id) }) } : {};
}
export function resourceTarget(resource: SupportResource): string | null {
  const parsed = parseSupportContext({ resourceType: resource.type, ...(resource.type === 'PAYMENT_ORDER' ? { resourceKey: resource.id } : { resourceId: resource.id }) });
  if (parsed.invalid) return null;
  const routes = { PROFILE: '/profile', ENROLLMENT: '/enrollments/', SESSION: '/sessions/', TUITION: '/tuitions/', RECEIPT: '/receipts/', PAYMENT_ORDER: '/payment-orders/' };
  return resource.type === 'PROFILE' ? routes.PROFILE : routes[resource.type] + resource.id;
}
export function resourceApi(resource: SupportResource) {
  const routes = { PROFILE: '/academic/student/me/profile', ENROLLMENT: '/academic/student/me/enrollments/', SESSION: '/academic/student/me/sessions/', TUITION: '/finance/student/me/tuitions/', RECEIPT: '/finance/student/me/receipts/', PAYMENT_ORDER: '/finance/student/me/payment-orders/' };
  return resource.type === 'PROFILE' ? routes.PROFILE : routes[resource.type] + resource.id;
}
