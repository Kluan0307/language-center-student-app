import type {CheckoutIntent} from './storage';
import type {Order} from './types';

export type PaymentApi = <T>(path:string, options?:{method?:'GET'|'POST';body?:unknown;signal?:AbortSignal})=>Promise<T>;
type Failure={kind?:string;status?:number;code?:string;requestRejected?:boolean;orderId?:string};
const rejectedCodes=new Set(['PAYMENT_DISABLED','PAYMENT_INVALID_AMOUNT','PAYMENT_BALANCE_CHANGED','TUITION_NOT_PAYABLE','PAYMENT_ALREADY_PENDING','PAYMENT_REVIEW_REQUIRED']);
export function definitelyRejected(error:unknown){
  const e=error as Failure|undefined;
  return e?.kind==='http'&&e.requestRejected===true&&!!e.code&&rejectedCodes.has(e.code);
}
export function paymentError(error:unknown){
  const e=error as Failure|undefined;
  const messages:Record<string,string>={PAYMENT_DISABLED:'Thanh toán trực tuyến đang tạm ngừng.',PAYMENT_INVALID_AMOUNT:'Kiểm tra lại số tiền thanh toán.',PAYMENT_BALANCE_CHANGED:'Số còn phải đóng đã thay đổi. Vui lòng kiểm tra và xác nhận lại.',TUITION_NOT_PAYABLE:'Khoản học phí hiện chưa thể thanh toán.',PAYMENT_ALREADY_PENDING:'Bạn có phiên thanh toán đang chờ. Mở giao dịch để tiếp tục.',PAYMENT_REVIEW_REQUIRED:'Trung tâm cần kiểm tra giao dịch trước khi bạn thanh toán tiếp.',PAYMENT_INTENT_MISMATCH:'Yêu cầu thanh toán chưa khớp. Vui lòng kiểm tra giao dịch trước đó.'};
  return e?.code&&messages[e.code] ? messages[e.code] : error instanceof Error?error.message:'Chưa kiểm tra được thanh toán. Vui lòng thử lại.';
}

/** Recovery and retry always use the frozen request, never a replacement UUID. */
export async function resolvePayment(api:PaymentApi,intent:CheckoutIntent,recoverFirst:boolean,active:()=>boolean){
  const path='/finance/student/me/payment-orders';
  const check=()=>{if(!active())throw new Error('Phiên thao tác đã thay đổi.');};
  async function recover(){check();const order=await api<Order>(path+'/requests/'+intent.body.requestId);check();return order;}
  if(recoverFirst){
    try{return {order:await recover(),open:false};}
    catch(e){check();if((e as Failure)?.status!==404)throw e;}
  }
  check();
  try{const order=await api<Order>(path,{method:'POST',body:intent.body});check();return {order,open:true};}
  catch(e){
    check();
    if(definitelyRejected(e)){
      const id=(e as Failure).orderId;
      if((e as Failure).code==='PAYMENT_ALREADY_PENDING'&&id){const order=await api<Order>(path+'/'+id);check();if(order.tuitionId!==intent.body.tuitionId)throw e;return {order,open:false};}
      throw e;
    }
    // Even an unexpected HTTP error can hide a successful commit behind a proxy.
    try{return {order:await recover(),open:false};}catch{check();throw e;}
  }
}

export function paymentStage(order:Order,returned:boolean){
  if(order.state==='SUCCEEDED')return {title:'Thanh toán thành công',description:'Trung tâm đã ghi nhận khoản tiền và tạo phiếu thu.',action:'receipt'};
  if(order.reviewRequired||order.state==='REVIEW_REQUIRED')return {title:'Giao dịch đang được kiểm tra',description:'Vui lòng không thanh toán lại nếu ngân hàng đã trừ tiền.',action:'support'};
  if(order.state==='FAILED')return {title:'Thanh toán chưa thành công',description:'Ngân hàng báo giao dịch không thành công. Kiểm tra khoản học phí trước khi thử lại.',action:'tuition'};
  if(order.state==='EXPIRED')return {title:'Phiên thanh toán đã hết hạn',description:'Nếu chưa thanh toán, bạn có thể kiểm tra học phí để tạo phiên mới. Nếu đã bị trừ tiền, hãy liên hệ trung tâm.',action:'tuition'};
  return returned?{title:'Đang kiểm tra kết quả',description:'Chưa nhận được xác nhận từ trung tâm. Việc quay lại app không có nghĩa giao dịch đã thành công.',action:'check'}:{title:'Phiên thanh toán chưa hoàn tất',description:'Nếu chưa thanh toán, bạn có thể tiếp tục phiên còn hiệu lực này.',action:'continue'};
}
