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
  const endpoint = request.nextUrl.searchParams.get('endpoint') || 'standings';

  const url = `${YAHOO_API_BASE}/league/${leagueKey}/${endpoint}?format=json`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json',
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return NextResponse.json({
        error: true,
        status: response.status,
        statusText: response.statusText,
        url,
        body: text.substring(0, 2000),
      });
    }

    const json = JSON.parse(text);
    return NextResponse.json({
      success: true,
      url,
      data: json,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      url,
    });
  }
}
