import { useState } from "react";
import { Text, TextInput, View, StyleSheet } from "react-native";
import { theme as t } from "../../theme/tokens";
import { Button } from "../../components/ui";
export function Field({
  label,
  value,
  onChangeText,
  password = false,
  username = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  password?: boolean;
  username?: boolean;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={password && !visible}
        textContentType={password ? "password" : username ? "username" : "none"}
        style={styles.input}
      />
      {password && (
        <Button
          title={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          secondary
          disabled={disabled}
          onPress={() => setVisible((v) => !v)}
        />
      )}
    </View>
  );
}
export function ErrorNotice({ message }: { message: string }) {
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  );
}
export function passwordError(password: string, confirm: string) {
  if (password.length < 8 || new TextEncoder().encode(password).length > 72)
    return "Mật khẩu cần tối thiểu 8 ký tự và tối đa 72 byte UTF-8.";
  if (password !== confirm) return "Xác nhận mật khẩu chưa khớp.";
  return null;
}
const styles = StyleSheet.create({
  label: { color: t.colors.text, fontSize: 15, fontWeight: "600" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: t.colors.text,
    backgroundColor: t.colors.surface,
  },
  error: { color: t.colors.danger, fontSize: 14, lineHeight: 21 },
});
