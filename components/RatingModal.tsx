
import React, { useState, useEffect } from 'react';
import { X, Star, Users, RotateCcw, Check, ThumbsUp } from 'lucide-react';
import { Game } from '../types';
import { playClick, playDelete } from '../services/sound';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, rating: number) => void;
  game: Game | null;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSave, game }) => {
  const [votes, setVotes] = useState<number[]>([]);

  // Reset votes when modal opens
  useEffect(() => {
    if (isOpen) {
      setVotes([]);
    }
  }, [isOpen]);

  if (!isOpen || !game) return null;

  const handleVote = (rating: number) => {
    playClick();
    setVotes(prev => [...prev, rating]);
  };

  const handleUndo = () => {
    playDelete();
    setVotes(prev => prev.slice(0, -1));
  };

  const calculateAverage = () => {
    if (votes.length === 0) return 0;
    const sum = votes.reduce((a, b) => a + b, 0);
    return sum / votes.length;
  };

  const average = calculateAverage();
  // Display purposes only - we send full precision to parent
  const roundedAverage = Math.round(average); 

  const handleSave = () => {
    if (votes.length > 0) {
        // Send exact average (e.g. 4.3333) so long-term average is more precise
        onSave(game.id, average);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white/50">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-[#1D1D1F] leading-tight">Rate "{game.title}"</h2>
                    <p className="text-sm text-slate-500 mt-1">Tap numbers as students hold up fingers</p>
                </div>
                <button onClick={onClose} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                    <X className="w-5 h-5 text-slate-600" />
                </button>
            </div>
        </div>

        {/* Stats Display */}
        <div className="p-6 bg-slate-50/50 flex items-center justify-between border-b border-white/50">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-[#1D1D1F] leading-none">{votes.length}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Votes</div>
                </div>
            </div>

            <div className="h-10 w-px bg-slate-200 mx-4"></div>

            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-100 text-yellow-600 rounded-xl">
                    <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <div className="text-2xl font-bold text-[#1D1D1F] leading-none">
                        {votes.length > 0 ? average.toFixed(1) : '-'}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average</div>
                </div>
            </div>
        </div>

        {/* Voting Buttons */}
        <div className="p-6 grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((num) => (
                <button
                    key={num}
                    onClick={() => handleVote(num)}
                    className="aspect-square rounded-2xl bg-white border border-slate-200 shadow-[0_4px_0_rgb(0,0,0,0.05)] hover:shadow-[0_2px_0_rgb(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition-all flex flex-col items-center justify-center gap-1 group"
                >
                    <span className="text-2xl font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{num}</span>
                    <Star className={`w-3 h-3 ${num <= 2 ? 'text-slate-300' : 'text-yellow-400 fill-current'}`} />
                </button>
            ))}
        </div>

        {/* Recent History / Undo */}
        <div className="flex-1 bg-slate-100/50 p-4 mx-6 rounded-2xl border border-white/50 shadow-inner flex flex-col items-center justify-center min-h-[80px]">
            {votes.length > 0 ? (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium">Last vote:</span>
                    <span className="text-lg font-bold text-[#1D1D1F] bg-white px-3 py-1 rounded-lg shadow-sm">{votes[votes.length - 1]}</span>
                    <button 
                        onClick={handleUndo}
                        className="ml-2 p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Undo last vote"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <span className="text-sm text-slate-400 italic">Waiting for inputs...</span>
            )}
        </div>

        {/* Footer */}
        <div className="p-6">
            <button
                onClick={handleSave}
                disabled={votes.length === 0}
                className="w-full py-4 bg-[#1D1D1F] text-white rounded-2xl font-bold text-lg shadow-lg shadow-black/5 hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <ThumbsUp className="w-5 h-5" />
                {votes.length === 0 ? 'No Votes Yet' : `Save Rating (${average.toFixed(1)})`}
            </button>
        </div>

      </div>
    </div>
  );
};

export default RatingModal;
