import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/yahoo';

export async function GET() {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/auth/callback`;
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Yahoo Client ID not configured' },
      { status: 500 }
    );
  }
  
  const authUrl = getAuthUrl(clientId, redirectUri);
  
  return NextResponse.redirect(authUrl);
}
