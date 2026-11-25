const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{if(n in imports)return imports[n];throw Error('Unexpected import '+n);},URL,Error,Set,Map,Date,AbortController,setTimeout,clearTimeout});return exports;}
const x=load('src/features/online/flow.ts');
const intent={accountId:7,body:{requestId:'11111111-1111-4111-8111-111111111111',tuitionId:13,amount:'1000.00',currency:'VND'}};
const order={id:'22222222-2222-4222-8222-222222222222',tuitionId:13,state:'PENDING',amount:'1000.00',currency:'VND',version:0,reviewRequired:false};
const failure=(status,code,requestRejected=false,orderId)=>Object.assign(Error('HTTP '+status),{kind:'http',status,code,requestRejected,orderId});
test('normal confirmation sends one frozen command and permits browser opening',async()=>{
 const calls=[];const api=async(path,opts)=>{calls.push({path,opts});return order;};
 const r=await x.resolvePayment(api,intent,false,()=>true);assert.equal(calls.length,1);assert.equal(calls[0].opts.body,intent.body);assert.equal(r.open,true);
});
test('POST timeout recovers committed order without posting another request',async()=>{
 const calls=[];const r=await x.resolvePayment(async(path,opts)=>{calls.push({path,opts});if(opts)throw Object.assign(Error('timeout'),{kind:'timeout'});return order;},intent,false,()=>true);
 assert.equal(r.order.id,order.id);assert.equal(r.open,false);assert.equal(calls.length,2);assert.ok(calls[1].path.endsWith(intent.body.requestId));
});
test('persisted intent checks recovery first then retries the exact same command on 404',async()=>{
 const calls=[];const r=await x.resolvePayment(async(path,opts)=>{calls.push({path,opts});if(!opts)throw failure(404);return order;},intent,true,()=>true);
 assert.equal(r.order.id,order.id);assert.equal(calls.length,2);assert.equal(calls[1].opts.body.requestId,intent.body.requestId);assert.equal(calls[1].opts.body.amount,'1000.00');
});
test('unavailable recovery never posts a speculative new payment',async()=>{
 let calls=0;await assert.rejects(x.resolvePayment(async()=>{calls++;throw failure(503);},intent,true,()=>true));assert.equal(calls,1);
});
test('only explicit known command rejection allows clearing the persisted request',()=>{
 assert.equal(x.definitelyRejected(failure(409,'PAYMENT_BALANCE_CHANGED',true)),true);
 for(const e of [failure(409),failure(500,'PAYMENT_BALANCE_CHANGED',false),failure(409,'UNKNOWN_CODE',true),failure(409,'PAYMENT_INTENT_MISMATCH',true),{kind:'network'}])assert.equal(x.definitelyRejected(e),false);
});
test('known rejection does not retry or turn into a pending recovery screen',async()=>{
 let calls=0;const e=failure(409,'PAYMENT_BALANCE_CHANGED',true);await assert.rejects(x.resolvePayment(async()=>{calls++;throw e;},intent,false,()=>true),v=>v===e);assert.equal(calls,1);
});
test('pending conflict opens the owned existing order without silently launching another amount',async()=>{
 let calls=0;const r=await x.resolvePayment(async(path,opts)=>{calls++;if(opts)throw failure(409,'PAYMENT_ALREADY_PENDING',true,order.id);return {...order,amount:'500.00'};},intent,false,()=>true);assert.equal(calls,2);assert.equal(r.open,false);assert.equal(r.order.amount,'500.00');
});
test('pending conflict cannot navigate to a different tuition',async()=>{
 await assert.rejects(x.resolvePayment(async(path,opts)=>{if(opts)throw failure(409,'PAYMENT_ALREADY_PENDING',true,order.id);return {...order,tuitionId:99};},intent,false,()=>true));
});
test('account/focus changes stop recovery before any payment is posted',async()=>{
 let active=true,calls=0;await assert.rejects(x.resolvePayment(async()=>{calls++;active=false;throw failure(404);},intent,true,()=>active));assert.equal(calls,1);
});
test('returning from browser never changes pending into financial success',()=>{
 assert.equal(x.paymentStage(order,false).action,'continue');assert.equal(x.paymentStage(order,true).action,'check');
 assert.equal(x.paymentStage({...order,state:'SUCCEEDED',receiptId:12},true).action,'receipt');
 assert.equal(x.paymentStage({...order,state:'SUCCEEDED',receiptId:12,reviewRequired:true},true).action,'receipt');
 assert.equal(x.paymentStage({...order,reviewRequired:true},false).action,'support');
});
test('failure, expiry and unallocated money have distinct next actions',()=>{
 assert.equal(x.paymentStage({...order,state:'EXPIRED'},true).action,'tuition');assert.equal(x.paymentStage({...order,state:'FAILED'},true).action,'tuition');assert.equal(x.paymentStage({...order,state:'REVIEW_REQUIRED'},false).action,'support');
});
test('conditional clear cannot remove another account or a more recent intent',async()=>{
 let stored=null;const store=load('src/features/online/storage.ts',{'react-native':{Platform:{OS:'android'}},'expo-secure-store':{getItemAsync:async()=>stored,setItemAsync:async(k,v)=>{stored=v;},deleteItemAsync:async()=>{stored=null;}}}).pendingCheckout;
 await store.write(intent);await store.clearIf(8,intent.body.requestId);assert.notEqual(stored,null);await store.clearIf(7,'33333333-3333-4333-8333-333333333333');assert.notEqual(stored,null);await store.clearIf(7,intent.body.requestId);assert.equal(stored,null);
});
test('API client preserves explicit rejection metadata for automatic recovery decisions',async()=>{
 const {createApiClient}=load('src/lib/api/client.ts');
 const api=createApiClient({baseUrl:'https://api.example/api/v1',token:()=> 'ui-test',onUnauthorized:()=>{},fetcher:async()=>new Response(JSON.stringify({code:'PAYMENT_ALREADY_PENDING',requestRejected:true,orderId:order.id}),{status:409})});
 await assert.rejects(api('/finance/student/me/payment-orders'),e=>e.code==='PAYMENT_ALREADY_PENDING'&&e.orderId===order.id&&x.definitelyRejected(e));
});
