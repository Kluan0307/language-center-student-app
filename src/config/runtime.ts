import Constants from "expo-constants";
import { resolveApiBaseUrl } from "./env";

// Resolve on render so an environment Fast Refresh cannot keep a null API client.
export function getApiBaseUrl(): string | null {
  return resolveApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL,
    Constants.expoConfig?.extra?.apiBaseUrl,
  );
}
