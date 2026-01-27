'use client';

import { useLeagueStore } from '@/lib/store';

export function OverviewStats() {
  const { seasonsData, managerStats } = useLeagueStore();
  
  // Calculate aggregate stats
  const totalSeasons = seasonsData.length;
  const totalGames = seasonsData.reduce((sum, s) => sum + s.matchups.length, 0);
  const totalManagers = managerStats.length;
  
  // Most championships
  const mostChampionships = managerStats.length > 0 
    ? Math.max(...managerStats.map(m => m.championships))
    : 0;
  const dynastyLeader = managerStats.find(m => m.championships === mostChampionships);
  
  // Highest win percentage (min 3 seasons)
  const qualifiedManagers = managerStats.filter(m => m.seasons_played >= 3);
  const bestWinPct = qualifiedManagers.length > 0
    ? Math.max(...qualifiedManagers.map(m => m.win_percentage))
    : 0;
  const winPctLeader = qualifiedManagers.find(m => m.win_percentage === bestWinPct);
  
  // Most total points
  const mostPoints = managerStats.length > 0
    ? Math.max(...managerStats.map(m => m.total_points_for))
    : 0;
  const pointsLeader = managerStats.find(m => m.total_points_for === mostPoints);
  
  // Year range
  const years = seasonsData.map(s => parseInt(s.league.season)).sort((a, b) => a - b);
  const yearRange = years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : 'N/A';
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div className="card p-5">
        <div className="text-gray-400 text-sm mb-1">Seasons Tracked</div>
        <div className="stat-value">{totalSeasons}</div>
        <div className="text-gray-500 text-xs mt-1 font-mono">{yearRange}</div>
      </div>
      
      <div className="card p-5">
        <div className="text-gray-400 text-sm mb-1">Dynasty Leader</div>
        <div className="stat-value">{dynastyLeader?.manager_name || '-'}</div>
        <div className="text-gray-500 text-xs mt-1">
          {mostChampionships} 🏆 championship{mostChampionships !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="card p-5">
        <div className="text-gray-400 text-sm mb-1">Best Win Rate</div>
        <div className="stat-value-emerald font-mono text-3xl font-bold">
          {(bestWinPct * 100).toFixed(1)}%
        </div>
        <div className="text-gray-500 text-xs mt-1">{winPctLeader?.manager_name || '-'}</div>
      </div>
      
      <div className="card p-5">
        <div className="text-gray-400 text-sm mb-1">All-Time Points Leader</div>
        <div className="stat-value">{pointsLeader?.manager_name || '-'}</div>
        <div className="text-gray-500 text-xs mt-1 font-mono">
          {mostPoints.toLocaleString(undefined, { maximumFractionDigits: 1 })} pts
        </div>
      </div>
    </div>
  );
}
