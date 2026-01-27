'use client';

import { useState } from 'react';
import { useLeagueStore } from '@/lib/store';

type SortKey = 'championships' | 'win_percentage' | 'total_points_for' | 'avg_finish' | 'seasons_played';

export function ManagerRankings() {
  const { managerStats } = useLeagueStore();
  const [sortBy, setSortBy] = useState<SortKey>('championships');
  
  const sortedManagers = [...managerStats].sort((a, b) => {
    switch (sortBy) {
      case 'championships':
        return b.championships - a.championships || b.win_percentage - a.win_percentage;
      case 'win_percentage':
        return b.win_percentage - a.win_percentage;
      case 'total_points_for':
        return b.total_points_for - a.total_points_for;
      case 'avg_finish':
        return a.avg_finish - b.avg_finish; // Lower is better
      case 'seasons_played':
        return b.seasons_played - a.seasons_played;
      default:
        return 0;
    }
  });
  
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'championships', label: '🏆 Titles' },
    { key: 'win_percentage', label: '📈 Win %' },
    { key: 'total_points_for', label: '💯 Points' },
    { key: 'avg_finish', label: '🎯 Avg Finish' },
    { key: 'seasons_played', label: '📅 Seasons' },
  ];
  
  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  };
  
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-750 flex items-center justify-between">
        <h3 className="font-display text-lg text-white tracking-wide">MANAGER RANKINGS</h3>
        <div className="flex gap-1">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSortBy(option.key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === option.key
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'text-gray-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>Manager</th>
              <th className="text-center">🏆</th>
              <th className="text-right">W-L</th>
              <th className="text-right">Win %</th>
              <th className="text-right">Avg</th>
            </tr>
          </thead>
          <tbody>
            {sortedManagers.map((manager, index) => (
              <tr key={manager.manager_id}>
                <td>
                  <span className={`rank-badge ${getRankBadgeClass(index + 1)}`}>
                    {index + 1}
                  </span>
                </td>
                <td>
                  <div className="font-medium text-white">{manager.manager_name}</div>
                  <div className="text-xs text-gray-500">{manager.seasons_played} seasons</div>
                </td>
                <td className="text-center">
                  {manager.championships > 0 ? (
                    <span className="trophy-gold text-lg">
                      {Array(manager.championships).fill('🏆').join('')}
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="text-right font-mono text-sm">
                  <span className="text-emerald-400">{manager.total_wins}</span>
                  <span className="text-gray-600">-</span>
                  <span className="text-crimson-400">{manager.total_losses}</span>
                  {manager.total_ties > 0 && (
                    <>
                      <span className="text-gray-600">-</span>
                      <span className="text-gray-400">{manager.total_ties}</span>
                    </>
                  )}
                </td>
                <td className="text-right font-mono text-sm">
                  <span className={manager.win_percentage >= 0.5 ? 'text-emerald-400' : 'text-crimson-400'}>
                    {(manager.win_percentage * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="text-right font-mono text-sm text-gray-400">
                  {manager.avg_finish.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
