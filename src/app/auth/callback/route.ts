import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the next page or dashboard
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If there was an error or no code, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_error', request.url)
  );
}
