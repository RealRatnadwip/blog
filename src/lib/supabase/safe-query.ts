import { isSupabaseConfigured, supabaseConfigError } from "./config";

export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; data: T; error: string };

export async function safePublicQuery<T>(
  fallback: T,
  run: () => Promise<T>,
): Promise<SafeResult<T>> {
  const configErr = supabaseConfigError();
  if (configErr) {
    return { ok: false, data: fallback, error: configErr };
  }
  try {
    const data = await run();
    return { ok: true, data };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Database request failed";
    console.error("[supabase]", msg);
    return { ok: false, data: fallback, error: msg };
  }
}

export { isSupabaseConfigured };
