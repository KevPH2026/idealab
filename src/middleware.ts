import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const is100x = host.startsWith('100x.pics') || host.startsWith('www.100x.pics');

  if (is100x) {
    const url = req.nextUrl.clone();

    // Root → landing page (internal rewrite, URL stays the same)
    if (url.pathname === '/') {
      url.pathname = '/landing';
      return NextResponse.rewrite(url);
    }

    // /get → adforge tool page
    if (url.pathname === '/get') {
      url.pathname = '/adforge';
      return NextResponse.rewrite(url);
    }

    // Only allow adforge, admin, api, landing, _next
    const allowed =
      url.pathname.startsWith('/adforge') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/landing') ||
      url.pathname.startsWith('/_next');
    if (!allowed) {
      url.pathname = '/landing';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
};
