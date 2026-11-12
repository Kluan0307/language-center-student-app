import type {ConfigContext,ExpoConfig} from 'expo/config';
const {validateReleaseConfig}=require('./config/release.cjs');
export default ({config}:ConfigContext):ExpoConfig=>{
  const checked=validateReleaseConfig(process.env,config);
  return {...config,name:'Language Center',slug:config.slug??'language-center-student-app',
    extra:{...config.extra,apiBaseUrl:checked.apiBaseUrl,eas:{...config.extra?.eas,...(checked.projectId?{projectId:checked.projectId}:{})}},
    android:{...config.android,package:checked.packageName,...(process.env.EXPO_ANDROID_GOOGLE_SERVICES_JSON?{googleServicesFile:process.env.EXPO_ANDROID_GOOGLE_SERVICES_JSON}:{})},
  };
};
