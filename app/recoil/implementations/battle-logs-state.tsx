'use client';

import { useEffect } from 'react';
import { useBattleLogs } from '../hooks/useBattleLogs';
import { createClient } from '@/utils/supabase/client';
import { BattleLog } from '../atoms/battle-logs';

export function BattleLogsStateProvider({ 
  children,
  userId 
}: { 
  children: React.ReactNode;
  userId?: string;
}) {
  const { loadBattleLogs } = useBattleLogs();
  
  useEffect(() => {
    if (!userId) return;
    
    const supabase = createClient();
    
    const fetchBattleLogs = async () => {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user', userId)
        .order('created_at', { ascending: false });
      
      if (data && !error) {
        loadBattleLogs(data as BattleLog[]);
      }
    };
    
    fetchBattleLogs();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('battle-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs',
          filter: `user=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New log added
            fetchBattleLogs();
          } else if (payload.eventType === 'UPDATE') {
            // Log updated
            fetchBattleLogs();
          } else if (payload.eventType === 'DELETE') {
            // Log deleted
            fetchBattleLogs();
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, loadBattleLogs]);
  
  return <>{children}</>;
}

// Example usage in a component
export function BattleLogsExample() {
  const {
    paginatedLogs,
    stats,
    filter,
    sort,
    loading,
    page,
    setPage,
    setFilterField,
    setSortField,
    clearFilters,
  } = useBattleLogs();
  
  return (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Total Games</h3>
          <p className="text-2xl font-bold">{stats.totalGames}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Win Rate</h3>
          <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Wins</h3>
          <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Losses</h3>
          <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter.format || ''}
          onChange={(e) => setFilterField('format', e.target.value || undefined)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Formats</option>
          <option value="Standard">Standard</option>
          <option value="Expanded">Expanded</option>
        </select>
        
        <select
          value={filter.result || 'all'}
          onChange={(e) => setFilterField('result', e.target.value as any)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Results</option>
          <option value="W">Wins</option>
          <option value="L">Losses</option>
          <option value="T">Ties</option>
        </select>
        
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>
      
      {/* Sort Options */}
      <div className="flex gap-4 mb-6">
        <select
          value={sort.field}
          onChange={(e) => setSortField('field', e.target.value as any)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="created_at">Date</option>
          <option value="format">Format</option>
          <option value="archetype">Your Deck</option>
          <option value="opp_archetype">Opponent Deck</option>
          <option value="result">Result</option>
        </select>
        
        <button
          onClick={() => setSortField('direction', sort.direction === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
        >
          {sort.direction === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      
      {/* Battle Logs List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedLogs.logs.map((log) => (
              <div key={log.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {log.archetype} vs {log.opp_archetype}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {log.format} • {new Date(log.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-sm rounded ${
                    log.result === 'W' ? 'bg-green-100 text-green-800' :
                    log.result === 'L' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {paginatedLogs.totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(paginatedLogs.totalPages, page + 1))}
              disabled={page === paginatedLogs.totalPages}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}