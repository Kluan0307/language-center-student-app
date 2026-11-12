export function parseApiBaseUrl(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    if (url.pathname.replace(/\/$/, "") !== "/api/v1") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
export function resolveApiBaseUrl(environmentValue?: string, manifestValue?: unknown): string | null {
  // A configured invalid value is an error; never silently switch servers.
  if (environmentValue?.trim()) return parseApiBaseUrl(environmentValue);
  return parseApiBaseUrl(typeof manifestValue === "string" ? manifestValue : undefined);
}
export const apiBaseUrl = parseApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
