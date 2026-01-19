
import React from 'react';
import { X, Folder, ChevronRight, Home } from 'lucide-react';
import { Folder as FolderType, Game } from '../types';
import { playClick } from '../services/sound';

interface MoveToFolderModalProps {
  isOpen: boolean;
  game: Game | null;
  folders: FolderType[];
  onClose: () => void;
  onMove: (gameId: string, folderId: string | null) => void;
}

const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({ isOpen, game, folders, onClose, onMove }) => {
  if (!isOpen || !game) return null;

  const handleMove = (folderId: string | null) => {
    playClick();
    onMove(game.id, folderId);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 dark:border-white/10 ring-1 ring-black/5 flex flex-col max-h-[70vh]">
        
        <div className="p-6 border-b border-black/5 dark:border-white/10 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold dark:text-white">Move Game</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">{game.title}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 dark:text-white" />
            </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {/* Move to Root */}
            <button
                onClick={() => handleMove(null)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${!game.folderId ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/40' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-indigo-300'}`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-500">
                        <Home className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm dark:text-white">Main Library (Root)</span>
                </div>
                {!game.folderId && <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/40" />}
            </button>

            {/* Folders */}
            {folders.map(folder => (
                <button
                    key={folder.id}
                    onClick={() => handleMove(folder.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${game.folderId === folder.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/40' : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-indigo-300'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                            <Folder className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm dark:text-white">{folder.name}</span>
                    </div>
                    {game.folderId === folder.id ? (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/40" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    )}
                </button>
            ))}

            {folders.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                    No folders created yet.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MoveToFolderModal;
