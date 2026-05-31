import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  optimizeImage,
  optimizeVideo,
  randomStorageKey,
  registerMediaAsset,
  uploadToStorage,
} from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE = 12 * 1024 * 1024;
const MAX_VIDEO = 48 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const rawFile = form.get("file");
    if (!rawFile || typeof (rawFile as any).arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const file = rawFile as File | Blob;
    const fileType = typeof (file as any).type === "string" ? file.type : "";
    const fileName = typeof (file as any).name === "string" ? (file as any).name : "";
    const buffer = Buffer.from(await file.arrayBuffer());
    const isVideo = fileType.startsWith("video/") || fileName.endsWith(".mp4");

    if (isVideo) {
      if (buffer.length > MAX_VIDEO) {
        return NextResponse.json({ error: "Video too large (max 48MB)" }, {
          status: 400,
        });
      }
      let optimized: { buffer: Buffer; mime: string };
      try {
        optimized = await optimizeVideo(buffer);
      } catch {
        return NextResponse.json(
          {
            error:
              "Video must be re-encoded on the server (metadata strip). Set FFMPEG_PATH or install ffmpeg on the host.",
          },
          { status: 503 },
        );
      }
      const key = randomStorageKey(".mp4");
      const publicUrl = await uploadToStorage(
        key,
        optimized.buffer,
        optimized.mime,
      );
      const asset = await registerMediaAsset({
        storageKey: key,
        publicPath: publicUrl,
        mimeType: optimized.mime,
        mediaType: "video",
        sizeBytes: optimized.buffer.length,
      });
      return NextResponse.json({
        id: asset.id,
        url: publicUrl,
        mediaType: "video",
      });
    }

    if (!fileType.startsWith("image/") && !fileType.startsWith("application/")) {
      return NextResponse.json({ error: "Unsupported file type" }, {
        status: 400,
      });
    }
    if (buffer.length > MAX_IMAGE) {
      return NextResponse.json({ error: "Image too large (max 12MB)" }, {
        status: 400,
      });
    }

    const optimized = await optimizeImage(buffer);
    const key = randomStorageKey(".webp");
    const publicUrl = await uploadToStorage(
      key,
      optimized.buffer,
      optimized.mime,
    );
    const asset = await registerMediaAsset({
      storageKey: key,
      publicPath: publicUrl,
      mimeType: optimized.mime,
      mediaType: "image",
      width: optimized.width,
      height: optimized.height,
      sizeBytes: optimized.buffer.length,
    });

    return NextResponse.json({
      id: asset.id,
      url: publicUrl,
      mediaType: "image",
      width: optimized.width,
      height: optimized.height,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
