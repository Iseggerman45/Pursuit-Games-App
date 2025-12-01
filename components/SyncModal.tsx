
import React, { useState, useRef } from 'react';
import { X, Download, Copy, Check, AlertCircle, Upload, FileJson, Smartphone, Wifi, Loader2, Link as LinkIcon, WifiOff, Database } from 'lucide-react';
import { ExportData, Game, GameResult } from '../types';
import { playClick, playSuccess, playWhoosh } from '../services/sound';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  categories: string[];
  tags: string[];
  results: GameResult[];
  recentPlayers: string[];
  onImport: (data: ExportData) => void;
  syncId: string | null;
  onStartLiveSync: () => void;
  onStopSync: () => void;
  isSyncing: boolean;
}

const SyncModal: React.FC<SyncModalProps> = ({ 
    isOpen, 
    onClose, 
    games, 
    categories, 
    tags,
    results,
    recentPlayers,
    onImport,
    syncId,
    onStartLiveSync,
    onStopSync,
    isSyncing
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'file'>('live');
  
  // Manual State
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const generateExportData = () => {
    const data: ExportData = {
      version: 1,
      timestamp: Date.now(),
      games,
      categories,
      tags,
      results,
      recentPlayers
    };
    return JSON.stringify(data);
  };

  // Calculate Storage Size
  const dataString = generateExportData();
  const blobSize = new Blob([dataString]).size; // Size in bytes
  const sizeKB = (blobSize / 1024).toFixed(1);
  const percentUsed = ((blobSize / (5 * 1024 * 1024)) * 100).toFixed(2); // Assuming 5MB limit

  // --- Handlers ---
  const handleCopyLink = async () => {
    playClick();
    if (!syncId) return;
    const url = `${window.location.origin}${window.location.pathname}?sync_id=${syncId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      playSuccess();
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy link');
    }
  };

  const handleDownloadFile = () => {
      playClick();
      const data = generateExportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pursuit_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      playSuccess();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const result = event.target?.result as string;
              const data = JSON.parse(result);
              validateAndImport(data);
          } catch (err) {
              setError("Could not parse file. Is it a valid JSON backup?");
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const validateAndImport = (data: any) => {
      if (!Array.isArray(data.games) || !Array.isArray(data.categories)) {
        throw new Error('Invalid library data format');
      }
      onImport(data);
      playWhoosh();
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${syncId ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                    {syncId ? <Wifi className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#1D1D1F]">Sync Library</h2>
                    {syncId && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Connected to Cloud</p>}
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                <X className="w-5 h-5 text-slate-600" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 m-4 bg-slate-100 rounded-2xl gap-1">
             <button
                onClick={() => { playClick(); setActiveTab('live'); setError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'live' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Wifi className="w-3.5 h-3.5" />
                Live Sync
            </button>
            <button
                onClick={() => { playClick(); setActiveTab('file'); setError(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'file' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileJson className="w-3.5 h-3.5" />
                Manual File
            </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 flex-1 overflow-y-auto min-h-[250px]">
            
            {/* LIVE SYNC TAB */}
            {activeTab === 'live' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800">Auto-Update Link</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                            Share a link once. Any changes made by you or your team will update automatically on everyone's device.
                        </p>
                    </div>

                    {!syncId ? (
                        <button
                            onClick={() => { playClick(); onStartLiveSync(); }}
                            disabled={isSyncing}
                            className="w-full py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-2 group"
                        >
                            {isSyncing ? (
                                <Loader2 className="w-8 h-8 animate-spin text-white/80" />
                            ) : (
                                <>
                                    <Wifi className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                    <span>Start Live Sync</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center gap-2 text-center animate-in zoom-in-95">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                                    <Check className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-900">You are connected!</h4>
                                    <p className="text-xs text-emerald-700 mt-0.5">App will poll for updates every 30s.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleCopyLink}
                                className="w-full py-4 bg-white border-2 border-slate-200 hover:border-orange-500 hover:text-orange-600 text-slate-700 rounded-2xl font-bold shadow-sm transition-all flex items-center justify-center gap-2 group"
                            >
                                {copySuccess ? <Check className="w-5 h-5 text-emerald-500" /> : <LinkIcon className="w-5 h-5 text-slate-400 group-hover:text-orange-600" />}
                                {copySuccess ? 'Link Copied!' : 'Copy Invitation Link'}
                            </button>

                            <button
                                onClick={onStopSync}
                                className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <WifiOff className="w-4 h-4" />
                                Stop Syncing
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* FILE TAB */}
            {activeTab === 'file' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="font-bold text-slate-800">Backup File</h3>
                        <p className="text-xs text-slate-500 mt-1">Old school. Download a file and send it manually.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={handleDownloadFile}
                            className="group relative p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-all flex flex-col items-center gap-3 text-center"
                        >
                            <div className="p-3 bg-white shadow-sm rounded-full text-orange-600 group-hover:scale-110 transition-transform">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Download Backup</h4>
                                <p className="text-[10px] text-slate-400 mt-1">Save .json file to device</p>
                            </div>
                        </button>

                        <div className="relative">
                            <input 
                                type="file"
                                ref={fileInputRef}
                                accept=".json"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <button 
                                onClick={() => { playClick(); fileInputRef.current?.click(); }}
                                className="w-full group relative p-6 bg-[#1D1D1F] text-white rounded-2xl shadow-lg shadow-black/5 hover:bg-black transition-all flex flex-col items-center gap-3 text-center active:scale-95"
                            >
                                <div className="p-3 bg-white/10 rounded-full text-white group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Restore Backup</h4>
                                    <p className="text-[10px] text-white/50 mt-1">Select .json file to merge</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm font-medium animate-in slide-in-from-left-2 justify-center">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Storage Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2">
            <Database className="w-3 h-3 text-slate-400" />
            <p className="text-[10px] font-medium text-slate-400">
                Library Size: <span className="text-slate-600 font-bold">{sizeKB} KB</span> ({percentUsed}% of 5MB limit)
            </p>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
