import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSeasonData, refreshTokens, YahooTokens, League } from '@/lib/yahoo';

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
  
  if (tokens.expires_at && tokens.expires_at < Date.now() + 5 * 60 * 1000) {
    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return null;
    }
    
    try {
      const newTokens = await refreshTokens(tokens.refresh_token, clientId, clientSecret);
      
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

export async function POST(request: NextRequest) {
  const tokens = await getValidTokens();
  
  if (!tokens) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const league: League = body.league;
    
    if (!league || !league.league_key) {
      return NextResponse.json(
        { error: 'Invalid league data' },
        { status: 400 }
      );
    }
    
    const seasonData = await getSeasonData(tokens.access_token, league);
    return NextResponse.json({ seasonData });
  } catch (error) {
    console.error('Error fetching season data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch season data' },
      { status: 500 }
    );
  }
}
