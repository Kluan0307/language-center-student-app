const {test} = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, imports = {}) { const exports = {}; vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{if(name in imports)return imports[name];throw Error(name);},URLSearchParams,Date,Intl,Set}); return exports; }
const c = load('src/features/support/context.ts');
const u = load('src/features/learning/utils.ts', {'../../lib/api/client':{}});
const f = load('src/features/online/flow.ts');
test('support preserves the source class, session, profile, fee and receipt', () => {
  for (const type of ['ENROLLMENT','SESSION','PROFILE','TUITION','RECEIPT']) {
    const result = c.parseSupportContext(c.supportLink('GRADE',type,'12').params);
    assert.equal(result.invalid,false); assert.equal(result.resource.type,type); assert.equal(result.resource.id,'12');
    assert.equal(c.contextBody(result.resource).resourceId,12);
  }
});
test('payment support preserves UUID without converting it to a numeric id', () => {
  const id='11111111-1111-4111-8111-111111111111', result=c.parseSupportContext(c.supportLink('PAYMENT','PAYMENT_ORDER',id).params);
  assert.equal(result.invalid,false);assert.equal(c.contextBody(result.resource).resourceKey,id);assert.equal(c.contextBody(result.resource).resourceId,undefined);
  assert.equal(c.resourceTarget(result.resource),'/payment-orders/'+id);
});
test('malformed or mixed support references cannot silently become an unlinked request', () => {
  for (const params of [{resourceType:'SESSION'}, {resourceId:'1'}, {resourceType:'SESSION',resourceId:'../1'}, {resourceType:'SESSION',resourceId:'9007199254740992'}, {resourceType:'SESSION',resourceId:'1',resourceKey:'x'}, {resourceType:'PAYMENT_ORDER',resourceKey:'https://evil.test'}, {category:'UNKNOWN'}, {resourceType:'ACCOUNTS',resourceId:'1'}]) assert.equal(c.parseSupportContext(params).invalid,true);
});
test('financial and profile support categories match the linked resource', () => {
  assert.equal(c.parseSupportContext({category:'GRADE',resourceType:'TUITION',resourceId:'1'}).category,'PAYMENT');
  assert.equal(c.parseSupportContext({resourceType:'PROFILE',resourceId:'1'}).category,'PROFILE');
});
test('support and payment-history return routes survive login without untrusted extra parameters', () => {
  const key='11111111-1111-4111-8111-111111111111';
  assert.ok(u.safeReturnTo('/support?category=PAYMENT&resourceType=PAYMENT_ORDER&resourceKey='+key).includes(key));
  assert.ok(u.safeReturnTo('/support?category=ATTENDANCE&resourceType=ENROLLMENT&resourceId=2').includes('resourceId=2'));
  assert.equal(u.safeReturnTo('/support?resourceType=SESSION&resourceId=../1'),null);
  assert.equal(u.safeReturnTo('/payment-orders?tuitionId=2&token=never-retain'),'/payment-orders?tuitionId=2');
  assert.equal(u.safeReturnTo('/tuition?tab=history&token=never-retain'),'/tuition?tab=history');
});
test('success without an available receipt is distinct from receipt-ready success', () => {
  assert.equal(f.paymentStage({state:'SUCCEEDED',receiptId:null},true).action,'check');
  assert.equal(f.paymentStage({state:'SUCCEEDED',receiptId:8},true).action,'receipt');
  assert.equal(f.paymentStage({state:'CREATED'},false).action,'check');
  assert.equal(f.paymentStage({state:'UNKNOWN'},false).action,'support');
});
