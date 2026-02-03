import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { YahooTokens, refreshTokens, getStandings, getMatchups } from '@/lib/yahoo';

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
    throw new Error(`Yahoo ${response.status}: ${err.substring(0, 200)}`);
  }
  return response.json();
}

// Fetch transactions for a league
async function getTransactions(accessToken: string, leagueKey: string) {
  try {
    const data = await yahooFetch(
      `/league/${leagueKey}/transactions?format=json`,
      accessToken
    );
    const transactions = data.fantasy_content.league[1].transactions;
    const result: any[] = [];

    for (const val of Object.values(transactions) as any[]) {
      if (typeof val === 'object' && val.transaction) {
        const t = val.transaction;
        const meta = Array.isArray(t[0]) ? t[0] : [t[0]];
        const info = meta[0] || {};
        const players = t[1]?.players;

        const playerList: any[] = [];
        if (players) {
          for (const pv of Object.values(players) as any[]) {
            if (typeof pv === 'object' && pv.player) {
              const pInfo = pv.player[0];
              const pTrans = pv.player[1]?.transaction_data;
              const nameObj = Array.isArray(pInfo) ? pInfo.find((p: any) => p.name) : null;
              playerList.push({
                name: nameObj?.name?.full || 'Unknown',
                type: pTrans?.type || (Array.isArray(pTrans) ? pTrans[0]?.type : ''),
                destination_team: pTrans?.destination_team_name || (Array.isArray(pTrans) ? pTrans[0]?.destination_team_name : ''),
                source_type: pTrans?.source_type || (Array.isArray(pTrans) ? pTrans[0]?.source_type : ''),
                faab_bid: info.faab_bid,
              });
            }
          }
        }

        result.push({
          type: info.type,
          timestamp: info.timestamp,
          status: info.status,
          faab_bid: info.faab_bid,
          trader_team_name: info.trader_team_name,
          tradee_team_name: info.tradee_team_name,
          players: playerList,
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}

// Fetch draft results for a league
async function getDraftResults(accessToken: string, leagueKey: string) {
  try {
    const data = await yahooFetch(
      `/league/${leagueKey}/draftresults?format=json`,
      accessToken
    );
    const picks = data.fantasy_content.league[1].draft_results;
    const result: any[] = [];

    for (const val of Object.values(picks) as any[]) {
      if (typeof val === 'object' && val.draft_result) {
        result.push(val.draft_result);
      }
    }
    return result;
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const tokens = await getValidTokens();
  if (!tokens) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const leagueKey = request.nextUrl.searchParams.get('league_key') || '449.l.668900';
  const mode = request.nextUrl.searchParams.get('mode') || 'full';
  const endWeek = parseInt(request.nextUrl.searchParams.get('weeks') || '17');
  const startWeek = parseInt(request.nextUrl.searchParams.get('start_week') || '1');

  try {
    if (mode === 'standings') {
      const standings = await getStandings(tokens.access_token, leagueKey);
      return NextResponse.json({ success: true, standings });
    }

    if (mode === 'matchups') {
      const matchups = await getMatchups(tokens.access_token, leagueKey, endWeek, startWeek);
      return NextResponse.json({ success: true, matchups_count: matchups.length, matchups });
    }

    if (mode === 'transactions') {
      const transactions = await getTransactions(tokens.access_token, leagueKey);
      return NextResponse.json({ success: true, count: transactions.length, transactions });
    }

    if (mode === 'draft') {
      const draft = await getDraftResults(tokens.access_token, leagueKey);
      return NextResponse.json({ success: true, count: draft.length, draft });
    }

    // Full mode: standings + transactions + draft (no matchups - too slow)
    const [standings, transactions, draft] = await Promise.all([
      getStandings(tokens.access_token, leagueKey),
      getTransactions(tokens.access_token, leagueKey),
      getDraftResults(tokens.access_token, leagueKey),
    ]);

    return NextResponse.json({
      success: true,
      league_key: leagueKey,
      standings,
      transactions,
      draft,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack?.substring(0, 1000),
    });
  }
}
