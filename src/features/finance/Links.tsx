import {Pressable,Text} from 'react-native';
import {theme} from '../../theme/tokens';
export function TextLink({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}){
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{minHeight:44,justifyContent:'center',opacity:disabled?0.5:1}}><Text style={{color:theme.colors.primary,fontSize:15,fontWeight:'600'}}>{title}</Text></Pressable>;
}
