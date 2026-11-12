const {getDefaultConfig}=require('expo/metro-config');
const config=getDefaultConfig(__dirname);
// Bound local release bundling on the same machine that runs the backend services.
if(process.env.LC_RELEASE_BUILD==='true')config.maxWorkers=2;
module.exports=config;
