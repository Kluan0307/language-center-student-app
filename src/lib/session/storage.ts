import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const key = "language-center.student.access-token";
// Web preview is memory-only: do not downgrade tokens to localStorage.
export const tokenStorage = {
  async read(): Promise<string | null> {
    return Platform.OS === "web" ? null : SecureStore.getItemAsync(key);
  },
  async write(token: string): Promise<void> {
    if (Platform.OS !== "web") await SecureStore.setItemAsync(key, token);
  },
  async clear(): Promise<void> {
    if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
  },
};
