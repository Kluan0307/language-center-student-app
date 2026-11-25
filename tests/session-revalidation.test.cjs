const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{if(n in imports)return imports[n];throw Error(n);},URL,AbortController,setTimeout,clearTimeout,Promise});return exports;}
const client=load('src/lib/api/client.ts'),types=load('src/types/api.ts');
const {createSessionManager}=load('src/lib/session/manager.ts',{'../api/client':client,'../../types/api':types});
const me={accountId:11,username:'student',role:'STUDENT',mustChangePassword:false};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status});
async function setup(){let saved='existing-token',handler=async()=>json(me);const manager=createSessionManager({baseUrl:'https://school.example/api/v1',storage:{read:async()=>saved,write:async v=>{saved=v;},clear:async()=>{saved=null;}},fetcher:(...args)=>handler(...args)});await manager.restore();return{manager,store:()=>saved,respond:fn=>{handler=fn;}};}
test('resume keeps identity and screen state while deduplicating verification',async()=>{
 const x=await setup();let resolve,calls=0;const states=[];x.manager.subscribe(()=>states.push(x.manager.getSnapshot().status));
 x.respond(()=>{calls++;return new Promise(r=>{resolve=r;});});const a=x.manager.revalidate(),b=x.manager.revalidate();
 assert.equal(a,b);assert.equal(x.manager.getSnapshot().status,'authenticated');assert.equal(x.manager.getSnapshot().identity.accountId,11);resolve(json(me));await a;
 assert.equal(calls,1);assert.ok(!states.includes('loading'));
});
test('temporary resume failure keeps identity and token with a warning that clears on recovery',async()=>{
 const x=await setup();x.respond(async()=>json({},503));await x.manager.revalidate();assert.equal(x.manager.getSnapshot().status,'authenticated');assert.equal(x.store(),'existing-token');assert.ok(x.manager.getSnapshot().message);
 x.respond(async()=>json(me));await x.manager.revalidate();assert.equal(x.manager.getSnapshot().message,undefined);
});
test('revoked or forbidden resume clears the session',async()=>{
 for(const status of [401,403]){const x=await setup();x.respond(async()=>json({},status));await x.manager.revalidate();assert.equal(x.manager.getSnapshot().status,'anonymous');assert.equal(x.store(),null);}
});
test('late resume response after logout cannot reopen a session',async()=>{
 const x=await setup();let resolve;x.respond(()=>new Promise(r=>{resolve=r;}));const task=x.manager.revalidate();await x.manager.clearLocalSession();resolve(json(me));await task;assert.equal(x.manager.getSnapshot().status,'anonymous');assert.equal(x.store(),null);
});
test('resume rejects identity switching and role changes',async()=>{
 for(const next of [{...me,accountId:12},{...me,role:'STAFF'}]){const x=await setup();x.respond(async()=>json(next));await x.manager.revalidate();assert.equal(x.manager.getSnapshot().status,'anonymous');}
});
test('resume refreshes mandatory password-change state without losing ownership',async()=>{
 const x=await setup();x.respond(async()=>json({...me,mustChangePassword:true}));await x.manager.revalidate();assert.equal(x.manager.getSnapshot().identity.mustChangePassword,true);assert.equal(x.manager.getSnapshot().identity.accountId,11);
});
