const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');const code=ts.transpileModule(fs.readFileSync('src/features/finance/utils.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const out={};vm.runInNewContext(code,{exports:out});
test('money preserves precision above JS safe integer cents',()=>assert.equal(out.formatMoney('9999999999999.99'),'9.999.999.999.999,99 đ'));
test('zero is real and missing balance stays unknown',()=>{assert.equal(out.formatMoney('0.00'),'0 đ');assert.equal(out.formatMoney(null),'Chưa xác minh');});
test('fraction is never rounded through Number',()=>assert.equal(out.formatMoney('1234567890123.01'),'1.234.567.890.123,01 đ'));
test('invalid scientific and malformed amounts are rejected',()=>{for(const v of ['1e9','1,00','Infinity','NaN','123'])assert.equal(out.formatMoney(v),'Chưa xác minh');});
test('support links keep explicit owned resource type',()=>{assert.equal(out.financialLink('TUITION',12).params.resourceId,'12');assert.equal(out.financialLink('RECEIPT',13).params.resourceType,'RECEIPT');});
