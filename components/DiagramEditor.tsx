
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Trash2, Camera, Wand2, Info, Undo2, Type as TypeIcon, X, Maximize2, Minimize2, CloudDownload } from 'lucide-react';
import { playClick, playPop, playSuccess } from '../services/sound';
import { generateGameDiagram } from '../services/gemini';
import { fetchGameDiagram } from '../services/firebase';
import { DiagramObject } from '../types';

interface DiagramEditorProps {
    initialImageUrl?: string;
    initialAnnotations?: string; 
    onSave: (url: string, annotations: string) => void;
    readOnly?: boolean;
    className?: string;
    gameTitle?: string;
    gameId?: string;
    libraryId?: string;
    hasCloudAsset?: boolean;
}

const compressImage = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            const scale = Math.min(1, MAX_WIDTH / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(base64);
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            resolve(compressed);
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
    });
};

const DiagramEditor: React.FC<DiagramEditorProps> = ({ 
    initialImageUrl, 
    initialAnnotations, 
    onSave, 
    readOnly = false, 
    className = "", 
    gameTitle,
    gameId,
    libraryId,
    hasCloudAsset
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
    const [annotations, setAnnotations] = useState<DiagramObject[]>(() => {
        try { return initialAnnotations ? JSON.parse(initialAnnotations) : []; } catch (e) { return []; }
    });
    
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [history, setHistory] = useState<{url: string | null, ann: DiagramObject[]}[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Asset lazy-load: If we don't have the image but cloud says it exists, fetch it
    useEffect(() => {
        if (!imageUrl && hasCloudAsset && gameId && libraryId) {
            const fetchAsset = async () => {
                setIsFetching(true);
                const cloudUrl = await fetchGameDiagram(libraryId, gameId);
                if (cloudUrl) {
                    setImageUrl(cloudUrl);
                    // Sync back to local state so we don't fetch again
                    onSave(cloudUrl, JSON.stringify(annotations));
                }
                setIsFetching(false);
            };
            fetchAsset();
        }
    }, [gameId, libraryId, hasCloudAsset]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    const pushToHistory = () => {
        setHistory(prev => [...prev.slice(-19), { url: imageUrl, ann: [...annotations.map(a => ({...a}))] }]);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        playClick();
        const last = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));
        setImageUrl(last.url);
        setAnnotations(last.ann);
        onSave(last.url || '', JSON.stringify(last.ann));
    };

    const handleGenerate = async (isRefining: boolean = false) => {
        const targetPrompt = prompt.trim() || `Technical schematic for ${gameTitle || 'a youth group game'}`;
        setIsGenerating(true);
        setError(null);
        playClick();

        try {
            const result = await generateGameDiagram(targetPrompt, isRefining ? (imageUrl || undefined) : undefined);
            if (result) {
                const compressed = await compressImage(result);
                pushToHistory();
                setImageUrl(compressed);
                onSave(compressed, JSON.stringify(annotations));
                setPrompt('');
                playSuccess();
            } else {
                setError("Failed to draw.");
            }
        } catch (e) {
            setError("Connection failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddText = () => {
        playClick();
        pushToHistory();
        const newLabel: DiagramObject = { id: crypto.randomUUID(), type: 'label', x: 50, y: 50, rotation: 0, scale: 1, color: '#000000', label: 'NEW LABEL' };
        const updated = [...annotations, newLabel];
        setAnnotations(updated);
        onSave(imageUrl || '', JSON.stringify(updated));
    };

    const handleUpdateLabel = (id: string, text: string) => {
        const updated = annotations.map(a => a.id === id ? { ...a, label: text } : a);
        setAnnotations(updated);
        onSave(imageUrl || '', JSON.stringify(updated));
    };

    const handleRemoveLabel = (id: string) => {
        playPop();
        pushToHistory();
        const updated = annotations.filter(a => a.id !== id);
        setAnnotations(updated);
        onSave(imageUrl || '', JSON.stringify(updated));
    };

    const handleClear = () => {
        if (confirm("Delete diagram?")) {
            pushToHistory();
            setImageUrl(null);
            setAnnotations([]);
            onSave('', '[]');
            playPop();
        }
    };

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        if (readOnly) return;
        e.stopPropagation();
        setDraggingId(id);
        const obj = annotations.find(a => a.id === id);
        if (obj && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const currentX = (obj.x / 100) * rect.width;
            const currentY = (obj.y / 100) * rect.height;
            setDragOffset({ x: e.clientX - currentX, y: e.clientY - currentY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingId || !containerRef.current || readOnly) return;
        const rect = containerRef.current.getBoundingClientRect();
        let newX = Math.max(2, Math.min(98, ((e.clientX - dragOffset.x) / rect.width) * 100));
        let newY = Math.max(2, Math.min(98, ((e.clientY - dragOffset.y) / rect.height) * 100));
        setAnnotations(prev => prev.map(a => a.id === draggingId ? { ...a, x: newX, y: newY } : a));
    };

    const handleMouseUp = () => {
        if (draggingId) {
            setDraggingId(null);
            onSave(imageUrl || '', JSON.stringify(annotations));
        }
    };

    return (
        <div 
            className={`flex flex-col bg-white dark:bg-[#1D1D1F] overflow-hidden select-none transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100]' : 'flex-1 min-h-0'} ${className}`}
            onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
        >
            {!readOnly && (
                <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex gap-2 flex-shrink-0">
                    <div className="relative flex-1">
                        <Sparkles className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isGenerating ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
                        <input
                            type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate(!!imageUrl)}
                            placeholder={imageUrl ? "Describe changes..." : "Describe setup..."}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                            disabled={isGenerating || isFetching}
                        />
                    </div>
                    <button onClick={handleAddText} disabled={isGenerating || isFetching || !imageUrl} className="px-4 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50"><TypeIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleGenerate(!!imageUrl)} disabled={isGenerating || isFetching || (!prompt.trim() && !imageUrl)} className={`px-5 rounded-2xl font-bold text-sm shadow-md flex items-center gap-2 ${imageUrl ? 'bg-indigo-600 text-white' : 'bg-[#1D1D1F] dark:bg-white text-white dark:text-black'}`}>
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : (imageUrl ? <><Wand2 className="w-4 h-4" /> Refine</> : <><Camera className="w-4 h-4" /> Draw</>)}
                    </button>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="px-4 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-700 dark:text-slate-300">{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
                </div>
            )}

            <div ref={containerRef} className={`relative flex-1 bg-[#F8FAFC] dark:bg-neutral-900 flex items-center justify-center min-h-0 ${isFullscreen ? 'p-12' : 'p-4'}`}>
                {imageUrl ? (
                    <div className="relative group w-full h-full max-w-full max-h-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5 overflow-hidden flex items-center justify-center">
                        <img src={imageUrl} alt="Diagram" className={`max-w-full max-h-full object-contain pointer-events-none ${(isGenerating || isFetching) ? 'opacity-30' : 'opacity-100'}`} />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            {/* Annotations Layer - Matches image size exactly */}
                            <div className="relative w-full h-full">
                                {annotations.map((ann) => (
                                    <div 
                                        key={ann.id} style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
                                        className={`absolute pointer-events-auto cursor-move z-40`}
                                        onMouseDown={(e) => handleMouseDown(e, ann.id)}
                                    >
                                        <div className="relative group/item">
                                            <div className="bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/20 shadow-sm">
                                                {readOnly ? (
                                                    <span className="text-[11px] font-mono font-black uppercase tracking-tight text-slate-900 dark:text-white">{ann.label}</span>
                                                ) : (
                                                    <input type="text" value={ann.label} onChange={(e) => handleUpdateLabel(ann.id, e.target.value)} className="bg-transparent border-none p-0 focus:ring-0 text-[11px] font-mono font-black uppercase text-slate-900 dark:text-white w-24 text-center" onClick={(e) => e.stopPropagation()} />
                                                )}
                                            </div>
                                            {!readOnly && (
                                                <button onClick={(e) => { e.stopPropagation(); handleRemoveLabel(ann.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full shadow-md opacity-0 group-hover/item:opacity-100 transition-opacity"><X className="w-2.5 h-2.5" /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {!readOnly && !isGenerating && !isFetching && (
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {history.length > 0 && <button onClick={handleUndo} className="p-2 bg-white dark:bg-neutral-800 rounded-full shadow-lg"><Undo2 className="w-4 h-4 dark:text-white" /></button>}
                                <button onClick={handleClear} className="p-2 bg-red-500 text-white rounded-full shadow-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center max-w-xs">
                        {isFetching ? (
                             <div className="animate-in fade-in duration-500 flex flex-col items-center">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                                    <CloudDownload className="w-6 h-6 animate-bounce" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-widest">Fetching Assets</h4>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Loading diagram from side-car storage...</p>
                             </div>
                        ) : (
                            <div className="opacity-50 flex flex-col items-center">
                                <ImageIcon className="w-12 h-12 text-slate-300 dark:text-white/20 mb-4" />
                                <h4 className="text-lg font-bold text-slate-700 dark:text-white">No Diagram</h4>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Diagrams are now compressed and stored separately to maximize your cloud storage space!</p>
                            </div>
                        )}
                    </div>
                )}
                {(isGenerating || isFetching) && (
                    <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-[2px] z-[60] flex flex-col items-center justify-center">
                        {isGenerating ? <Wand2 className="w-12 h-12 text-indigo-500 animate-pulse mb-2" /> : <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-2" />}
                        <span className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">
                            {isGenerating ? 'Drawing...' : 'Loading Cloud Asset...'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagramEditor;
