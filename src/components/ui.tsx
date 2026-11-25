import { QueryFeedback } from './QueryFeedback';
import React from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme as t } from '../theme/tokens';
type Icon = React.ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, onRefresh, refreshing = false }: React.PropsWithChildren<{
  onRefresh?: () => void; refreshing?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  return <SafeAreaView edges={['left', 'right']} style={s.screen}>
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={[s.content, { paddingBottom: t.spacing.xl + insets.bottom }]}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} colors={[t.colors.primary]} /> : undefined}>
        <QueryFeedback />
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={s.heading}><Text accessibilityRole="header" style={s.title}>{title}</Text>
    {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}</View>;
}
export function SectionTitle({ title, action }: { title: string; action?: { title: string; onPress: () => void } }) {
  return <View style={s.sectionHeader}><Text accessibilityRole="header" style={[textStyles.section, { flex: 1, marginBottom: 0 }]}>{title}</Text>
    {action && <Pressable accessibilityRole="button" onPress={action.onPress} style={({ pressed }) => [s.textAction, pressed && s.pressed]}>
      <Text style={{ color: t.colors.primary, fontSize: 15, fontWeight: '600' }}>{action.title}</Text>
    </Pressable>}</View>;
}
export function Card({ children }: React.PropsWithChildren) { return <View style={s.card}>{children}</View>; }
export function Button({ title, onPress, secondary = false, disabled = false }: {
  title: string; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} aria-disabled={disabled} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondary, (pressed || disabled) && s.pressed]}>
    <Text style={[s.buttonText, secondary && { color: t.colors.primary }]}>{title}</Text>
  </Pressable>;
}
export function IconButton({ icon, label, onPress, disabled = false }: { icon: Icon; label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} aria-disabled={disabled} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [s.iconButton, (pressed || disabled) && s.pressed]}>
    <Ionicons name={icon} size={22} color={t.colors.primary} />
  </Pressable>;
}
export function SegmentedControl<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <View accessibilityRole="tablist" style={s.segments}>{options.map(option => <Pressable key={option.value}
    accessibilityRole="tab" accessibilityState={{ selected: value === option.value }} aria-selected={value === option.value} onPress={() => onChange(option.value)}
    style={({ pressed }) => [s.segment, value === option.value && s.segmentSelected, pressed && s.pressed]}>
    <Text style={[s.segmentText, value === option.value && { color: t.colors.primary }]}>{option.label}</Text>
  </Pressable>)}</View>;
}
export function InlineNotice({ title, description, tone = 'info', action }: {
  title: string; description?: string; tone?: 'info' | 'warning' | 'danger'; action?: { title: string; onPress: () => void };
}) {
  const color = tone === 'danger' ? t.colors.danger : tone === 'warning' ? t.colors.warning : t.colors.primary;
  const backgroundColor = tone === 'danger' ? t.colors.dangerLight : tone === 'warning' ? t.colors.warningLight : t.colors.primaryLight;
  return <View style={[s.notice, { backgroundColor }]}><View style={{ flexDirection: 'row', gap: 8 }}>
    <Ionicons name={tone === 'info' ? 'information-circle-outline' : 'alert-circle-outline'} size={20} color={color} />
    <View style={{ flex: 1, gap: 4 }}><Text style={{ color, fontSize: 15, fontWeight: '600', lineHeight: 22 }}>{title}</Text>
      {description ? <Text style={textStyles.body}>{description}</Text> : null}
    </View></View>
    {action && <Button secondary title={action.title} onPress={action.onPress} />}
  </View>;
}
export function StateView({ title, description, icon = 'albums-outline', loading, action }: {
  title: string; description: string; icon?: Icon; loading?: boolean; action?: { title: string; onPress: () => void };
}) {
  return <View style={s.state} accessibilityLiveRegion={loading ? 'polite' : undefined}>
    {loading ? <ActivityIndicator size="large" color={t.colors.primary} /> : <View style={s.icon}><Ionicons name={icon} size={28} color={t.colors.primary} /></View>}
    <Text accessibilityRole="header" style={s.stateTitle}>{title}</Text><Text style={s.stateText}>{description}</Text>
    {action && <Button {...action} />}
  </View>;
}
export function Row({ title, description, icon, onPress }: { title: string; description: string; icon: Icon; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description} onPress={onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: t.colors.primaryLight }]}>
    <View style={s.smallIcon}><Ionicons name={icon} size={22} color={t.colors.primary} /></View>
    <View style={{ flex: 1, gap: 4 }}><Text style={s.rowTitle}>{title}</Text><Text style={s.subtitle}>{description}</Text></View>
    <Ionicons name="chevron-forward" size={18} color={t.colors.muted} />
  </Pressable>;
}
export const textStyles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 23, color: t.colors.muted },
  label: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: t.colors.text },
  section: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: t.colors.text, marginBottom: 8 },
});
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: { padding: t.spacing.lg, gap: t.spacing.lg, width: '100%', maxWidth: 700, alignSelf: 'center' },
  heading: { gap: 4 }, title: { fontSize: 25, lineHeight: 33, fontWeight: '700', color: t.colors.text },
  subtitle: { fontSize: 15, lineHeight: 22, color: t.colors.muted },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  textAction: { minHeight: t.touchTarget, minWidth: t.touchTarget, justifyContent: 'center', paddingLeft: 8 },
  card: { backgroundColor: t.colors.surface, borderRadius: t.radius.lg, padding: t.spacing.lg, borderWidth: 1, borderColor: t.colors.border, gap: t.spacing.md },
  button: { minHeight: t.touchTarget, borderRadius: t.radius.md, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center' },
  secondary: { backgroundColor: t.colors.primaryLight },
  pressed: { opacity: 0.6 }, buttonText: { color: 'white', fontWeight: '600', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  iconButton: { minWidth: t.touchTarget, minHeight: t.touchTarget, borderRadius: t.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primaryLight },
  segments: { flexDirection: 'row', backgroundColor: t.colors.border, padding: 4, gap: 4, borderRadius: t.radius.md },
  segment: { flex: 1, minHeight: t.touchTarget, paddingVertical: 10, paddingHorizontal: 4, borderRadius: t.radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: t.colors.surface }, segmentText: { fontSize: 15, fontWeight: '600', textAlign: 'center', color: t.colors.muted },
  notice: { padding: t.spacing.md, borderRadius: t.radius.md, gap: 8 },
  state: { paddingVertical: 20, alignItems: 'center', gap: 12 },
  icon: { width: 56, height: 56, borderRadius: 18, backgroundColor: t.colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  stateTitle: { fontSize: 18, lineHeight: 26, fontWeight: '600', color: t.colors.text, textAlign: 'center' },
  stateText: { fontSize: 15, lineHeight: 23, textAlign: 'center', color: t.colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, paddingVertical: 10, borderRadius: t.radius.sm },
  smallIcon: { padding: 10, backgroundColor: t.colors.primaryLight, borderRadius: t.radius.md },
  rowTitle: { fontSize: 16, lineHeight: 23, fontWeight: '600', color: t.colors.text },
});
