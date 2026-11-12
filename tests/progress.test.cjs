const {test}=require('node:test'),assert=require('node:assert/strict'),ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm');const code=ts.transpileModule(fs.readFileSync('src/features/progress/utils.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const exportsObj={};vm.runInNewContext(code,{exports:exportsObj});
test('zero is a real grade',()=>assert.equal(exportsObj.scoreLabel({score:0,maxScore:10,status:'GRADED'}),'0 / 10'));
test('missing grade is not zero',()=>assert.equal(exportsObj.scoreLabel({score:null,maxScore:10,status:'NOT_GRADED'}),'Chưa chấm'));
test('incomplete coverage hides percentage',()=>assert.equal(exportsObj.percentLabel({coverageComplete:false,attendancePercent:0,eligibleCompleted:3}),'Chưa đủ dữ liệu để tính tỷ lệ'));
test('empty denominator hides percentage',()=>assert.equal(exportsObj.percentLabel({coverageComplete:true,attendancePercent:null,eligibleCompleted:0}),'Chưa có buổi đủ điều kiện'));
test('verified zero attendance remains zero',()=>assert.equal(exportsObj.percentLabel({coverageComplete:true,attendancePercent:0,eligibleCompleted:3}),'0%'));
