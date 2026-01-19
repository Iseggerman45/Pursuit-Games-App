import React from 'react';
import { Star, Clock, Trophy, FolderInput, Trash2, BookOpen } from 'lucide-react';
import { Game } from '../types';
import { playWhoosh } from '../services/sound';
import { TagIcon } from './TagIcon';

interface GameCardProps {
  game: Game;
  onRateClick: (game: Game) => void;
  onDelete: (id: string) => void;
  onLogWin: (game: Game) => void;
  onClick: (game: Game) => void;
  onMoveClick: (game: Game) => void; 
  showFolderName?: boolean; 
  folderName?: string; 
  libraryId?: string;
}

const GameCard: React.FC<GameCardProps> = ({ 
    game, onRateClick, onDelete, onLogWin, onClick, onMoveClick, showFolderName, folderName
}) => {
  const handleClick = () => {
    playWhoosh();
    onClick(game);
  };

  const roundedRating = Math.round(game.rating || 0);

  return (
    <div 
      className="group relative w-full h-[22rem] cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl active:scale-95"
      onClick={handleClick}
      draggable={true}
      onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('gameId', game.id);
      }}
    >
        <div className="w-full h-full bg-white dark:bg-[#1D1D1F] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 overflow-hidden flex flex-col">
          
          <div className="relative w-full h-24 bg-gradient-to-br from-indigo-500/10 to-orange-500/10 dark:from-indigo-500/20 dark:to-orange-500/20 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-indigo-400 dark:text-indigo-600 opacity-20" />
                {showFolderName && folderName && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 bg-black/40 backdrop-blur-md text-[8px] font-black uppercase text-white rounded-md border border-white/10">
                      {folderName}
                    </span>
                  </div>
                )}
          </div>

          <div className="flex-1 p-6 flex flex-col text-left">
            <h3 className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight mb-2 line-clamp-2">{game.title}</h3>
            
            <div className="flex flex-wrap gap-1.5 mb-auto">
                {(game.tags || []).slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <TagIcon tag={tag} className="w-2.5 h-2.5 opacity-60" />
                        {tag}
                    </span>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <Clock className="w-3 h-3 text-orange-500" />
                    <span>{game.duration}</span>
                </div>
                <div 
                    className="flex gap-0.5"
                    onClick={(e) => { e.stopPropagation(); onRateClick(game); }}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= roundedRating ? 'text-yellow-400 fill-current' : 'text-slate-200 dark:text-slate-700'}`} 
                        />
                    ))}
                </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 dark:bg-black/20 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 opacity-60">
                <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                    {game.createdBy?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[60px]">
                    {game.createdBy || 'Anon'}
                </span>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); onMoveClick(game); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"><FolderInput className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); onLogWin(game); }} className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg transition-all"><Trophy className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(game.id); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default GameCard;