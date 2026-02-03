// Yahoo Fantasy Sports API Client
// Documentation: https://developer.yahoo.com/fantasysports/guide/

const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';
const YAHOO_API_BASE = 'https://fantasysports.yahooapis.com/fantasy/v2';

export interface YahooTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expires_at?: number;
}

export interface YahooUser {
  guid: string;
  nickname?: string;
  profile_image?: string;
}

export interface League {
  league_key: string;
  league_id: string;
  name: string;
  season: string;
  num_teams: number;
  scoring_type: string;
  current_week?: number;
  start_week?: number;
  end_week?: number;
  is_finished?: boolean;
}

export interface Team {
  team_key: string;
  team_id: string;
  name: string;
  manager_id?: string;
  manager_nickname?: string;
  logo_url?: string;
  waiver_priority?: number;
  number_of_moves?: number;
  number_of_trades?: number;
}

export interface Standings {
  team_key: string;
  team_name: string;
  manager_nickname: string;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  percentage: number;
  points_for: number;
  points_against: number;
  playoff_seed?: number;
}

export interface Matchup {
  week: number;
  team1_key: string;
  team1_name: string;
  team1_points: number;
  team2_key: string;
  team2_name: string;
  team2_points: number;
  winner_team_key?: string;
  is_playoffs: boolean;
  is_consolation: boolean;
}

export interface SeasonData {
  league: League;
  standings: Standings[];
  matchups: Matchup[];
  champion?: Standings;
}

export interface ManagerStats {
  manager_id: string;
  manager_name: string;
  seasons_played: number;
  championships: number;
  championship_appearances: number;
  playoff_appearances: number;
  total_wins: number;
  total_losses: number;
  total_ties: number;
  win_percentage: number;
  total_points_for: number;
  total_points_against: number;
  avg_finish: number;
  best_finish: number;
  worst_finish: number;
  highest_single_week_score: number;
  lowest_single_week_score: number;
  seasons: {
    year: string;
    rank: number;
    wins: number;
    losses: number;
    points_for: number;
    made_playoffs: boolean;
    won_championship: boolean;
  }[];
}

// Generate OAuth URL for login
export function getAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'fspt-r', // Fantasy Sports read permission
  });
  return `${YAHOO_AUTH_URL}?${params.toString()}`;
}

// Exchange auth code for tokens
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<YahooTokens> {
  const response = await fetch(YAHOO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens = await response.json();
  tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  return tokens;
}

// Refresh expired tokens
export async function refreshTokens(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<YahooTokens> {
  const response = await fetch(YAHOO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokens = await response.json();
  tokens.expires_at = Date.now() + tokens.expires_in * 1000;
  return tokens;
}

// Make authenticated API request
async function yahooApiRequest(
  endpoint: string,
  accessToken: string
): Promise<any> {
  const url = `${YAHOO_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Yahoo API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Get user's profile
export async function getUser(accessToken: string): Promise<YahooUser> {
  const data = await yahooApiRequest('/users;use_login=1?format=json', accessToken);
  const user = data.fantasy_content.users[0].user[0];
  return {
    guid: user.guid,
  };
}

// Get all NFL fantasy football game keys (each season has a unique game key)
// NFL game keys: 2005=101, 2006=124, 2007=147, ..., 2024=449
export function getNflGameKeys(): { year: string; key: string }[] {
  const gameKeys: { year: string; key: string }[] = [];
  
  // Known game keys for NFL fantasy football
  const knownKeys: Record<string, string> = {
    '2005': '101',
    '2006': '124', 
    '2007': '147',
    '2008': '175',
    '2009': '199',
    '2010': '222',
    '2011': '242',
    '2012': '257',
    '2013': '273',
    '2014': '314',
    '2015': '331',
    '2016': '348',
    '2017': '359',
    '2018': '371',
    '2019': '380',
    '2020': '390',
    '2021': '399',
    '2022': '406',
    '2023': '414',
    '2024': '423',
    '2025': '449',
  };
  
  for (const [year, key] of Object.entries(knownKeys)) {
    gameKeys.push({ year, key });
  }
  
  return gameKeys;
}

// Get user's leagues for a specific game/season
export async function getLeaguesForSeason(
  accessToken: string,
  gameKey: string
): Promise<League[]> {
  try {
    const data = await yahooApiRequest(
      `/users;use_login=1/games;game_keys=${gameKey}/leagues?format=json`,
      accessToken
    );
    
    const leagues: League[] = [];
    const content = data.fantasy_content;
    
    if (content.users?.[0]?.user?.[1]?.games) {
      const games = content.users[0].user[1].games;
      for (const game of Object.values(games) as any[]) {
        if (typeof game === 'object' && game.game?.[1]?.leagues) {
          const leagueData = game.game[1].leagues;
          for (const league of Object.values(leagueData) as any[]) {
            if (typeof league === 'object' && league.league) {
              const l = league.league[0];
              leagues.push({
                league_key: l.league_key,
                league_id: l.league_id,
                name: l.name,
                season: l.season,
                num_teams: l.num_teams,
                scoring_type: l.scoring_type,
                current_week: l.current_week,
                start_week: l.start_week,
                end_week: l.end_week,
                is_finished: l.is_finished === '1',
              });
            }
          }
        }
      }
    }
    
    return leagues;
  } catch (error) {
    // Season might not have leagues, return empty
    console.log(`No leagues found for game key ${gameKey}`);
    return [];
  }
}

// Get all user's leagues across all seasons
export async function getAllLeagues(accessToken: string): Promise<League[]> {
  const allLeagues: League[] = [];
  const gameKeys = getNflGameKeys();
  
  // Fetch in batches to avoid rate limiting
  for (const { key } of gameKeys) {
    const leagues = await getLeaguesForSeason(accessToken, key);
    allLeagues.push(...leagues);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return allLeagues;
}

// Get standings for a league
export async function getStandings(
  accessToken: string,
  leagueKey: string
): Promise<Standings[]> {
  const data = await yahooApiRequest(
    `/league/${leagueKey}/standings?format=json`,
    accessToken
  );
  
  const standings: Standings[] = [];
  const teams = data.fantasy_content.league[1].standings[0].teams;
  
  for (const teamData of Object.values(teams) as any[]) {
    if (typeof teamData === 'object' && teamData.team) {
      const team = teamData.team[0];
      // team_standings can be at index 1 or 2 depending on whether team_points is included
      const teamStandings = teamData.team.find((t: any) => t.team_standings)?.team_standings;
      if (!teamStandings) continue;
      const managers = team.find((t: any) => t.managers)?.managers;
      const managerNickname = managers?.[0]?.manager?.nickname || 'Unknown';
      
      standings.push({
        team_key: team[0].team_key,
        team_name: team[2].name,
        manager_nickname: managerNickname,
        rank: parseInt(teamStandings.rank),
        wins: parseInt(teamStandings.outcome_totals.wins),
        losses: parseInt(teamStandings.outcome_totals.losses),
        ties: parseInt(teamStandings.outcome_totals.ties || '0'),
        percentage: parseFloat(teamStandings.outcome_totals.percentage),
        points_for: parseFloat(teamStandings.points_for),
        points_against: parseFloat(teamStandings.points_against),
        playoff_seed: teamStandings.playoff_seed ? parseInt(teamStandings.playoff_seed) : undefined,
      });
    }
  }
  
  return standings.sort((a, b) => a.rank - b.rank);
}

// Get matchups for a league (all weeks)
export async function getMatchups(
  accessToken: string,
  leagueKey: string,
  totalWeeks: number = 17
): Promise<Matchup[]> {
  const allMatchups: Matchup[] = [];
  
  for (let week = 1; week <= totalWeeks; week++) {
    try {
      const data = await yahooApiRequest(
        `/league/${leagueKey}/scoreboard;week=${week}?format=json`,
        accessToken
      );
      
      const matchups = data.fantasy_content.league[1].scoreboard[0].matchups;
      
      for (const matchupData of Object.values(matchups) as any[]) {
        if (typeof matchupData === 'object' && matchupData.matchup) {
          const m = matchupData.matchup;
          // Teams are nested under m["0"].teams
          const teamsObj = m['0']?.teams || m.teams;
          if (!teamsObj) continue;

          const team1 = teamsObj['0'].team;
          const team2 = teamsObj['1'].team;

          // Extract team info - metadata is in team[0] array, points found via search
          const team1Points = team1.find((t: any) => t.team_points)?.team_points;
          const team2Points = team2.find((t: any) => t.team_points)?.team_points;

          allMatchups.push({
            week,
            team1_key: team1[0][0].team_key,
            team1_name: team1[0][2].name,
            team1_points: team1Points ? parseFloat(team1Points.total) : 0,
            team2_key: team2[0][0].team_key,
            team2_name: team2[0][2].name,
            team2_points: team2Points ? parseFloat(team2Points.total) : 0,
            winner_team_key: m.winner_team_key,
            is_playoffs: m.is_playoffs === '1',
            is_consolation: m.is_consolation === '1',
          });
        }
      }
    } catch (error) {
      // Week might not exist, continue
      console.log(`No matchups for week ${week}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return allMatchups;
}

// Get complete season data for a league
export async function getSeasonData(
  accessToken: string,
  league: League
): Promise<SeasonData> {
  const standings = await getStandings(accessToken, league.league_key);
  const matchups = await getMatchups(accessToken, league.league_key, league.end_week || 17);
  
  // Champion is the rank 1 team (or could check playoff results)
  const champion = standings.find(s => s.rank === 1);
  
  return {
    league,
    standings,
    matchups,
    champion,
  };
}

// Calculate manager statistics across all seasons
export function calculateManagerStats(seasonsData: SeasonData[]): ManagerStats[] {
  const managerMap = new Map<string, ManagerStats>();
  
  for (const season of seasonsData) {
    for (const standing of season.standings) {
      const managerId = standing.manager_nickname.toLowerCase().replace(/\s+/g, '_');
      
      if (!managerMap.has(managerId)) {
        managerMap.set(managerId, {
          manager_id: managerId,
          manager_name: standing.manager_nickname,
          seasons_played: 0,
          championships: 0,
          championship_appearances: 0,
          playoff_appearances: 0,
          total_wins: 0,
          total_losses: 0,
          total_ties: 0,
          win_percentage: 0,
          total_points_for: 0,
          total_points_against: 0,
          avg_finish: 0,
          best_finish: 999,
          worst_finish: 0,
          highest_single_week_score: 0,
          lowest_single_week_score: 999,
          seasons: [],
        });
      }
      
      const manager = managerMap.get(managerId)!;
      manager.seasons_played++;
      manager.total_wins += standing.wins;
      manager.total_losses += standing.losses;
      manager.total_ties += standing.ties;
      manager.total_points_for += standing.points_for;
      manager.total_points_against += standing.points_against;
      
      if (standing.rank === 1) {
        manager.championships++;
      }
      
      // Assume top 4-6 make playoffs depending on league size
      const playoffCutoff = Math.ceil(season.league.num_teams / 2);
      if (standing.rank <= playoffCutoff) {
        manager.playoff_appearances++;
      }
      
      if (standing.rank <= 2) {
        manager.championship_appearances++;
      }
      
      if (standing.rank < manager.best_finish) {
        manager.best_finish = standing.rank;
      }
      
      if (standing.rank > manager.worst_finish) {
        manager.worst_finish = standing.rank;
      }
      
      manager.seasons.push({
        year: season.league.season,
        rank: standing.rank,
        wins: standing.wins,
        losses: standing.losses,
        points_for: standing.points_for,
        made_playoffs: standing.rank <= playoffCutoff,
        won_championship: standing.rank === 1,
      });
      
      // Check matchups for high/low scores
      for (const matchup of season.matchups) {
        if (matchup.team1_name === standing.team_name) {
          if (matchup.team1_points > manager.highest_single_week_score) {
            manager.highest_single_week_score = matchup.team1_points;
          }
          if (matchup.team1_points < manager.lowest_single_week_score && matchup.team1_points > 0) {
            manager.lowest_single_week_score = matchup.team1_points;
          }
        }
        if (matchup.team2_name === standing.team_name) {
          if (matchup.team2_points > manager.highest_single_week_score) {
            manager.highest_single_week_score = matchup.team2_points;
          }
          if (matchup.team2_points < manager.lowest_single_week_score && matchup.team2_points > 0) {
            manager.lowest_single_week_score = matchup.team2_points;
          }
        }
      }
    }
  }
  
  // Calculate averages and percentages
  for (const manager of Array.from(managerMap.values())) {
    const totalGames = manager.total_wins + manager.total_losses + manager.total_ties;
    manager.win_percentage = totalGames > 0 
      ? (manager.total_wins + manager.total_ties * 0.5) / totalGames 
      : 0;
    
    manager.avg_finish = manager.seasons_played > 0
      ? manager.seasons.reduce((sum, s) => sum + s.rank, 0) / manager.seasons_played
      : 0;
    
    // Sort seasons by year
    manager.seasons.sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }
  
  return Array.from(managerMap.values()).sort((a, b) => b.championships - a.championships);
}

// Calculate head-to-head records between managers
export function calculateHeadToHead(
  seasonsData: SeasonData[]
): Map<string, Map<string, { wins: number; losses: number; ties: number }>> {
  const h2h = new Map<string, Map<string, { wins: number; losses: number; ties: number }>>();
  
  for (const season of seasonsData) {
    // Build team to manager mapping for this season
    const teamToManager = new Map<string, string>();
    for (const standing of season.standings) {
      teamToManager.set(standing.team_name, standing.manager_nickname);
    }
    
    for (const matchup of season.matchups) {
      if (matchup.is_consolation) continue; // Skip consolation games
      
      const manager1 = teamToManager.get(matchup.team1_name);
      const manager2 = teamToManager.get(matchup.team2_name);
      
      if (!manager1 || !manager2) continue;
      
      if (!h2h.has(manager1)) {
        h2h.set(manager1, new Map());
      }
      if (!h2h.has(manager2)) {
        h2h.set(manager2, new Map());
      }
      
      if (!h2h.get(manager1)!.has(manager2)) {
        h2h.get(manager1)!.set(manager2, { wins: 0, losses: 0, ties: 0 });
      }
      if (!h2h.get(manager2)!.has(manager1)) {
        h2h.get(manager2)!.set(manager1, { wins: 0, losses: 0, ties: 0 });
      }
      
      if (matchup.team1_points > matchup.team2_points) {
        h2h.get(manager1)!.get(manager2)!.wins++;
        h2h.get(manager2)!.get(manager1)!.losses++;
      } else if (matchup.team2_points > matchup.team1_points) {
        h2h.get(manager1)!.get(manager2)!.losses++;
        h2h.get(manager2)!.get(manager1)!.wins++;
      } else {
        h2h.get(manager1)!.get(manager2)!.ties++;
        h2h.get(manager2)!.get(manager1)!.ties++;
      }
    }
  }
  
  return h2h;
}
