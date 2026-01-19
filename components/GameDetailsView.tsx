import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Clock, Box, Trophy, Sparkles, PlayCircle, Users, Edit2, Save, Trash2, Star, BookOpen, Sword, FlagTriangleRight, Settings, FolderInput } from 'lucide-react';
import { Game, ActiveTimer } from '../types';
import { TagIcon } from './TagIcon';
import { playClick } from '../services/sound';
import DiagramEditor from './DiagramEditor';

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
  onResetRating: (id: string) => void;
  onMoveClick: (game: Game) => void;
  libraryId: string;
}

const GameDetailsView: React.FC<GameDetailsViewProps> = ({ 
    game, onClose, onRate, onLogWin, onOpenAI, onDelete, onUpdateGame, allTags, onCreateTag,
    activeTimer, onStartTimer, onStopTimer, onResetRating, onMoveClick, libraryId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGame, setEditedGame] = useState<Game | null>(null);
  const [customDuration, setCustomDuration] = useState(15);
  
  // Sectioned Rule States
  const [editSetup, setEditSetup] = useState('');
  const [editGameplay, setEditGameplay] = useState('');
  const [editWin, setEditWin] = useState('');
  
  const parseRules = (rules?: string) => {
      let s = '', g = rules || '', w = '';
      if (rules && (rules.includes('## Setup') || rules.includes('## Gameplay') || rules.includes('## How to Win'))) {
          const parts = rules.split(/## (Setup|Gameplay|How to Win)/i);
          s = ''; g = ''; w = '';
          for (let i = 1; i < parts.length; i += 2) {
              const header = parts[i]?.toLowerCase();
              const content = parts[i+1]?.trim() || '';
              if (header === 'setup') s = content;
              else if (header === 'gameplay') g = content;
              else if (header === 'how to win') w = content;
          }
          if (!g && rules && !rules.includes('##')) g = rules;
      }
      return { s, g, w };
  };

  useEffect(() => {
      if (game && !isEditing) {
          const { s, g, w } = parseRules(game.rules);
          setEditSetup(s);
          setEditGameplay(g);
          setEditWin(w);
          setEditedGame(game);
      }
  }, [game, isEditing]);

  if (!game) return null;

  const handleSaveEdit = () => {
      if (editedGame) {
          const combinedRules = `## Setup\n${editSetup}\n\n## Gameplay\n${editGameplay}\n\n## How to Win\n${editWin}`;
          
          onUpdateGame({
              ...editedGame,
              rules: combinedRules.trim(),
          });
          setIsEditing(false);
          playClick();
      }
  };

  const isGameRunning = activeTimer && activeTimer.status === 'running' && activeTimer.label === game.title;
  const { s: viewSetup, g: viewGameplay, w: viewWin } = parseRules(game.rules);

  const markdownComponents = {
      p: ({children}: any) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
      ul: ({children}: any) => <ul className="list-disc pl-5 mb-4 space-y-1 leading-relaxed">{children}</ul>,
      ol: ({children}: any) => <ol className="list-decimal pl-5 mb-4 space-y-1 leading-relaxed">{children}</ol>,
      strong: ({children}: any) => <strong className="font-bold text-slate-800 dark:text-white bg-orange-100 dark:bg-orange-500/20 px-1 rounded-md">{children}</strong>,
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full max-w-5xl max-h-[95vh] bg-white dark:bg-[#1D1D1F] text-[#1D1D1F] dark:text-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/50 dark:border-white/10 animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-8 pb-6 border-b border-black/5 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                <div className="absolute top-6 right-6 flex items-center gap-2 z-50">
                    <button onClick={() => onOpenAI(game)} className="p-2 bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/40 rounded-full transition-colors text-indigo-600 dark:text-indigo-300" title="AI Assistant"><Sparkles className="w-5 h-5" /></button>
                     {!isEditing && <button onClick={() => setIsEditing(true)} className="p-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors text-slate-500 dark:text-white/70" title="Edit Game"><Edit2 className="w-5 h-5" /></button>}
                    <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full text-slate-500 dark:text-white/70 hover:text-slate-800 dark:hover:text-white" title="Close"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                        {(game.tags || []).map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-white dark:bg-white/10 border border-black/5 dark:border-white/5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"><TagIcon tag={tag} className="w-3 h-3 opacity-70" /> {tag}</span>
                        ))}
                    </div>
                    {isEditing ? (
                        <input type="text" value={editedGame?.title || ''} onChange={(e) => setEditedGame(p => p ? {...p, title: e.target.value} : null)} className="text-3xl font-bold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/20 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Game Title" />
                    ) : (
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{game.title || 'Untitled Game'}</h2>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        {/* Diagram Container */}
                        <div className="bg-white dark:bg-black/20 rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm flex flex-col items-center justify-center">
                            <div className="w-full aspect-[16/10] min-h-[400px] flex flex-col">
                                <DiagramEditor 
                                    initialImageUrl={game.diagramUrl} 
                                    initialAnnotations={game.diagramData} 
                                    onSave={(url, ann) => onUpdateGame({...game, diagramUrl: url, diagramData: ann})} 
                                    readOnly={!isEditing} 
                                    gameTitle={game.title} 
                                    gameId={game.id}
                                    libraryId={libraryId}
                                    hasCloudAsset={game.hasDiagram}
                                />
                            </div>
                        </div>

                        {/* Rules Sectioned Editing */}
                        <div className="space-y-6">
                            <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2 text-emerald-600 dark:text-emerald-400"><PlayCircle className="w-4 h-4" /> Game Manual</h3>
                            
                            {isEditing ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                            <BookOpen className="w-3.5 h-3.5" /> 1. Setup
                                        </label>
                                        <textarea 
                                            value={editSetup} 
                                            onChange={(e) => setEditSetup(e.target.value)} 
                                            className="w-full h-32 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 resize-none text-slate-800 dark:text-white" 
                                            placeholder="What happens before the game starts?" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                            <Sword className="w-3.5 h-3.5" /> 2. Gameplay
                                        </label>
                                        <textarea 
                                            value={editGameplay} 
                                            onChange={(e) => setEditGameplay(e.target.value)} 
                                            className="w-full h-48 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500/20 resize-none text-slate-800 dark:text-white" 
                                            placeholder="How do you actually play the game?" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                            <FlagTriangleRight className="w-3.5 h-3.5" /> 3. How to Win
                                        </label>
                                        <textarea 
                                            value={editWin} 
                                            onChange={(e) => setEditWin(e.target.value)} 
                                            className="w-full h-24 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500/20 resize-none text-slate-800 dark:text-white" 
                                            placeholder="When does the game end and who wins?" 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(viewSetup || !viewGameplay) ? (
                                        <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 p-5">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 text-[10px] uppercase tracking-widest mb-3 block">1. The Setup</span>
                                            <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                                                <ReactMarkdown components={markdownComponents}>{viewSetup || '_No setup details available._'}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 p-5">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-widest mb-3 block">2. Gameplay</span>
                                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown components={markdownComponents}>{viewGameplay || '_No gameplay instructions provided._'}</ReactMarkdown>
                                        </div>
                                    </div>
                                    {viewWin && (
                                        <div className="bg-orange-50/50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/20 p-5">
                                            <span className="font-bold text-orange-600 dark:text-orange-400 text-[10px] uppercase tracking-widest mb-3 block">3. How to Win</span>
                                            <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                                                <ReactMarkdown components={markdownComponents}>{viewWin}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                         {!isEditing && (
                            <div className={`rounded-3xl p-6 border ${isGameRunning ? 'bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'}`}>
                                <h3 className="font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 text-slate-500 dark:text-slate-400">{isGameRunning ? 'Active Game' : 'Quick Timer'}</h3>
                                {isGameRunning ? (
                                    <button onClick={onStopTimer} className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg animate-pulse">STOP TIMER</button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between bg-white dark:bg-black/20 rounded-xl p-1 border border-black/5 dark:border-white/5">
                                            <button onClick={() => setCustomDuration(d => Math.max(1, d - 1))} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors">-</button>
                                            <div className="font-bold dark:text-white">{customDuration} min</div>
                                            <button onClick={() => setCustomDuration(d => d + 1)} className="p-2 text-slate-500 hover:text-indigo-600 transition-colors">+</button>
                                        </div>
                                        <button onClick={() => { onStartTimer(customDuration, game.title); onClose(); }} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all">Start Timer</button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5">
                            <h3 className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Box className="w-3.5 h-3.5" /> Supplies</h3>
                            {isEditing ? (
                                <textarea 
                                    value={editedGame?.materials || ''} 
                                    onChange={(e) => setEditedGame(p => p ? {...p, materials: e.target.value} : null)} 
                                    className="w-full h-32 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500/20 text-slate-800 dark:text-white resize-none" 
                                    placeholder="Bullet points of required items..."
                                />
                            ) : (
                                <div className="text-slate-600 dark:text-slate-300 text-sm prose prose-sm dark:prose-invert">
                                    <ReactMarkdown components={markdownComponents}>{game.materials || '_No supplies listed._'}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5">
                            <h3 className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2">
                                <Settings className="w-3 h-3" />
                                {isEditing ? 'Edit Details' : 'Game Stats'}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Duration</span>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={editedGame?.duration || ''} 
                                            onChange={(e) => setEditedGame(p => p ? {...p, duration: e.target.value} : null)}
                                            className="text-right text-xs font-bold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 w-24 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="15 mins"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold dark:text-white flex items-center gap-1.5"><Clock className="w-3 h-3" /> {game.duration || 'N/A'}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Min Players</span>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={editedGame?.minPlayers || ''} 
                                            onChange={(e) => setEditedGame(p => p ? {...p, minPlayers: e.target.value} : null)}
                                            className="text-right text-xs font-bold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 w-24 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="4"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold dark:text-white flex items-center gap-1.5"><Users className="w-3 h-3" /> {game.minPlayers || '2+'}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Category</span>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={editedGame?.category || ''} 
                                            onChange={(e) => setEditedGame(p => p ? {...p, category: e.target.value} : null)}
                                            className="text-right text-xs font-bold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 w-24 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="Active"
                                        />
                                    ) : (
                                        <span className="text-xs font-bold dark:text-white">{game.category || 'General'}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/10 pt-4">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Avg Rating</span>
                                    <span className="text-xs font-bold dark:text-white flex items-center gap-1.5"><Star className="w-3 h-3 text-yellow-500 fill-current" /> {(game.rating || 0).toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex gap-3 items-center justify-between">
                {isEditing ? (
                    <>
                        <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex gap-2">
                          <button onClick={() => onDelete(game.id)} className="px-4 py-3 text-red-500 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2">
                              <Trash2 className="w-4 h-4" /> Delete
                          </button>
                          <button onClick={() => onMoveClick(game)} className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all flex items-center gap-2">
                              <FolderInput className="w-4 h-4" /> Move
                          </button>
                        </div>
                        <div className="flex gap-3 ml-auto">
                            <button onClick={() => onRate(game)} className="px-6 py-3 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-all">
                                <Star className="w-4 h-4 text-yellow-500" /> Rate
                            </button>
                            <button onClick={() => onLogWin(game)} className="px-8 py-3 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
                                <Trophy className="w-4 h-4" /> Log Result
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