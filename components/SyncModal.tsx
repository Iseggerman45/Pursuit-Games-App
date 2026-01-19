
import React, { useState } from 'react';
import { X, Upload, CloudLightning, Trash2, Loader2 } from 'lucide-react';
import { ExportData, Game, GameResult, FirebaseConfig, GroupMessage } from '../types';
import { cleanData } from '../services/firebase';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  messages?: GroupMessage[];
  results?: GameResult[];
  categories: string[];
  tags: string[];
  recentPlayers: string[];
  syncId: string | null;
  firebaseConfig: FirebaseConfig | null;
  onImport: (data: ExportData) => void;
  onStartLiveSync: () => void;
  onJoinLiveSync: (id: string) => void;
  onConnectFirebase: (config: FirebaseConfig) => void;
  onDisconnectFirebase: () => void;
  onDownloadCloud: () => void;
  onUpload?: () => Promise<{ success: boolean; error?: string }>;
  onHardReset?: () => Promise<void>;
  isLoading: boolean;
  isHardcoded?: boolean;
  error?: string | null;
  logs?: string[];
  onPruneDiagram?: (gameId: string) => void;
  appVersion?: string; // Added missing prop
}

const SyncModal: React.FC<SyncModalProps> = ({ 
    isOpen, onClose, games, messages = [], results = [], categories, tags, recentPlayers, syncId, 
    firebaseConfig, onImport, onJoinLiveSync, onConnectFirebase, onDownloadCloud, onUpload, isLoading, logs = [], onPruneDiagram, appVersion
}) => {
  const [newLibraryId, setNewLibraryId] = useState(syncId || 'main_library');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getSizeKB = (obj: any) => Math.round(new Blob([JSON.stringify(cleanData(obj))]).size / 1024);

  const gamesSize = getSizeKB(games);
  const msgsSize = getSizeKB(messages);
  const resSize = getSizeKB(results);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-white/10 rounded-xl text-indigo-600"><CloudLightning className="w-5 h-5" /></div>
                <div>
                    <h2 className="text-xl font-bold dark:text-white">Cloud Status</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Multi-Doc Expansion Active</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
        </div>

        <div className="px-6 pt-4 space-y-4">
             <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Library X-Ray</span>
                    <span className="text-xs font-bold dark:text-white">{gamesSize} KB / 1 MB</span>
                 </div>
                 <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                     <div style={{ width: `${Math.min(100, (gamesSize/1000)*100)}%` }} className={`h-full ${gamesSize > 800 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-4">
                     <div className="text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Games Doc</span>
                        <span className="text-sm font-black dark:text-white">{gamesSize} KB</span>
                     </div>
                     <div className="text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Chat Doc</span>
                        <span className="text-sm font-black dark:text-white">{msgsSize} KB</span>
                     </div>
                 </div>
             </div>
             
             <button onClick={() => setShowBreakdown(!showBreakdown)} className="w-full py-2 text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                 {showBreakdown ? 'Hide Storage Details' : 'View Detailed Breakdown'}
             </button>

             {showBreakdown && (
                <div className="max-h-[200px] overflow-y-auto space-y-2 p-2 scrollbar-thin">
                    {[...games].sort((a,b) => (getSizeKB(b) - getSizeKB(a))).slice(0, 5).map(g => (
                        <div key={g.id} className="flex justify-between items-center text-[11px] p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                            <span className="font-bold dark:text-white truncate max-w-[150px]">{g.title}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">{getSizeKB(g)} KB</span>
                                {g.diagramUrl && <button onClick={() => onPruneDiagram?.(g.id)} className="text-red-400"><Trash2 className="w-3 h-3"/></button>}
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>

        <div className="p-6 pt-4 space-y-4 flex-1 overflow-y-auto">
            <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Library Channel</label>
                <div className="flex gap-2">
                    <input value={newLibraryId} onChange={(e) => setNewLibraryId(e.target.value)} className="flex-1 bg-slate-50 dark:bg-black/20 p-2 rounded-xl text-sm font-bold dark:text-white" />
                    <button onClick={() => onJoinLiveSync(newLibraryId)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Join</button>
                </div>
            </div>
            
            <button onClick={onUpload} disabled={isLoading} className="w-full py-4 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-50">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Consolidate Library
            </button>

            {logs.length > 0 && (
              <div className="bg-slate-900 rounded-xl p-3 max-h-[100px] overflow-y-auto">
                  {logs.map((log, i) => <div key={i} className="text-[9px] font-mono text-emerald-400 mb-1">{log}</div>)}
              </div>
            )}
            
            <div className="text-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Version {appVersion || 'Unknown'}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
