const PLACEHOLDER_PATTERNS = [
  "your-project",
  "your-anon-key",
  "your-service-role",
  "example.supabase",
  "xxxxxxxx",
];

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return false;
  const blob = `${url} ${anon}`.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((p) => blob.includes(p));
}

export function supabaseConfigError(): string | null {
  if (isSupabaseConfigured()) return null;
  return (
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example)."
  );
}
