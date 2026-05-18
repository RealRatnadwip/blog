"use client";

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Button } from './ui';

export function MediaUploader() {
  const supabase = createBrowserSupabaseClient();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage('Uploading file…');

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? 'blog-media';
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });

    if (error) {
      setMessage(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    setMessage(`Uploaded! Public URL: ${data.publicUrl}`);
    setUploading(false);
  }

  return (
    <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-6">
      <p className="text-sm uppercase tracking-[0.35em] text-slate-400">media upload</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">Upload an image to Supabase storage and use the generated URL in your post.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="cursor-pointer rounded-full border border-slate-700/80 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:border-accent">
          {uploading ? 'Uploading…' : 'Select file'}
          <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} disabled={uploading} />
        </label>
        <Button type="button" variant="ghost" disabled={uploading} onClick={() => setMessage('Paste a file, then wait for the URL.')}>Upload image</Button>
      </div>
      {message ? <p className="mt-4 text-sm text-slate-300 break-words">{message}</p> : null}
    </div>
  );
}
