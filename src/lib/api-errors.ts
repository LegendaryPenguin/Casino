/** Parse `{ error: string }` (or JSON object) from failed API responses for toasts. */
export async function errorMessageFromResponse(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { error?: unknown };
    if (typeof j.error === "string") return j.error;
    if (j.error && typeof j.error === "object") {
      return JSON.stringify(j.error);
    }
  } catch {
    if (text.trim()) return text.slice(0, 300);
  }
  return `Request failed (HTTP ${res.status})`;
}

/** Message for a fetch response after JSON body parsed (our APIs use `{ ok, error }`). */
export function messageFromApiJson(
  res: Response,
  data: { ok?: boolean; error?: unknown },
): string {
  if (typeof data.error === "string") return data.error;
  return `Request failed (HTTP ${res.status})`;
}
