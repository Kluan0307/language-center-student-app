import { useEffect, useRef, useState } from 'react';
import { router, type Href } from 'expo-router';
import { useSession } from '../../providers/SessionProvider';
import { useNotificationInbox } from '../../providers/NotificationProvider';
import { noticeTarget, type Notice } from './types';

export function useNoticeOpen() {
  const { api, identity } = useSession(), inbox = useNotificationInbox();
  const generation = useRef(0), flight = useRef(false), [opening, setOpening] = useState<number | null>(null);
  useEffect(() => () => { generation.current++; }, [identity?.accountId]);
  async function open(notice: Notice) {
    if (flight.current) return;
    const epoch = generation.current; flight.current = true; setOpening(notice.id);
    try {
      // A read-marker outage must not block opening a resource; its own API
      // rechecks ownership. Do not decrement the unread count optimistically.
      if (!notice.readAt) {
        void api('/academic/student/me/notifications/' + notice.id + '/read', { method: 'PUT' })
          .then(() => inbox.reload()).catch(() => {});
      }
      if (epoch !== generation.current) return;
      inbox.reload();
      router.push((noticeTarget(notice) ?? '/notifications/' + notice.id) as Href);
    } finally { flight.current = false; if (epoch === generation.current) setOpening(null); }
  }
  return { open, opening };
}
