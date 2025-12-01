


import React, { useState } from 'react';
import { X, Trophy, Swords, Crown, History, User } from 'lucide-react';
import { GameResult, UserProfile, Rivalry } from '../types';
import { playClick } from '../services/sound';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: GameResult[];
  user: UserProfile | null;
  rivalries: Rivalry[];
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, results, user, rivalries }) => {
  const [activeTab, setActiveTab] = useState<'rivalries' | 'champions' | 'history'>('rivalries');

  if (!isOpen) return null;

  // Logic for Champions (Individual)
  const individualCounts: Record<string, number> = {};
  results.filter(r => r.type === 'Individual').forEach(r => {
      individualCounts[r.winner] = (individualCounts[r.winner] || 0) + 1;
  });
  const champions = Object.entries(individualCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
                    <Trophy className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">Leaderboard</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                <X className="w-5 h-5 text-slate-600" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 m-4 bg-slate-100 rounded-2xl gap-1">
             <button
                onClick={() => { playClick(); setActiveTab('rivalries'); }}
                className={`flex-1 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'rivalries' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Swords className="w-3.5 h-3.5" />
                Rivalries
            </button>
            <button
                onClick={() => { playClick(); setActiveTab('champions'); }}
                className={`flex-1 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'champions' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Crown className="w-3.5 h-3.5" />
                Champions
            </button>
            <button
                onClick={() => { playClick(); setActiveTab('history'); }}
                className={`flex-1 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'history' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <History className="w-3.5 h-3.5" />
                History
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-thin scrollbar-thumb-slate-200 min-h-[300px]">
            
            {activeTab === 'rivalries' && (
                <div className="space-y-6">
                    {rivalries.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">
                            No rivalries set up. Add them in Settings!
                        </div>
                    ) : (
                        rivalries.map((rivalry) => {
                            const score1 = results.filter(r => r.winner === rivalry.team1).length;
                            const score2 = results.filter(r => r.winner === rivalry.team2).length;
                            const total = score1 + score2 || 1;

                            return (
                                <div key={rivalry.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                                    <h3 className="text-center font-bold text-slate-800 mb-4 uppercase text-xs tracking-wider">
                                        {rivalry.team1} vs {rivalry.team2}
                                    </h3>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 text-center">
                                            <div className="text-3xl font-black text-indigo-600">{score1}</div>
                                            <div className="text-xs font-bold text-indigo-400">{rivalry.team1}</div>
                                        </div>
                                        <div className="text-slate-300 font-serif italic">vs</div>
                                        <div className="flex-1 text-center">
                                            <div className="text-3xl font-black text-rose-600">{score2}</div>
                                            <div className="text-xs font-bold text-rose-400">{rivalry.team2}</div>
                                        </div>
                                    </div>
                                    {/* Bar */}
                                    <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        <div style={{ width: `${(score1 / total) * 100}%`}} className="h-full bg-indigo-500 transition-all duration-500" />
                                        <div style={{ width: `${(score2 / total) * 100}%`}} className="h-full bg-rose-500 transition-all duration-500" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === 'champions' && (
                <div className="space-y-3">
                    {champions.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">No individual winners recorded yet.</div>
                    ) : (
                        champions.map(([name, count], index) => (
                            <div key={name} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                        ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' : 
                                          index === 1 ? 'bg-slate-200 text-slate-600' :
                                          index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <span className="font-bold text-slate-700">
                                        {name} {user?.name === name && <span className="text-[10px] text-slate-400 ml-1">(You)</span>}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                    <Trophy className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span className="font-bold text-sm text-slate-700">{count}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-3">
                    {results.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic text-sm">No games played yet.</div>
                    ) : (
                        results.map((result) => (
                            <div key={result.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{result.winner} won</p>
                                    <p className="text-xs text-slate-400">{result.gameTitle}</p>
                                </div>
                                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                    {new Date(result.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;