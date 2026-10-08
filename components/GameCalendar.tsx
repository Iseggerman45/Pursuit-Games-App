import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, X, StickyNote, Search, CalendarPlus, ClipboardList, Copy, Printer } from 'lucide-react';
import { Game, GameCalendarEvent, CalendarSettings, CalendarSchedule } from '../types';
import { playClick, playPop, playDelete } from '../services/sound';

interface GameCalendarProps {
  games: Game[];
  settings: CalendarSettings;
  onSaveSettings: (settings: CalendarSettings) => void;
  events: GameCalendarEvent[];
  onAddEvent: (event: GameCalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onOpenGame: (game: Game) => void;
}

type ViewMode = 'month' | 'week';

const pad = (n: number) => String(n).padStart(2, '0');

const keyFromParts = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

const partsFromKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return { year, month: month - 1, day };
};

const todayKey = () => {
  const now = new Date();
  return keyFromParts(now.getFullYear(), now.getMonth(), now.getDate());
};

const keyToUtcDate = (key: string) => {
  const { year, month, day } = partsFromKey(key);
  return new Date(Date.UTC(year, month, day));
};

const addDays = (key: string, amount: number) => {
  const date = keyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + amount);
  return keyFromParts(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const startOfWeek = (key: string) => {
  const date = keyToUtcDate(key);
  return addDays(key, -date.getUTCDay());
};

const monthLabel = (key: string) =>
  keyToUtcDate(key).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });

const shortDayLabel = (key: string) =>
  keyToUtcDate(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

const formatTime = (time?: string) => {
  if (!time) return 'Anytime';
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return time;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${pad(minute)} ${suffix}`;
};

const GameCalendar: React.FC<GameCalendarProps> = ({ games, settings, onSaveSettings, events, onAddEvent, onDeleteEvent, onOpenGame }) => {
  const [view, setView] = useState<ViewMode>('month');
  const [anchorDate, setAnchorDate] = useState(todayKey());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedGameId, setSelectedGameId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [gameSearch, setGameSearch] = useState('');
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [selectedNights, setSelectedNights] = useState<number[]>([]);
  const [nightGroups, setNightGroups] = useState<Record<number, 'Middle School' | 'High School'>>({});
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [supplyListDate, setSupplyListDate] = useState<string | null>(null);

  const weekLabels = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  const openCalendarSetup = () => {
    const current = settings.schedules || [];
    setSelectedNights(current.map(s => s.dayOfWeek));
    setNightGroups(Object.fromEntries(current.map(s => [s.dayOfWeek, s.targetGroup])));
    setSetupStep(current.length ? 2 : 1);
    setIsEditingSchedule(true);
  };

  const finishCalendarSetup = () => {
    if (!selectedNights.length) return;
    const schedules: CalendarSchedule[] = selectedNights.map(dayOfWeek => ({
      dayOfWeek,
      targetGroup: nightGroups[dayOfWeek] || 'Middle School'
    }));
    onSaveSettings({ configured: true, schedules });
    setIsEditingSchedule(false);
    playPop();
  };

  const scheduledDaySet = useMemo(() => new Set((settings.schedules || []).map(s => s.dayOfWeek)), [settings.schedules]);
  const scheduleForDay = (dayOfWeek: number) => settings.schedules?.find(s => s.dayOfWeek === dayOfWeek);

  const gameMap = useMemo(() => new Map(games.map(game => [game.id, game])), [games]);

  const visibleEvents = useMemo(() => {
    return [...events]
      .filter(event => gameMap.has(event.gameId))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '99:99').localeCompare(b.time || '99:99');
      });
  }, [events, gameMap]);

  const monthDays = useMemo(() => {
    const { year, month } = partsFromKey(anchorDate);
    const firstKey = keyFromParts(year, month, 1);
    const first = keyToUtcDate(firstKey);
    const start = addDays(firstKey, -first.getUTCDay());
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [anchorDate]);

  const visibleMonthDays = useMemo(() => monthDays.filter(date => scheduledDaySet.has(keyToUtcDate(date).getUTCDay())), [monthDays, scheduledDaySet]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
      .filter(date => scheduledDaySet.has(keyToUtcDate(date).getUTCDay()));
  }, [anchorDate, scheduledDaySet]);

  const eventsForDate = (date: string) =>
    visibleEvents.filter(event => event.date === date);

  const openAdd = (date = anchorDate) => {
    playClick();
    setSelectedDate(date);
    setSelectedGameId('');
    setSelectedTime('');
    setNotes('');
    setGameSearch('');
    setIsModalOpen(true);
  };

  const closeAdd = () => {
    setIsModalOpen(false);
    setGameSearch('');
  };

  const saveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId) return;
    const event: GameCalendarEvent = {
      id: crypto.randomUUID(),
      gameId: selectedGameId,
      date: selectedDate,
      time: selectedTime || undefined,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    onAddEvent(event);
    playPop();
    closeAdd();
  };

  const navigate = (direction: number) => {
    playClick();
    if (view === 'month') {
      const { year, month } = partsFromKey(anchorDate);
      const next = new Date(Date.UTC(year, month + direction, 1));
      setAnchorDate(keyFromParts(next.getUTCFullYear(), next.getUTCMonth(), 1));
    } else {
      setAnchorDate(addDays(anchorDate, direction * 7));
    }
  };

  const goToday = () => {
    playClick();
    setAnchorDate(todayKey());
  };

  const supplyList = useMemo(() => {
    if (!supplyListDate) return [];
    const dayEvents = eventsForDate(supplyListDate);
    const items: { name: string; games: string[] }[] = [];
    dayEvents.forEach(event => {
      const game = gameMap.get(event.gameId);
      if (!game || !game.materials?.trim()) return;
      const parts = game.materials.split(/\n|[,;•]/).map(item => item.replace(/^[\s\-–—*•]+/, '').trim()).filter(Boolean);
      parts.forEach(name => {
        const key = name.toLowerCase().replace(/\s+/g, ' ');
        const existing = items.find(item => item.name.toLowerCase().replace(/\s+/g, ' ') === key);
        if (existing) {
          if (!existing.games.includes(game.title)) existing.games.push(game.title);
        } else items.push({ name, games: [game.title] });
      });
    });
    return items;
  }, [supplyListDate, events, gameMap]);

  const copySupplyList = async () => {
    if (!supplyListDate) return;
    const lines = ['Supply List — ' + shortDayLabel(supplyListDate), ''];
    supplyList.forEach(item => lines.push('☐ ' + item.name + (item.games.length ? ' — ' + item.games.join(', ') : '')));
    try { await navigator.clipboard.writeText(lines.join('\n')); } catch {}
    playPop();
  };

  const filteredGames = useMemo(() => {
    const term = gameSearch.trim().toLowerCase();
    if (!term) return games;
    return games.filter(game => game.title.toLowerCase().includes(term));
  }, [games, gameSearch]);

  const title = view === 'month'
    ? monthLabel(anchorDate)
    : weekDays.length ? `${shortDayLabel(weekDays[0])} – ${shortDayLabel(weekDays[weekDays.length - 1])}` : 'Your Youth Nights';

  return (
    <section className="relative z-10 max-w-7xl mx-auto w-full">
      {!settings.configured || isEditingSchedule ? (
        <div className="mb-7 glass-card rounded-[2rem] p-6 sm:p-8 border border-orange-200/60 dark:border-orange-400/10 bg-gradient-to-br from-orange-500/10 via-white/20 to-indigo-500/10 dark:from-orange-500/10 dark:via-white/[0.03] dark:to-indigo-500/10">
          <div className="max-w-2xl">
            <div className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Calendar Setup</div>
            {setupStep === 1 ? (
              <>
                <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Which nights do you have youth group?</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pick the nights you actually meet. The calendar will hide every other day.</p>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {weekLabels.map((day, index) => (
                    <button key={day} type="button" onClick={() => setSelectedNights(prev => prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index])} className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all ${selectedNights.includes(index) ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white/60 dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>{day}</button>
                  ))}
                </div>
                <button type="button" disabled={!selectedNights.length} onClick={() => setSetupStep(2)} className="mt-5 px-5 py-2.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-black text-sm font-bold disabled:opacity-40">Continue</button>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">Who meets on each night?</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This lets the calendar keep your Middle School and High School nights organized.</p>
                <div className="mt-5 space-y-2">
                  {[...selectedNights].sort((a,b) => a-b).map(day => (
                    <div key={day} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/55 dark:bg-white/5 border border-black/5 dark:border-white/10">
                      <span className="font-bold text-slate-800 dark:text-white">{weekLabels[day]}</span>
                      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-black/20">
                        {(['Middle School','High School'] as const).map(group => (
                          <button key={group} type="button" onClick={() => setNightGroups(prev => ({...prev, [day]: group}))} className={`px-3 py-2 rounded-lg text-xs font-bold ${(nightGroups[day] || 'Middle School') === group ? 'bg-orange-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>{group}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setSetupStep(1)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">Back</button>
                  <button type="button" onClick={finishCalendarSetup} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold">Save Calendar</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Game Calendar</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Plan your games once. Know what you’re playing all week.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={goToday} className="px-4 py-2.5 rounded-xl bg-white/75 dark:bg-white/5 border border-white/80 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm">Today</button>
          <div className="p-1 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 flex">
            <button onClick={() => setView('month')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'month' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500'}`}>Month</button>
            <button onClick={() => setView('week')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'week' ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500'}`}>Week</button>
          </div>
          <button onClick={() => openAdd(todayKey())} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 transition-transform">
            <Plus className="w-4 h-4" /> Schedule Game
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden border border-white/70 dark:border-white/10">
        <div className="px-4 sm:px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300" aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => navigate(1)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300" aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2"><div className="text-xs font-bold text-slate-400">{visibleEvents.length} scheduled</div><button onClick={openCalendarSetup} className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline">Edit nights</button></div>
        </div>

        {view === 'month' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/10">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].filter((_, index) => scheduledDaySet.has(index)).map(day => (
                  <div key={day} className="px-3 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">{day}</div>
                ))}
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, scheduledDaySet.size)}, minmax(0, 1fr))` }}>
                {visibleMonthDays.map((date, index) => {
                  const { month: currentMonth } = partsFromKey(anchorDate);
                  const isCurrentMonth = partsFromKey(date).month === currentMonth;
                  const isToday = date === todayKey();
                  const dayEvents = eventsForDate(date);
                  return (
                    <div key={date} className={`min-h-[128px] p-2 border-b border-r border-black/5 dark:border-white/10 ${isCurrentMonth ? 'bg-white/25 dark:bg-white/[0.015]' : 'bg-slate-50/40 dark:bg-black/10'}`}>
                      <button onClick={() => openAdd(date)} className="w-full flex items-center justify-between gap-2 text-left group">
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black ${isToday ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : isCurrentMonth ? 'text-slate-700 dark:text-slate-200 group-hover:bg-slate-100 dark:group-hover:bg-white/10' : 'text-slate-300 dark:text-slate-700'}`}>{partsFromKey(date).day}</span>
                        {dayEvents.length > 0 && <span className="text-[9px] font-bold text-slate-400">{dayEvents.length}</span>}
                      </button>
                      <div className="mt-1.5 space-y-1.5">
                        {dayEvents.slice(0, 4).map(event => {
                          const game = gameMap.get(event.gameId);
                          if (!game) return null;
                          return (
                            <div key={event.id} className="flex items-stretch gap-1 rounded-xl bg-gradient-to-r from-indigo-500/10 to-orange-500/10 dark:from-indigo-500/15 dark:to-orange-500/10 border border-indigo-200/60 dark:border-indigo-400/10 hover:border-indigo-400/50 transition-colors overflow-hidden">
                              <button onClick={() => onOpenGame(game)} className="min-w-0 flex-1 text-left px-2.5 py-2">
                                <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 truncate">{event.time ? formatTime(event.time) + ' · ' : ''}{game.title}</div>
                                <div className="text-[9px] text-slate-400 truncate">{game.duration}</div>
                              </button>
                              <button onClick={() => { if (confirm(`Remove ${game.title} from the calendar?`)) { playDelete(); onDeleteEvent(event.id); } }} className="px-2 text-slate-300 hover:text-red-500 hover:bg-red-500/5 transition-colors" aria-label={`Remove ${game.title} from calendar`}><Trash2 className="w-3 h-3" /></button>
                            </div>
                          );
                        })}
                        {dayEvents.length > 4 && (
                          <button onClick={() => { setView('week'); setAnchorDate(date); }} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 px-2">+{dayEvents.length - 4} more</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `repeat(${Math.max(1, scheduledDaySet.size)}, minmax(0, 1fr))` }}>
              {weekDays.map(date => {
                const dayEvents = eventsForDate(date);
                const isToday = date === todayKey();
                return (
                  <div key={date} className="min-h-[430px] border-r border-black/5 dark:border-white/10 last:border-r-0 bg-white/20 dark:bg-white/[0.015]">
                    <button onClick={() => openAdd(date)} className="w-full p-3 text-left border-b border-black/5 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5">
                      <div className="text-[10px] uppercase font-black tracking-wider text-slate-400">{keyToUtcDate(date).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })}</div>
                      <div className="text-[9px] font-bold text-orange-500">{scheduleForDay(keyToUtcDate(date).getUTCDay())?.targetGroup === 'Middle School' ? 'Middle School' : 'High School'}</div>
                      <div className={`mt-1 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${isToday ? 'bg-orange-500 text-white' : 'text-slate-800 dark:text-white'}`}>{partsFromKey(date).day}</div>
                    </button>
                    <div className="p-2 space-y-2">
                      {dayEvents.map(event => {
                        const game = gameMap.get(event.gameId);
                        if (!game) return null;
                        return (
                          <div key={event.id} className="group rounded-2xl p-3 bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 shadow-sm">
                            <button onClick={() => onOpenGame(game)} className="w-full text-left">
                              <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{formatTime(event.time)}</div>
                              <div className="mt-1 text-xs font-black text-slate-800 dark:text-white leading-snug">{game.title}</div>
                              <div className="mt-1 text-[10px] text-slate-400">{game.duration}</div>
                              {event.notes && <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{event.notes}</div>}
                            </button>
                            <button onClick={() => { if (confirm(`Remove ${game.title} from the calendar?`)) { playDelete(); onDeleteEvent(event.id); } }} className="mt-2 text-slate-300 hover:text-red-500 transition-colors" aria-label={`Remove ${game.title}`}><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        );
                      })}
                      <button onClick={() => setSupplyListDate(date)} className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black hover:bg-orange-500/20 transition-colors"><ClipboardList className="w-3.5 h-3.5" /> Supply List</button>
                      {dayEvents.length === 0 && <button onClick={() => openAdd(date)} className="w-full py-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-300 hover:text-orange-500 hover:border-orange-300 transition-colors"><Plus className="w-5 h-5 mx-auto" /></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {visibleEvents.length === 0 && (
        <div className="mt-5 glass-card rounded-[1.75rem] p-6 text-center border border-white/70 dark:border-white/10">
          <CalendarPlus className="w-8 h-8 mx-auto text-orange-500 mb-3" />
          <h3 className="font-black text-slate-900 dark:text-white">Your calendar is ready.</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Schedule your first game and you’ll never have to remember what you planned again.</p>
          <button onClick={() => openAdd(todayKey())} className="mt-4 px-5 py-2.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-black text-sm font-bold">Schedule your first game</button>
        </div>
      )}

      {supplyListDate && (
        <div className="fixed inset-0 z-[160] bg-slate-950/55 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400"><ClipboardList className="w-5 h-5" /></div><div><div className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Game Coordinator</div><h3 className="text-xl font-black text-slate-900 dark:text-white">Supply List</h3><p className="text-xs text-slate-400 mt-0.5">{shortDayLabel(supplyListDate)}</p></div></div>
              <button onClick={() => setSupplyListDate(null)} className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {supplyList.length ? <div className="space-y-2 max-h-[50vh] overflow-y-auto">{supplyList.map(item => <div key={item.name} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10"><span className="mt-0.5 text-slate-400">☐</span><div><div className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</div><div className="text-[10px] text-slate-400 mt-0.5">For: {item.games.join(', ')}</div></div></div>)}</div> : <div className="py-10 text-center"><ClipboardList className="w-9 h-9 mx-auto text-slate-300 mb-3" /><p className="font-bold text-slate-700 dark:text-slate-200">No supplies listed.</p><p className="text-sm text-slate-400 mt-1">Add materials to the games scheduled for this night.</p></div>}
              <div className="mt-5 flex justify-end gap-2"><button onClick={copySupplyList} disabled={!supplyList.length} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold disabled:opacity-40"><Copy className="w-4 h-4" /> Copy List</button><button onClick={() => window.print()} disabled={!supplyList.length} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold disabled:opacity-40"><Printer className="w-4 h-4" /> Print</button></div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-950/50 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">Schedule a game</div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{shortDayLabel(selectedDate)}</h3>
              </div>
              <button onClick={closeAdd} className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveEvent} className="p-6 space-y-5">
              {games.length === 0 ? (
                <div className="rounded-2xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-400/20 p-4 text-sm text-orange-700 dark:text-orange-300">
                  Create a game first, then you can schedule it here.
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Game</label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input value={gameSearch} onChange={e => setGameSearch(e.target.value)} placeholder="Search games..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm dark:text-white focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                    <div className="mt-2 max-h-44 overflow-y-auto space-y-1.5">
                      {filteredGames.slice(0, 12).map(game => (
                        <button key={game.id} type="button" onClick={() => { setSelectedGameId(game.id); playClick(); }} className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all ${selectedGameId === game.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/50 dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-orange-300'}`}>
                          <div className="text-sm font-bold truncate">{game.title}</div>
                          <div className={`text-[10px] mt-0.5 ${selectedGameId === game.id ? 'text-orange-100' : 'text-slate-400'}`}>{game.duration} · {game.minPlayers} players minimum</div>
                        </button>
                      ))}
                      {filteredGames.length === 0 && <div className="text-sm text-slate-400 py-4 text-center">No games found.</div>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Date</label>
                      <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="mt-2 w-full px-3 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm dark:text-white" />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-slate-400">Time <span className="font-normal normal-case">(optional)</span></label>
                      <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="mt-2 w-full px-3 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><StickyNote className="w-3.5 h-3.5" /> Notes <span className="font-normal normal-case">(optional)</span></label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Bring water balloons, split into 4 teams..." className="mt-2 w-full h-20 px-3 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border-none resize-none text-sm dark:text-white" />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={closeAdd} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">Cancel</button>
                <button type="submit" disabled={!selectedGameId || games.length === 0} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed">Schedule Game</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default GameCalendar;
