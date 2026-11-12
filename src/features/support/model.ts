import {useEffect,useRef,useState} from 'react';
import * as Crypto from 'expo-crypto';
import {useSession} from '../../providers/SessionProvider';
export const statusLabels={OPEN:'Mới',IN_PROGRESS:'Đang xử lý',RESOLVED:'Đã giải quyết',CLOSED:'Đã đóng'};
export const categoryLabels={PROFILE:'Hồ sơ',GRADE:'Điểm số',ATTENDANCE:'Điểm danh',PAYMENT:'Học phí',LEAVE:'Xin nghỉ',MAKEUP:'Học bù',OTHER:'Khác'};
export type Ticket={id:number;category:keyof typeof categoryLabels;subject:string;status:keyof typeof statusLabels;version:number;createdAt:string;updatedAt:string;resourceType:string|null;resourceId:number|null};
export type Detail={request:Ticket;messages:{id:number;sender:'STUDENT'|'CENTER';message:string;createdAt:string}[]};
export function useSupportCommand(onSaved:(data:Detail)=>void){const {api,identity}=useSession();const [pending,setPending]=useState<{path:string;body:Record<string,unknown>}>(),[busy,setBusy]=useState(false),[error,setError]=useState<string>();const generation=useRef(0);useEffect(()=>()=>{generation.current++;},[identity?.accountId]);
 async function send(path:string,body:Record<string,unknown>){if(busy)return;const op=pending??{path,body:{...body,requestId:Crypto.randomUUID()}};const epoch=generation.current;setPending(op);setBusy(true);setError(undefined);try{const data=await api<Detail>(op.path,{method:'POST',body:op.body});if(epoch===generation.current){setPending(undefined);onSaved(data);}}catch(e){if(epoch===generation.current)setError(e instanceof Error?e.message:'Chưa gửi được yêu cầu.');}finally{if(epoch===generation.current)setBusy(false);}}
 async function recover(){if(!pending||busy)return;const epoch=generation.current;setBusy(true);try{const data=await api<Detail>('/academic/student/me/support-requests/operations/'+pending.body.requestId);if(epoch===generation.current){setPending(undefined);setError(undefined);onSaved(data);}}catch(e){if(epoch===generation.current)setError(e instanceof Error?e.message:'Chưa xác nhận được kết quả.');}finally{if(epoch===generation.current)setBusy(false);}}
 return{pending,busy,error,send,recover};}
