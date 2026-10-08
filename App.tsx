
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Trophy, Search, Settings, Cloud, UserCircle, Filter, X, Moon, Sun, FolderPlus, Loader2, Info, Users, CalendarDays, BookOpen, ArrowLeft } from 'lucide-react';
import { Game, UserProfile, GameResult, GroupMessage, FirebaseConfig, Folder, TargetGroup, ExportData, Player, GameCalendarEvent, CalendarSettings } from './types';
import { generateGame } from './services/gemini';
import { playClick, playPop, playSuccess, playDelete, playWhoosh } from './services/sound';
import { initFirebase, saveToFirebase, subscribeToLibrary, saveGameDiagram, deleteGameAssets, cleanData } from './services/firebase';
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
import PlayersModal from './components/PlayersModal';
import GameCalendar from './components/GameCalendar';

const APP_VERSION = "4.5.1";

const APP_UPDATES = [
  "Game instructions are now stored as separate Setup, Gameplay, and How to Win fields.",
  "Existing games are automatically upgraded when they load from Firebase.",
  "Game editing now keeps the new structured data and legacy rules synchronized.",
  "Improved Firebase game syncing and data normalization.",
  "New Game Calendar lets you schedule games and view your plan by month or week.",
];
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

const SplashScreen: React.FC<{ isExiting: boolean }> = ({ isExiting }) => (
  <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-50/90 dark:bg-[#08090d] transition-all duration-700 ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
    <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-orange-500/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative p-6 bg-slate-950 dark:bg-white/10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white/10 animate-bounce duration-1000">
            <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 512 512">
                <defs>
                    <linearGradient id="splash-g" x1="256" y1="42" x2="256" y2="470" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F97316"/>
                        <stop offset="1" stopColor="#DC2626"/>
                    </linearGradient>
                </defs>
                <path d="M256 42.6C256 42.6 405.3 170.6 405.3 298.6C405.3 394.6 330.6 469.3 256 469.3C181.3 469.3 106.6 394.6 106.6 298.6C106.6 170.6 256 42.6 256 42.6Z" fill="url(#splash-g)"/>
                <path d="M256 384L230.4 360.5MT183.4 317.8 160 290.1 160 256C160 228.2 181.3 206.9 209 206.9C223.9 206.9 238.9 213.3 247.4 224L256 232.5L264.5 224C273 213.3 287.9 206.9 302.9 206.9C330.6 206.9 352 228.2 352 256C352 290.1 328.5 317.8 281.5 360.5L256 384Z" fill="white" className="opacity-90"/>
            </svg>
        </div>
    </div>
    <div className="mt-12 flex flex-col items-center gap-2">
        <h1 className="text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase">Pursuit</h1>
        <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
        </div>
    </div>
  </div>
);

const App: React.FC = () => {
  // --- CORE DATA ---
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem('pursuit_games');
    return saved ? JSON.parse(saved) : [];
  });
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('pursuit_folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('pursuit_players');
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
  const [showUpdates, setShowUpdates] = useState<boolean>(() => {
    return localStorage.getItem('pursuit_last_seen_version') !== APP_VERSION;
  });
  const [tags, setTags] = useState<string[]>(() => JSON.parse(localStorage.getItem('pursuit_tags') || JSON.stringify(DEFAULT_TAGS)));
  
  const [results, setResults] = useState<GameResult[]>(() => {
    const saved = localStorage.getItem('pursuit_results');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [messages, setMessages] = useState<GroupMessage[]>(() => JSON.parse(localStorage.getItem('pursuit_messages') || '[]'));
  const [calendarEvents, setCalendarEvents] = useState<GameCalendarEvent[]>(() => JSON.parse(localStorage.getItem('pursuit_calendar_events') || '[]'));
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>(() => JSON.parse(localStorage.getItem('pursuit_calendar_settings') || '{"configured":false,"schedules":[]}'));
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLauncher, setShowLauncher] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isPlayersModalOpen, setIsPlayersModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [ratingGame, setRatingGame] = useState<Game | null>(null);
  const [winnerGame, setWinnerGame] = useState<Game | null>(null);
  const [aiGame, setAiGame] = useState<Game | null>(null);
  const [movingGame, setMovingGame] = useState<Game | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);

  const isInitialLoadRef = useRef(true);

  // Initial Boot Sequence
  useEffect(() => {
    const timer = setTimeout(() => {
        setIsInitializing(false);
        setTimeout(() => setShowApp(true), 300);
    }, 1500); 
    return () => clearTimeout(timer);
  }, []);

  // --- PERSISTENCE ---
  const safeStringify = (data: any) => JSON.stringify(cleanData(data));

  useEffect(() => { localStorage.setItem('pursuit_games', safeStringify(games)); }, [games]);
  useEffect(() => { localStorage.setItem('pursuit_folders', safeStringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('pursuit_players', safeStringify(players)); }, [players]);
  useEffect(() => { localStorage.setItem('pursuit_user_profile', safeStringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('pursuit_results', safeStringify(results)); }, [results]);
  useEffect(() => { localStorage.setItem('pursuit_calendar_events', safeStringify(calendarEvents)); }, [calendarEvents]);
  useEffect(() => { localStorage.setItem('pursuit_calendar_settings', safeStringify(calendarSettings)); }, [calendarSettings]);
  useEffect(() => { localStorage.setItem('pursuit_library_id', libraryId); }, [libraryId]);
  useEffect(() => { localStorage.setItem('pursuit_theme', isDarkMode ? 'dark' : 'light'); }, [isDarkMode]);

  const dismissUpdates = () => {
    localStorage.setItem('pursuit_last_seen_version', APP_VERSION);
    setShowUpdates(false);
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- SYNC ENGINE ---
  const triggerBroadcast = useCallback(async (overrideGames?: Game[], overrideFolders?: Folder[], overrideMessages?: GroupMessage[], overrideResults?: GameResult[], overridePlayers?: Player[], overrideCalendarEvents?: GameCalendarEvent[], overrideCalendarSettings?: CalendarSettings) => {
    if (!libraryId) return { success: false, error: 'No library ID' };
    setIsBroadcasting(true);
    try {
        await saveToFirebase({
            version: 1, timestamp: Date.now(),
            games: overrideGames || games, 
            folders: overrideFolders || folders, 
            messages: overrideMessages || messages,
            results: overrideResults || results,
            players: overridePlayers || players,
            calendarEvents: overrideCalendarEvents || calendarEvents, calendarSettings: overrideCalendarSettings || calendarSettings,
            tags, categories: []
        }, AUTO_FIREBASE_CONFIG, libraryId);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Unknown error' };
    } finally { 
        setIsBroadcasting(false); 
    }
  }, [games, folders, messages, results, players, calendarEvents, calendarSettings, libraryId, tags]);

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
                            if (!cloudGames.find(cg => cg.id === localGame.id)) merged.push(localGame);
                        });
                        return merged;
                    });
                    setFolders(prev => {
                        const merged = [...cloudFolders];
                        prev.forEach(localFolder => {
                            if (!cloudFolders.find(cf => cf.id === localFolder.id)) merged.push(localFolder);
                        });
                        return merged;
                    });
                } else {
                    setGames(prev => cloudGames.map(cg => {
                        const local = prev.find(p => p.id === cg.id);
                        if (local?.diagramUrl && !cg.diagramUrl) return { ...cg, diagramUrl: local.diagramUrl };
                        return cg;
                    }));
                    setFolders(cloudFolders);
                }
                if (data.tags) setTags(data.tags);
                if (Array.isArray(data.calendarEvents)) setCalendarEvents(data.calendarEvents);
                if (data.calendarSettings) setCalendarSettings(data.calendarSettings as CalendarSettings);
            }
        };

        const handlePlayers = (cloudPlayers: Player[]) => {
            if (!cloudPlayers || !Array.isArray(cloudPlayers)) return;
            setPlayers(prev => {
                if (isInitialLoadRef.current) {
                    const merged = [...cloudPlayers];
                    prev.forEach(localPlayer => {
                        if (!cloudPlayers.find(cp => cp.id === localPlayer.id)) merged.push(localPlayer);
                    });
                    return merged;
                }
                return cloudPlayers;
            });
            setTimeout(() => { isInitialLoadRef.current = false; }, 1000);
        };

        const unsubscribe = subscribeToLibrary(libraryId, handleData, setMessages, setResults, handlePlayers);
        return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [libraryId]);

  // --- HANDLERS ---
  const handleSaveProfile = (profile: UserProfile) => {
      setUser(profile);
      localStorage.setItem('pursuit_user_profile', JSON.stringify(profile));
      setIsProfileModalOpen(false);
  };

  const handleSaveCalendarSettings = (settings: CalendarSettings) => {
      setCalendarSettings(settings);
      triggerBroadcast(undefined, undefined, undefined, undefined, undefined, undefined, settings);
  };


  const handleAddCalendarEvent = (event: GameCalendarEvent) => {
      const newEvents = [...calendarEvents, event];
      setCalendarEvents(newEvents);
      triggerBroadcast(undefined, undefined, undefined, undefined, undefined, newEvents);
  };

  const handleDeleteCalendarEvent = (id: string) => {
      const newEvents = calendarEvents.filter(event => event.id !== id);
      setCalendarEvents(newEvents);
      triggerBroadcast(undefined, undefined, undefined, undefined, undefined, newEvents);
  };

  const handleAddPlayer = (name: string, age: string, gender: 'Male' | 'Female' | 'Other') => {
      const newPlayer: Player = { id: crypto.randomUUID(), name, age, gender };
      const newPlayers = [newPlayer, ...players];
      setPlayers(newPlayers);
      triggerBroadcast(undefined, undefined, undefined, undefined, newPlayers);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
      const oldPlayer = players.find(p => p.id === updatedPlayer.id);
      const newPlayers = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
      setPlayers(newPlayers);
      
      let newResults = results;
      if (oldPlayer && oldPlayer.name !== updatedPlayer.name) {
          newResults = results.map(res => {
              const winners = res.winner.split(',').map(w => w.trim());
              const updatedWinners = winners.map(w => w.toLowerCase() === oldPlayer.name.toLowerCase() ? updatedPlayer.name : w);
              return { ...res, winner: updatedWinners.join(', ') };
          });
          setResults(newResults);
      }
      
      triggerBroadcast(undefined, undefined, undefined, newResults, newPlayers);
  };

  const handleDeletePlayer = (id: string) => {
      const newPlayers = players.filter(p => p.id !== id);
      setPlayers(newPlayers);
      triggerBroadcast(undefined, undefined, undefined, undefined, newPlayers);
  };

  const handleUpdateGame = async (updatedGame: Game) => {
      const newGames = games.map(x => x.id === updatedGame.id ? {...x, ...updatedGame, lastUpdated: Date.now()} : x);
      setGames(newGames);
      if (updatedGame.diagramUrl && updatedGame.diagramUrl.startsWith('data:')) {
          await saveGameDiagram(libraryId, updatedGame.id, updatedGame.diagramUrl);
      }
      triggerBroadcast(newGames);
  };

  const handleDeleteGame = async (id: string) => {
      if(confirm("Delete game?")) {
        const newGames = games.filter(g => g.id !== id);
        const newCalendarEvents = calendarEvents.filter(event => event.gameId !== id);
        setGames(newGames);
        setCalendarEvents(newCalendarEvents);
        setSelectedGame(null);
        playDelete();
        await deleteGameAssets(libraryId, id);
        triggerBroadcast(newGames, undefined, undefined, undefined, undefined, newCalendarEvents);
      }
  };

  const handleHardRefresh = async () => {
    if (confirm("This will clear the app's internal cache and force an update. Your data will remain safe in the cloud. Continue?")) {
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }
        }
        window.location.reload();
    }
  };

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

  return (
    <>
      {isInitializing || !showApp ? <SplashScreen isExiting={!isInitializing} /> : null}
      
      <div className={`min-h-screen bg-[#F5F5F7] dark:bg-[#0A0A0C] transition-opacity duration-500 flex flex-col ${!showApp ? 'opacity-0' : 'opacity-100'}`}>
          {showUpdates && (
          <div className="fixed inset-0 z-[180] bg-slate-950/55 backdrop-blur-xl flex items-center justify-center p-5 sm:p-6">
              <div className="glass-card w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-[soft-pop_.45s_cubic-bezier(.22,1,.36,1)_both]">
                  <div className="relative px-7 pt-7 pb-5 bg-gradient-to-br from-orange-500/15 via-white/20 to-indigo-500/15 dark:from-orange-500/15 dark:via-white/5 dark:to-indigo-500/15 border-b border-black/5 dark:border-white/10">
                      <div className="flex items-start justify-between gap-4">
                          <div>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-300 text-xs font-black uppercase tracking-wider border border-orange-500/15">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                  New Updates
                              </div>
                              <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white">What’s new</h2>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here’s what changed since your last visit.</p>
                          </div>
                          <div className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-900/5 dark:bg-white/10 text-xs font-bold text-slate-600 dark:text-slate-300">
                              v{APP_VERSION}
                          </div>
                      </div>
                  </div>
                  <div className="px-7 py-6">
                      <ul className="space-y-4">
                          {APP_UPDATES.map((update, index) => (
                              <li key={index} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                  <span className="mt-2 w-2 h-2 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-sm shadow-orange-500/30" />
                                  <span>{update}</span>
                              </li>
                          ))}
                      </ul>
                      <button onClick={dismissUpdates} className="mt-7 w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all">
                          Got it
                      </button>
                  </div>
              </div>
          </div>
      )}

      {!user && !isProfileModalOpen && (
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 text-center">
                  <div className="glass-card p-10 rounded-[3rem] shadow-2xl max-w-sm">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-orange-500/15 dark:from-indigo-500/20 dark:to-orange-500/15 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/10">
                          <UserCircle className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold dark:text-white mb-2">Welcome Home</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">Let's set up your profile to start organizing your playbook.</p>
                      <button onClick={() => { playClick(); setIsProfileModalOpen(true); }} className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-xl">Get Started</button>
                  </div>
              </div>
          )}

          <nav className="sticky top-0 z-40 bg-white/65 dark:bg-slate-950/65 backdrop-blur-2xl border-b border-white/70 dark:border-white/10 shadow-sm p-4 sm:px-8">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveFolderId(null); setIsGlobalView(false); setShowCalendar(false); setShowLauncher(true); }}>
                          <div className="relative p-2.5 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-xl shadow-lg shadow-orange-500/25 rotate-3 overflow-visible">
                              <div className="absolute -inset-1.5 rounded-2xl bg-orange-500/20 blur-md animate-pulse pointer-events-none" />
                              <svg className="relative w-5 h-5 drop-shadow-sm" viewBox="0 0 512 512">
                                  <defs>
                                      <linearGradient id="brand-g" x1="256" y1="42" x2="256" y2="470" gradientUnits="userSpaceOnUse">
                                          <stop stopColor="#FDBA74"/>
                                          <stop offset=".35" stopColor="#F97316"/>
                                          <stop offset="1" stopColor="#DC2626"/>
                                      </linearGradient>
                                  </defs>
                                  <path d="M256 42.6C256 42.6 405.3 170.6 405.3 298.6C405.3 394.6 330.6 469.3 256 469.3C181.3 469.3 106.6 394.6 106.6 298.6C106.6 170.6 256 42.6 256 42.6Z" fill="url(#brand-g)"/>
                                  <path d="M256 384L230.4 360.5C183.4 317.8 160 290.1 160 256C160 228.2 181.3 206.9 209 206.9C223.9 206.9 238.9 213.3 247.4 224L256 232.5L264.5 224C273 213.3 287.9 206.9 302.9 206.9C330.6 206.9 352 228.2 352 256C352 290.1 328.5 317.8 281.5 360.5L256 384Z" fill="white" opacity=".92"/>
                              </svg>
                          </div>
                          <h1 className="text-xl font-black text-[#1D1D1F] dark:text-white tracking-tighter uppercase hidden sm:block">Pursuit</h1>
                      </div>
                  </div>
                  {!showCalendar && <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search everything..." className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/25 focus:bg-white dark:focus:bg-white/10 dark:text-white transition-all shadow-inner" />
                  </div>}
                  <div className="flex items-center gap-2">
                      <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl">
                          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                      </button>
                      <button onClick={() => setIsSyncModalOpen(true)} className="p-2.5 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-2xl relative">
                          {isBroadcasting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                      </button>
                      <button onClick={() => setIsPlayersModalOpen(true)} className="p-2.5 bg-sky-50/80 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl relative border border-sky-100/80 dark:border-sky-400/10">
                          <Users className="w-5 h-5" />
                      </button>
                      <button onClick={() => setIsLeaderboardModalOpen(true)} className="p-2.5 bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100/80 dark:border-amber-400/10"><Trophy className="w-5 h-5" /></button>
                      <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />
                      <button onClick={() => setIsProfileModalOpen(true)} className={`w-10 h-10 rounded-full ${user?.color || 'bg-slate-500'} flex items-center justify-center text-white font-bold shadow-md border-2 border-white dark:border-white/10`}>{user?.emoji || user?.name?.charAt(0)}</button>
                  </div>
              </div>
          </nav>

          <main className="relative flex-1 overflow-hidden p-6 sm:p-12 pt-8 w-full">
              <div className="color-orb blue w-[30rem] h-[30rem] -top-40 -left-40" />
              <div className="color-orb violet w-[34rem] h-[34rem] top-[20%] -right-56" />
              <div className="color-orb cyan w-[26rem] h-[26rem] bottom-[-8rem] left-[30%]" />
              <div className="color-orb orange w-[24rem] h-[24rem] top-[55%] left-[5%]" />
              <div className="color-orb red w-[20rem] h-[20rem] bottom-[5%] right-[12%]" />
              {showLauncher ? (
                  <div className="relative z-10 max-w-5xl mx-auto w-full min-h-[calc(100vh-10rem)] flex items-center justify-center">
                      <div className="w-full">
                          <div className="text-center mb-10 sm:mb-14">
                              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-300 text-xs font-black uppercase tracking-wider border border-orange-500/15">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                  Pursuit
                              </div>
                              <h2 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight gradient-text">What are we doing today?</h2>
                              <p className="mt-3 text-base sm:text-lg text-slate-500 dark:text-slate-400">Choose where you want to go.</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
                              <button
                                onClick={() => { playClick(); setShowLauncher(false); setShowCalendar(false); setIsGlobalView(false); setActiveFolderId(null); }}
                                className="group relative min-h-[18rem] sm:min-h-[22rem] rounded-[2.5rem] glass-card border border-white/80 dark:border-white/10 overflow-hidden text-left shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                              >
                                  <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-indigo-500/15 blur-3xl group-hover:bg-indigo-500/25 transition-all" />
                                  <div className="relative h-full p-7 sm:p-9 flex flex-col justify-between">
                                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                                          <BookOpen className="w-8 h-8" />
                                      </div>
                                      <div>
                                          <div className="flex items-end justify-between gap-4">
                                              <div>
                                                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Game Library</h3>
                                                  <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">Browse, organize, and create all your games.</p>
                                              </div>
                                              <span className="shrink-0 w-11 h-11 rounded-full bg-slate-950 dark:bg-white text-white dark:text-black flex items-center justify-center text-xl group-hover:translate-x-1 transition-transform">→</span>
                                          </div>
                                      </div>
                                  </div>
                              </button>
                              <button
                                onClick={() => { playClick(); setShowLauncher(false); setShowCalendar(true); }}
                                className="group relative min-h-[18rem] sm:min-h-[22rem] rounded-[2.5rem] glass-card border border-white/80 dark:border-white/10 overflow-hidden text-left shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                              >
                                  <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-orange-500/20 blur-3xl group-hover:bg-orange-500/30 transition-all" />
                                  <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />
                                  <div className="relative h-full p-7 sm:p-9 flex flex-col justify-between">
                                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
                                          <CalendarDays className="w-8 h-8" />
                                      </div>
                                      <div>
                                          <div className="flex items-end justify-between gap-4">
                                              <div>
                                                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Game Calendar</h3>
                                                  <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">Plan your games by week or month so you always know what’s next.</p>
                                              </div>
                                              <span className="shrink-0 w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-orange-500/20 group-hover:translate-x-1 transition-transform">→</span>
                                          </div>
                                      </div>
                                  </div>
                              </button>


                          </div>
                      </div>
                  </div>
              ) : showCalendar ? (
                  <GameCalendar games={games} events={calendarEvents} settings={calendarSettings} onSaveSettings={handleSaveCalendarSettings} onAddEvent={handleAddCalendarEvent} onDeleteEvent={handleDeleteCalendarEvent} onOpenGame={(game) => { setShowCalendar(false); setShowLauncher(false); setSelectedGame(game); }} />
              ) : <div className="relative z-10 max-w-7xl mx-auto w-full">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                   <div>
                      {activeFolderId && !isGlobalView && (
                          <button onClick={() => { playClick(); setActiveFolderId(null); }} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                              <ArrowLeft className="w-4 h-4" /> Back to Folders
                          </button>
                      )}
                      <h2 className="text-4xl sm:text-5xl font-black gradient-text tracking-tight flex items-baseline gap-4">
                          {isGlobalView ? 'All Games' : (activeFolderId ? (folders.find(f => f.id === activeFolderId)?.name || 'Folder') : 'Playbook')}
                          <span className="text-lg font-bold text-slate-300 dark:text-slate-600">{filteredGames.length} Items</span>
                      </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => setIsFilterModalOpen(true)} className={`p-3 rounded-2xl border ${selectedTags.length > 0 ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-white/5 text-slate-600 border-black/5 dark:border-white/5 shadow-sm'}`}><Filter className="w-4 h-4" /></button>
                      <div className="p-1 bg-white/65 dark:bg-white/5 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl flex shadow-sm">
                          <button onClick={() => { setIsGlobalView(false); setActiveFolderId(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isGlobalView ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500'}`}>Folders</button>
                          <button onClick={() => { setIsGlobalView(true); setActiveFolderId(null); }} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isGlobalView ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-md' : 'text-slate-500'}`}>List</button>
                      </div>
                      <button onClick={() => setIsSettingsModalOpen(true)} className="p-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm"><Settings className="w-5 h-5 text-slate-600" /></button>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {!isGlobalView && !activeFolderId && (
                      <>
                          {folders.map(folder => (
                              <FolderCard key={folder.id} folder={folder} gameCount={games.filter(g => g && g.folderId === folder.id).length} onClick={() => setActiveFolderId(folder.id)} onDropGame={(gid) => { 
                                  const newGames = games.map(g => g.id === gid ? {...g, folderId: folder.id, folderIcon: folder.icon || 'folder', lastUpdated: Date.now()} : g);
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
                          <button onClick={() => setIsFolderModalOpen(true)} className="h-[10rem] sm:h-[12rem] rounded-[2rem] border-2 border-dashed border-indigo-200/70 dark:border-white/10 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/10 transition-all"><FolderPlus className="w-6 h-6" /><span className="text-sm font-bold">New Folder</span></button>
                      </>
                  )}

                  {(!searchTerm && !isGlobalView && !activeFolderId) || activeFolderId ? (
                      <button onClick={() => setIsModalOpen(true)} className="h-[22rem] rounded-[2rem] border-4 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-indigo-300/80 hover:bg-gradient-to-br hover:from-indigo-50/50 hover:to-cyan-50/30 dark:hover:from-indigo-500/10 dark:hover:to-cyan-500/5 transition-all">
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 dark:from-indigo-500/15 dark:to-cyan-500/10 rounded-3xl flex items-center justify-center group-hover:from-indigo-600 group-hover:to-violet-600 transition-all shadow-sm"><Plus className="w-8 h-8 text-slate-400 group-hover:text-white" /></div>
                          <span className="text-xl font-bold text-slate-700 dark:text-white">Add Game</span>
                      </button>
                  ) : null}

                  {filteredGames.map(game => (
                      <GameCard key={game.id} game={game} onRateClick={setRatingGame} onLogWin={setWinnerGame} onDelete={handleDeleteGame} onClick={() => { playWhoosh(); setSelectedGame(game); }} onMoveClick={setMovingGame} showFolderName={isGlobalView} folderName={game.folderId ? (folders.find(f => f.id === game.folderId)?.name || 'Root') : 'Root'} folderIcon={game.folderId ? (folders.find(f => f.id === game.folderId)?.icon || 'folder') : game.folderIcon} />
                  ))}
                  {activeFolderId && filteredGames.length === 0 && (
                      <div className="col-span-full py-16 text-center rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10 bg-white/30 dark:bg-white/[0.02]">
                          <p className="text-lg font-bold text-slate-600 dark:text-slate-300">This folder is empty</p>
                          <p className="mt-1 text-sm text-slate-400">Add a game here or go back to your folders.</p>
                      </div>
                  )}
              </div>
          </div>}
          </main>

          <PlayersModal 
            isOpen={isPlayersModalOpen} 
            onClose={() => setIsPlayersModalOpen(false)} 
            players={players} 
            onAddPlayer={handleAddPlayer} 
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer} 
          />

          <WinnerModal isOpen={!!winnerGame} game={winnerGame} players={players} onClose={() => setWinnerGame(null)} onSave={(res) => { 
              const newResults = [res, ...results];
              setResults(newResults); 
              setWinnerGame(null); 
              playSuccess(); 
              triggerBroadcast(undefined, undefined, undefined, newResults); 
          }} user={user} rivalries={[]} />

          <LeaderboardModal isOpen={isLeaderboardModalOpen} onClose={() => setIsLeaderboardModalOpen(false)} results={results} user={user} players={players} rivalries={[]} />

          <GameDetailsView game={selectedGame} onClose={() => setSelectedGame(null)} onRate={setRatingGame} onLogWin={setWinnerGame} onOpenAI={setAiGame} onDelete={handleDeleteGame} onUpdateGame={handleUpdateGame} allTags={tags} onCreateTag={()=>{}} activeTimer={null} onStartTimer={()=>{}} onStopTimer={()=>{}} onResetRating={()=>{}} onMoveClick={setMovingGame} libraryId={libraryId} />

          <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} games={games} messages={messages} results={results} players={players} categories={[]} tags={tags} recentPlayers={[]} syncId={libraryId} firebaseConfig={AUTO_FIREBASE_CONFIG} onImport={() => {}} onStartLiveSync={() => {}} onJoinLiveSync={(id) => { setLibraryId(id); setIsSyncModalOpen(false); }} onConnectFirebase={() => {}} onDisconnectFirebase={() => {}} onDownloadCloud={() => window.location.reload()} onUpload={() => triggerBroadcast()} onHardReset={handleHardRefresh} isLoading={isLoading || isBroadcasting} appVersion={APP_VERSION} />
          
          <AddGameModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categories={[]} onGenerate={async (p, cat, group, manualTags) => {
                  setIsLoading(true);
                  try {
                      const res = await generateGame(p, manualTags);
                      const game: Game = { ...res, id: crypto.randomUUID(), rating: 0, ratingCount: 0, targetGroups: group === 'Both' ? ['Middle School', 'High School'] : [group as any], folderId: activeFolderId || undefined, folderIcon: activeFolderId ? (folders.find(f => f.id === activeFolderId)?.icon || 'folder') : undefined, lastUpdated: Date.now(), createdBy: user?.name || 'Guest', creatorId: user?.id };
                      const newGames = [game, ...games];
                      setGames(newGames);
                      setIsModalOpen(false); setSelectedGame(game); playSuccess();
                      triggerBroadcast(newGames);
                  } catch (error) {
                      console.error('Unable to generate game:', error);
                      throw error;
                  } finally { setIsLoading(false); }
              }} isLoading={isLoading} allTags={tags} user={user} />
          
          <CreateFolderModal isOpen={isFolderModalOpen} onClose={() => setIsFolderModalOpen(false)} onCreate={(name, icon) => { 
              const newFolders = [...folders, { id: crypto.randomUUID(), name, icon, createdAt: Date.now() }];
              setFolders(newFolders); 
              playPop(); 
              triggerBroadcast(undefined, newFolders); 
          }} />

          <RenameFolderModal isOpen={!!renamingFolder} folder={renamingFolder} onClose={() => setRenamingFolder(null)} onRename={(id, name, icon) => {
              const newFolders = folders.map(f => f.id === id ? { ...f, name, icon, lastUpdated: Date.now() } : f);
              setFolders(newFolders);
              triggerBroadcast(undefined, newFolders);
              playPop();
              setRenamingFolder(null);
          }} />

          <RatingModal isOpen={!!ratingGame} game={ratingGame} onClose={() => setRatingGame(null)} onSave={(id, r) => { 
              const newGames = games.map(g => g.id === id ? {...g, rating: r, ratingCount: (g.ratingCount||0)+1, lastUpdated: Date.now()} : g);
              setGames(newGames); 
              triggerBroadcast(newGames); 
          }} />

          <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onSave={handleSaveProfile} initialUser={user} />
          <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} categories={[]} onCreateCategory={()=>{}} onDeleteCategory={()=>{}} tags={tags} onCreateTag={(t) => setTags(prev => [...prev, t])} onDeleteTag={(t) => setTags(prev => prev.filter(x => x !== t))} rivalries={[]} onCreateRivalry={()=>{}} onDeleteRivalry={()=>{}} appVersion={APP_VERSION} gameCount={games.length} folderCount={folders.length} />
          <MoveToFolderModal isOpen={!!movingGame} game={movingGame} folders={folders} onClose={() => setMovingGame(null)} onMove={(gid, fid) => { const newGames = games.map(g => g.id === gid ? {...g, folderId: fid || undefined, folderIcon: fid ? (folders.find(f => f.id === fid)?.icon || 'folder') : undefined, lastUpdated: Date.now()} : g); setGames(newGames); setMovingGame(null); playPop(); triggerBroadcast(newGames); }} />
          <GameAIModal isOpen={!!aiGame} game={aiGame} onClose={() => setAiGame(null)} onUpdateRules={(id, rules) => { const newGames = games.map(g => g.id === id ? {...g, rules, lastUpdated: Date.now()} : g); setGames(newGames); triggerBroadcast(newGames); }} />
      </div>
    </>
  );
};

export default App;
