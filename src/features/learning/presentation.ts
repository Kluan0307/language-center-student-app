import type { Session } from './types';
import type { Summary } from '../finance/types';
import { addDays, isDate, minuteOfDay, weekStart } from './utils';

export function weekDays(date: string) {
  const first = weekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}
export function dateCaption(date: string) {
  if (!isDate(date)) return date;
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'));
}
export function groupSessions(sessions: Session[]) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date)
    || (minuteOfDay(a.startTime) ?? 1440) - (minuteOfDay(b.startTime) ?? 1440)
    || a.sessionId - b.sessionId);
  const groups: { date: string; sessions: Session[] }[] = [];
  for (const session of sorted) {
    const last = groups[groups.length - 1];
    if (last?.date === session.date) last.sessions.push(session);
    else groups.push({ date: session.date, sessions: [session] });
  }
  return groups;
}
// Unknown balances must never become a reassuring zero on the home screen.
export function homeFeeState(summary: Summary): 'review' | 'due' | 'clear' {
  if (!summary.coverageComplete || summary.outstanding === null || !/^\d+\.\d{2}$/.test(summary.outstanding)) return 'review';
  return /[1-9]/.test(summary.outstanding) ? 'due' : 'clear';
}
