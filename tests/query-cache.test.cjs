const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/query/client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject,Date,Map,Set,Object,Promise,AbortController});
const {createQueryClient,freshnessMs}=exportsObject;
const failure=(kind,status)=>Object.assign(Error('temporary'),{kind,status});
test('simultaneous readers share one request and fresh academic data is reused',async()=>{
 let count=0,clock=100;const client=createQueryClient({now:()=>clock});
 const load=async()=>{count++;return {className:'A1'};};
 const first=client.fetch('class','/academic/student/me/enrollments/1',load),second=client.fetch('class','/academic/student/me/enrollments/1',load);
 assert.equal(first,second);await first;clock+=100;await client.fetch('class','/academic/student/me/enrollments/1',load);
 assert.equal(count,1);assert.equal(client.stats().deduplicated,1);assert.equal(client.stats().cacheHits,1);
});
test('financial, grades and editable versions are freshly requested on every activation',async()=>{
 for(const path of ['/finance/student/me/tuitions/1/payment-context','/teaching/student/me/enrollments/1/grades?page=0','/teaching/student/me/enrollments/1/final-result','/academic/student/me/notification-preferences','/academic/student/me/support-requests/1']){
  assert.equal(freshnessMs(path),0);let calls=0;const client=createQueryClient();const load=async()=>++calls;await client.fetch('key',path,load);await client.fetch('key',path,load);assert.equal(calls,2);
 }
});
test('transient network failures retain last data with an explicit timestamp and error',async()=>{
 let clock=100;const client=createQueryClient({now:()=>clock}),release=client.retain('key');
 await client.fetch('key','/academic/student/me/schedule',async()=>['session']);clock=200;client.invalidateKey('key');
 await client.fetch('key','/academic/student/me/schedule',async()=>{throw failure('network');});
 assert.equal(client.getSnapshot('key').data[0],'session');assert.equal(client.getSnapshot('key').updatedAt,100);assert.ok(client.getSnapshot('key').error);assert.equal(client.getActivity().staleCount,1);release();
});
test('forbidden, deleted and invalid responses remove previously cached private data',async()=>{
 for(const error of [failure('http',403),failure('http',404),failure('http',401),failure('invalid-response'),failure('http',409)]){
  const client=createQueryClient();await client.fetch('key','/finance/student/me/tuitions',async()=>['private']);
  await client.fetch('key','/finance/student/me/tuitions',async()=>{throw error;});assert.equal(client.getSnapshot('key').data,undefined);
 }
});
test('cache clear before deferred work prevents old requests from starting',async()=>{
 const client=createQueryClient();let calls=0;const task=client.fetch('key','/academic/student/me/profile',async()=>{calls++;return 'old';});client.clear();await task;
 assert.equal(calls,0);assert.equal(client.getSnapshot('key').data,undefined);
});
test('late responses after logout cannot restore private cache data',async()=>{
 const client=createQueryClient();let resolve;const task=client.fetch('key','/academic/student/me/profile',()=>new Promise(r=>{resolve=r;}));await Promise.resolve();client.clear();resolve('old user');await task;
 assert.equal(client.getSnapshot('key').data,undefined);const next=createQueryClient();assert.equal(next.getSnapshot('key').data,undefined);
});
test('one consumer leaving does not abort a request still needed by another',async()=>{
 const client=createQueryClient(),a=client.retain('key'),b=client.retain('key');let signal,resolve;
 const task=client.fetch('key','/academic/student/me/profile',s=>{signal=s;return new Promise(r=>{resolve=r;});});await Promise.resolve();a();assert.equal(signal.aborted,false);resolve('result');await task;assert.equal(client.getSnapshot('key').data,'result');b();
});
test('leaving the last consumer cancels its request and ignores late completion',async()=>{
 const client=createQueryClient(),release=client.retain('key');let signal,resolve;
 const task=client.fetch('key','/academic/student/me/profile',s=>{signal=s;return new Promise(r=>{resolve=r;});});await Promise.resolve();release();assert.equal(signal.aborted,true);resolve('late');await task;assert.equal(client.getSnapshot('key').data,undefined);
});
test('invalidation makes a fresh entry load again without affecting unrelated data',async()=>{
 const client=createQueryClient();let calls=0;await client.fetch('fees','/finance/student/me/tuitions',async()=>1);await client.fetch('class','/academic/student/me/enrollments/1',async()=>++calls);
 client.invalidate('/finance/');await client.fetch('class','/academic/student/me/enrollments/1',async()=>++calls);assert.equal(calls,1);assert.equal(client.getSnapshot('fees').revision,1);
});
test('inactive entries are bounded and reclaimed without persisting them to disk',async()=>{
 let clock=1;const client=createQueryClient({now:()=>clock,maxEntries:2});
 for(let i=0;i<5;i++){clock++;await client.fetch(String(i),'/academic/student/me/enrollments/'+i,async()=>i);}
 assert.equal(client.stats().entries,2);assert.equal(client.stats().evicted,3);assert.equal(client.getSnapshot('0').data,undefined);
});
