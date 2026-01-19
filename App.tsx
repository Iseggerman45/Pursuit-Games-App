import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Trophy, Search, Settings, Cloud, UserCircle, Filter, X, MessageCircle, Moon, Sun, FolderPlus, Loader2, Info } from 'lucide-react';
import { Game, UserProfile, GameResult, GroupMessage, FirebaseConfig, Folder, TargetGroup, ExportData } from './types';
import { generateGame } from './services/gemini';
import { playClick, playPop, playSuccess, playDelete, playWhoosh } from './services/sound';
import { initFirebase, saveToFirebase, subscribeToLibrary, saveGameDiagram, deleteGameAssets } from './services/firebase';
import GameCard from './components/GameCard';
import FolderCard from './components/FolderCard';
import AddGameModal from './components/AddGameModal';
import CreateFolderModal from './components/CreateFolderModal';
import RenameFolderModal from './components/RenameFolderModal';
import SettingsModal from './components/SettingsModal';
import RatingModal from './components/RatingModal';
import SyncModal from './components/SyncModal';
import ProfileModal from './components/ProfileModal';
import FilterModal from './components/FilterModal';
import WinnerModal from './components/WinnerModal';
import GameAIModal from './components/GameAIModal';
import GameDetailsView from './components/GameDetailsView';
import MessagingModal from './components/MessagingModal';
import LeaderboardModal from './components/LeaderboardModal';
import MoveToFolderModal from './components/MoveToFolderModal';

const APP_VERSION = "3.9.1";
const GLOBAL_ID = "pursuit_global";

const AUTO_FIREBASE_CONFIG: FirebaseConfig | null = {
  apiKey: "AIzaSyBTnLS8G8tT5_i1Pza3C1Wkv1TlvMGa20k",
  authDomain: "pursuit-games-d8e59.firebaseapp.com",
  projectId: "pursuit-games-d8e59",
  storageBucket: "pursuit-games-d8e59.firebasestorage.app",
  messagingSenderId: "100691956298",
  appId: "1:100691956298:web:f0bb61c618fe4548894cb3"
};

const DEFAULT_TAGS = ['Team Game', 'Free for All', 'Students vs Leaders', 'Boys vs Girls', 'No Props', 'Indoor', 'Outdoor', 'High Energy', 'Ice Breaker'];

const App: React.FC = () => {
  // --- CORE DATA ---
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem('youth_group_games') || localStorage.getItem('pursuit_games');
    return saved ? JSON.parse(saved) : [];
  });
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('pursuit_folders') || localStorage.getItem('folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('pursuit_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [libraryId, setLibraryId] = useState<string>(() => {
      const saved = localStorage.getItem('pursuit_library_id');
      if (!saved || saved.includes('main_library') || saved.length > 20) return GLOBAL_ID;
      return saved;
  });

  // --- UI STATE ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('pursuit_theme') === 'dark');
  const [tags, setTags] = useState<string[]>(() => JSON.parse(localStorage.getItem('pursuit_tags') || JSON.stringify(DEFAULT_TAGS)));
  const [results, setResults] = useState<GameResult[]>(() => JSON.parse(localStorage.getItem('pursuit_results') || '[]'));
  const [messages, setMessages] = useState<GroupMessage[]>(() => JSON.parse(localStorage.getItem('pursuit_messages') || '[]'));
  
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [ratingGame, setRatingGame] = useState<Game | null>(null);
  const [winnerGame, setWinnerGame] = useState<Game | null>(null);
  const [aiGame, setAiGame] = useState<Game | null>(null);
  const [movingGame, setMovingGame] = useState<Game | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);

  const isInitialLoadRef = useRef(true);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('youth_group_games', JSON.stringify(games)); }, [games]);
  useEffect(() => { localStorage.setItem('pursuit_folders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('pursuit_user_profile', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('pursuit_theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem('pursuit_library_id', libraryId); }, [libraryId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- SYNC ENGINE ---
  const triggerBroadcast = useCallback(async (overrideGames?: Game[], overrideFolders?: Folder[], overrideMessages?: GroupMessage[], overrideResults?: GameResult[]) => {
    if (!libraryId) return { success: false, error: 'No library ID' };
    setIsBroadcasting(true);
    try {
        await saveToFirebase({
            version: 1, timestamp: Date.now(),
            games: overrideGames || games, 
            folders: overrideFolders || folders, 
            messages: overrideMessages || messages,
            results: overrideResults || results,
            tags, categories: []
        }, AUTO_FIREBASE_CONFIG, libraryId);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Unknown error' };
    } finally { 
        setIsBroadcasting(false); 
    }
  }, [games, folders, messages, results, libraryId, tags]);

  useEffect(() => {
    if (AUTO_FIREBASE_CONFIG && libraryId) {
        initFirebase(AUTO_FIREBASE_CONFIG);
        
        const handleData = (data: Partial<ExportData>) => {
            if (data.games && Array.isArray(data.games)) {
                const cloudGames = data.games as Game[];
                const cloudFolders = (data.folders || []) as Folder[];

                if (isInitialLoadRef.current) {
                    setGames(prev => {
                        const merged = [...cloudGames];
                        prev.forEach(localGame => {
                            if (!cloudGames.find(cg => cg.id === localGame.id)) {
                                merged.push(localGame);
                            }
                        });
                        return merged;
                    });
                    setFolders(prev => {
                        const merged = [...cloudFolders];
                        prev.forEach(localFolder => {
                            if (!cloudFolders.find(cf => cf.id === localFolder.id)) {
                                merged.push(localFolder);
                            }
                        });
                        return merged;
                    });
                    isInitialLoadRef.current = false;
                } else {
                    // Update state but preserve local diagram URLs if they aren't in cloud yet
                    setGames(prev => cloudGames.map(cg => {
                        const local = prev.find(p => p.id === cg.id);
                        if (local?.diagramUrl && !cg.diagramUrl) {
                            return { ...cg, diagramUrl: local.diagramUrl };
                        }
                        return cg;
                    }));
                    setFolders(cloudFolders);
                }
                
                if (data.tags) setTags(data.tags);
            }
        };

        const unsubscribe = subscribeToLibrary(libraryId, handleData, setMessages, setResults);
        return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [libraryId]);

  const handleJoinLibrary = (newId: string) => {
      const cleanId = newId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (cleanId) {
          isInitialLoadRef.current = true;
          setLibraryId(cleanId);
          setIsSyncModalOpen(false);
          playPop();
      }
  };

  const handleForcePull = async () => {
      setIsLoading(true);
      try {
          window.location.reload(); 
      } finally { setIsLoading(false); }
  }

  // --- FILTERING ---
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      if (!game || !game.id) return false;
      if (searchTerm && !game.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedTags.length > 0 && !selectedTags.every(tag => game.tags?.includes(tag))) return false;
      
      if (!isGlobalView) {
          if (activeFolderId) {
              if (game.folderId !== activeFolderId) return false;
          } else {
              if (game.folderId && folders.some(f => f.id === game.folderId)) return false;
          }
      }
      return true;
    }).sort((a,b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  }, [games, folders, searchTerm, selectedTags, activeFolderId, isGlobalView]);

  const totalGamesInFolders = useMemo(() => {
    return games.filter(g => g && g.folderId && folders.some(f => f.id === g.folderId)).length;
  }, [games, folders]);

  const handleUpdateGame = async (updatedGame: Game) => {
      const newGames = games.map(x => x.id === updatedGame.id ? {...x, ...updatedGame, lastUpdated: Date.now()} : x);
      setGames(newGames);
      
      // If there's a diagram, save it separately to the side-car asset storage
      if (updatedGame.diagramUrl && updatedGame.diagramUrl.startsWith('data:')) {
          await saveGameDiagram(libraryId, updatedGame.id, updatedGame.diagramUrl);
      }
      
      triggerBroadcast(newGames);
  };

  const handleDeleteGame = async (id: string) => {
      if(confirm("Delete game?")) {
        const newGames = games.filter(g => g.id !== id);
        setGames(newGames); 
        setSelectedGame(null);
        playDelete(); 
        
        // Clean up associated diagram assets
        await deleteGameAssets(libraryId, id);
        
        triggerBroadcast(newGames);
      }
  };

  const handleRenameFolder = (id: string, newName: string) => {
    const newFolders = folders.map(f => f.id === id ? { ...f, name: newName, lastUpdated: Date.now() } : f);
    setFolders(newFolders);
    triggerBroadcast(undefined, newFolders);
    setRenamingFolder(null);
    playPop();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0C] transition-colors duration-500 flex flex-col">
        {!user && !isProfileModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 text-center">
                <div className="bg-white dark:bg-[#1D1D1F] p-10 rounded-[3rem] shadow-2xl max-w-sm border border-black/5 dark:border-white/5">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                        <UserCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white mb-2">Welcome Home</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">Let's set up your profile to start organizing your playbook.</p>
                    <button onClick={() => { playClick(); setIsProfileModalOpen(true); }} className="w-full py-4 bg-[#1D1D1F] dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-xl">Get Started</button>
                </div>
            </div>
        )}

        <nav className="sticky top-0 z-40 bg-white/70 dark:bg-[#1D1D1F]/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5 p-4 sm:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveFolderId(null); setIsGlobalView(false); }}>
                        <div className="p-2 bg-[#1D1D1F] dark:bg-white rounded-xl shadow-lg rotate-3">
                            <svg className="w-5 h-5" viewBox="0 0 512 512">
                                <path d="M256 42.6C256 42.6 405.3 170.6 405.3 298.6C405.3 394.6 330.6 469.3 256 469.3C181.3 469.3 106.6 394.6 106.6 298.6C106.6 170.6 256 42.6 256 42.6Z" fill="#F97316"/>
                            </svg>
                        </div>
                        <h1 className="text-xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase hidden sm:block">Pursuit</h1>
                    </div>
                </div>
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search everything..." className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500/20 dark:text-white transition-all shadow-inner" />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl">
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsSyncModalOpen(true)} className="p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl relative">
                        {isBroadcasting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setIsMessagingModalOpen(true)} className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl relative"><MessageCircle className="w-5 h-5" />{messages.length > 0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1D1D1F]" />}</button>
                    <button onClick={() => setIsLeaderboardModalOpen(true)} className="p-2.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-2xl"><Trophy className="w-5 h-5" /></button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                    <button onClick={() => setIsProfileModalOpen(true)} className={`w-10 h-10 rounded-full ${user?.color || 'bg-slate-500'} flex items-center justify-center text-white font-bold shadow-md border-2 border-white dark:border-white/10`}>{user?.emoji || user?.name?.charAt(0)}</button>
                </div>
            </div>
        </nav>

        <main className="flex-1 p-6 sm:p-12 pt-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                 <div>
                    <h2 className="text-4xl sm:text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tight flex items-baseline gap-4">
                        {isGlobalView ? 'All Games' : (activeFolderId ? folders.find(f => f.id === activeFolderId)?.name : 'Playbook')}
                        <span className="text-lg font-bold text-slate-300 dark:text-slate-600">{filteredGames.length} Items</span>
                    </h2>
                    {!isGlobalView && !activeFolderId && totalGamesInFolders > 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                           <Info className="w-3 h-3" /> {totalGamesInFolders} games are organized into folders. Toggle <span className="font-bold underline cursor-pointer" onClick={() => setIsGlobalView(true)}>List</span> to see everything.
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setIsFilterModalOpen(true)} className={`p-3 rounded-2xl border ${selectedTags.length > 0 ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-white/5 text-slate-600 border-black/5 dark:border-white/5 shadow-sm'}`}><Filter className="w-4 h-4" /></button>
                    <div className="p-1 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex shadow-sm">
                        <button onClick={() => { setIsGlobalView(false); setActiveFolderId(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isGlobalView ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500'}`}>Folders</button>
                        <button onClick={() => { setIsGlobalView(true); setActiveFolderId(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isGlobalView ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500'}`}>List</button>
                    </div>
                    <button onClick={() => setIsSettingsModalOpen(true)} className="p-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm"><Settings className="w-5 h-5 text-slate-600" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {!isGlobalView && !activeFolderId && (
                    <>
                        {folders.map(folder => (
                            <FolderCard key={folder.id} folder={folder} gameCount={games.filter(g => g && g.folderId === folder.id).length} onClick={() => setActiveFolderId(folder.id)} onDropGame={(gid) => { 
                                const newGames = games.map(g => g.id === gid ? {...g, folderId: folder.id, lastUpdated: Date.now()} : g);
                                setGames(newGames); 
                                playPop(); 
                                triggerBroadcast(newGames); 
                            }} onDelete={() => { 
                                if(confirm("Delete folder?")) {
                                    const newFolders = folders.filter(f => f.id !== folder.id);
                                    setFolders(newFolders);
                                    triggerBroadcast(undefined, newFolders);
                                }
                            }} onRename={() => setRenamingFolder(folder)} />
                        ))}
                        <button onClick={() => setIsFolderModalOpen(true)} className="h-[10rem] sm:h-[12rem] rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/10 transition-all"><FolderPlus className="w-6 h-6" /><span className="text-sm font-bold">New Folder</span></button>
                    </>
                )}

                {(!searchTerm && !isGlobalView && !activeFolderId) || activeFolderId ? (
                    <button onClick={() => setIsModalOpen(true)} className="h-[22rem] rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center group-hover:bg-indigo-600 transition-all shadow-sm"><Plus className="w-8 h-8 text-slate-400 group-hover:text-white" /></div>
                        <span className="text-xl font-bold text-slate-700 dark:text-white">Add Game</span>
                    </button>
                ) : null}

                {filteredGames.map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      onRateClick={setRatingGame} 
                      onLogWin={setWinnerGame} 
                      onDelete={handleDeleteGame} 
                      onClick={() => { playWhoosh(); setSelectedGame(game); }} 
                      onMoveClick={setMovingGame} 
                      showFolderName={isGlobalView} 
                      folderName={game.folderId ? (folders.find(f => f.id === game.folderId)?.name || 'Root') : 'Root'} 
                    />
                ))}
            </div>
        </main>

        <SyncModal 
            isOpen={isSyncModalOpen} 
            onClose={() => setIsSyncModalOpen(false)} 
            games={games} 
            messages={messages}
            results={results}
            categories={[]}
            tags={tags}
            recentPlayers={[]}
            syncId={libraryId} 
            firebaseConfig={AUTO_FIREBASE_CONFIG}
            onImport={() => {}}
            onStartLiveSync={() => {}}
            onJoinLiveSync={handleJoinLibrary} 
            onConnectFirebase={() => {}}
            onDisconnectFirebase={() => {}}
            onDownloadCloud={handleForcePull} 
            onUpload={() => triggerBroadcast()} 
            isLoading={isLoading || isBroadcasting} 
            appVersion={APP_VERSION} 
        />
        
        <AddGameModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            categories={[]}
            onGenerate={async (p, cat, group, manualTags) => {
                setIsLoading(true);
                try {
                    const res = await generateGame(p, manualTags);
                    const game: Game = { ...res, id: crypto.randomUUID(), rating: 0, ratingCount: 0, targetGroups: group === 'Both' ? ['Middle School', 'High School'] : [group as any], folderId: activeFolderId || undefined, lastUpdated: Date.now(), createdBy: user?.name || 'Guest', creatorId: user?.id };
                    const newGames = [game, ...games];
                    setGames(newGames);
                    setIsModalOpen(false); setSelectedGame(game); playSuccess();
                    triggerBroadcast(newGames);
                } finally { setIsLoading(false); }
            }} 
            isLoading={isLoading} 
            allTags={tags} 
            user={user} 
        />
        
        <CreateFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onCreate={(name) => { 
            const newFolders = [...folders, { id: crypto.randomUUID(), name, createdAt: Date.now() }];
            setFolders(newFolders); 
            playPop(); 
            triggerBroadcast(undefined, newFolders); 
        }} />
        <RenameFolderModal isOpen={!!renamingFolder} folder={renamingFolder} onClose={() => setRenamingFolder(null)} onRename={handleRenameFolder} />
        <MoveToFolderModal isOpen={!!movingGame} game={movingGame} folders={folders} onClose={() => setMovingGame(null)} onMove={(gid, fid) => { 
            const newGames = games.map(g => g.id === gid ? {...g, folderId: fid || undefined, lastUpdated: Date.now()} : g);
            setGames(newGames); 
            setMovingGame(null); 
            playPop(); 
            triggerBroadcast(newGames); 
        }} />
        <GameDetailsView 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
          onRate={setRatingGame} 
          onLogWin={setWinnerGame} 
          onOpenAI={setAiGame} 
          onDelete={handleDeleteGame} 
          onUpdateGame={handleUpdateGame} 
          allTags={tags} 
          onCreateTag={()=>{}} 
          activeTimer={null} 
          onStartTimer={()=>{}} 
          onStopTimer={()=>{}} 
          onResetRating={()=>{}} 
          onMoveClick={setMovingGame} 
          libraryId={libraryId}
        />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} categories={[]} onCreateCategory={()=>{}} onDeleteCategory={()=>{}} tags={tags} onCreateTag={(t) => setTags(prev => [...prev, t])} onDeleteTag={(t) => setTags(prev => prev.filter(x => x !== t))} rivalries={[]} onCreateRivalry={()=>{}} onDeleteRivalry={()=>{}} appVersion={APP_VERSION} gameCount={games.length} folderCount={folders.length} />
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={setUser} initialUser={user} />
        <RatingModal isOpen={!!ratingGame} game={ratingGame} onClose={() => setRatingGame(null)} onSave={(id, r) => { 
            const newGames = games.map(g => g.id === id ? {...g, rating: r, ratingCount: (g.ratingCount||0)+1, lastUpdated: Date.now()} : g);
            setGames(newGames); 
            triggerBroadcast(newGames); 
        }} />
        <WinnerModal isOpen={!!winnerGame} game={winnerGame} onClose={() => setWinnerGame(null)} onSave={(res) => { 
            const newResults = [res, ...results];
            setResults(newResults); 
            setWinnerGame(null); 
            playSuccess(); 
            triggerBroadcast(undefined, undefined, undefined, newResults); 
        }} user={user} recentPlayers={[]} rivalries={[]} />
        <GameAIModal isOpen={!!aiGame} game={aiGame} onClose={() => setAiGame(null)} onUpdateRules={(id, rules) => { 
            const newGames = games.map(g => g.id === id ? {...g, rules, lastUpdated: Date.now()} : g);
            setGames(newGames); 
            triggerBroadcast(newGames); 
        }} />
        <MessagingModal isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} messages={messages} onSendMessage={(c) => { 
            if(user) {
              const newMessages = [...messages, { id: crypto.randomUUID(), senderId: user.id, senderName: user.name, senderColor: user.color, senderEmoji: user.emoji, content: c, timestamp: Date.now() }];
              setMessages(newMessages); 
              triggerBroadcast(undefined, undefined, newMessages); 
            }
        }} user={user} />
        <LeaderboardModal isOpen={isLeaderboardModalOpen} onClose={() => setIsLeaderboardModalOpen(false)} results={results} user={user} rivalries={[]} />
    </div>
  );
};

export default App;