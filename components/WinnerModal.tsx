
import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, User, Check, Crown, Search } from 'lucide-react';
import { Game, GameResult, UserProfile, Rivalry } from '../types';
import { playClick } from '../services/sound';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  onSave: (result: GameResult) => void;
  user: UserProfile | null;
  recentPlayers: string[];
  rivalries: Rivalry[];
}

const WinnerModal: React.FC<WinnerModalProps> = ({ isOpen, onClose, game, onSave, user, recentPlayers, rivalries }) => {
  const [winnerName, setWinnerName] = useState('');
  const [activeRivalry, setActiveRivalry] = useState<Rivalry | null>(null);

  useEffect(() => {
    if (isOpen && game) {
        setWinnerName('');
        setActiveRivalry(null); // Default to individual

        // Smart detect from tags
        const lowerTags = game.tags.map(t => t.toLowerCase());
        const matched = rivalries.find(r => 
            lowerTags.includes(`${r.team1.toLowerCase()} vs ${r.team2.toLowerCase()}`) ||
            lowerTags.includes(`${r.team1.toLowerCase()} vs. ${r.team2.toLowerCase()}`)
        );
        if (matched) {
            setActiveRivalry(matched);
        } else if (lowerTags.includes('boys vs girls')) {
            // Fallback for default BvG if not matched by ID (should be caught above if default exists)
             const bvg = rivalries.find(r => r.team1 === 'Boys' && r.team2 === 'Girls');
             if (bvg) setActiveRivalry(bvg);
        }
    }
  }, [isOpen, game, rivalries]);

  if (!isOpen || !game) return null;

  const handleSave = (winner: string, type: 'Team' | 'Individual') => {
      onSave({
          id: crypto.randomUUID(),
          gameId: game.id,
          gameTitle: game.title,
          winner: winner,
          type: type,
          timestamp: Date.now()
      });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-500" />
                    Who Won?
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-[250px] truncate">{game.title}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
        </div>

        {/* Content */}
        <div className="p-8">
            {activeRivalry ? (
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleSave(activeRivalry.team1, 'Team')}
                        className="aspect-square rounded-2xl bg-indigo-100 hover:bg-indigo-200 border-2 border-indigo-200 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <span className="text-3xl font-bold text-indigo-700">{activeRivalry.team1.charAt(0)}</span>
                        <span className="font-bold text-indigo-700 text-lg">{activeRivalry.team1}</span>
                    </button>
                    <button 
                        onClick={() => handleSave(activeRivalry.team2, 'Team')}
                        className="aspect-square rounded-2xl bg-rose-100 hover:bg-rose-200 border-2 border-rose-200 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                         <span className="text-3xl font-bold text-rose-700">{activeRivalry.team2.charAt(0)}</span>
                        <span className="font-bold text-rose-700 text-lg">{activeRivalry.team2}</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="text-center mb-2">
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                            🏆
                        </div>
                        <h3 className="font-bold text-slate-700 dark:text-white">Individual Winner</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Enter the name of the champion</p>
                    </div>

                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            if(winnerName.trim()) handleSave(winnerName.trim(), 'Individual');
                        }}
                    >
                        <input
                            type="text"
                            value={winnerName}
                            onChange={(e) => setWinnerName(e.target.value)}
                            placeholder="e.g. Josh"
                            className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-lg font-bold text-center text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!winnerName.trim()}
                            className="w-full mt-4 py-3 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg shadow-black/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black dark:hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Log Win
                        </button>
                    </form>

                    {/* Quick Select Buttons (Recent) */}
                    {(user || recentPlayers.length > 0) && (
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                            {user && (
                                <button
                                    type="button"
                                    onClick={() => handleSave(user.name, 'Individual')}
                                    className="px-3 py-1.5 bg-orange-50 dark:bg-orange-500/20 hover:bg-orange-100 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-bold transition-all"
                                >
                                    It was me ({user.name})!
                                </button>
                            )}
                            {recentPlayers.map(player => (
                                <button
                                    key={player}
                                    type="button"
                                    onClick={() => handleSave(player, 'Individual')}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold transition-all"
                                >
                                    {player}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer to switch modes manually */}
        <div className="bg-slate-50 dark:bg-white/5 p-3 border-t border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-hide">
            <div className="flex justify-center gap-2">
                <button 
                    onClick={() => { playClick(); setActiveRivalry(null); }} 
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeRivalry === null ? 'bg-white dark:bg-white/10 shadow-sm text-orange-600 ring-1 ring-orange-200 dark:ring-orange-500/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                >
                    Individual
                </button>
                {rivalries.map(r => (
                    <button 
                        key={r.id}
                        onClick={() => { playClick(); setActiveRivalry(r); }} 
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeRivalry?.id === r.id ? 'bg-white dark:bg-white/10 shadow-sm text-orange-600 ring-1 ring-orange-200 dark:ring-orange-500/30' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        {r.team1} vs {r.team2}
                    </button>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default WinnerModal;
