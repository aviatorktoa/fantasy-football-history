'use client';

import { useState } from 'react';
import { useLeagueStore } from '@/lib/store';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Color palette for different managers
const COLORS = [
  '#f5c542', // gold
  '#34d399', // emerald
  '#f87171', // red
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#fb923c', // orange
  '#f472b6', // pink
  '#2dd4bf', // teal
  '#fbbf24', // amber
  '#818cf8', // indigo
];

export function SeasonChart() {
  const { managerStats, seasonsData } = useLeagueStore();
  const [metric, setMetric] = useState<'rank' | 'wins' | 'points'>('rank');
  
  // Get all unique years
  const years = Array.from(new Set(seasonsData.map(s => s.league.season))).sort();
  
  // Build chart data
  const chartData = years.map(year => {
    const dataPoint: Record<string, any> = { year };
    
    for (const manager of managerStats) {
      const seasonStats = manager.seasons.find(s => s.year === year);
      if (seasonStats) {
        switch (metric) {
          case 'rank':
            dataPoint[manager.manager_name] = seasonStats.rank;
            break;
          case 'wins':
            dataPoint[manager.manager_name] = seasonStats.wins;
            break;
          case 'points':
            dataPoint[manager.manager_name] = seasonStats.points_for;
            break;
        }
      }
    }
    
    return dataPoint;
  });
  
  // Only show managers with enough data (at least 2 seasons)
  const activeManagers = managerStats.filter(m => m.seasons_played >= 2);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    
    // Sort by value (for rank, lower is better)
    const sorted = [...payload].sort((a, b) => {
      if (metric === 'rank') return a.value - b.value;
      return b.value - a.value;
    });
    
    return (
      <div className="custom-tooltip">
        <div className="font-display text-lg text-white mb-2">{label}</div>
        <div className="space-y-1">
          {sorted.map((entry: any, index: number) => (
            <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-300">{entry.name}</span>
              </span>
              <span className="font-mono" style={{ color: entry.color }}>
                {metric === 'rank' && `#${entry.value}`}
                {metric === 'wins' && `${entry.value}W`}
                {metric === 'points' && entry.value?.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-white tracking-wide">PERFORMANCE OVER TIME</h3>
        <div className="flex gap-1">
          {[
            { key: 'rank', label: 'Finish' },
            { key: 'wins', label: 'Wins' },
            { key: 'points', label: 'Points' },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setMetric(option.key as any)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                metric === option.key
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'text-gray-400 hover:text-white hover:bg-slate-750'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252b3d" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              reversed={metric === 'rank'}
              domain={metric === 'rank' ? ['dataMin', 'dataMax'] : [0, 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            {activeManagers.slice(0, 10).map((manager, index) => (
              <Line
                key={manager.manager_id}
                type="monotone"
                dataKey={manager.manager_name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS[index % COLORS.length] }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-750">
        {activeManagers.slice(0, 10).map((manager, index) => (
          <div key={manager.manager_id} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-gray-400">{manager.manager_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
