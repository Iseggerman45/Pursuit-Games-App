
import React, { useState } from 'react';

const FOLDER_ICON_OPTIONS = [
  ['folder','Folder',Folder], ['team','Team',Users], ['energy','High Energy',Zap], ['trophy','Competition',Trophy], ['game','Games',Gamepad2], ['fitness','Active',Dumbbell], ['music','Music',Music], ['drama','Drama',Drama], ['winter','Winter',Snowflake], ['fire','Fire',Flame], ['target','Target',Target], ['battle','Battle',Swords], ['flag','Flag',Flag], ['timer','Timed',Timer], ['heart','Team Spirit',Heart], ['star','Star',Star], ['sparkle','Special',Sparkles], ['ghost','Spooky',Ghost], ['racing','Race',Car], ['dice','Dice',Dices], ['volleyball','Ball',Volleyball], ['brain','Brain',Brain], ['puzzle','Puzzle',Puzzle], ['active','Action',PersonStanding], ['water','Water',Waves], ['mountain','Outdoor',Mountain], ['camp','Camp',Tent], ['party','Party',PartyPopper], ['school','School',GraduationCap], ['crown','Leaders',Crown], ['ball','Ball',CircleDot], ['chair','Chair',Armchair]
] as const;
import { X, FolderPlus, ArrowRight, Folder, Users, Zap, Trophy, Gamepad2, Dumbbell, Music, Drama, Snowflake, Flame, Target, Swords, Flag, Timer, Heart, Star, Sparkles, Ghost, Car, Dices, Volleyball, Brain, Puzzle, PersonStanding, Waves, Mountain, Tent, PartyPopper, GraduationCap, Crown, CircleDot, Armchair } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, icon: string) => void;
  movingGameTitle?: string;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate, movingGameTitle }) => {
  const [folderName, setFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim(), selectedIcon);
      setFolderName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl text-white ${movingGameTitle ? 'bg-indigo-500' : 'bg-orange-100 text-orange-600'}`}>
                    <FolderPlus className={`w-5 h-5 ${movingGameTitle ? 'text-white' : 'text-orange-600'}`} />
                </div>
                <div>
                    <h3 className="font-bold text-[#1D1D1F] dark:text-white">{movingGameTitle ? 'Move to New Folder' : 'New Folder'}</h3>
                    {movingGameTitle && (
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                            Moving <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{movingGameTitle}</span>
                        </p>
                    )}
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder Name (e.g. Musical Games)"
              className="w-full p-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-sm"
            />
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose a game type</label>
              <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto pr-1">
                {FOLDER_ICON_OPTIONS.map(([id, label, Icon]) => (
                  <button key={id} type="button" onClick={() => setSelectedIcon(id)} title={label} className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${selectedIcon === id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-500 border-transparent hover:border-indigo-200 hover:text-indigo-600'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[8px] font-bold truncate w-full px-1">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                  ${movingGameTitle ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#1D1D1F] dark:bg-white dark:text-black hover:bg-black'}
              `}
            >
              {movingGameTitle ? (
                  <>Create & Move <ArrowRight className="w-4 h-4" /></>
              ) : (
                  'Create Folder'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateFolderModal;
