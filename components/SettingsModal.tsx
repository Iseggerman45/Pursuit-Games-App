
import React, { useState, useEffect } from 'react';
import { X, Plus, FolderPlus, Trash2, Folder, Tag, Settings2, Swords, Download, Smartphone, Monitor, Info, CloudLightning, RefreshCw, AlertTriangle, Database } from 'lucide-react';
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
  defaultTab?: 'categories' | 'tags' | 'rivalries' | 'install';
  appVersion?: string;
  onRescueData?: () => void;
  folderCount?: number;
  gameCount?: number;
}

type Tab = 'categories' | 'tags' | 'rivalries' | 'install';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, 
    onCreateCategory, onDeleteCategory, categories,
    onCreateTag, onDeleteTag, tags,
    onCreateRivalry, onDeleteRivalry, rivalries,
    deferredPrompt, onInstall,
    defaultTab = 'categories',
    appVersion,
    onRescueData,
    folderCount = 0,
    gameCount = 0
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [inputValue, setInputValue] = useState('');
  // Rivalry state
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');

  useEffect(() => {
    if (isOpen) {
        setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

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
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-200">
                    <Settings2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1D1D1F] dark:text-white">Settings</h3>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                <X className="w-5 h-5" />
             </button>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl mb-4 overflow-x-auto">
              <button 
                onClick={() => { playClick(); setActiveTab('categories'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'categories' ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  <Folder className="w-4 h-4" />
                  Cats
              </button>
              <button 
                onClick={() => { playClick(); setActiveTab('tags'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'tags' ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  <Tag className="w-4 h-4" />
                  Tags
              </button>
              <button 
                onClick={() => { playClick(); setActiveTab('rivalries'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'rivalries' ? 'bg-white dark:bg-white/10 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  <Swords className="w-4 h-4" />
                  Rivals
              </button>
              <button 
                onClick={() => { playClick(); setActiveTab('install'); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'install' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  <Download className="w-4 h-4" />
                  App
              </button>
          </div>

          {activeTab !== 'install' && (
            <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {activeTab === 'rivalries' ? 'Create New Matchup' : `Add New ${activeTab === 'categories' ? 'Category' : 'Tag'}`}
                </h4>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    {activeTab === 'rivalries' ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={team1}
                                    onChange={(e) => setTeam1(e.target.value)}
                                    placeholder="Team A"
                                    className="flex-1 p-2 bg-white dark:bg-black/20 border-none rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-sm text-center"
                                />
                                <div className="flex items-center text-slate-400 font-bold text-[10px] whitespace-nowrap">VS</div>
                                <input
                                    type="text"
                                    value={team2}
                                    onChange={(e) => setTeam2(e.target.value)}
                                    placeholder="Team B"
                                    className="flex-1 p-2 bg-white dark:bg-black/20 border-none rounded-lg text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-sm text-center"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!team1.trim() || !team2.trim()}
                                className="w-full p-2 bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-black rounded-lg shadow-lg shadow-black/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Add Rivalry
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                autoFocus
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={activeTab === 'categories' ? "Category Name..." : "Tag Name..."}
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
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            {activeTab === 'install' ? (
                <div className="space-y-6 px-2 pb-4">
                    {/* Stats */}
                    <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Database className="w-5 h-5 text-indigo-500" />
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Data Status</h4>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    Games: {gameCount} | Folders: {folderCount}
                                </p>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>

                    <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Install as an App</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                            Pursuit is a <strong>Progressive Web App</strong>. It installs directly from your browser, works offline, and behaves like a native app.
                        </p>
                        
                        <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-xl text-left flex gap-2">
                             <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                             <div>
                                <p className="text-[10px] font-bold text-yellow-800 dark:text-yellow-400 mb-1">Data Safety Note:</p>
                                <p className="text-[10px] text-yellow-700 dark:text-yellow-500/80 leading-snug">
                                    Updating the app is safe! But <strong>deleting/uninstalling</strong> the app icon may wipe your saved games. Always use <strong>Live Sync</strong> to back up your data to the cloud.
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* Data Rescue Button */}
                    {onRescueData && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                            <h4 className="font-bold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Missing Data?
                            </h4>
                            <p className="text-xs text-red-700 dark:text-red-400 mb-3">
                                If your games or folders disappeared, try force-fetching the latest backup from the cloud.
                            </p>
                            <button
                                onClick={onRescueData}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                            >
                                <CloudLightning className="w-3.5 h-3.5" />
                                Rescue / Force Restore
                            </button>
                        </div>
                    )}

                    {/* Desktop Button */}
                    {deferredPrompt && onInstall && (
                        <button 
                            onClick={onInstall}
                            className="w-full py-4 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-2xl shadow-lg font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
                        >
                            <Monitor className="w-5 h-5" />
                            Install to Desktop
                        </button>
                    )}

                    {/* iOS Instructions */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
                            <Smartphone className="w-4 h-4" />
                            <span>iPhone / iPad</span>
                        </div>
                        <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                            <li>Tap the <strong>Share</strong> button in Safari <span className="inline-block align-middle bg-slate-200 dark:bg-white/20 p-1 rounded"><Download className="w-3 h-3" /></span></li>
                            <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                            <li>Tap <strong>Add</strong> in the top right</li>
                        </ol>
                    </div>

                    {/* Android Instructions */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
                            <Smartphone className="w-4 h-4" />
                            <span>Android (Chrome)</span>
                        </div>
                        <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                            <li>Tap the <strong>Three Dots</strong> menu</li>
                            <li>Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong></li>
                            <li>Follow the prompt to install</li>
                        </ol>
                    </div>
                </div>
            ) : (
                activeTab === 'rivalries' ? (
                    rivalries.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm italic">
                            No rivalries defined. Add one above!
                        </div>
                    ) : (
                        rivalries.map((r) => (
                            <div key={r.id} className="group flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Swords className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{r.team1} <span className="text-slate-400 mx-1 font-bold text-[10px]">VS</span> {r.team2}</span>
                                </div>
                                <button
                                    onClick={() => onDeleteRivalry(r.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                )
            )}
        </div>
        
        {/* Footer Version Info */}
        <div className="p-3 border-t border-slate-100 dark:border-white/5 text-center bg-slate-50/50 dark:bg-white/5">
            <p className="text-[10px] text-slate-400 font-medium">Pursuit App Version {appVersion || '1.0.0'}</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
