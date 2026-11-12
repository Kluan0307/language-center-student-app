import {Platform} from 'react-native';
let epoch=0,ready:Promise<void>=Promise.resolve();
export function clearPrivateDownloads(){epoch++;if(Platform.OS==='web')return;ready=ready.catch(()=>{}).then(async()=>{const {Directory,Paths}=await import('expo-file-system');const dir=new Directory(Paths.cache,'language-center-student-private');if(dir.exists)dir.delete();}).catch(()=>{});}
export async function shareDocument(bytes:ArrayBuffer,filename:string,mime:string){
 const safe=filename.replace(/[\\/\x00-\x1f]/g,'_').slice(-160)||'document';
 if(Platform.OS==='web'){const url=URL.createObjectURL(new Blob([bytes],{type:mime}));try{const a=document.createElement('a');a.href=url;a.download=safe;document.body.appendChild(a);a.click();a.remove();}finally{setTimeout(()=>URL.revokeObjectURL(url),1000);}return;}
 const version=epoch;await ready;const [{Directory,File,Paths},Sharing,Crypto]=await Promise.all([import('expo-file-system'),import('expo-sharing'),import('expo-crypto')]);if(version!==epoch)throw Error('Phiên đã thay đổi. Vui lòng tải lại.');if(!await Sharing.isAvailableAsync())throw Error('Thiết bị chưa hỗ trợ mở/chia sẻ tài liệu.');if(version!==epoch)throw Error('Phiên đã thay đổi.');const dir=new Directory(Paths.cache,'language-center-student-private');dir.create({idempotent:true,intermediates:true});const file=new File(dir,Crypto.randomUUID()+'-'+safe);file.write(new Uint8Array(bytes));try{await Sharing.shareAsync(file.uri,{mimeType:mime,dialogTitle:safe});}finally{setTimeout(()=>{try{if(file.exists)file.delete();}catch{}},60000);}
}
