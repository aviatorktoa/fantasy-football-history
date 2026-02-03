import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { YahooTokens, refreshTokens } from '@/lib/yahoo';

const YAHOO_API_BASE = 'https://fantasysports.yahooapis.com/fantasy/v2';

async function getValidTokens(): Promise<YahooTokens | null> {
  const cookieStore = await cookies();
  const tokensCookie = cookieStore.get('yahoo_tokens');

  if (!tokensCookie) return null;

  let tokens: YahooTokens;
  try {
    tokens = JSON.parse(tokensCookie.value);
  } catch {
    return null;
  }

  if (tokens.expires_at && tokens.expires_at < Date.now() + 5 * 60 * 1000) {
    const clientId = process.env.YAHOO_CLIENT_ID;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

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
    } catch {
      return null;
    }
  }

  return tokens;
}

export async function GET(request: NextRequest) {
  const tokens = await getValidTokens();
  if (!tokens) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const leagueKey = request.nextUrl.searchParams.get('league_key') || '449.l.668900';
  const week = request.nextUrl.searchParams.get('week') || '1';

  try {
    // Fetch raw scoreboard for one week
    const url = `${YAHOO_API_BASE}/league/${leagueKey}/scoreboard;week=${week}?format=json`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: true, status: response.status, body: err.substring(0, 1000) });
    }

    const data = await response.json();
    const matchups = data.fantasy_content.league[1].scoreboard[0].matchups;

    // Get first matchup raw structure
    const firstMatchup = matchups['0'];

    return NextResponse.json({
      success: true,
      matchups_keys: Object.keys(matchups),
      first_matchup_keys: firstMatchup ? Object.keys(firstMatchup) : [],
      first_matchup_raw: JSON.stringify(firstMatchup).substring(0, 3000),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack?.substring(0, 500),
    });
  }
}
