
import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Trash2, User, Users, Edit3, UserCircle2, Save, Undo2 } from 'lucide-react';
import { Player } from '../types';
import { playClick, playDelete, playSuccess } from '../services/sound';

interface PlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (name: string, age: string, gender: 'Male' | 'Female' | 'Other') => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
}

const PlayersModal: React.FC<PlayersModalProps> = ({ isOpen, onClose, players, onAddPlayer, onUpdatePlayer, onDeletePlayer }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  useEffect(() => {
      if (!isOpen) {
          setActiveTab('list');
          setEditingPlayerId(null);
          setName('');
          setAge('');
          setGender('Male');
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (activeTab === 'edit' && editingPlayerId) {
          onUpdatePlayer({ id: editingPlayerId, name: name.trim(), age, gender });
          playSuccess();
      } else {
          onAddPlayer(name.trim(), age, gender);
          playSuccess();
      }
      resetForm();
      setActiveTab('list');
    }
  };

  const resetForm = () => {
    setName('');
    setAge('');
    setGender('Male');
    setEditingPlayerId(null);
  };

  const handleStartEdit = (player: Player) => {
      playClick();
      setEditingPlayerId(player.id);
      setName(player.name);
      setAge(player.age);
      setGender(player.gender);
      setActiveTab('edit');
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white/95 dark:bg-[#1D1D1F]/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-black/5 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tighter italic leading-none">
                        {activeTab === 'edit' ? 'Draft Edit' : 'The Roster'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                        {activeTab === 'edit' ? `Modifying Profile` : 'Manage Squad & Stats'}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 mx-8 mt-4 bg-slate-100 dark:bg-black/20 rounded-2xl gap-1">
             <button
                onClick={() => { playClick(); setActiveTab('list'); setEditingPlayerId(null); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight ${activeTab === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Users className="w-4 h-4" />
                Squad ({players.length})
            </button>
            <button
                onClick={() => { playClick(); setActiveTab('add'); resetForm(); }}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 uppercase tracking-tight ${activeTab === 'add' ? 'bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <UserPlus className="w-4 h-4" />
                Draft New
            </button>
            {activeTab === 'edit' && (
                <div className="flex-1 py-3 rounded-xl text-xs font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 uppercase tracking-tight border border-indigo-200 dark:border-indigo-500/20">
                    <Edit3 className="w-4 h-4" />
                    Editing
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 min-h-[400px]">
            
            {activeTab === 'list' && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Find student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        {filteredPlayers.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 dark:text-slate-600 italic text-sm">
                                {searchTerm ? 'No matches found.' : 'Your draft board is empty.'}
                            </div>
                        ) : (
                            filteredPlayers.map(player => (
                                <div key={player.id} className="group flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black italic shadow-inner ${player.gender === 'Female' ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20'}`}>
                                            {player.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{player.name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                                {player.age ? `${player.age} Years Old` : 'Age N/A'} • {player.gender}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => handleStartEdit(player)}
                                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                            title="Edit Profile"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => { playDelete(); onDeletePlayer(player.id); }}
                                            className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Delete Player"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {(activeTab === 'add' || activeTab === 'edit') && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                            Full Student Name
                        </label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Jackson Smith"
                            className="w-full p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-lg font-black italic text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                            autoFocus
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Age</label>
                            <input 
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="14"
                                className="w-full p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Gender Category</label>
                            <select 
                                value={gender}
                                onChange={(e) => setGender(e.target.value as any)}
                                className="w-full p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 appearance-none"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {activeTab === 'edit' && (
                            <button 
                                type="button"
                                onClick={() => { playClick(); setActiveTab('list'); resetForm(); }}
                                className="flex-1 py-5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-3xl font-black text-lg uppercase italic transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Undo2 className="w-5 h-5" />
                                Cancel
                            </button>
                        )}
                        <button 
                            type="submit"
                            disabled={!name.trim()}
                            className={`flex-[2] py-5 text-white dark:text-black rounded-3xl font-black text-xl uppercase italic shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${activeTab === 'edit' ? 'bg-indigo-600 dark:bg-indigo-400 text-white' : 'bg-[#1D1D1F] dark:bg-white'}`}
                        >
                            {activeTab === 'edit' ? <Save className="w-6 h-6" /> : <UserCircle2 className="w-6 h-6" />}
                            {activeTab === 'edit' ? 'Update Profile' : 'Add to Squad'}
                        </button>
                    </div>
                </form>
            )}

        </div>
      </div>
    </div>
  );
};

export default PlayersModal;
