import {Pressable,Text,View} from 'react-native';
import {theme} from '../../theme/tokens';
export function Segments({value,options,onChange}:{value:string;options:{value:string;label:string}[];onChange:(value:string)=>void}){
  return <View accessibilityRole="tablist" style={{flexDirection:'row',gap:4,padding:4,borderRadius:14,backgroundColor:theme.colors.primaryLight}}>
    {options.map(option=><Pressable key={option.value} accessibilityRole="tab" accessibilityState={{selected:value===option.value}} onPress={()=>onChange(option.value)} style={{flex:1,minHeight:44,justifyContent:'center',alignItems:'center',borderRadius:10,backgroundColor:value===option.value?theme.colors.surface:'transparent',paddingHorizontal:8}}><Text style={{fontSize:15,fontWeight:'600',color:value===option.value?theme.colors.primary:theme.colors.muted}}>{option.label}</Text></Pressable>)}
  </View>;
}
