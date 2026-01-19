
import React, { useState, useMemo } from 'react';
import { X, Trophy, Swords, Crown, History, User, Users2, Star, TrendingUp, Medal, Filter, ChevronDown, Sparkles } from 'lucide-react';
import { GameResult, UserProfile, Rivalry, Player } from '../types';
import { playClick } from '../services/sound';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: GameResult[];
  user: UserProfile | null;
  players: Player[];
  rivalries: Rivalry[];
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, results, user, players, rivalries }) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'history'>('roster');
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [winTypeFilter, setWinTypeFilter] = useState<'all' | 'Team' | 'Individual'>('all');

  const uniqueGames = useMemo(() => {
    const gameMap = new Map<string, string>();
    results.forEach(res => {
        if (res.gameId && res.gameTitle) {
            gameMap.set(res.gameId, res.gameTitle);
        }
    });
    return Array.from(gameMap.entries()).map(([id, title]) => ({ id, title }));
  }, [results]);

  const playerStats = useMemo(() => {
    // 1. Identify all unique names from both the official roster AND match history
    const allNames = new Set<string>();
    players.forEach(p => allNames.add(p.name.trim()));
    results.forEach(res => {
        res.winner.split(',').forEach(w => {
            const trimmed = w.trim();
            if (trimmed) allNames.add(trimmed);
        });
    });

    // 2. Compute stats for every identified person
    const stats = Array.from(allNames).map(name => {
        let individualWins = 0;
        let teamWins = 0;
        const lowerName = name.toLowerCase();

        results.forEach(res => {
            if (selectedGameId !== 'all' && res.gameId !== selectedGameId) return;
            if (winTypeFilter !== 'all' && res.type !== winTypeFilter) return;

            const winners = res.winner.split(',').map(w => w.trim().toLowerCase());
            if (winners.includes(lowerName)) {
                if (res.type === 'Team') teamWins++;
                else individualWins++;
            }
        });

        // Try to find the original player object for metadata (age/gender/id)
        const playerInfo = players.find(p => p.name.trim().toLowerCase() === lowerName);

        return {
            id: playerInfo?.id || `discovered_${name}`,
            name,
            gender: playerInfo?.gender || 'Other',
            age: playerInfo?.age || '',
            individualWins,
            teamWins,
            totalWins: individualWins + teamWins,
            isOfficial: !!playerInfo
        };
    });

    // 3. Filter and Sort
    // If filtering by a specific game, only show people with wins in that game.
    // If viewing 'All', only show people with at least 1 win ever to keep it clean.
    return stats
        .filter(p => p.totalWins > 0)
        .sort((a, b) => b.totalWins - a.totalWins);
  }, [players, results, selectedGameId, winTypeFilter]);

  const filteredHistory = useMemo(() => {
      return results.filter(res => {
          if (selectedGameId !== 'all' && res.gameId !== selectedGameId) return false;
          if (winTypeFilter !== 'all' && res.type !== winTypeFilter) return false;
          return true;
      });
  }, [results, selectedGameId, winTypeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white/95 dark:bg-[#1D1D1F]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-8 pb-4 border-b border-black/5 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-400 text-white rounded-2xl shadow-lg rotate-3">
                    <Trophy className="w-7 h-7" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic leading-none">The Arena</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Live Season Standings</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
        </div>

        {/* Filters Section */}
        <div className="px-8 py-4 bg-white dark:bg-black/20 border-b border-black/5 dark:border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative group">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Game Title</label>
                    <div className="relative">
                        <select 
                            value={selectedGameId}
                            onChange={(e) => { playClick(); setSelectedGameId(e.target.value); }}
                            className="w-full pl-3 pr-10 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-xs font-bold text-slate-700 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                        >
                            <option value="all">All Games</option>
                            {uniqueGames.map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="sm:w-48 relative group">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Win Mode</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-white/10 rounded-xl">
                        {(['all', 'Individual', 'Team'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => { playClick(); setWinTypeFilter(type); }}
                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${winTypeFilter === type ? 'bg-white dark:bg-white/20 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {type === 'all' ? 'All' : type === 'Individual' ? 'Solo' : 'Team'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex p-2 mx-8 mt-4 bg-slate-100 dark:bg-black/20 rounded-2xl gap-1">
             <button
                onClick={() => { playClick(); setActiveTab('roster'); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight ${activeTab === 'roster' ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Medal className="w-4 h-4" />
                Standings
            </button>
            <button
                onClick={() => { playClick(); setActiveTab('history'); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight ${activeTab === 'history' ? 'bg-white dark:bg-white/10 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <History className="w-4 h-4" />
                History
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            
            {activeTab === 'roster' && (
                <div className="space-y-3">
                    {playerStats.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 dark:text-slate-600 italic text-sm">
                            No wins recorded for this selection yet.
                        </div>
                    ) : (
                        playerStats.map((player, index) => (
                            <div key={player.id} className={`flex items-center justify-between p-4 rounded-3xl border shadow-sm transition-all ${index === 0 && player.totalWins > 0 ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-500/5 dark:border-orange-500/20' : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black italic shadow-inner
                                        ${index === 0 && player.totalWins > 0 ? 'bg-yellow-400 text-white' : 
                                          index === 1 && player.totalWins > 0 ? 'bg-slate-300 text-slate-700' :
                                          index === 2 && player.totalWins > 0 ? 'bg-orange-300 text-white' : 'bg-slate-100 dark:bg-black/20 text-slate-500'}
                                    `}>
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-white tracking-tight uppercase italic flex items-center gap-2">
                                            {player.name}
                                            {/* Fix: Wrap Sparkles icon in a span to provide a title (tooltip), fixing the type error where Lucide icons do not support the title prop directly. */}
                                            {!player.isOfficial && <span title="Derived from history"><Sparkles className="w-3 h-3 text-indigo-400 opacity-50" /></span>}
                                        </h4>
                                        <div className="flex gap-2 mt-1">
                                            {(winTypeFilter === 'all' || winTypeFilter === 'Team') && (
                                                <span className="text-[9px] font-black uppercase bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                    <Users2 className="w-2.5 h-2.5" /> Team: {player.teamWins}
                                                </span>
                                            )}
                                            {(winTypeFilter === 'all' || winTypeFilter === 'Individual') && (
                                                <span className="text-[9px] font-black uppercase bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                    <User className="w-2.5 h-2.5" /> Solo: {player.individualWins}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-slate-800 dark:text-white leading-none">{player.totalWins}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {winTypeFilter === 'all' ? 'Total Wins' : winTypeFilter === 'Team' ? 'Team Wins' : 'Solo Wins'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-20 text-slate-400 dark:text-slate-600 italic text-sm">No match history for this filter.</div>
                    ) : (
                        filteredHistory.map((result) => {
                            const winnerList = result.winner.split(',').map(w => w.trim());
                            return (
                                <div key={result.id} className="p-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2rem] shadow-sm flex flex-col gap-3 group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${result.type === 'Team' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600'}`}>
                                                {result.type === 'Team' ? <Users2 className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{result.gameTitle}</h4>
                                                <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider">
                                                    {new Date(result.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${result.type === 'Team' ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {result.type}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1.5">
                                        {winnerList.map((name, i) => (
                                            <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-full">
                                                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">
                                                    {name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[11px] font-black text-slate-700 dark:text-white uppercase italic">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
