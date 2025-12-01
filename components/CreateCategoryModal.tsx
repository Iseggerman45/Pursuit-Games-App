
import React, { useState } from 'react';
import { X, Plus, FolderPlus, Trash2, Folder } from 'lucide-react';
import { playClick } from '../services/sound';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  onDelete: (name: string) => void;
  categories: string[];
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ isOpen, onClose, onCreate, onDelete, categories }) => {
  const [categoryName, setCategoryName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      onCreate(categoryName.trim());
      setCategoryName('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/50">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                    <FolderPlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#1D1D1F]">Manage Categories</h3>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="New Category..."
              className="flex-1 p-3 bg-white border-none rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-inner text-sm"
            />
            <button
              type="submit"
              disabled={!categoryName.trim()}
              className="p-3 bg-[#1D1D1F] hover:bg-black text-white rounded-xl shadow-lg shadow-black/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
            {categories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                    No categories yet.
                </div>
            ) : (
                categories.map((cat) => (
                    <div key={cat} className="group flex items-center justify-between p-3 bg-white/50 border border-white/60 rounded-xl hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                            <Folder className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-700 text-sm">{cat}</span>
                        </div>
                        <button
                            onClick={() => onDelete(cat)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Category"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;
