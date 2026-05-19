import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/server";
import { safePublicQuery } from "@/lib/supabase/safe-query";

export async function GET() {
  const result = await safePublicQuery(
    [] as {
      id: string;
      public_path: string;
      media_type: string;
      mime_type: string;
      width: number | null;
      height: number | null;
      created_at: string;
    }[],
    async () => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("media_assets")
        .select(
          "id, public_path, media_type, mime_type, width, height, created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { media: result.data, warning: result.error },
      { status: 200 },
    );
  }

  return NextResponse.json(result.data);
}
