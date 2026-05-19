import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";

type GenericClient = SupabaseClient;

function createBaseClient(url: string, key: string): GenericClient {
  const fetchWithTimeout: typeof fetch = (input, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    return fetch(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
    }).finally(() => clearTimeout(timeout));
  };

  const options: Parameters<typeof createClient>[2] = {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout },
  };

  if (typeof window === "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ws = require("ws") as typeof import("ws");
      options.realtime = { transport: ws as unknown as WebSocket };
    } catch {
      /* realtime unused for REST-only usage */
    }
  }

  return createClient(url, key, options);
}

export function createServiceClient(): GenericClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.includes("your-")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createBaseClient(url, key);
}

export function createAnonClient(): GenericClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBaseClient(url, key);
}
