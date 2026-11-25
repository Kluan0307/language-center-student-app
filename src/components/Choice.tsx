import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, textStyles } from './ui';
import { BottomSheet } from './BottomSheet';
import { theme as t } from '../theme/tokens';

export function Choice({ title, value, options, onChange, disabled = false }: {
  title: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <><Button secondary title={title + ': ' + (options.find(o => o.value === value)?.label ?? 'Chọn')} disabled={disabled} onPress={() => setOpen(true)} />
    <BottomSheet visible={open && !disabled} title={title} onClose={() => setOpen(false)}>
      {options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} aria-checked={value === option.value}
        onPress={() => { onChange(option.value); setOpen(false); }} style={({ pressed }) => ({ minHeight: t.touchTarget, padding: 14, borderRadius: t.radius.md, backgroundColor: value === option.value || pressed ? t.colors.primaryLight : t.colors.surface })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text style={[textStyles.label, { flex: 1 }]}>{option.label}</Text>
          {value === option.value && <Ionicons name="checkmark" size={22} color={t.colors.primary} />}</View>
      </Pressable>)}
    </BottomSheet></>;
}
