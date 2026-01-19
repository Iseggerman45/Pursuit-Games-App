
import React, { useState } from 'react';
import { X, UserPlus, Search, Trash2, User, Users } from 'lucide-react';
import { Player } from '../types';
import { playClick, playDelete, playSuccess } from '../services/sound';

interface PlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (name: string, age: string, gender: 'Male' | 'Female' | 'Other') => void;
  onDeletePlayer: (id: string) => void;
}

const PlayersModal: React.FC<PlayersModalProps> = ({ isOpen, onClose, players, onAddPlayer, onDeletePlayer }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddPlayer(name.trim(), age, gender);
      setName('');
      setAge('');
      setGender('Male');
      playSuccess();
      setActiveTab('list');
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                    <Users className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white">Player Roster</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-slate-600 dark:text-slate-400">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 mx-6 mt-4 bg-slate-100 dark:bg-white/5 rounded-2xl gap-1">
             <button
                onClick={() => { playClick(); setActiveTab('list'); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <Users className="w-4 h-4" />
                Roster ({players.length})
            </button>
            <button
                onClick={() => { playClick(); setActiveTab('add'); }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'add' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
                <UserPlus className="w-4 h-4" />
                Add New
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/20">
            
            {activeTab === 'list' && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        {filteredPlayers.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic text-sm">
                                {searchTerm ? 'No matches found.' : 'No players added yet.'}
                            </div>
                        ) : (
                            filteredPlayers.map(player => (
                                <div key={player.id} className="group flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${player.gender === 'Female' ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'}`}>
                                            {player.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">{player.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {player.age ? `${player.age} yrs` : 'Age N/A'} • {player.gender}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { playDelete(); onDeletePlayer(player.id); }}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'add' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Student Name"
                            className="w-full mt-1 p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Age</label>
                            <input 
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="14"
                                className="w-full mt-1 p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                            <select 
                                value={gender}
                                onChange={(e) => setGender(e.target.value as any)}
                                className="w-full mt-1 p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 appearance-none"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full py-4 mt-4 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Add to Roster
                    </button>
                </form>
            )}

        </div>
      </div>
    </div>
  );
};

export default PlayersModal;
