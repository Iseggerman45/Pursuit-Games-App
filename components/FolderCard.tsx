
import React, { useState } from 'react';
import { Folder, FolderOpen, Trash2, Edit2, CornerRightDown, Users, Zap, Trophy, Gamepad2, Dumbbell, Music, Drama, Snowflake, Flame, Target, Swords, Flag, Timer, Heart, Star, Sparkles, Ghost, Car, Dices, Volleyball, Brain, Puzzle, PersonStanding, Waves, Mountain, Tent, PartyPopper, GraduationCap, Crown, CircleDot } from 'lucide-react';
import { Folder as FolderType } from '../types';
import { playClick, playPop } from '../services/sound';

const FOLDER_ICONS: Record<string, React.ElementType> = { folder: Folder, team: Users, energy: Zap, trophy: Trophy, game: Gamepad2, fitness: Dumbbell, music: Music, drama: Drama, winter: Snowflake, fire: Flame, target: Target, battle: Swords, flag: Flag, timer: Timer, heart: Heart, star: Star, sparkle: Sparkles, ghost: Ghost, racing: Car, dice: Dices, volleyball: Volleyball, brain: Brain, puzzle: Puzzle, active: PersonStanding, water: Waves, mountain: Mountain, camp: Tent, party: PartyPopper, school: GraduationCap, crown: Crown, ball: CircleDot };

interface FolderCardProps {
  folder: FolderType;
  gameCount: number;
  onClick: () => void;
  onDropGame: (gameId: string) => void;
  onDelete: () => void;
  onRename?: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({ folder, gameCount, onClick, onDropGame, onDelete, onRename }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
  }

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Try getting custom ID first, then fallback to text
    const gameId = e.dataTransfer.getData('gameId') || e.dataTransfer.getData('text/plain');
    
    if (gameId) {
      playPop();
      onDropGame(gameId);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete();
  };

  const handleRename = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRename?.();
  };

  return (
    <div 
      className={`
        group relative w-full h-[10rem] sm:h-[12rem] cursor-pointer interactive-lift
        ${isDragOver ? 'scale-105 z-20' : 'hover:-translate-y-1 z-0'}
      `}
      onClick={() => { playClick(); onClick(); }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`
        w-full h-full rounded-[2rem] border overflow-hidden flex flex-col items-center justify-center text-center p-6 transition-all duration-300 pointer-events-none
        ${isDragOver 
            ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.3)] ring-4 ring-indigo-400/20' 
            : 'glass-card backdrop-blur-xl border-white/70 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-indigo-300/60 dark:hover:border-white/20'
        }
      `}>
        {/* Action Buttons (Hover) */}
        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-30 pointer-events-auto">
            <button 
                onClick={handleRename}
                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-full transition-all"
                title="Rename Folder"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <button 
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-full transition-all"
                title="Delete Folder"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>

        <div className={`
            w-16 h-16 rounded-3xl flex items-center justify-center mb-3 transition-colors duration-300
            ${isDragOver ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-orange-500/15 dark:from-indigo-500/20 dark:via-violet-500/15 dark:to-orange-500/15 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/10'}
        `}>
             {isDragOver ? <CornerRightDown className="w-8 h-8 animate-bounce" /> : (() => { const Icon = FOLDER_ICONS[folder.icon || 'folder'] || Folder; return <Icon className="w-8 h-8" />; })()}
        </div>

        <h3 className={`text-lg font-bold truncate w-full px-2 transition-colors ${isDragOver ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
            {folder.name}
        </h3>
        
        <p className={`text-xs font-semibold uppercase tracking-wide mt-1 transition-colors ${isDragOver ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {gameCount} {gameCount === 1 ? 'Game' : 'Games'}
        </p>

        {isDragOver && (
             <div className="absolute inset-x-0 bottom-4 text-center">
                 <span className="bg-white dark:bg-black/50 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-sm">Release to Move</span>
             </div>
        )}
      </div>
    </div>
  );
};

export default FolderCard;
