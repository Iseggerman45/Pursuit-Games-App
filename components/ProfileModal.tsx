
import React, { useState, useEffect } from 'react';
import { X, UserCircle, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { playClick } from '../services/sound';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  initialUser: UserProfile | null;
}

const AVATAR_COLORS = [
    'bg-slate-500',
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
];

const EMOJIS = [
    // Happy / Smileys
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', 
    '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑',
    // Hands / Gestures
    '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', 
    // Sad / Negative
    '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯',
    '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰',
    '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿',
    '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
    // Animals
    '🐵', '🐶', '🐺', '🦊', '🦝', '🐱', '🦁', '🐯', '🐴', '🦄', '🦓', '🐮', '🐷', '🐗', '🐭', '🐹', '🐰',
    '🐻', '🐨', '🐼', '🦥', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐸', '🐢', '🦎', '🐍', '🐲',
    '🦕', '🦖', '🐳', '🐬', '🐟', '🐙', '🦑', '🦈', '🦀', '🦞', '🦋', '🐝', '🐞',
    // Misc
    '🔥', '⚡️', '✨', '🌈', '☀️', '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', 
    '🍞', '🥐', '🥨', '🥯', '🥖', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🥫', '🍖', '🍗', '🥩', '🍠', '🥟', 
    '⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🎱', '🥏', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', 
    '⛳️', '🏹', '🎣', '🤿', '🥊', '🥋', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼',
    '🎮', '🚀', '💎', '💡', '🎉', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🔮', '🧿', '🧸', '🪅'
];

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, initialUser }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (initialUser) {
            setName(initialUser.name);
            setColor(initialUser.color);
            setEmoji(initialUser.emoji || '');
        } else {
            // Pick random color on new signup
            setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
            setEmoji('😎');
        }
    }
  }, [isOpen, initialUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
        onSave({
            id: initialUser?.id || crypto.randomUUID(),
            name: name.trim(),
            color,
            emoji
        });
        // Saving a profile should also finish/close the form, both for first-time setup and edits.
        onClose();
    }
  };

  const isDismissible = !!initialUser;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Force blocking background if first time, otherwise clickable */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => { if (isDismissible) onClose(); }}
      />
      
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5 flex flex-col max-h-[calc(100dvh-2rem)]">
        
        {isDismissible && (
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-slate-500 z-10"
            >
                <X className="w-5 h-5" />
            </button>
        )}

        <div className="p-6 sm:p-8 flex flex-col items-center text-center overflow-y-auto">
            
            <div className={`flex-shrink-0 w-24 h-24 rounded-full ${color} shadow-lg mb-6 flex items-center justify-center text-white text-4xl font-bold transition-colors duration-300 ring-4 ring-white`}>
                {emoji ? emoji : (name ? name.charAt(0).toUpperCase() : <UserCircle className="w-12 h-12" />)}
            </div>

            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-1">
                {initialUser ? 'Update Profile' : 'Welcome to Pursuit'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
                {initialUser ? 'Change how you appear to the team.' : 'Enter your name so the team knows who added which game!'}
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                
                {/* Name Input */}
                <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Display Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Kat, Sarah, Mike"
                        className="w-full p-4 bg-white border-none rounded-2xl text-lg text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-center font-bold"
                        autoFocus={!initialUser}
                    />
                </div>

                {/* Emoji Picker */}
                    <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Select Avatar</label>
                    <div className="bg-white/50 rounded-2xl p-3 border border-white/50 h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => { playClick(); setEmoji(''); }}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold border transition-all ${!emoji ? 'bg-white border-slate-300 shadow-sm ring-2 ring-orange-200' : 'border-transparent opacity-50 hover:opacity-100 hover:bg-white/50'}`}
                                title="Use Initials"
                            >
                                ABC
                            </button>
                            {EMOJIS.map(e => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => { playClick(); setEmoji(e); }}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-2xl transition-all ${emoji === e ? 'bg-white shadow-md scale-110 ring-2 ring-orange-200' : 'opacity-70 hover:opacity-100 hover:scale-110 hover:bg-white/50'}`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Background Color</label>
                    <div className="flex justify-center gap-3 flex-wrap bg-white/50 p-3 rounded-2xl border border-white/50">
                        {AVATAR_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => { playClick(); setColor(c); }}
                                className={`w-8 h-8 rounded-full ${c} transition-transform hover:scale-110 shadow-sm ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110 shadow-md' : ''}`}
                            />
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="w-full py-4 bg-[#1D1D1F] text-white rounded-2xl font-bold text-lg shadow-lg shadow-black/5 hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" />
                    {initialUser ? 'Save Changes' : "Let's Go!"}
                </button>
            </form>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
