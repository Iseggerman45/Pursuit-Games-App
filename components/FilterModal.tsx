
import React from 'react';
import { X, Filter, Check } from 'lucide-react';
import { TagIcon } from './TagIcon';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClear: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ 
    isOpen, onClose, allTags, selectedTags, onToggleTag, onClear 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/50 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                    <Filter className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1D1D1F]">Filter Games</h3>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
             </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">By Tag</h4>
            <div className="flex flex-wrap gap-2">
                {allTags.length === 0 ? (
                    <span className="text-sm text-slate-400 italic">No tags available. Add some in settings!</span>
                ) : (
                    allTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => onToggleTag(tag)}
                                className={`
                                    px-3 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2
                                    ${isSelected 
                                        ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                                    }
                                `}
                            >
                                {isSelected ? <Check className="w-3.5 h-3.5" /> : <TagIcon tag={tag} className="w-3.5 h-3.5 opacity-60" />}
                                {tag}
                            </button>
                        );
                    })
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/50 bg-white/30 flex gap-3">
            <button 
                onClick={onClear}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-black/5 rounded-xl transition-colors"
            >
                Clear All
            </button>
            <button 
                onClick={onClose}
                className="flex-1 py-3 bg-[#1D1D1F] text-white rounded-xl text-sm font-bold shadow-lg shadow-black/5 hover:bg-black transition-all active:scale-95"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
