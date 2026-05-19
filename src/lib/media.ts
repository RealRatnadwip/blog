import sharp from "sharp";
import { randomBytes } from "crypto";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createServiceClient } from "./supabase/server";

const BUCKET = "blog-media";

export function randomStorageKey(ext: string): string {
  const hash = randomBytes(16).toString("hex");
  return `${hash}${ext}`;
}

/** Re-encode image — strips EXIF/IPTC/XMP and original filename never touches storage. */
export async function optimizeImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  mime: string;
  width: number;
  height: number;
}> {
  const optimized = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: optimized.data,
    mime: "image/webp",
    width: optimized.info.width,
    height: optimized.info.height,
  };
}

/** Strip container metadata via ffmpeg copy-transcode when available. */
export async function optimizeVideo(buffer: Buffer): Promise<{
  buffer: Buffer;
  mime: string;
}> {
  const ffmpegPath = process.env.FFMPEG_PATH ?? "ffmpeg";

  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const exec = promisify(execFile);
  const id = randomBytes(8).toString("hex");
  const input = join(tmpdir(), `in-${id}`);
  const output = join(tmpdir(), `out-${id}.mp4`);

  try {
    await writeFile(input, buffer);
    await exec(ffmpegPath, [
      "-y",
      "-i",
      input,
      "-map_metadata",
      "-1",
      "-fflags",
      "+bitexact",
      "-flags:v",
      "+bitexact",
      "-flags:a",
      "+bitexact",
      "-c:v",
      "libx264",
      "-crf",
      "28",
      "-preset",
      "fast",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      output,
    ]);
    const out = await readFile(output);
    return { buffer: out, mime: "video/mp4" };
  } finally {
    await unlink(input).catch(() => {});
    await unlink(output).catch(() => {});
  }
}

export async function uploadToStorage(
  key: string,
  buffer: Buffer,
  mime: string,
): Promise<string> {
  const supabase = createServiceClient();
  const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

export async function registerMediaAsset(input: {
  storageKey: string;
  publicPath: string;
  mimeType: string;
  mediaType: "image" | "video";
  width?: number;
  height?: number;
  sizeBytes: number;
}) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      storage_key: input.storageKey,
      public_path: input.publicPath,
      mime_type: input.mimeType,
      media_type: input.mediaType,
      width: input.width ?? null,
      height: input.height ?? null,
      size_bytes: input.sizeBytes,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMediaAsset(id: string) {
  const supabase = createServiceClient();
  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_key")
    .eq("id", id)
    .single();
  if (asset?.storage_key) {
    await supabase.storage.from(BUCKET).remove([asset.storage_key]);
  }
  await supabase.from("media_assets").delete().eq("id", id);
}
