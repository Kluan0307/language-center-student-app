import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
const key = "language-center.student.access-token";
// Serialize writes/deletes so late login persistence cannot survive a logout.
let queue: Promise<unknown> = Promise.resolve();
// Web sessions survive tab focus changes but never persist across a full reload.
let webToken: string | null = null;
function serial<T>(action: () => Promise<T>): Promise<T> {
  const task = queue.then(action, action);
  queue = task.catch(() => {});
  return task;
}
export const tokenStorage = {
  read: () =>
    serial(
      async (): Promise<string | null> =>
        Platform.OS === "web" ? webToken : SecureStore.getItemAsync(key),
    ),
  write: (token: string) =>
    serial(async () => {
      if (Platform.OS === "web") webToken = token;
      else await SecureStore.setItemAsync(key, token);
    }),
  clear: () =>
    serial(async () => {
      webToken = null;
      if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
    }),
};
