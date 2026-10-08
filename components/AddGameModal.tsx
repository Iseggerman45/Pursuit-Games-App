import React, { useEffect, useRef, useState } from 'react';
import { X, Users, Clock, FileText, BookOpen, Sword, FlagTriangleRight, GraduationCap, UserCircle, Tag, Save, Box } from 'lucide-react';
import { TargetGroup, UserProfile } from '../types';
import { playClick } from '../services/sound';
import { TagIcon } from './TagIcon';

export interface ManualGameInput {
  title: string;
  setup: string;
  gameplay: string;
  howToWin: string;
  hasWinner: boolean;
  materials: string;
  duration: string;
  minPlayers: string;
  targetGroup: TargetGroup | 'Both';
  manualTags: string[];
}

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (game: ManualGameInput) => Promise<void> | void;
  isLoading: boolean;
  categories: string[];
  allTags: string[];
  user: UserProfile | null;
}

const fieldClass = 'w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300';
const sectionLabelClass = 'text-sm font-semibold text-slate-800 mb-2.5 flex items-center gap-2';

const RuleFormattingToolbar: React.FC<{ onInsert: (prefix: string) => void }> = ({ onInsert }) => (
  <div className="flex flex-wrap items-center gap-1.5 mb-2" aria-label="Rule formatting">
    <span className="text-[11px] text-slate-500 mr-1">Add formatting:</span>
    <button type="button" onClick={() => onInsert('- ')} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700">• Bullet</button>
    <button type="button" onClick={() => onInsert('1. ')} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700">1. Number</button>
    <button type="button" onClick={() => onInsert('  - ')} className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700">↳ Sub-point</button>
  </div>
);

const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose, onCreate, isLoading, allTags, user }) => {
  const [title, setTitle] = useState('');
  const [setup, setSetup] = useState('');
  const [gameplay, setGameplay] = useState('');
  const [howToWin, setHowToWin] = useState('');
  const [hasWinner, setHasWinner] = useState(true);
  const [supplies, setSupplies] = useState<string[]>([]);
  const [supplyInput, setSupplyInput] = useState('');
  const [minPlayers, setMinPlayers] = useState('2+');
  const [duration, setDuration] = useState('15 minutes');
  const [targetGroup, setTargetGroup] = useState<TargetGroup | 'Both'>('Both');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const setupRef = useRef<HTMLTextAreaElement>(null);
  const gameplayRef = useRef<HTMLTextAreaElement>(null);
  const howToWinRef = useRef<HTMLTextAreaElement>(null);

  const insertRulePrefix = (setter: React.Dispatch<React.SetStateAction<string>>, value: string, textareaRef: { current: HTMLTextAreaElement | null }, prefix: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const lineBreak = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const insertion = `${lineBreak}${prefix}`;
    setter(`${before}${insertion}${after}`);
    window.setTimeout(() => {
      if (!textarea) return;
      textarea.focus();
      const cursor = before.length + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  };

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSetup('');
      setGameplay('');
      setHowToWin('');
      setHasWinner(true);
      setSupplies([]);
      setSupplyInput('');
      setMinPlayers('2+');
      setDuration('15 minutes');
      setTargetGroup('Both');
      setSelectedTags([]);
      setFormError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !setup.trim() || !gameplay.trim() || (hasWinner && !howToWin.trim())) {
      setFormError(hasWinner
        ? 'Please fill in the game name, setup, gameplay, and how to win before saving.'
        : 'Please fill in the game name, setup, and gameplay before saving.');
      return;
    }
    setFormError(null);
    try {
      await onCreate({
        title: title.trim(),
        setup: setup.trim(),
        gameplay: gameplay.trim(),
        howToWin: hasWinner ? howToWin.trim() : '',
        hasWinner,
        materials: supplies.length ? supplies.map(item => `• ${item}`).join('\n') : 'None required',
        duration: duration.trim() || 'Not specified',
        minPlayers: minPlayers.trim() || '2+',
        targetGroup,
        manualTags: selectedTags,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save this game. Please try again.');
    }
  };

  const toggleTag = (tag: string) => {
    playClick();
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-white/60">
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/70">
          <div>
            <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2"><BookOpen className="w-5 h-5 text-orange-600" /> Add Game Manually</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold ${user?.color || 'bg-slate-400'}`}>
                {user?.emoji || (user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-3 h-3" />)}
              </div>
              <p className="text-xs text-slate-500">Posting as <span className="font-semibold">{user?.name || 'Guest'}</span></p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-2 bg-black/5 hover:bg-black/10 rounded-full text-slate-600 disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="manual-game-form" onSubmit={handleSubmit} className="space-y-6">
            {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>}
            <div>
              <label className={sectionLabelClass}><FileText className="w-4 h-4 text-orange-600" /> Game Name *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={fieldClass} placeholder="e.g. Sharks and Minnows" disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={sectionLabelClass}><GraduationCap className="w-4 h-4 text-orange-600" /> School Level</label>
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
                  {(['Middle School', 'High School', 'College', 'Both'] as (TargetGroup | 'Both')[]).map(group => (
                    <button key={group} type="button" onClick={() => { playClick(); setTargetGroup(group); }} className={`flex-1 py-2 px-2 text-xs font-semibold rounded-xl ${targetGroup === group ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>{group}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={sectionLabelClass}><Users className="w-4 h-4 text-orange-600" /> Minimum Players</label>
                <input value={minPlayers} onChange={e => setMinPlayers(e.target.value)} className={fieldClass} placeholder="e.g. 8" disabled={isLoading} />
              </div>
              <div>
                <label className={sectionLabelClass}><Clock className="w-4 h-4 text-orange-600" /> Duration</label>
                <input value={duration} onChange={e => setDuration(e.target.value)} className={fieldClass} placeholder="e.g. 10–15 minutes" disabled={isLoading} />
              </div>
              <div>
                <label className={sectionLabelClass}><Box className="w-4 h-4 text-orange-600" /> Materials / Supplies</label>
                <input
                  value={supplyInput}
                  onChange={e => setSupplyInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const item = supplyInput.trim();
                      if (item && !isLoading) {
                        setSupplies(prev => [...prev, item]);
                        setSupplyInput('');
                      }
                    }
                  }}
                  className={fieldClass}
                  placeholder="Type a supply and press Enter (e.g. 4 cones)"
                  disabled={isLoading}
                  aria-label="Add a supply"
                />
                {supplies.length > 0 && (
                  <ul className="mt-2 space-y-1.5" aria-label="Supplies added">
                    {supplies.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-700">
                        <span>• {item}</span>
                        <button type="button" onClick={() => setSupplies(prev => prev.filter((_, i) => i !== index))} disabled={isLoading} className="text-slate-400 hover:text-red-600 px-1" aria-label={`Remove ${item}`}>×</button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-xs text-slate-500">Press Enter after each item to add another.</p>
              </div>
            </div>

            <div>
              <label className={sectionLabelClass}><Tag className="w-4 h-4 text-orange-600" /> Tags</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => {
                  const active = selectedTags.includes(tag);
                  return <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 ${active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'}`}><TagIcon tag={tag} className={`w-3 h-3 ${active ? 'opacity-100' : 'opacity-60'}`} />{tag}</button>;
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div>
                <label className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-2"><BookOpen className="w-3.5 h-3.5" /> 1. Setup *</label>
                <RuleFormattingToolbar onInsert={(prefix) => insertRulePrefix(setSetup, setup, setupRef, prefix)} />
                <textarea value={setup} onChange={e => setSetup(e.target.value)} ref={setupRef} className={`${fieldClass} min-h-28 resize-y`} placeholder="Where to play, what to prepare, how to split teams, and starting positions..." disabled={isLoading} />
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2 mb-2"><Sword className="w-3.5 h-3.5" /> 2. Gameplay / How to Play *</label>
                <RuleFormattingToolbar onInsert={(prefix) => insertRulePrefix(setGameplay, gameplay, gameplayRef, prefix)} />
                <textarea value={gameplay} onChange={e => setGameplay(e.target.value)} ref={gameplayRef} className={`${fieldClass} min-h-40 resize-y`} placeholder="Write the rules in order, including what players do and what leaders should watch for..." disabled={isLoading} />
              </div>
              <div>
                <label className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-2 mb-2"><FlagTriangleRight className="w-3.5 h-3.5" /> {hasWinner ? "3. How to Win *" : "3. Just for Fun"}</label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setHasWinner(true)} className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${hasWinner ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-200 text-slate-500'}`}>Has a winner</button>
                  <button type="button" onClick={() => setHasWinner(false)} className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${!hasWinner ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 text-slate-500'}`}>Just for fun — no winner</button>
                </div>
                {hasWinner && (
                  <>
                    <RuleFormattingToolbar onInsert={(prefix) => insertRulePrefix(setHowToWin, howToWin, howToWinRef, prefix)} />
                    <textarea value={howToWin} onChange={e => setHowToWin(e.target.value)} ref={howToWinRef} className={`${fieldClass} min-h-24 resize-y`} placeholder="Explain the win condition and how ties are handled..." disabled={isLoading} />
                  </>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-black/5 bg-white/70 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-black/5 rounded-full">Cancel</button>
          <button type="button" onClick={(e) => { e.preventDefault(); void handleSubmit(e as unknown as React.FormEvent); }} disabled={isLoading} className="px-7 py-3 bg-[#1D1D1F] hover:bg-black text-white text-sm font-semibold rounded-full shadow-lg flex items-center gap-2 disabled:opacity-60"><Save className="w-4 h-4 text-orange-300" /> Save Game</button>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
