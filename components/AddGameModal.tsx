
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Users, Clock, FileText, Wand2, Layers, GraduationCap, UserCircle, Tag } from 'lucide-react';
import { TargetGroup, UserProfile } from '../types';
import { playClick } from '../services/sound';
import { TagIcon } from './TagIcon';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, category: string, targetGroup: TargetGroup | 'Both', manualTags: string[]) => void;
  isLoading: boolean;
  categories: string[];
  allTags: string[];
  user: UserProfile | null;
}

const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose, onGenerate, isLoading, categories, allTags, user }) => {
  const [description, setDescription] = useState('');
  const [minPlayers, setMinPlayers] = useState('2');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('15');
  const [targetGroup, setTargetGroup] = useState<TargetGroup | 'Both'>('Both');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
        setMinPlayers('2');
        setHours('0');
        setMinutes('15');
        setDescription('');
        setTargetGroup('Both');
        setSelectedTags([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let prompt = `Minimum Players: ${minPlayers}. Duration: ${hours} hours and ${minutes} minutes. Target Audience: ${targetGroup}.`;
    if (description.trim()) {
      prompt += ` Description/Theme: ${description}`;
    }
    // Default to 'General' category as it's no longer a primary selector
    onGenerate(prompt, 'General', targetGroup, selectedTags);
  };

  const toggleTag = (tag: string) => {
      playClick();
      setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 flex flex-col max-h-[90vh] border border-white/50 ring-1 ring-black/5">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/40">
          <div>
            <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-orange-600" />
                Create Game
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold ${user?.color || 'bg-slate-400'}`}>
                    {user?.emoji ? user.emoji : (user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-3 h-3" />)}
                </div>
                <p className="text-xs text-slate-500">Posting as <span className="font-semibold">{user?.name || 'Guest'}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isLoading} 
            className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
            <form id="game-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
                {/* Target Group */}
                <div className="col-span-2">
                    <label className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-orange-600" />
                        School Level
                    </label>
                    <div className="flex bg-white/50 p-1 rounded-2xl border border-white/60 overflow-x-auto">
                        {(['Middle School', 'High School', 'College', 'Both'] as (TargetGroup | 'Both')[]).map((group) => (
                            <button
                                key={group}
                                type="button"
                                onClick={() => { playClick(); setTargetGroup(group); }}
                                className={`
                                    flex-1 py-2 px-2 text-[10px] sm:text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap
                                    ${targetGroup === group 
                                        ? 'bg-white text-orange-600 shadow-sm ring-1 ring-black/5' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }
                                `}
                            >
                                {group}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tag Selection */}
            <div className="col-span-2">
                <label className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-orange-600" />
                    Tags <span className="text-slate-400 font-normal ml-auto text-xs">(Select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`
                                    px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5
                                    ${isSelected 
                                        ? 'bg-orange-500 border-orange-500 text-white' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                                    }
                                `}
                            >
                                <TagIcon tag={tag} className={`w-3 h-3 ${isSelected ? 'opacity-100' : 'opacity-60'}`} />
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Minimum Players */}
            <div>
                <label className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    Minimum Players Needed
                </label>
                <input
                    type="number"
                    min="1"
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full p-3.5 bg-white border-none rounded-2xl text-slate-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
            </div>

            {/* Duration */}
            <div>
                <label className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Duration
                </label>
                <div className="flex gap-3">
                    <div className="flex-1 bg-white/50 rounded-2xl border border-white/60 p-1 relative group focus-within:ring-2 focus-within:ring-orange-500/20">
                         <span className="absolute top-2 left-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hours</span>
                        <select 
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="w-full pt-6 pb-2 px-3 bg-transparent border-none rounded-xl text-slate-700 font-bold text-sm appearance-none cursor-pointer focus:outline-none"
                        >
                            {[0, 1, 2, 3, 4].map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 bg-white/50 rounded-2xl border border-white/60 p-1 relative group focus-within:ring-2 focus-within:ring-orange-500/20">
                         <span className="absolute top-2 left-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Minutes</span>
                        <select 
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            className="w-full pt-6 pb-2 px-3 bg-transparent border-none rounded-xl text-slate-700 font-bold text-sm appearance-none cursor-pointer focus:outline-none"
                        >
                            {[0, 5, 10, 15, 20, 30, 45, 50].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
                     <FileText className="w-4 h-4 text-orange-600" />
                     Vibe / Theme <span className="text-slate-400 font-normal ml-auto text-xs">(Optional)</span>
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Something high energy involving water balloons..."
                    className="w-full h-24 p-4 border-none rounded-2xl resize-none text-slate-700 placeholder:text-slate-400 bg-white shadow-inner focus:ring-2 focus:ring-orange-500/20 text-sm leading-relaxed"
                    disabled={isLoading}
                />
            </div>

            </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 bg-white/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-black/5 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="game-form"
              disabled={isLoading}
              className="px-8 py-3 bg-[#1D1D1F] hover:bg-black text-white text-sm font-semibold rounded-full shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-300" />
                  Generate
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
