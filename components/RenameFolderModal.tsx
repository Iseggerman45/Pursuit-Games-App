
import React, { useState, useEffect } from 'react';
import { X, Edit3, Check } from 'lucide-react';
import { Folder } from '../types';

interface RenameFolderModalProps {
  isOpen: boolean;
  folder: Folder | null;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
}

const RenameFolderModal: React.FC<RenameFolderModalProps> = ({ isOpen, folder, onClose, onRename }) => {
  const [folderName, setFolderName] = useState('');

  useEffect(() => {
    if (isOpen && folder) {
      setFolderName(folder.name);
    }
  }, [isOpen, folder]);

  if (!isOpen || !folder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim() && folderName.trim() !== folder.name) {
      onRename(folder.id, folderName.trim());
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Edit3 className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-[#1D1D1F] dark:text-white">Rename Folder</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Currently: {folder.name}</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="New Folder Name"
              className="w-full p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner text-sm"
            />
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Name
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RenameFolderModal;
