'use client';

import { useLeagueStore } from '@/lib/store';

export function HeadToHeadMatrix() {
  const { managerStats, headToHead } = useLeagueStore();
  
  // Sort managers by championships then win percentage
  const sortedManagers = [...managerStats].sort((a, b) => {
    if (b.championships !== a.championships) return b.championships - a.championships;
    return b.win_percentage - a.win_percentage;
  });
  
  const getRecord = (manager1: string, manager2: string) => {
    const record = headToHead.get(manager1)?.get(manager2);
    if (!record) return null;
    return record;
  };
  
  const getWinPercentage = (record: { wins: number; losses: number; ties: number } | null) => {
    if (!record) return null;
    const total = record.wins + record.losses + record.ties;
    if (total === 0) return null;
    return (record.wins + record.ties * 0.5) / total;
  };
  
  const getCellColor = (pct: number | null) => {
    if (pct === null) return 'bg-slate-800';
    if (pct >= 0.65) return 'bg-emerald-600/40';
    if (pct >= 0.55) return 'bg-emerald-600/20';
    if (pct > 0.45) return 'bg-slate-700';
    if (pct > 0.35) return 'bg-crimson-600/20';
    return 'bg-crimson-600/40';
  };
  
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-750">
        <h3 className="font-display text-lg text-white tracking-wide">HEAD-TO-HEAD RECORDS</h3>
        <p className="text-sm text-gray-400 mt-1">All-time matchup records between managers</p>
      </div>
      
      <div className="overflow-x-auto p-4">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="w-32 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                vs.
              </th>
              {sortedManagers.map((manager) => (
                <th
                  key={manager.manager_id}
                  className="px-1 py-2 text-center text-xs font-medium text-gray-400 whitespace-nowrap"
                  style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: '100px' }}
                >
                  {manager.manager_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedManagers.map((rowManager) => (
              <tr key={rowManager.manager_id}>
                <td className="px-2 py-1 text-sm font-medium text-white whitespace-nowrap">
                  {rowManager.manager_name}
                </td>
                {sortedManagers.map((colManager) => {
                  if (rowManager.manager_id === colManager.manager_id) {
                    return (
                      <td key={colManager.manager_id} className="px-1 py-1">
                        <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center">
                          <span className="text-gray-600 text-xs">—</span>
                        </div>
                      </td>
                    );
                  }
                  
                  const record = getRecord(rowManager.manager_name, colManager.manager_name);
                  const pct = getWinPercentage(record);
                  
                  return (
                    <td key={colManager.manager_id} className="px-1 py-1">
                      <div
                        className={`w-12 h-12 rounded flex flex-col items-center justify-center transition-colors ${getCellColor(pct)}`}
                        title={record ? `${rowManager.manager_name} vs ${colManager.manager_name}: ${record.wins}-${record.losses}${record.ties > 0 ? `-${record.ties}` : ''}` : 'No games'}
                      >
                        {record ? (
                          <>
                            <span className="font-mono text-xs font-bold text-white">
                              {record.wins}-{record.losses}
                            </span>
                            {record.ties > 0 && (
                              <span className="font-mono text-[10px] text-gray-400">
                                {record.ties}T
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="px-4 pb-4 flex items-center gap-4 text-xs">
        <span className="text-gray-500">Win Rate:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-600/40" />
          <span className="text-gray-400">65%+</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-emerald-600/20" />
          <span className="text-gray-400">55-64%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-slate-700" />
          <span className="text-gray-400">45-54%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-crimson-600/20" />
          <span className="text-gray-400">35-44%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-crimson-600/40" />
          <span className="text-gray-400">&lt;35%</span>
        </div>
      </div>
    </div>
  );
}
