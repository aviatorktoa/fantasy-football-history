import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/yahoo';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  if (error) {
    return NextResponse.redirect(`${appUrl}?error=${encodeURIComponent(error)}`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${appUrl}?error=no_code`);
  }
  
  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/callback`;
  
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}?error=missing_credentials`);
  }
  
  try {
    const tokens = await exchangeCodeForTokens(
      code,
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Store tokens in encrypted cookie
    const cookieStore = await cookies();
    
    cookieStore.set('yahoo_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    
    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(
      `${appUrl}?error=${encodeURIComponent('auth_failed')}`
    );
  }
}
