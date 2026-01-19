
import React, { useState, useEffect, useMemo } from 'react';
import { X, Trophy, Users, User, Check, Crown, Search, Users2, ShieldCheck } from 'lucide-react';
import { Game, GameResult, UserProfile, Rivalry, Player } from '../types';
import { playClick } from '../services/sound';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  players: Player[];
  onSave: (result: GameResult) => void;
  user: UserProfile | null;
  rivalries: Rivalry[];
}

const WinnerModal: React.FC<WinnerModalProps> = ({ isOpen, onClose, game, players, onSave, user, rivalries }) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const isTeamGame = useMemo(() => {
    if (!game) return false;
    const lowerTags = game.tags.map(t => t.toLowerCase());
    return lowerTags.some(t => t.includes('team') || t.includes('vs') || t.includes('boys vs girls') || t.includes('students vs leaders'));
  }, [game]);

  useEffect(() => {
    if (isOpen) {
        setSelectedPlayerIds([]);
        setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen || !game) return null;

  const handleTogglePlayer = (id: string) => {
      playClick();
      if (isTeamGame) {
          setSelectedPlayerIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
      } else {
          // Individual is single select
          setSelectedPlayerIds(prev => prev.includes(id) ? [] : [id]);
      }
  };

  const handleSave = () => {
      if (selectedPlayerIds.length === 0) return;

      const winningPlayerNames = players
          .filter(p => selectedPlayerIds.includes(p.id))
          .map(p => p.name)
          .join(', ');

      onSave({
          id: crypto.randomUUID(),
          gameId: game.id,
          gameTitle: game.title,
          winner: winningPlayerNames, // We store comma separated names for backward compatibility and display
          type: isTeamGame ? 'Team' : 'Individual',
          timestamp: Date.now()
      });
  };

  const filteredPlayers = players.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white/95 dark:bg-[#1D1D1F]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shadow-lg ${isTeamGame ? 'bg-indigo-600 text-white' : 'bg-yellow-500 text-white'}`}>
                    {isTeamGame ? <Users2 className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
                </div>
                <div>
                    <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic leading-none">
                        {isTeamGame ? 'Team Victory' : 'MVP Pick'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 truncate max-w-[200px]">{game.title}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
        </div>

        <div className="p-4 bg-white dark:bg-black/20 border-b border-black/5 dark:border-white/10">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search roster..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            {players.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                    <Users className="w-12 h-12 text-slate-200 dark:text-white/10 mb-4" />
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Your roster is empty.</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Add students in the "Players" section first!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredPlayers.map(player => {
                        const isSelected = selectedPlayerIds.includes(player.id);
                        return (
                            <button
                                key={player.id}
                                onClick={() => handleTogglePlayer(player.id)}
                                className={`
                                    relative p-4 rounded-3xl border transition-all flex flex-col items-center gap-2 group
                                    ${isSelected 
                                        ? 'bg-indigo-50 border-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-400 shadow-lg' 
                                        : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                                    }
                                `}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shadow-sm transition-transform group-hover:scale-110 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-xs font-bold truncate w-full text-center ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {player.name}
                                </span>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 p-1 bg-indigo-600 text-white rounded-full shadow-lg">
                                        <Check className="w-2.5 h-2.5" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 dark:border-white/10 bg-slate-50 dark:bg-black/20">
            <button
                onClick={handleSave}
                disabled={selectedPlayerIds.length === 0}
                className="w-full py-4 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-tighter"
            >
                <ShieldCheck className="w-6 h-6" />
                Log {selectedPlayerIds.length > 1 ? `${selectedPlayerIds.length} Winners` : 'Winner'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default WinnerModal;
