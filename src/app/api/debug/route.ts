import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { YahooTokens, refreshTokens, getSeasonData, League } from '@/lib/yahoo';

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

  try {
    const league: League = {
      league_key: leagueKey,
      league_id: leagueKey.split('.l.')[1],
      name: 'test',
      season: '2024',
      num_teams: 12,
      scoring_type: 'head',
      end_week: 17,
    };

    const seasonData = await getSeasonData(tokens.access_token, league);

    return NextResponse.json({
      success: true,
      standings_count: seasonData.standings.length,
      matchups_count: seasonData.matchups.length,
      champion: seasonData.champion?.team_name,
      standings_sample: seasonData.standings.slice(0, 3),
      matchups_sample: seasonData.matchups.slice(0, 3),
    });
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack?.substring(0, 1000),
    });
  }
}
