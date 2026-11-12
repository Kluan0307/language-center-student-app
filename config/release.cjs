function validateReleaseConfig(env,config){
  const profile=env.EAS_BUILD_PROFILE;
  const release=['preview','production'].includes(profile)||env.LC_RELEASE_BUILD==='true';
  const value=env.EXPO_PUBLIC_API_BASE_URL??config.extra?.apiBaseUrl;
  if(release){
    let u;try{u=new URL(value);}catch{throw Error('Release build requires EXPO_PUBLIC_API_BASE_URL with a reachable HTTPS gateway.');}
    if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname.replace(/\/$/,'')!=='/api/v1'||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|\[?::1\]?$)/i.test(u.hostname))throw Error('Release API must be public HTTPS ending in /api/v1, without credentials or query.');
    if(env.EXPO_PUBLIC_PAYMENT_PROTOCOL_TEST)throw Error('Payment protocol simulator is not allowed in a release build.');
    for(const key of Object.keys(env))if(key.startsWith('EXPO_PUBLIC_')&&/SECRET|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN|DB_URL|DB_USERNAME|VNPAY_HASH/i.test(key))throw Error('Server secrets must not be published through EXPO_PUBLIC variables.');
  }
  const packageName=env.EXPO_ANDROID_PACKAGE??config.android?.package??'com.languagecenter.student';
  if(!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(packageName))throw Error('Android package name is invalid.');
  const projectId=env.EXPO_PUBLIC_EAS_PROJECT_ID??config.extra?.eas?.projectId;
  if(projectId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId))throw Error('EAS project ID must be a real project UUID.');
  return {release,apiBaseUrl:value,packageName,projectId};
}
module.exports={validateReleaseConfig};
