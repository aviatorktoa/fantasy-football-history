'use client';

import { useLeagueStore } from '@/lib/store';

export function ChampionshipTimeline() {
  const { seasonsData } = useLeagueStore();
  
  // Sort by year
  const sortedSeasons = [...seasonsData].sort(
    (a, b) => parseInt(a.league.season) - parseInt(b.league.season)
  );
  
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-750">
        <h3 className="font-display text-lg text-white tracking-wide">CHAMPIONSHIP TIMELINE</h3>
        <p className="text-sm text-gray-400 mt-1">Complete history of league champions</p>
      </div>
      
      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-500 via-gold-500/50 to-transparent" />
          
          <div className="space-y-6">
            {sortedSeasons.map((season, index) => {
              const champion = season.champion;
              const runnerUp = season.standings.find(s => s.rank === 2);
              
              return (
                <div key={season.league.season} className="relative flex gap-6 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  {/* Year marker */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg glow-gold z-10">
                    <span className="font-mono text-sm font-bold text-midnight">
                      {season.league.season.slice(-2)}
                    </span>
                  </div>
                  
                  {/* Season card */}
                  <div className="flex-1 bg-slate-850/50 rounded-lg p-4 border border-slate-750/50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-gray-400 text-sm">{season.league.season} Season</div>
                        <div className="font-display text-xl text-white tracking-wide flex items-center gap-2">
                          <span className="text-2xl">🏆</span>
                          {champion?.manager_nickname || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Team: {champion?.team_name}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          <span className="text-emerald-400">{champion?.wins || 0}</span>
                          <span className="text-gray-600">-</span>
                          <span className="text-crimson-400">{champion?.losses || 0}</span>
                          {(champion?.ties || 0) > 0 && (
                            <>
                              <span className="text-gray-600">-</span>
                              <span className="text-gray-400">{champion?.ties}</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {champion?.points_for?.toFixed(1)} pts
                        </div>
                      </div>
                    </div>
                    
                    {/* Runner up */}
                    {runnerUp && (
                      <div className="pt-3 border-t border-slate-750/50 flex items-center gap-2">
                        <span className="text-gray-600 text-sm">Runner-up:</span>
                        <span className="text-gray-400 text-sm">{runnerUp.manager_nickname}</span>
                        <span className="text-gray-600 text-xs">({runnerUp.team_name})</span>
                      </div>
                    )}
                    
                    {/* League stats */}
                    <div className="mt-3 flex gap-4 text-xs text-gray-500">
                      <span>{season.league.num_teams} teams</span>
                      <span>{season.matchups.length} matchups</span>
                      <span className="capitalize">{season.league.scoring_type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
