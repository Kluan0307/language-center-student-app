const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawn,spawnSync}=require('child_process');
const {validateReleaseConfig}=require('../config/release.cjs');
const root=path.resolve(__dirname,'..');
function run(command,args,options={}){return new Promise((resolve,reject)=>{
 const child=spawn(command,args,{cwd:root,windowsHide:true,stdio:'inherit',...options});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error('Build command exited '+code)));
});}
(async()=>{
 const env={...process.env,CI:'1',LC_RELEASE_BUILD:'true',NODE_OPTIONS:'--max-old-space-size=1536',CMAKE_BUILD_PARALLEL_LEVEL:'2'};
 const config=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')).expo;
 const checked=validateReleaseConfig(env,config);
 if(!env.ANDROID_HOME)throw Error('Set ANDROID_HOME to your Android SDK directory.');
 if(!fs.existsSync(path.join(root,'android/gradlew.bat')))await run(process.execPath,['node_modules/expo/bin/cli','prebuild','--platform','android','--no-install'],{env});
 const props=path.join(root,'android/gradle.properties');let text=fs.readFileSync(props,'utf8');
 const settings={'org.gradle.jvmargs':'-Xmx1536m -XX:MaxMetaspaceSize=512m -XX:ActiveProcessorCount=2 -Dfile.encoding=UTF-8','org.gradle.workers.max':'1','org.gradle.parallel':'false','kotlin.compiler.execution.strategy':'in-process','EX_DEV_CLIENT_NETWORK_INSPECTOR':'false'};
 for(const [key,value] of Object.entries(settings)){const pattern=new RegExp('^'+key.replaceAll('.','\\.')+'=.*$','m');text=pattern.test(text)?text.replace(pattern,()=>key+'='+value):text+'\n'+key+'='+value+'\n';}fs.writeFileSync(props,text);
 const appGradle=path.join(root,'android/app/build.gradle');let gradle=fs.readFileSync(appGradle,'utf8');
 const versionCode=config.android?.versionCode??1;
 if(!Number.isSafeInteger(versionCode)||versionCode<1||!/^\d+\.\d+\.\d+$/.test(config.version))throw Error('Invalid application version.');
 gradle=gradle.replace(/versionCode\s+\d+/, 'versionCode '+versionCode).replace(/versionName\s+"[^"]+"/, 'versionName "'+config.version+'"').replace(/applicationId\s+['"][^'"]+['"]/, "applicationId '"+checked.packageName+"'");
 fs.writeFileSync(appGradle,gradle);

 if(!gradle.includes('// LC Windows object path limit'))gradle+='\n// LC Windows object path limit\nandroid { defaultConfig { externalNativeBuild { cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=240" } } } }\n';
 gradle=gradle.replace(/-DCMAKE_OBJECT_PATH_MAX=\d+/g,'-DCMAKE_OBJECT_PATH_MAX=240');fs.writeFileSync(appGradle,gradle);
 const poolArgs='"-DCMAKE_JOB_POOLS=lc_compile=1;lc_link=1", "-DCMAKE_JOB_POOL_COMPILE=lc_compile", "-DCMAKE_JOB_POOL_LINK=lc_link"';
 if(!gradle.includes('// LC bounded native compilation')){gradle+='\n// LC bounded native compilation\nandroid { defaultConfig { externalNativeBuild { cmake { arguments '+poolArgs+' } } } }\n';fs.writeFileSync(appGradle,gradle);}
 if(!gradle.includes('// LC public environment bundle inputs')){gradle+='\n// LC public environment bundle inputs\ntasks.withType(com.facebook.react.tasks.BundleHermesCTask).configureEach { inputs.property("lcPublicEnvironment", System.getenv().findAll { key, value -> key.startsWith("EXPO_PUBLIC_") }.sort()) }\n';fs.writeFileSync(appGradle,gradle);}
 const rootGradlePath=path.join(root,'android/build.gradle');let rootGradle=fs.readFileSync(rootGradlePath,'utf8');
 if(!rootGradle.includes('// LC bounded library compilation')){rootGradle+='\n// LC bounded library compilation\nsubprojects { p -> p.plugins.withId("com.android.library") { p.android.defaultConfig.externalNativeBuild.cmake.arguments.addAll(['+poolArgs+']) } }\n';fs.writeFileSync(rootGradlePath,rootGradle);}
 if(!rootGradle.includes('// LC short native library paths')){rootGradle+='\n// LC short native library paths\nsubprojects { p -> p.plugins.withId("com.android.library") { p.android.externalNativeBuild.cmake.buildStagingDirectory = rootProject.file(".native/" + p.name); p.android.defaultConfig.externalNativeBuild.cmake.arguments.add("-DCMAKE_OBJECT_PATH_MAX=240") } }\n';fs.writeFileSync(rootGradlePath,rootGradle);}
 let drive,buildRoot=root;const mappedRoot=path.dirname(root);
 try{
   if(process.platform==='win32'){
     for(const candidate of ['R:','S:','T:','U:','V:','W:','X:','Y:','Z:']){
       if(fs.existsSync(candidate+'\\'))continue;
       const result=spawnSync('subst.exe',[candidate,mappedRoot],{windowsHide:true,stdio:'ignore'});
       if(result.status===0){drive=candidate;buildRoot=path.join(candidate+'\\',path.basename(root));break;}
     }
     if(!drive)throw Error('No unused drive letter for a short Windows build path.');
   }
   const command='gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon'+(process.argv.includes('--check-config')?' --dry-run':'');
   await run(env.ComSpec||'cmd.exe',['/d','/s','/c',command],{cwd:path.join(buildRoot,'android'),env});
 }finally{
   if(drive){const mappings=spawnSync('subst.exe',[],{encoding:'utf8',windowsHide:true}).stdout||'';if(mappings.split(/\r?\n/).some(line=>line.startsWith(drive+'\\: => ')&&line.endsWith(mappedRoot)))spawnSync('subst.exe',[drive,'/D'],{windowsHide:true});}
 }
 if(process.argv.includes('--check-config')){console.log('Android build configuration validated; no APK generated.');return;}
 const source=path.join(root,'android/app/build/outputs/apk/release/app-release.apk');if(!fs.existsSync(source))throw Error('Gradle did not produce the expected APK.');
 const dir=path.join(root,'artifacts');fs.mkdirSync(dir,{recursive:true});const stamp=new Date().toISOString().replace(/\D/g,'').slice(0,14);
 const file='LanguageCenter-'+config.version+'-sandbox-arm64-'+stamp+'.apk';fs.copyFileSync(source,path.join(dir,file));
 const buffer=fs.readFileSync(path.join(dir,file));const info={file,version:config.version,versionCode,packageName:checked.packageName,createdAt:new Date().toISOString(),apiBaseUrl:checked.apiBaseUrl,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),bytes:buffer.length,architecture:'arm64-v8a',environment:'VNPAY sandbox',signing:'local Android project signing; generated template uses debug keystore, internal distribution only',deviceAcceptance:'PENDING'};
 fs.writeFileSync(path.join(dir,'latest-android.json'),JSON.stringify(info,null,2));console.log('APK ready: '+path.join(dir,file));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
