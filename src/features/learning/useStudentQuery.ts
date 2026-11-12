import {useCallback,useEffect,useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {useSession} from '../../providers/SessionProvider';
import {loadAllPages} from './utils';
import {financeEvents} from '../finance/events';

export function useStudentQuery<T>(path:string|null,allPages=false){
  const {api,status,identity}=useSession();
  const enabled=status==='authenticated'&&!identity?.mustChangePassword&&path!==null;
  const financial=path?.startsWith('/finance/')===true;
  const [revision,setRevision]=useState(0),[fetching,setFetching]=useState(false);
  const base=JSON.stringify([identity?.accountId,path,allPages]);
  const key=JSON.stringify([base,revision]);
  const [result,setResult]=useState<{base:string;key:string;data?:T;error?:string}>();
  const reload=useCallback(()=>setRevision(v=>v+1),[]);
  useEffect(()=>financial?financeEvents.subscribe(reload):undefined,[financial,reload]);
  useFocusEffect(useCallback(()=>{
    if(!enabled)return;
    if(!financial)setResult(undefined);
    const controller=new AbortController();setFetching(true);
    void (allPages?loadAllPages(api,path!,controller.signal):api<T>(path!,{signal:controller.signal}))
      .then(data=>{if(!controller.signal.aborted)setResult({base,key,data:data as T});})
      .catch(error=>{if(!controller.signal.aborted)setResult(previous=>({base,key,data:financial&&previous?.base===base?previous.data:undefined,error:error instanceof Error?error.message:'Không tải được dữ liệu.'}));})
      .finally(()=>{if(!controller.signal.aborted)setFetching(false);});
    return()=>controller.abort();
  },[api,enabled,path,allPages,key,base,financial]));
  const current=enabled&&result?.base===base&&(financial||result.key===key)?result:undefined;
  return {data:current?.data,error:current?.error,loading:enabled&&!current?.data&&!current?.error,
    refreshing:enabled&&financial&&fetching,enabled,reload};
}
