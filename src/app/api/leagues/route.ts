import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllLeagues, refreshTokens, YahooTokens } from '@/lib/yahoo';

async function getValidTokens(): Promise<YahooTokens | null> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get('yahoo_tokens');
  
  if (!tokensCookie) {
    return null;
  }
  
  let tokens: YahooTokens;
  try {
    tokens = JSON.parse(tokensCookie.value);
  } catch {
    return null;
  }
  
  // Check if token is expired (with 5 minute buffer)
  if (tokens.expires_at && tokens.expires_at < Date.now() + 5 * 60 * 1000) {
    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return null;
    }
    
    try {
      const newTokens = await refreshTokens(tokens.refresh_token, clientId, clientSecret);
      
      // Update cookie with new tokens
      cookieStore.set('yahoo_tokens', JSON.stringify(newTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
      
      return newTokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }
  
  return tokens;
}

export async function GET() {
  const tokens = await getValidTokens();
  
  if (!tokens) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  try {
    const leagues = await getAllLeagues(tokens.access_token);
    return NextResponse.json({ leagues });
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    );
  }
}
