// Authentication disabled
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Authentication disabled - allow all requests
  return NextResponse.next();

  // console.log('🔒 Authentication enabled, checking...');

  // const pathname = request.nextUrl.pathname;

  // // Check if the route is protected
  // const isProtected = protectedRoutes.some((route) =>
  //   pathname.startsWith(route)
  // );

  // if (isProtected) {
  //   const token = request.cookies.get('auth-token')?.value;

  //   if (!token) {
  //     return NextResponse.redirect(new URL('/sign-in', request.url));
  //   }

  //   try {
  //     const { verifyAuth } = await import('@/lib/auth/verify');
  //     await verifyAuth(token);
  //   } catch {
  //     return NextResponse.redirect(new URL('/sign-in', request.url));
  //   }
  // }

  // return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
