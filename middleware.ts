import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/admin/:path*', '/admin', '/api/admin/:path*'],
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    if (req.nextUrl.pathname.startsWith('/api/admin')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    if (req.nextUrl.pathname !== '/admin') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/admin';
      redirectUrl.searchParams.set('auth', 'required');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}
