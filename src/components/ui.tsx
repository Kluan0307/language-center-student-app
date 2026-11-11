import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme as t } from "../theme/tokens";
export function Screen({ children }: React.PropsWithChildren) {
  return (
    <SafeAreaView edges={["left", "right"]} style={s.screen}>
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={s.heading}>
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
  );
}
export function Card({ children }: React.PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: t.colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function StateView({
  title,
  description,
  icon = "albums-outline",
  loading,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  loading?: boolean;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={s.state}>
      {loading ? (
        <ActivityIndicator size="large" color={t.colors.primary} />
      ) : (
        <View style={s.icon}>
          <Ionicons name={icon} size={28} color={t.colors.primary} />
        </View>
      )}
      <Text accessibilityRole="header" style={s.stateTitle}>
        {title}
      </Text>
      <Text style={s.stateText}>{description}</Text>
      {action && <Button {...action} />}
    </View>
  );
}
export function Row({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        pressed && { backgroundColor: t.colors.primaryLight },
      ]}
    >
      <View style={s.smallIcon}>
        <Ionicons name={icon} size={22} color={t.colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.subtitle}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.colors.muted} />
    </Pressable>
  );
}
export const textStyles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 23, color: t.colors.muted },
  label: { fontSize: 17, fontWeight: "600", color: t.colors.text },
  section: {
    fontSize: 18,
    fontWeight: "700",
    color: t.colors.text,
    marginBottom: 12,
  },
});
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.background },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 20,
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
  },
  heading: { gap: 8 },
  title: { fontSize: 26, fontWeight: "700", color: t.colors.text },
  subtitle: { fontSize: 14, lineHeight: 21, color: t.colors.muted },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: t.colors.border,
    gap: 12,
  },
  button: {
    minHeight: 48,
    borderRadius: t.radius.md,
    padding: 14,
    backgroundColor: t.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: { backgroundColor: t.colors.primaryLight },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
  state: { paddingVertical: 28, alignItems: "center", gap: 16 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: t.colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: t.colors.text,
    textAlign: "center",
  },
  stateText: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: t.colors.muted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 76,
    paddingVertical: 12,
  },
  smallIcon: {
    padding: 10,
    backgroundColor: t.colors.primaryLight,
    borderRadius: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: t.colors.text },
});
