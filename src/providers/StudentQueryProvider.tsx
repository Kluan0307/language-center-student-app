import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { createQueryClient, type QueryClient } from '../lib/query/client';
import { financeEvents } from '../features/finance/events';
import { useSession } from './SessionProvider';
const Context = createContext<QueryClient | null>(null);
export function StudentQueryProvider({ children }: PropsWithChildren) {
  const { api, identity, status } = useSession();
  const account = status === 'authenticated' ? identity?.accountId : null;
  const client = useMemo(() => createQueryClient(), [api, account, identity?.mustChangePassword]);
  useEffect(() => {
    const unsubscribe = financeEvents.subscribe(() => client.invalidate('/finance/'));
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active' && previous !== 'active') client.invalidate();
      previous = next;
    });
    return () => { unsubscribe(); subscription.remove(); client.clear(); };
  }, [client]);
  return <Context.Provider value={client}>{children}</Context.Provider>;
}
export function useStudentQueries() {
  const client = useContext(Context);
  if (!client) throw Error('StudentQueryProvider is required');
  return client;
}
