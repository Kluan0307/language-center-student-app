import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
export type CheckoutIntent={accountId:number;body:{requestId:string;tuitionId:number;amount:string;currency:'VND'}};
const key='language-center.student.pending-checkout';let memory:CheckoutIntent|null=null;let queue:Promise<unknown>=Promise.resolve();
function serial<T>(fn:()=>Promise<T>){const next=queue.then(fn,fn);queue=next.catch(()=>{});return next;}
export const pendingCheckout={
 read:(accountId:number)=>serial(async()=>{const raw=Platform.OS==='web'?memory:await SecureStore.getItemAsync(key);let value:unknown;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{return null;}if(!value||typeof value!=='object')return null;const i=value as CheckoutIntent;if(i.accountId!==accountId||!i.body||!Number.isSafeInteger(i.body.tuitionId)||i.body.tuitionId<=0||!/^\d{1,10}\.\d{2}$/.test(i.body.amount)||i.body.currency!=='VND'||!validOrderId(i.body.requestId))return null;return i;}),
 write:(intent:CheckoutIntent)=>serial(async()=>{memory=intent;if(Platform.OS!=='web')await SecureStore.setItemAsync(key,JSON.stringify(intent));}),
 clearIf:(accountId:number,requestId:string)=>serial(async()=>{
   const raw=Platform.OS==='web'?memory:await SecureStore.getItemAsync(key);
   let value:CheckoutIntent|null;try{value=typeof raw==='string'?JSON.parse(raw):raw;}catch{return;}
   if(value?.accountId!==accountId||value?.body?.requestId!==requestId)return;
   if(Platform.OS!=='web')await SecureStore.deleteItemAsync(key);memory=null;
 }),
 clear:()=>serial(async()=>{memory=null;if(Platform.OS!=='web')await SecureStore.deleteItemAsync(key);}),
};
export function validOrderId(id:unknown):id is string{return typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);}
