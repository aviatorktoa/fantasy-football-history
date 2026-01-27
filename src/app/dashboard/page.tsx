'use client';

import { useEffect, useState } from 'react';
import { useLeagueStore } from '@/lib/store';
import { LeagueSelector } from '@/components/LeagueSelector';
import { OverviewStats } from '@/components/OverviewStats';
import { ManagerRankings } from '@/components/ManagerRankings';
import { SeasonChart } from '@/components/SeasonChart';
import { HeadToHeadMatrix } from '@/components/HeadToHeadMatrix';
import { ChampionshipTimeline } from '@/components/ChampionshipTimeline';

export default function DashboardPage() {
  const { 
    fetchLeagues, 
    isLoadingLeagues, 
    leagues, 
    selectedLeagueName,
    seasonsData,
    managerStats,
    isLoadingSeasons,
    loadingProgress,
    error 
  } = useLeagueStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'h2h' | 'timeline'>('overview');
  
  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);
  
  // Group leagues by name to find recurring leagues
  const leagueGroups = leagues.reduce((acc, league) => {
    if (!acc[league.name]) {
      acc[league.name] = [];
    }
    acc[league.name].push(league);
    return acc;
  }, {} as Record<string, typeof leagues>);
  
  // Sort by number of seasons (most seasons first)
  const sortedLeagueNames = Object.entries(leagueGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name]) => name);
  
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-750 bg-midnight/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-midnight" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wide text-white">DYNASTY</h1>
              <p className="text-xs text-gray-500">League Analytics</p>
            </div>
          </div>
          
          <a 
            href="/api/auth/logout" 
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-crimson-500/10 border border-crimson-500/30 rounded-lg text-crimson-400">
            {error}
          </div>
        )}
        
        {/* League selector */}
        <LeagueSelector 
          leagueNames={sortedLeagueNames}
          leagueGroups={leagueGroups}
          isLoading={isLoadingLeagues}
        />
        
        {/* Loading state for seasons */}
        {isLoadingSeasons && (
          <div className="card p-8 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 mb-4">
                <svg className="w-8 h-8 text-gold-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h3 className="font-display text-xl text-white mb-2">LOADING SEASONS</h3>
              <p className="text-gray-400">
                Fetching {loadingProgress.current} of {loadingProgress.total} seasons...
              </p>
            </div>
            <div className="progress-bar max-w-xs mx-auto">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }} 
              />
            </div>
          </div>
        )}
        
        {/* Dashboard content */}
        {!isLoadingSeasons && selectedLeagueName && seasonsData.length > 0 && (
          <>
            {/* Overview stats */}
            <OverviewStats />
            
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-750 pb-4">
              {[
                { id: 'overview', label: 'Rankings' },
                { id: 'h2h', label: 'Head-to-Head' },
                { id: 'timeline', label: 'Timeline' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gold-500/20 text-gold-400'
                      : 'text-gray-400 hover:text-white hover:bg-slate-750'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ManagerRankings />
                <SeasonChart />
              </div>
            )}
            
            {activeTab === 'h2h' && <HeadToHeadMatrix />}
            
            {activeTab === 'timeline' && <ChampionshipTimeline />}
          </>
        )}
        
        {/* Empty state */}
        {!isLoadingSeasons && !selectedLeagueName && leagues.length > 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🏈</div>
            <h3 className="font-display text-2xl text-white mb-2">SELECT A LEAGUE</h3>
            <p className="text-gray-400">Choose a league above to view its complete history and analytics</p>
          </div>
        )}
      </div>
    </main>
  );
}
