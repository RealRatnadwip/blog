import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import supabaseAdmin from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';

async function ensureAuthenticated() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
      },
    }
  );
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

function apiError(message: string, status = 400) {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET() {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const { data, error } = await supabaseAdmin.from('tags').select('*').order('name');
  if (error) return apiError(error.message, 500);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json();
  if (!body.name) return apiError('Name is required');

  const { data, error } = await supabaseAdmin
    .from('tags')
    .insert({ name: body.name, slug: slugify(body.name) })
    .select('*')
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json();
  if (!body.id || !body.name) return apiError('Tag id and name are required');

  const { data, error } = await supabaseAdmin
    .from('tags')
    .update({ name: body.name, slug: slugify(body.name) })
    .eq('id', body.id)
    .select('*')
    .single();

  if (error) return apiError(error.message, 500);
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json();
  if (!body.id) return apiError('Tag id required');

  const { error } = await supabaseAdmin.from('tags').delete().eq('id', body.id);
  if (error) return apiError(error.message, 500);

  return NextResponse.json({ success: true });
}
