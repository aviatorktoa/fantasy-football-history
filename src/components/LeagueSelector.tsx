'use client';

import { useLeagueStore } from '@/lib/store';
import type { League } from '@/lib/yahoo';

interface LeagueSelectorProps {
  leagueNames: string[];
  leagueGroups: Record<string, League[]>;
  isLoading: boolean;
}

export function LeagueSelector({ leagueNames, leagueGroups, isLoading }: LeagueSelectorProps) {
  const { selectedLeagueName, selectLeague, fetchAllSeasonData } = useLeagueStore();
  
  const handleSelect = async (name: string) => {
    selectLeague(name);
    // Small delay to let state update
    setTimeout(() => {
      useLeagueStore.getState().fetchAllSeasonData();
    }, 100);
  };
  
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="loading-shimmer h-12 w-64 rounded-lg mb-4" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="loading-shimmer h-24 w-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  if (leagueNames.length === 0) {
    return (
      <div className="card p-8 text-center mb-8">
        <div className="text-4xl mb-4">🤔</div>
        <h3 className="font-display text-xl text-white mb-2">NO LEAGUES FOUND</h3>
        <p className="text-gray-400">
          We couldn't find any Yahoo Fantasy Football leagues associated with your account.
        </p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="font-display text-xl text-white mb-4 tracking-wide">YOUR LEAGUES</h2>
      
      <div className="flex flex-wrap gap-3">
        {leagueNames.map((name) => {
          const seasons = leagueGroups[name];
          const yearRange = seasons.length > 1
            ? `${Math.min(...seasons.map(s => parseInt(s.season)))} - ${Math.max(...seasons.map(s => parseInt(s.season)))}`
            : seasons[0].season;
          const isSelected = selectedLeagueName === name;
          
          return (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              className={`card card-hover p-4 text-left min-w-[200px] ${
                isSelected ? 'border-gold-500/50 bg-gold-500/5' : ''
              }`}
            >
              <h3 className={`font-semibold mb-1 ${isSelected ? 'text-gold-400' : 'text-white'}`}>
                {name}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-400">{seasons.length} seasons</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-500 font-mono">{yearRange}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
