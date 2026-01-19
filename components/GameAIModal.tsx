
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Sparkles, Wand2, Copy, Check, Save, RotateCw, List, RefreshCw, MessageSquare, Bold } from 'lucide-react';
import { Game } from '../types';
import { improveGameText, generateGameContent } from '../services/gemini';
import { playClick, playSuccess } from '../services/sound';

interface GameAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  onUpdateRules: (gameId: string, newRules: string) => void;
}

const GameAIModal: React.FC<GameAIModalProps> = ({ isOpen, onClose, game, onUpdateRules }) => {
  const [activeTab, setActiveTab] = useState<'polish' | 'generate'>('polish');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Polish State
  const [polishInstruction, setPolishInstruction] = useState('Make it funnier and more hype');
  
  // Generate State
  const [generatePrompt, setGeneratePrompt] = useState('');

  if (!isOpen || !game) return null;

  const handlePolish = async () => {
    setIsLoading(true);
    try {
        const improved = await improveGameText(game.rules, polishInstruction);
        setResult(improved);
        playSuccess();
    } catch (e) {
        setResult("Error generating content. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;
    setIsLoading(true);
    try {
        const content = await generateGameContent(game.title, generatePrompt);
        setResult(content);
        playSuccess();
    } catch (e) {
        setResult("Error generating content. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveRules = () => {
      if (activeTab === 'polish' && result) {
          onUpdateRules(game.id, result);
          onClose();
          playSuccess();
      }
  };

  const handleCopy = async () => {
      if (result) {
          await navigator.clipboard.writeText(result);
          setCopySuccess(true);
          playClick();
          setTimeout(() => setCopySuccess(false), 2000);
      }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 border border-white/50 ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-black/5 bg-white/50 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-[#1D1D1F] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    AI Assistant
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">For "{game.title}"</p>
            </div>
            <button onClick={onClose} className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors">
                <X className="w-5 h-5 text-slate-600" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 mx-6 mt-4 bg-slate-100 rounded-2xl gap-1">
             <button
                onClick={() => { playClick(); setActiveTab('polish'); setResult(''); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'polish' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Wand2 className="w-4 h-4" />
                Refine Rules
            </button>
            <button
                onClick={() => { playClick(); setActiveTab('generate'); setResult(''); }}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <List className="w-4 h-4" />
                Generate Content
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
            
            {/* INPUT SECTION */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-6">
                {activeTab === 'polish' ? (
                    <div className="space-y-3">
                         <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">How should we change the rules?</label>
                         <div className="flex flex-wrap gap-2 mb-2">
                            {['Format with Bold & Lists', 'Make it funnier', 'Simplify for Middle Schoolers', 'Make it concise'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => setPolishInstruction(opt)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${polishInstruction === opt ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {opt === 'Format with Bold & Lists' && <Bold className="w-3 h-3 inline mr-1" />}
                                    {opt}
                                </button>
                            ))}
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="text"
                                value={polishInstruction}
                                onChange={(e) => setPolishInstruction(e.target.value)}
                                className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="e.g. Add a twist involving water balloons..."
                             />
                             <button 
                                onClick={handlePolish}
                                disabled={isLoading}
                                className="bg-[#1D1D1F] text-white px-5 rounded-xl font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                             >
                                {isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Go'}
                             </button>
                         </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">What do you need for this game?</label>
                         <div className="flex flex-wrap gap-2 mb-2">
                            {['10 Charades words', 'Tournament Bracket for 8 teams', '5 Trivia Questions', 'Score Sheet Template', 'A Variation for Indoors'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => setGeneratePrompt(opt)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${generatePrompt === opt ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="text"
                                value={generatePrompt}
                                onChange={(e) => setGeneratePrompt(e.target.value)}
                                className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="e.g. List of 20 challenging words..."
                             />
                             <button 
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="bg-[#1D1D1F] text-white px-5 rounded-xl font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                             >
                                {isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : 'Go'}
                             </button>
                         </div>
                    </div>
                )}
            </div>

            {/* OUTPUT SECTION */}
            {result && (
                <div className="animate-in slide-in-from-bottom-2 fade-in">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {activeTab === 'polish' ? 'New Description' : 'Generated Content'}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleCopy}
                                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg"
                            >
                                {copySuccess ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                {copySuccess ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-slate-700 text-sm leading-relaxed overflow-x-auto">
                        <div className="prose prose-sm max-w-none prose-p:text-slate-700 prose-headings:text-slate-800 prose-strong:text-slate-900 prose-strong:font-black prose-ul:list-disc prose-ul:pl-4">
                            <ReactMarkdown>{result}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        {activeTab === 'polish' && result && (
            <div className="p-6 border-t border-black/5 bg-white/50">
                <button
                    onClick={handleSaveRules}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Save New Rules to Game
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default GameAIModal;
