import { create } from 'zustand';
import type { League, SeasonData, ManagerStats } from '@/lib/yahoo';
import { calculateManagerStats, calculateHeadToHead } from '@/lib/yahoo';

interface LeagueStore {
  // Data
  leagues: League[];
  selectedLeagueName: string | null;
  seasonsData: SeasonData[];
  managerStats: ManagerStats[];
  headToHead: Map<string, Map<string, { wins: number; losses: number; ties: number }>>;
  
  // Loading states
  isLoadingLeagues: boolean;
  isLoadingSeasons: boolean;
  loadingProgress: { current: number; total: number };
  error: string | null;
  
  // Actions
  setLeagues: (leagues: League[]) => void;
  selectLeague: (leagueName: string) => void;
  fetchLeagues: () => Promise<void>;
  fetchAllSeasonData: () => Promise<void>;
  clearError: () => void;
}

export const useLeagueStore = create<LeagueStore>((set, get) => ({
  leagues: [],
  selectedLeagueName: null,
  seasonsData: [],
  managerStats: [],
  headToHead: new Map(),
  
  isLoadingLeagues: false,
  isLoadingSeasons: false,
  loadingProgress: { current: 0, total: 0 },
  error: null,
  
  setLeagues: (leagues) => set({ leagues }),
  
  selectLeague: (leagueName) => {
    set({ selectedLeagueName: leagueName, seasonsData: [], managerStats: [] });
  },
  
  fetchLeagues: async () => {
    set({ isLoadingLeagues: true, error: null });
    
    try {
      const response = await fetch('/api/leagues');
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/';
          return;
        }
        throw new Error('Failed to fetch leagues');
      }
      
      const data = await response.json();
      set({ leagues: data.leagues, isLoadingLeagues: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error', 
        isLoadingLeagues: false 
      });
    }
  },
  
  fetchAllSeasonData: async () => {
    const { leagues, selectedLeagueName } = get();
    
    if (!selectedLeagueName) return;
    
    // Filter leagues by selected name (same league across seasons)
    const selectedLeagues = leagues.filter(l => l.name === selectedLeagueName);
    
    set({ 
      isLoadingSeasons: true, 
      error: null,
      loadingProgress: { current: 0, total: selectedLeagues.length }
    });
    
    const seasonsData: SeasonData[] = [];
    
    for (let i = 0; i < selectedLeagues.length; i++) {
      const league = selectedLeagues[i];
      
      try {
        const response = await fetch('/api/season', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ league }),
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch season ${league.season}`);
          continue;
        }
        
        const data = await response.json();
        seasonsData.push(data.seasonData);
        
        set({ loadingProgress: { current: i + 1, total: selectedLeagues.length } });
      } catch (error) {
        console.error(`Error fetching season ${league.season}:`, error);
      }
    }
    
    // Calculate stats
    const managerStats = calculateManagerStats(seasonsData);
    const headToHead = calculateHeadToHead(seasonsData);
    
    set({ 
      seasonsData,
      managerStats,
      headToHead,
      isLoadingSeasons: false 
    });
  },
  
  clearError: () => set({ error: null }),
}));
