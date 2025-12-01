
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Clock, Box, Trophy, Sparkles, User, PlayCircle, Users, Edit2, Save, Plus, Check, StopCircle, Timer, AlertTriangle } from 'lucide-react';
import { Game, TargetGroup, ActiveTimer } from '../types';
import { TagIcon } from './TagIcon';
import { playClick } from '../services/sound';

interface GameDetailsViewProps {
  game: Game | null;
  onClose: () => void;
  onRate: (game: Game) => void;
  onLogWin: (game: Game) => void;
  onOpenAI: (game: Game) => void;
  onDelete: (id: string) => void;
  onUpdateGame: (game: Game) => void;
  allTags: string[];
  onCreateTag: (tag: string) => void;
  activeTimer: ActiveTimer | null;
  onStartTimer: (minutes: number, label: string) => void;
  onStopTimer: () => void;
}

const GameDetailsView: React.FC<GameDetailsViewProps> = ({ 
    game, onClose, onRate, onLogWin, onOpenAI, onDelete, onUpdateGame, allTags, onCreateTag,
    activeTimer, onStartTimer, onStopTimer
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGame, setEditedGame] = useState<Game | null>(null);
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [searchTag, setSearchTag] = useState('');
  const [customDuration, setCustomDuration] = useState(15);

  // Sync edits if game changes externally (e.g. cloud sync) ONLY if we aren't actively editing
  useEffect(() => {
      if (game && !isEditing) {
          setEditedGame(game);
      }
      if (!game) {
          setIsEditing(false);
          setIsTagMenuOpen(false);
          setSearchTag('');
      }
  }, [game, isEditing]);

  if (!game) return null;

  const handleStartEdit = () => {
      setEditedGame(game);
      setIsEditing(true);
      playClick();
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedGame(game); // Revert
      playClick();
  };

  const handleSaveEdit = () => {
      if (editedGame) {
          onUpdateGame(editedGame);
          setIsEditing(false);
      }
  };

  const handleStartGameClick = () => {
      playClick();
      onStartTimer(customDuration, game.title);
      onClose();
  };

  const handleGameOverClick = () => {
      onStopTimer();
  }

  // Immediate add tag (View Mode) or Draft add tag (Edit Mode)
  const handleAddTag = (tag: string) => {
      playClick();
      
      // If tag doesn't exist in allTags, create it globally first
      if (!allTags.includes(tag)) {
          onCreateTag(tag);
      }

      if (isEditing && editedGame) {
          if (!editedGame.tags.includes(tag)) {
              setEditedGame({
                  ...editedGame,
                  tags: [...editedGame.tags, tag]
              });
          }
      } else {
          // Immediate update
          if (!game.tags.includes(tag)) {
              onUpdateGame({
                  ...game,
                  tags: [...game.tags, tag],
                  lastUpdated: Date.now()
              });
          }
      }
      setIsTagMenuOpen(false);
      setSearchTag('');
  };

  const handleRemoveTag = (tag: string) => {
      if (editedGame) {
          setEditedGame({
              ...editedGame,
              tags: editedGame.tags.filter(t => t !== tag)
          });
          playClick();
      }
  };

  const currentGame = isEditing && editedGame ? editedGame : game;
  const filteredTags = allTags.filter(t => !currentGame.tags.includes(t) && t.toLowerCase().includes(searchTag.toLowerCase()));
  
  // Check if *this* game is the one running
  const isGameRunning = activeTimer && activeTimer.status === 'running' && activeTimer.label === game.title;
  // Check if *another* game is running
  const isAnotherGameRunning = activeTimer && activeTimer.status === 'running' && activeTimer.label !== game.title;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        />

        {/* The "Expanded Card" - Adaptive Colors */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1D1D1F] text-[#1D1D1F] dark:text-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/50 dark:border-white/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            
            {/* Header / Hero Section */}
            <div className="relative p-8 pb-6 border-b border-black/5 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                {/* Close/Edit Buttons - High Z-Index to ensure clickability */}
                <div className="absolute top-6 right-6 flex items-center gap-2 z-50">
                     {!isEditing && (
                        <button 
                            onClick={handleStartEdit}
                            className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors text-slate-500 dark:text-white/70 hover:text-slate-800 dark:hover:text-white"
                            title="Edit Game"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                     )}
                    <button 
                        onClick={onClose}
                        className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors text-slate-500 dark:text-white/70 hover:text-slate-800 dark:hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-col gap-4 relative z-10">
                    {/* Tags Section */}
                    <div className="flex flex-wrap gap-2 mb-2 relative">
                        {currentGame.tags.map(tag => (
                            <span key={tag} className="group relative px-2.5 py-1 bg-white dark:bg-white/10 border border-black/5 dark:border-white/5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-white/80 flex items-center gap-1.5 shadow-sm">
                                <TagIcon tag={tag} className="w-3 h-3 opacity-70" />
                                {tag}
                                {isEditing && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                                        className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                                        title="Remove Tag"
                                    >
                                        <X className="w-2 h-2 text-white" />
                                    </button>
                                )}
                            </span>
                        ))}
                        
                        {/* Add Tag Button */}
                        <div className="relative">
                            <button 
                                onClick={() => { playClick(); setIsTagMenuOpen(!isTagMenuOpen); }}
                                className="px-2 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent dark:border-white/10 rounded-lg text-[11px] font-semibold text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white flex items-center gap-1 transition-colors"
                            >
                                <Plus className="w-3 h-3" />
                                Add Tag
                            </button>
                            
                            {/* Tag Dropdown */}
                            {isTagMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setIsTagMenuOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#2C2C2E] border border-black/5 dark:border-white/10 rounded-xl shadow-xl z-30 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-2 pb-2 mb-1 border-b border-black/5 dark:border-white/5">
                                            <input 
                                                type="text" 
                                                placeholder="Search or Create..." 
                                                value={searchTag}
                                                onChange={(e) => setSearchTag(e.target.value)}
                                                autoFocus
                                                className="w-full bg-slate-100 dark:bg-black/20 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/20">
                                            {filteredTags.length === 0 && searchTag.trim() && (
                                                <button
                                                    onClick={() => handleAddTag(searchTag.trim())}
                                                    className="w-full text-left px-3 py-2 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-2"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Create "{searchTag}"
                                                </button>
                                            )}
                                            {filteredTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => handleAddTag(tag)}
                                                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/10 flex items-center gap-2"
                                                >
                                                    <TagIcon tag={tag} className="w-3 h-3 opacity-50" />
                                                    {tag}
                                                </button>
                                            ))}
                                            {filteredTags.length === 0 && !searchTag && (
                                                <div className="px-3 py-2 text-xs text-slate-400 dark:text-white/30 italic text-center">No more tags</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {isEditing ? (
                        <input
                            type="text"
                            value={editedGame?.title}
                            onChange={(e) => setEditedGame(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 -ml-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full"
                        />
                    ) : (
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
                            {game.title}
                        </h2>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-white/60">
                        <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
                            <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedGame?.duration}
                                    onChange={(e) => setEditedGame(prev => prev ? { ...prev, duration: e.target.value } : null)}
                                    className="bg-transparent border-b border-slate-300 dark:border-white/20 w-24 focus:outline-none text-slate-800 dark:text-white px-1"
                                />
                            ) : (
                                <span>{game.duration}</span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 shadow-sm">
                            <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            {isEditing ? (
                                <select
                                    value={editedGame?.targetGroup}
                                    onChange={(e) => setEditedGame(prev => prev ? { ...prev, targetGroup: e.target.value as TargetGroup } : null)}
                                    className="bg-transparent border-none focus:outline-none text-slate-800 dark:text-white appearance-none pr-6 cursor-pointer"
                                >
                                    {['Middle School', 'High School', 'College', 'Both'].map(tg => (
                                        <option key={tg} value={tg} className="bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-white">{tg}</option>
                                    ))}
                                </select>
                            ) : (
                                <span>{game.targetGroup}</span>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="flex items-center gap-2 px-2">
                                <User className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <span>Added by {game.createdBy || 'Unknown'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Col: Supplies */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Start Game / Timer Control */}
                        {!isEditing && (
                             <div className={`rounded-3xl p-6 border transition-all ${isGameRunning ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/50' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'}`}>
                                <h3 className={`font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 ${isGameRunning ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {isGameRunning ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                    {isGameRunning ? 'Game In Progress' : 'Start Game'}
                                </h3>
                                
                                {isGameRunning ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-500 dark:text-white/70">Timer is running on all synced devices.</p>
                                        <button
                                            onClick={handleGameOverClick}
                                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 animate-pulse"
                                        >
                                            <StopCircle className="w-6 h-6" />
                                            GAME OVER
                                        </button>
                                    </div>
                                ) : isAnotherGameRunning ? (
                                    <div className="space-y-3 bg-orange-50 dark:bg-orange-500/10 p-4 rounded-xl border border-orange-200 dark:border-orange-500/30">
                                         <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-sm">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Another Game Running</span>
                                         </div>
                                         <p className="text-xs text-slate-600 dark:text-white/70">
                                            "{activeTimer?.label}" is currently active. You must stop it before starting this one.
                                         </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-1">
                                            <button onClick={() => setCustomDuration(d => Math.max(1, d - 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors">-</button>
                                            <div className="flex items-center justify-center gap-1 flex-1">
                                                <input 
                                                    type="number" 
                                                    value={customDuration} 
                                                    onChange={(e) => setCustomDuration(Math.max(1, parseInt(e.target.value) || 0))}
                                                    className="bg-transparent text-center font-bold text-lg w-16 text-slate-800 dark:text-white focus:outline-none appearance-none m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-b border-transparent focus:border-orange-500/50"
                                                />
                                                <span className="text-xs text-slate-400 dark:text-white/50">min</span>
                                            </div>
                                            <button onClick={() => setCustomDuration(d => d + 1)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors">+</button>
                                        </div>
                                        <button
                                            onClick={handleStartGameClick}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <PlayCircle className="w-5 h-5" />
                                            Start Game Timer
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 relative">
                            <h3 className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                <Box className="w-4 h-4" />
                                Supplies Needed
                            </h3>
                            {isEditing ? (
                                <textarea
                                    value={editedGame?.materials}
                                    onChange={(e) => setEditedGame(prev => prev ? { ...prev, materials: e.target.value } : null)}
                                    className="w-full h-48 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-xl p-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none leading-relaxed"
                                />
                            ) : (
                                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                                    {game.materials ? game.materials : (
                                        <span className="italic opacity-50">No materials listed.</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5">
                                <h3 className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    AI Tools
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                    Need a variation, a score sheet, or want to make the rules funnier?
                                </p>
                                <button
                                    onClick={() => onOpenAI(game)}
                                    className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Open AI Assistant
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Rules */}
                    <div className="lg:col-span-2">
                        <div className="mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                             <PlayCircle className="w-5 h-5" />
                             <h3 className="font-bold uppercase tracking-widest text-xs">How to Play & Win</h3>
                        </div>
                        
                        {isEditing ? (
                             <textarea
                                value={editedGame?.rules}
                                onChange={(e) => setEditedGame(prev => prev ? { ...prev, rules: e.target.value } : null)}
                                className="w-full h-[500px] bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-xl p-4 text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none font-mono leading-relaxed"
                            />
                        ) : (
                            <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-headings:text-slate-900 dark:prose-headings:text-white prose-ul:list-disc prose-ol:list-decimal prose-strong:text-slate-800 dark:prose-strong:text-white prose-a:text-orange-600 dark:prose-a:text-orange-400">
                                <ReactMarkdown>{game.rules}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-3 items-center justify-between z-40 relative">
                {isEditing ? (
                    <>
                        <button 
                            onClick={handleCancelEdit}
                            className="px-6 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center gap-2 ml-auto"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={() => onDelete(game.id)}
                            className="px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-colors"
                        >
                            Delete Game
                        </button>
                        
                        <div className="flex gap-3 flex-1 justify-end">
                            <button
                                onClick={() => onRate(game)} 
                                className="px-6 py-3 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-slate-200 dark:border-transparent rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                <Trophy className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                                Rate Game
                            </button>
                            <button 
                                onClick={() => onLogWin(game)}
                                className="px-8 py-3 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:bg-black dark:hover:bg-slate-200 transition-colors shadow-lg flex items-center gap-2"
                            >
                                <Trophy className="w-4 h-4" />
                                Log Winner
                            </button>
                        </div>
                    </>
                )}
            </div>

        </div>
    </div>
  );
};

export default GameDetailsView;
