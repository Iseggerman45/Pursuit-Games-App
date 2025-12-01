
import React, { useState } from 'react';
import { X, Plus, FolderPlus, Trash2, Folder, Tag, Settings2, Swords, Download } from 'lucide-react';
import { playClick } from '../services/sound';
import { TagIcon } from './TagIcon';
import { Rivalry } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  categories: string[];
  onCreateTag: (name: string) => void;
  onDeleteTag: (name: string) => void;
  tags: string[];
  onCreateRivalry: (team1: string, team2: string) => void;
  onDeleteRivalry: (id: string) => void;
  rivalries: Rivalry[];
  deferredPrompt?: any;
  onInstall?: () => void;
}

type Tab = 'categories' | 'tags' | 'rivalries';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, 
    onCreateCategory, onDeleteCategory, categories,
    onCreateTag, onDeleteTag, tags,
    onCreateRivalry, onDeleteRivalry, rivalries,
    deferredPrompt, onInstall
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [inputValue, setInputValue] = useState('');
  // Rivalry state
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'rivalries') {
        if (team1.trim() && team2.trim()) {
            onCreateRivalry(team1.trim(), team2.trim());
            setTeam1('');
            setTeam2('');
        }
    } else {
        if (inputValue.trim()) {
            if (activeTab === 'categories') {
                onCreateCategory(inputValue.trim());
            } else {
                onCreateTag(inputValue.trim());
            }
            setInputValue('');
        }
    }
  };

  const currentList = activeTab === 'categories' ? categories : tags;
  const handleDelete = activeTab === 'categories' ? onDeleteCategory : onDeleteTag;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/80 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/50 dark:border-white/10">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-200">
                    <Settings2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1D1D1F] dark:text-white">Manage Library</h3>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* Install Button (If available) */}
          {deferredPrompt && onInstall && (
              <button 
                onClick={onInstall}
                className="w-full mb-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl shadow-md font-bold text-sm flex items-center justify-center gap-2 animate-in slide-in-from-top-2"
              >
                  <Download className="w-4 h-4" />
                  Install App to Device
              </button>
          )}

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl mb-6">
              <button 
                onClick={() => { playClick(); setActiveTab('categories'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  <Folder className="w-4 h-4" />
                  Categories
              </button>
              <button 
                onClick={() => { playClick(); setActiveTab('tags'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'tags' ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  <Tag className="w-4 h-4" />
                  Tags
              </button>
              <button 
                onClick={() => { playClick(); setActiveTab('rivalries'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'rivalries' ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  <Swords className="w-4 h-4" />
                  Rivalries
              </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            {activeTab === 'rivalries' ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={team1}
                        onChange={(e) => setTeam1(e.target.value)}
                        placeholder="Team 1 (e.g. Red)"
                        className="flex-1 p-3 bg-white dark:bg-black/20 border-none rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-sm"
                    />
                    <div className="flex items-center text-slate-400 font-bold text-xs">VS</div>
                    <input
                        type="text"
                        value={team2}
                        onChange={(e) => setTeam2(e.target.value)}
                        placeholder="Team 2 (e.g. Blue)"
                        className="flex-1 p-3 bg-white dark:bg-black/20 border-none rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!team1.trim() || !team2.trim()}
                        className="p-3 bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-black rounded-xl shadow-lg shadow-black/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={activeTab === 'categories' ? "New Category Name..." : "New Tag Name..."}
                        className="flex-1 p-3 bg-white dark:bg-black/20 border-none rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-3 bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-black rounded-xl shadow-lg shadow-black/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            )}
          </form>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            {activeTab === 'rivalries' ? (
                rivalries.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                        No rivalries defined.
                    </div>
                ) : (
                    rivalries.map((r) => (
                        <div key={r.id} className="group flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <Swords className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{r.team1} <span className="text-slate-400 mx-1">vs</span> {r.team2}</span>
                            </div>
                            <button
                                onClick={() => onDeleteRivalry(r.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Rivalry"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )
            ) : (
                currentList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                        No {activeTab} yet.
                    </div>
                ) : (
                    currentList.map((item) => (
                        <div key={item} className="group flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                {activeTab === 'categories' ? (
                                    <Folder className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <TagIcon tag={item} className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{item}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(item)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title={`Delete ${item}`}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
