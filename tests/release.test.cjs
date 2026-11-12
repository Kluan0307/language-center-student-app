const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateReleaseConfig}=require('../config/release.cjs');
const valid={LC_RELEASE_BUILD:'true',EXPO_PUBLIC_API_BASE_URL:'https://center.example/api/v1'};
test('internal handoff defaults to an Android package and requires public HTTPS',()=>{
 assert.equal(validateReleaseConfig(valid,{}).packageName,'com.languagecenter.student');
 for(const api of [undefined,'http://192.168.1.2:8080/api/v1','https://localhost/api/v1','https://127.0.0.1/api/v1','https://center.example','https://user:pass@center.example/api/v1','https://center.example/api/v1?token=test'])assert.throws(()=>validateReleaseConfig({...valid,EXPO_PUBLIC_API_BASE_URL:api},{}));
});
test('release cannot include server secrets or simulator switches in public config',()=>{
 assert.throws(()=>validateReleaseConfig({...valid,EXPO_PUBLIC_JWT_SECRET:'never-publish'},{}));
 assert.throws(()=>validateReleaseConfig({...valid,EXPO_PUBLIC_PAYMENT_PROTOCOL_TEST:'1'},{}));
 assert.doesNotThrow(()=>validateReleaseConfig({...valid,EXPO_PUBLIC_CENTER_PHONE:'0900000000'},{}));
});
test('development retains LAN configuration without weakening release profiles',()=>{
 assert.doesNotThrow(()=>validateReleaseConfig({EXPO_PUBLIC_API_BASE_URL:'http://192.168.1.2:8080/api/v1'},{}));
 assert.throws(()=>validateReleaseConfig({EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_API_BASE_URL:'http://192.168.1.2:8080/api/v1'},{}));
 assert.throws(()=>validateReleaseConfig({...valid,EXPO_PUBLIC_EAS_PROJECT_ID:'placeholder'},{}));
});
