import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { theme as t } from '../../theme/tokens';
import { dateCaption, weekDays } from './presentation';
import { todayInVietnam } from './utils';

export function WeekStrip({ date, onSelect }: { date: string; onSelect: (date: string) => void }) {
  const scroll = useRef<ScrollViewInstance>(null);
  const { width } = useWindowDimensions();
  const days = weekDays(date), today = todayInVietnam();
  const dayWidth = Math.max(t.touchTarget, (Math.min(width, 700) - 32 - 24) / 7);
  const reveal = () => scroll.current?.scrollTo({ x: Math.max(0, days.indexOf(date) * (dayWidth + 4) - dayWidth), animated: false });
  useEffect(reveal, [date, dayWidth]);
  return <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} onLayout={reveal} onContentSizeChange={reveal}
    style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 4 }}>
    {days.map((day, i) => {
      const selected = day === date;
      return <Pressable key={day} accessibilityRole="button" accessibilityLabel={dateCaption(day) + (day === today ? ', hôm nay' : '')}
        accessibilityState={{ selected }} aria-selected={selected} onPress={() => onSelect(day)} style={({ pressed }) => ({ width: dayWidth, minHeight: 72, paddingVertical: 8,
          alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: t.radius.md, opacity: pressed ? 0.6 : 1,
          backgroundColor: selected ? t.colors.primary : t.colors.surface, borderWidth: 1, borderColor: selected ? t.colors.primary : t.colors.border })}>
        <Text style={{ fontSize: 13, color: selected ? 'white' : t.colors.muted }}>{i === 6 ? 'CN' : 'T' + (i + 2)}</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: selected ? 'white' : t.colors.text }}>{Number(day.slice(8))}</Text>
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: day === today ? (selected ? 'white' : t.colors.primary) : 'transparent' }} />
      </Pressable>;
    })}
  </ScrollView>;
}
