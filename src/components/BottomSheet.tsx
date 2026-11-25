import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme as t } from '../theme/tokens';
import { Button, textStyles } from './ui';

export function BottomSheet({ visible, title, onClose, children }: PropsWithChildren<{
  visible: boolean; title: string; onClose: () => void;
}>) {
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={s.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Đóng lựa chọn" onPress={onClose} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['bottom', 'left', 'right']} accessibilityViewIsModal style={s.sheet}>
        <View style={s.handle} />
        <Text accessibilityRole="header" style={textStyles.section}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 4 }} style={{ flexShrink: 1 }}>{children}</ScrollView>
        <Button secondary title="Đóng" onPress={onClose} />
      </SafeAreaView>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.backdrop },
  sheet: { maxHeight: '80%', padding: 20, gap: 12, backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.border, alignSelf: 'center' },
});
