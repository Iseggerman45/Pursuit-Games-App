
import React from 'react';
import { Sparkles, X, Rocket, Check } from 'lucide-react';
import { playClick } from '../services/sound';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
  notes: string;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose, version, notes }) => {
  if (!isOpen) return null;

  const handleClose = () => {
      playClick();
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={handleClose}
      />
      
      <div className="relative bg-white dark:bg-[#1D1D1F] rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-white/20 ring-1 ring-white/10">
        
        {/* Decorative Header Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-orange-400 to-red-600 opacity-20 dark:opacity-30" />
        
        <div className="relative p-8 flex flex-col items-center text-center">
            
            {/* Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-lg shadow-orange-500/30 flex items-center justify-center mb-6 rotate-3 animate-[pulse_3s_ease-in-out_infinite]">
                <Rocket className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-black text-[#1D1D1F] dark:text-white mb-1">
                Update Received!
            </h2>
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-6">
                Version {version}
            </p>

            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 w-full border border-slate-100 dark:border-white/5 mb-6 text-left">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    What's New
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {notes}
                </div>
            </div>

            <button
                onClick={handleClose}
                className="w-full py-4 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <Check className="w-5 h-5" />
                Awesome, Let's Go!
            </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;
