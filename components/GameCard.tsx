
import React from 'react';
import { Star, Clock, Trophy, User } from 'lucide-react';
import { Game } from '../types';
import { playWhoosh } from '../services/sound';
import { TagIcon } from './TagIcon';

interface GameCardProps {
  game: Game;
  onRateClick: (game: Game) => void;
  onDelete: (id: string) => void;
  onLogWin: (game: Game) => void;
  onOpenAI?: (game: Game) => void;
  onClick: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onRateClick, onLogWin, onClick }) => {

  const handleClick = () => {
    playWhoosh();
    onClick(game);
  };

  const handleRateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRateClick(game);
  };

  const handleLogWinClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onLogWin(game);
  }

  return (
    <div 
      className="group relative w-full h-[22rem] cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
      onClick={handleClick}
    >
        {/* Card Body */}
        <div className="w-full h-full bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/60 dark:border-white/10 overflow-hidden flex flex-col transition-colors duration-300">
          
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            {/* Hover Indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-3 py-1 bg-[#1D1D1F] dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">View</span>
            </div>

            <h3 className="text-2xl font-bold text-[#1D1D1F] dark:text-white tracking-tight mb-3 leading-tight line-clamp-3 transition-colors">{game.title}</h3>
            
            <div className="flex flex-wrap gap-2 justify-center mb-6">
                {game.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white/50 dark:bg-white/10 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-semibold rounded-full flex items-center gap-1.5 transition-colors">
                        <TagIcon tag={tag} className="w-3 h-3 opacity-60" />
                        {tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-100/50 dark:bg-white/5 px-3 py-1.5 rounded-lg transition-colors">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{game.duration}</span>
            </div>
          </div>

          {/* Footer Area */}
          <div className="p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm border-t border-white/50 dark:border-white/5 flex flex-col items-center gap-1.5 transition-colors">
            <div className="flex items-center justify-between w-full px-2">
                
                {/* Attribution */}
                <div className="flex items-center gap-1.5 opacity-60">
                    <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        {game.createdBy || 'Unknown'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Log Winner */}
                    <button
                        onClick={handleLogWinClick}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-white/10 rounded-full transition-colors"
                        title="Log Winner"
                    >
                        <Trophy className="w-4 h-4" />
                    </button>

                    {/* Rating */}
                    <div 
                        className="flex gap-1 cursor-pointer hover:scale-110 transition-transform"
                        onClick={handleRateClick}
                        title="Rate this game"
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                                key={star} 
                                className={`w-4 h-4 ${star <= game.rating ? 'text-yellow-400 fill-current drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'}`} 
                            />
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default GameCard;
