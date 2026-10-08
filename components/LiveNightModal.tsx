import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, ClipboardList, Play, Star, X, ChevronRight, RotateCcw } from 'lucide-react';
import { Game, GameCalendarEvent } from '../types';
import RatingModal from './RatingModal';

interface LiveNightModalProps {
  date: string;
  games: Game[];
  events: GameCalendarEvent[];
  onClose: () => void;
  onSaveRating: (gameId: string, rating: number) => void;
}

const formatNightDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
};

const formatTime = (time?: string) => {
  if (!time) return 'Anytime';
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const normalizeMarkdown = (value: string) => value.replace(/\\([\\`*_{}\[\]()#+.!>|~-])/g, '$1');

const LiveNightModal: React.FC<LiveNightModalProps> = ({ date, games, events, onClose, onSaveRating }) => {
  const gameMap = useMemo(() => new Map(games.map(game => [game.id, game])), [games]);
  const nightEvents = useMemo(() => events
    .filter(event => event.date === date && gameMap.has(event.gameId))
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
    .map(event => ({
      event,
      game: gameMap.get(event.gameId)!,
      subGames: (event.subGameIds || []).map(id => gameMap.get(id)).filter((game): game is Game => Boolean(game))
    })), [events, date, gameMap]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedSupplies, setCheckedSupplies] = useState<string[]>([]);
  const [ratingGame, setRatingGame] = useState<Game | null>(null);

  const supplies = useMemo(() => {
    const items: { name: string; games: string[] }[] = [];
    nightEvents.forEach(({ game, subGames }) => {
      [game, ...subGames].forEach(itemGame => {
        if (!itemGame.materials?.trim()) return;
        itemGame.materials.split(/\n|[,;•]/).map(item => item.replace(/^[\s\-–—*•]+/, '').trim()).filter(Boolean).forEach(name => {
          const key = name.toLowerCase().replace(/\s+/g, ' ');
          const existing = items.find(item => item.name.toLowerCase().replace(/\s+/g, ' ') === key);
          if (existing) {
            if (!existing.games.includes(itemGame.title)) existing.games.push(itemGame.title);
          } else items.push({ name, games: [itemGame.title] });
        });
      });
    });
    return items;
  }, [nightEvents]);

  const current = nightEvents[currentIndex];
  const isComplete = currentIndex >= nightEvents.length;
  const toggleSupply = (name: string) => setCheckedSupplies(prev => prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]);

  const finishAndRate = () => {
    if (current) setRatingGame(current.game);
  };

  const saveRating = (gameId: string, rating: number) => {
    onSaveRating(gameId, rating);
    setCurrentIndex(index => index + 1);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-6xl max-h-[94vh] glass-card rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 flex flex-col">
          <header className="px-5 sm:px-7 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white"><Play className="w-5 h-5" /></div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Pursuit · Live Night</div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate">{formatNightDate(date)}</h2>
              </div>
            </div>
            <button onClick={() => { if (confirm('End this Live Night? Your checked supplies and current progress will be cleared.')) onClose(); }} className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-red-500" aria-label="End Live Night"><X className="w-5 h-5" /></button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)] min-h-0 flex-1 overflow-y-auto">
            <section className="p-5 sm:p-7">
              {nightEvents.length === 0 ? (
                <div className="py-14 text-center">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">No games scheduled</h3>
                  <p className="mt-2 text-sm text-slate-500">Add games to this date in the calendar, then start Live Night.</p>
                  <button onClick={onClose} className="mt-5 px-5 py-3 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-black font-bold">Back to Calendar</button>
                </div>
              ) : isComplete ? (
                <div className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Check className="w-8 h-8" /></div>
                  <h3 className="mt-5 text-3xl font-black text-slate-900 dark:text-white">Night complete!</h3>
                  <p className="mt-2 text-slate-500">You made it through all {nightEvents.length} scheduled game{nightEvents.length === 1 ? '' : 's'}.</p>
                  <button onClick={onClose} className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold">Finish Live Night</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-400">Game {currentIndex + 1} of {nightEvents.length}</div>
                      <div className="mt-2 h-1.5 w-40 max-w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${((currentIndex + 1) / nightEvents.length) * 100}%` }} /></div>
                    </div>
                    <div className="text-xs font-bold text-orange-600 dark:text-orange-400">{formatTime(current.event.time)}</div>
                  </div>
                  <div className="rounded-[1.5rem] p-5 sm:p-7 bg-gradient-to-br from-orange-500/10 via-indigo-500/5 to-violet-500/10 border border-orange-200/50 dark:border-white/10">
                    <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Up Now</div>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{current.game.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span>{current.game.duration}</span><span>·</span><span>{current.game.minPlayers} players minimum</span>
                    </div>
                    {current.event.notes && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{current.event.notes}</p>}
                    <div className="mt-5 space-y-4">
                      {current.game.setup && <div><h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Setup</h4><div className="mt-1.5 text-sm prose prose-sm max-w-none text-slate-800 dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-800 dark:prose-li:text-slate-100 dark:prose-invert"><ReactMarkdown>{normalizeMarkdown(current.game.setup)}</ReactMarkdown></div></div>}
                      <div><h4 className="text-xs font-black uppercase tracking-wider text-slate-400">How to Play</h4><div className="mt-1.5 text-sm prose prose-sm max-w-none text-slate-800 dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-800 dark:prose-li:text-slate-100 dark:prose-invert"><ReactMarkdown>{normalizeMarkdown(current.game.gameplay || current.game.rules || 'No instructions have been added yet.')}</ReactMarkdown></div></div>
                      {current.game.howToWin && <div><h4 className="text-xs font-black uppercase tracking-wider text-slate-400">How to Win</h4><div className="mt-1.5 text-sm prose prose-sm max-w-none text-slate-800 dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-800 dark:prose-li:text-slate-100 dark:prose-invert"><ReactMarkdown>{normalizeMarkdown(current.game.howToWin)}</ReactMarkdown></div></div>}
                    </div>
                  </div>

                  {current.subGames.length > 0 && (
                    <div className="mt-5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Mini-games / Sub-games <span className="text-xs font-medium text-slate-400">· no rating needed</span></h4>
                      <div className="mt-2 space-y-2">
                        {current.subGames.map(subGame => (
                          <details key={subGame.id} className="rounded-xl border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5">
                            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">{subGame.title}</summary>
                            <div className="px-4 pb-4 space-y-3">
                              {subGame.setup && <div className="text-sm prose prose-sm max-w-none text-slate-800 dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-800 dark:prose-li:text-slate-100 dark:prose-invert"><strong>Setup:</strong><ReactMarkdown>{normalizeMarkdown(subGame.setup)}</ReactMarkdown></div>}
                              <div className="text-sm prose prose-sm max-w-none text-slate-800 dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-800 dark:prose-li:text-slate-100 dark:prose-invert"><strong>How to play:</strong><ReactMarkdown>{normalizeMarkdown(subGame.gameplay || subGame.rules || 'No instructions have been added yet.')}</ReactMarkdown></div>
                              {subGame.howToWin && <div className="text-sm prose prose-sm max-w-none text-slate-800 dark:text-slate-100 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-800 dark:prose-li:text-slate-100 dark:prose-invert"><strong>How to win:</strong><ReactMarkdown>{normalizeMarkdown(subGame.howToWin)}</ReactMarkdown></div>}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={finishAndRate} className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black shadow-lg shadow-orange-500/20"><Star className="w-4 h-4 fill-current" /> Finish Game & Rate</button>
                  </div>
                  <p className="mt-2 text-center text-[11px] text-slate-400">After the game, collect the group’s 1–5 rating to move to the next scheduled game.</p>
                </>
              )}
            </section>

            <aside className="p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/10 bg-slate-50/50 dark:bg-black/10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-orange-500" /><h3 className="text-lg font-black text-slate-900 dark:text-white">Whole-Night Supplies</h3></div>
                <span className="text-xs font-bold text-slate-400">{checkedSupplies.length}/{supplies.length}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Combined list for every scheduled game and its mini-games.</p>
              {supplies.length ? (
                <div className="mt-4 space-y-2">
                  {supplies.map(item => {
                    const checked = checkedSupplies.includes(item.name);
                    return <label key={item.name} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/70 dark:bg-white/5 border-black/5 dark:border-white/10'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSupply(item.name)} className="mt-0.5 accent-orange-500" />
                      <span className="min-w-0"><span className={`block text-sm font-bold ${checked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{item.name}</span><span className="block mt-0.5 text-[10px] text-slate-400">For: {item.games.join(', ')}</span></span>
                    </label>;
                  })}
                </div>
              ) : <div className="mt-5 p-5 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-sm text-slate-400 text-center">No materials listed on tonight’s games yet.</div>}
              <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Tonight’s Lineup</h4>
                <div className="space-y-2">
                  {nightEvents.map((item, index) => <div key={item.event.id} className={`w-full flex items-start gap-2 text-left p-2 rounded-lg ${index === currentIndex ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : index < currentIndex ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {index < currentIndex ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <span className="w-4 h-4 mt-0.5 shrink-0 rounded-full border border-current text-[9px] flex items-center justify-center">{index + 1}</span>}
                    <span className="min-w-0"><span className="block text-xs font-bold">{item.game.title}</span><span className="block text-[10px] opacity-70">{formatTime(item.event.time)}{item.subGames.length ? ` · ${item.subGames.length} mini-game(s)` : ''}</span></span>
                    {index === currentIndex && <ChevronRight className="w-3.5 h-3.5 mt-0.5 ml-auto shrink-0 opacity-50" />}
                  </div>)}
                </div>
                {checkedSupplies.length > 0 && <button onClick={() => setCheckedSupplies([])} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-orange-500"><RotateCcw className="w-3.5 h-3.5" /> Reset supply checklist</button>}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <RatingModal isOpen={!!ratingGame} game={ratingGame} onClose={() => setRatingGame(null)} onSave={(gameId, rating) => { saveRating(gameId, rating); setRatingGame(null); }} />
    </>
  );
};

export default LiveNightModal;
