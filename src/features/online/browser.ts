import {Platform} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {financeEvents} from '../finance/events';
import {trustedCheckout,type Order} from './types';

export type PaymentWindow={navigate:(url:string)=>void;close:()=>void}|null;
const opened=new Set<string>();
const errors=new Map<string,string>();
export function paymentBrowserError(account:number,id:string){return errors.get(account+':'+id);}
export function wasPaymentOpened(account:number,id:string){return opened.has(account+':'+id);}
export function reservePaymentWindow():PaymentWindow{
  if(Platform.OS!=='web')return null;
  const win=window.open('about:blank','_blank');
  if(!win)return null;
  win.opener=null;win.document.title='Thanh toán học phí';win.document.body.textContent='Đang chuẩn bị trang thanh toán…';
  return {navigate:url=>{if(win.closed)throw Error('Cửa sổ thanh toán đã đóng. Hãy mở lại từ giao dịch.');win.location.replace(url);},close:()=>win.close()};
}
export async function openPayment(order:Order,account:number,reserved:PaymentWindow=null){
  if(!order.checkoutUrl||order.state!=='PENDING'||order.reviewRequired||Date.parse(order.expiresAt)<=Date.now()){
    reserved?.close();throw Error('Phiên không còn có thể mở. Vui lòng kiểm tra lại học phí.');
  }
  if(!(order.environment==='SANDBOX'&&trustedCheckout(order.checkoutUrl))){
    reserved?.close();throw Error('Địa chỉ cổng thanh toán không hợp lệ.');
  }
  opened.add(account+':'+order.id);
  errors.delete(account+':'+order.id);
  try{
    if(Platform.OS==='web'){
      if(reserved)reserved.navigate(order.checkoutUrl);
      else throw Error('Trình duyệt chưa cho phép mở cửa sổ. Bấm Tiếp tục thanh toán và cho phép cửa sổ mới.');
    }else await WebBrowser.openBrowserAsync(order.checkoutUrl);
  }catch(e){errors.set(account+':'+order.id,e instanceof Error?e.message:'Chưa mở được cổng thanh toán. Hãy tiếp tục phiên này.');throw e;}
  finally{financeEvents.notify();}
}
