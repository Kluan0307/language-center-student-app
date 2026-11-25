import { useState, type PropsWithChildren } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, textStyles } from './ui';
import { theme as t } from '../theme/tokens';

export function Badge({ label, tone = 'info' }: { label: string; tone?: 'info' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? t.colors.success : tone === 'warning' ? t.colors.warning : tone === 'danger' ? t.colors.danger : t.colors.primary;
  const backgroundColor = tone === 'success' ? t.colors.successLight : tone === 'warning' ? t.colors.warningLight : tone === 'danger' ? t.colors.dangerLight : t.colors.primaryLight;
  return <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor }}><Text style={{ color, fontSize: 14, lineHeight: 21, fontWeight: '600' }}>{label}</Text></View>;
}
export function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return <View style={{ gap: 3 }}><Text style={textStyles.body}>{label}</Text><Text style={textStyles.label}>{value || 'Chưa cập nhật'}</Text></View>;
}
export function Disclosure({ title, children }: PropsWithChildren<{ title: string }>) {
  const [open, setOpen] = useState(false);
  return <Card><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} aria-expanded={open}
    onPress={() => setOpen(v => !v)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <Text style={[textStyles.label, { flex: 1 }]}>{title}</Text><Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={t.colors.muted} />
  </Pressable>{open && <View style={{ gap: 12 }}>{children}</View>}</Card>;
}
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Button secondary title="Trước" disabled={page === 0} onPress={() => onChange(page - 1)} />
    <Text style={[textStyles.body, { flex: 1, textAlign: 'center' }]}>{page + 1} / {totalPages}</Text>
    <Button secondary title="Sau" disabled={page + 1 >= totalPages} onPress={() => onChange(page + 1)} /></View>;
}
