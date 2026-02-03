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

async function yahooFetch(endpoint: string, accessToken: string) {
  const url = `${YAHOO_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Yahoo ${response.status}: ${err.substring(0, 500)}`);
  }
  return response.json();
}

export async function GET(request: NextRequest) {
  const tokens = await getValidTokens();
  if (!tokens) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const leagueKey = request.nextUrl.searchParams.get('league_key') || '449.l.668900';
  const mode = request.nextUrl.searchParams.get('mode') || 'raw';
  const steps: string[] = [];

  try {
    if (mode === 'test_season') {
      // Test full season data fetch with step-by-step error tracking
      steps.push('Starting standings fetch...');
      const standingsData = await yahooFetch(
        `/league/${leagueKey}/standings?format=json`,
        tokens.access_token
      );
      steps.push('Standings fetched OK');

      // Try parsing standings
      const teams = standingsData.fantasy_content.league[1].standings[0].teams;
      steps.push('Teams extracted: ' + typeof teams + ', keys: ' + Object.keys(teams).join(','));

      const standings: any[] = [];
      for (const [key, teamData] of Object.entries(teams) as any[]) {
        if (typeof teamData === 'object' && teamData.team) {
          try {
            const team = teamData.team[0];
            const teamStandings = teamData.team[1].team_standings;
            const managers = team.find((t: any) => t.managers)?.managers;
            const managerNickname = managers?.[0]?.manager?.nickname || 'Unknown';

            standings.push({
              team_key: team[0].team_key,
              team_name: team[2].name,
              manager_nickname: managerNickname,
              rank: parseInt(teamStandings.rank),
              wins: parseInt(teamStandings.outcome_totals.wins),
              losses: parseInt(teamStandings.outcome_totals.losses),
            });
          } catch (parseErr: any) {
            steps.push('Parse error for team key ' + key + ': ' + parseErr.message);
            steps.push('teamData structure: ' + JSON.stringify(teamData).substring(0, 500));
          }
        }
      }
      steps.push('Parsed ' + standings.length + ' standings entries');

      // Try fetching one week of matchups
      steps.push('Fetching week 1 scoreboard...');
      const scoreData = await yahooFetch(
        `/league/${leagueKey}/scoreboard;week=1?format=json`,
        tokens.access_token
      );
      steps.push('Week 1 scoreboard fetched OK');

      const matchups = scoreData.fantasy_content.league[1].scoreboard[0].matchups;
      steps.push('Matchups type: ' + typeof matchups + ', keys: ' + Object.keys(matchups).join(','));

      const parsedMatchups: any[] = [];
      for (const [key, matchupData] of Object.entries(matchups) as any[]) {
        if (typeof matchupData === 'object' && matchupData.matchup) {
          try {
            const m = matchupData.matchup;
            const mTeams = m[0].teams;
            const team1 = mTeams[0].team;
            const team2 = mTeams[1].team;

            parsedMatchups.push({
              week: 1,
              team1_name: team1[0][2].name,
              team1_points: parseFloat(team1[1].team_points.total),
              team2_name: team2[0][2].name,
              team2_points: parseFloat(team2[1].team_points.total),
              is_playoffs: m.is_playoffs === '1',
              is_consolation: m.is_consolation === '1',
            });
          } catch (parseErr: any) {
            steps.push('Matchup parse error key ' + key + ': ' + parseErr.message);
            steps.push('matchupData: ' + JSON.stringify(matchupData).substring(0, 500));
          }
        }
      }
      steps.push('Parsed ' + parsedMatchups.length + ' matchups for week 1');

      return NextResponse.json({
        success: true,
        steps,
        standings: standings.slice(0, 3),
        matchups: parsedMatchups.slice(0, 2),
      });
    }

    // Default: raw API response
    const data = await yahooFetch(
      `/league/${leagueKey}/standings?format=json`,
      tokens.access_token
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      steps,
      stack: error.stack?.substring(0, 500),
    });
  }
}
