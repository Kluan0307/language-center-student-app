const fs=require('fs'),path=require('path');const {validateReleaseConfig}=require('../config/release.cjs');
const root=path.resolve(__dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')).expo;
validateReleaseConfig({...process.env,LC_RELEASE_BUILD:'true'},config);
const errors=[],banned=/Khám phá giao diện|Xem trước phát triển|startPreview|endPreview|9704198526191432198|EXPO_PUBLIC_PAYMENT_PROTOCOL_TEST/;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else if(/\.[jt]sx?$/.test(f)&&banned.test(fs.readFileSync(f,'utf8')))errors.push('Development-only content in '+path.relative(root,f));}}
walk(path.join(root,'src'));
for(const asset of [config.icon,config.web?.favicon,...Object.values(config.android?.adaptiveIcon||{}).filter(v=>typeof v==='string'&&v.endsWith('.png'))])if(asset&&!fs.existsSync(path.resolve(root,asset)))errors.push('Missing app asset: '+asset);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log('Release configuration, runtime cleanup and app asset checks passed.');
