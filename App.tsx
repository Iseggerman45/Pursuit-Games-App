
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { Plus, Trophy, Search, Settings, Upload, Cloud, Wifi, UserCircle, Filter, X, ArrowUpDown, Crown, Timer, StopCircle, BellRing, MessageCircle, Moon, Sun } from 'lucide-react';
import { Game, TargetGroup, ExportData, UserProfile, GameResult, ActiveTimer, Rivalry, GroupMessage } from './types';
import { generateGame } from './services/gemini';
import { playClick, playPop, playSuccess, playDelete, playAlarm, playMessage } from './services/sound';
import { createBlob, updateBlob, getBlob } from './services/jsonblob';
import { requestNotificationPermission, sendNotification } from './services/notifications';
import GameCard from './components/GameCard';
import AddGameModal from './components/AddGameModal';
import SettingsModal from './components/SettingsModal';
import RatingModal from './components/RatingModal';
import SyncModal from './components/SyncModal';
import ProfileModal from './components/ProfileModal';
import FilterModal from './components/FilterModal';
import WinnerModal from './components/WinnerModal';
import LeaderboardModal from './components/LeaderboardModal';
import GameAIModal from './components/GameAIModal';
import GameDetailsView from './components/GameDetailsView';
import MessagingModal from './components/MessagingModal';

// Empty default games as requested
const DEFAULT_GAMES: Game[] = [];

const DEFAULT_CATEGORIES = ['Ice Breakers', 'Active', 'Team Building', 'Indoors', 'Outdoors'];
const DEFAULT_TAGS = ['Team Game', 'Free for All', 'Students vs Leaders', 'Boys vs Girls', 'No Props', 'Indoor', 'Outdoor', 'High Energy', 'Sit Down'];
const DEFAULT_RIVALRIES: Rivalry[] = [
    { id: 'bvg', team1: 'Boys', team2: 'Girls' },
    { id: 'svl', team1: 'Students', team2: 'Leaders' }
];

type Tab = 'Middle School' | 'High School' | 'College';
type SortOption = 'newest' | 'rating' | 'alpha';

// Custom Logo Component (Flame + Heart)
const PursuitLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316"/> {/* orange-500 */}
        <stop offset="1" stopColor="#DC2626"/> {/* red-600 */}
      </linearGradient>
      <filter id="glow" x="-4" y="-4" width="32" height="32" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Outer Flame */}
    <path 
      d="M12 2C12 2 19 8 19 14C19 18.5 15.5 22 12 22C8.5 22 5 18.5 5 14C5 8 12 2 12 2Z" 
      fill="url(#logoGradient)" 
      stroke="white" 
      strokeWidth="1"
      strokeOpacity="0.2"
    />
    {/* Inner Heart */}
    <path 
      d="M12 18L10.8 16.9C8.6 14.9 7.5 13.6 7.5 12C7.5 10.7 8.5 9.7 9.8 9.7C10.5 9.7 11.2 10 11.6 10.5L12 10.9L12.4 10.5C12.8 10 13.5 9.7 14.2 9.7C15.5 9.7 16.5 10.7 16.5 12C16.5 13.6 15.4 14.9 13.2 16.9L12 18Z" 
      fill="white"
    />
  </svg>
);

const App: React.FC = () => {
  // Load Dark Mode Preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('pursuit_theme');
    // Default to light if not set, or system preference
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Load Games
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem('youth_group_games');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_GAMES;
    return parsed.map((g: any) => ({
        ...g,
        category: g.category || 'Uncategorized',
        targetGroup: g.targetGroup || 'Both',
        lastUpdated: g.lastUpdated || Date.now(),
        tags: g.tags || []
    }));
  });

  // Load Categories
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('youth_group_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Load Tags
  const [tags, setTags] = useState<string[]>(() => {
      const saved = localStorage.getItem('pursuit_tags');
      return saved ? JSON.parse(saved) : DEFAULT_TAGS;
  });

  // Load Rivalries
  const [rivalries, setRivalries] = useState<Rivalry[]>(() => {
      const saved = localStorage.getItem('pursuit_rivalries');
      return saved ? JSON.parse(saved) : DEFAULT_RIVALRIES;
  });

  // Load Results
  const [results, setResults] = useState<GameResult[]>(() => {
      const saved = localStorage.getItem('pursuit_results');
      return saved ? JSON.parse(saved) : [];
  });

  // Load Recent Players
  const [recentPlayers, setRecentPlayers] = useState<string[]>(() => {
      const saved = localStorage.getItem('pursuit_recent_players');
      return saved ? JSON.parse(saved) : [];
  });

  // Load Messages
  const [messages, setMessages] = useState<GroupMessage[]>(() => {
      const saved = localStorage.getItem('pursuit_messages');
      return saved ? JSON.parse(saved) : [];
  });

  // Load Sync ID
  const [syncId, setSyncId] = useState<string | null>(() => {
      return localStorage.getItem('pursuit_sync_id');
  });

  // Load User Profile
  const [user, setUser] = useState<UserProfile | null>(() => {
      const saved = localStorage.getItem('pursuit_user_profile');
      return saved ? JSON.parse(saved) : null;
  });

  // Active Timer State - Loaded from storage for persistence
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
      const saved = localStorage.getItem('pursuit_active_timer');
      return saved ? JSON.parse(saved) : null;
  });

  const [timeLeft, setTimeLeft] = useState<string>('00:00');
  const [showTimesUp, setShowTimesUp] = useState(false);
  
  // Track dismissed timer IDs to prevent zombie timers from sync - Loaded from storage
  const dismissedTimerIdRef = useRef<string | null>(localStorage.getItem('pursuit_dismissed_timer_id'));

  const [activeTab, setActiveTab] = useState<Tab>('Middle School');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Rating Modal State
  const [ratingGame, setRatingGame] = useState<Game | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Winner Modal State
  const [winnerGame, setWinnerGame] = useState<Game | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // AI Modal State
  const [aiGame, setAiGame] = useState<Game | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  // Game Details View State (Expanded Card)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Validating loading state for sync operations

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Refs for checking current state in async intervals
  const gamesRef = useRef(games);
  const categoriesRef = useRef(categories);
  const tagsRef = useRef(tags);
  const rivalriesRef = useRef(rivalries);
  const resultsRef = useRef(results);
  const recentPlayersRef = useRef(recentPlayers);
  const activeTimerRef = useRef(activeTimer);
  const messagesRef = useRef(messages);
  const isMessagingOpenRef = useRef(isMessagingOpen);

  // Capture Install Prompt
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pursuit_theme', isDarkMode ? 'dark' : 'light');
    
    // Update theme color meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDarkMode ? '#000000' : '#F5F5F7');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
      playClick();
      setIsDarkMode(prev => !prev);
  };

  // Check for profile on mount
  useEffect(() => {
    if (!user) {
        setIsProfileModalOpen(true);
    }
  }, [user]);

  useEffect(() => {
      gamesRef.current = games;
      localStorage.setItem('youth_group_games', JSON.stringify(games));
      // Update selectedGame if the underlying game data changes (e.g. AI update)
      if (selectedGame) {
          const updated = games.find(g => g.id === selectedGame.id);
          if (updated && updated !== selectedGame) {
              setSelectedGame(updated);
          }
      }
  }, [games, selectedGame]);

  useEffect(() => {
      categoriesRef.current = categories;
      localStorage.setItem('youth_group_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
      tagsRef.current = tags;
      localStorage.setItem('pursuit_tags', JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
      rivalriesRef.current = rivalries;
      localStorage.setItem('pursuit_rivalries', JSON.stringify(rivalries));
  }, [rivalries]);

  useEffect(() => {
      resultsRef.current = results;
      localStorage.setItem('pursuit_results', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
      recentPlayersRef.current = recentPlayers;
      localStorage.setItem('pursuit_recent_players', JSON.stringify(recentPlayers));
  }, [recentPlayers]);

  useEffect(() => {
      messagesRef.current = messages;
      localStorage.setItem('pursuit_messages', JSON.stringify(messages));
      
      // Calculate unread
      const lastRead = parseInt(localStorage.getItem('pursuit_last_read_msg') || '0');
      const unread = messages.filter(m => m.timestamp > lastRead).length;
      setUnreadCount(unread);

  }, [messages]);

  useEffect(() => {
      isMessagingOpenRef.current = isMessagingOpen;
      if (isMessagingOpen) {
          localStorage.setItem('pursuit_last_read_msg', Date.now().toString());
          setUnreadCount(0);
          // Request permission when opening chat
          requestNotificationPermission();
      }
  }, [isMessagingOpen]);

  useEffect(() => {
      activeTimerRef.current = activeTimer;
      if (activeTimer) {
          localStorage.setItem('pursuit_active_timer', JSON.stringify(activeTimer));
          if (activeTimer.status === 'running') {
              document.title = '⏱️ Pursuit';
          }
      } else {
          localStorage.removeItem('pursuit_active_timer');
          document.title = 'Pursuit - Youth Group Games';
      }
  }, [activeTimer]);

  useEffect(() => {
      if (syncId) {
          localStorage.setItem('pursuit_sync_id', syncId);
      } else {
          localStorage.removeItem('pursuit_sync_id');
      }
  }, [syncId]);

  useEffect(() => {
      if (user) {
          localStorage.setItem('pursuit_user_profile', JSON.stringify(user));
      }
  }, [user]);

  // --- Timer Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
        if (activeTimer && activeTimer.status === 'running') {
            const now = Date.now();
            const diff = activeTimer.endTime - now;
            
            if (diff <= 0) {
                // Time up locally
                setTimeLeft("00:00");
                document.title = "⏰ Time Up! - Pursuit";
                if (!showTimesUp) {
                    setShowTimesUp(true);
                    playAlarm();
                    sendNotification("Time's Up!", `${activeTimer.label} has finished.`);
                    // We DO NOT auto-end here to avoid fighting with sync.
                    // We let the user dismiss it, which handles the status update.
                }
            } else {
                const m = Math.floor((diff / 1000) / 60);
                const s = Math.floor((diff / 1000) % 60);
                const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                setTimeLeft(timeStr);
                document.title = `${timeStr} - ${activeTimer.label}`;
            }
        } else if (activeTimer && activeTimer.status === 'ended' && !showTimesUp) {
            // If we receive an 'ended' status from cloud but haven't shown alert yet
            // AND we haven't already dismissed this specific timer
            if (activeTimer.id !== dismissedTimerIdRef.current) {
                setShowTimesUp(true);
                playAlarm();
                sendNotification("Game Over", `${activeTimer.label} has been stopped.`);
                document.title = "⏰ Game Over - Pursuit";
            } else {
                // If we already dismissed it, we should probably clear it from view if it's still lingering
                setActiveTimer(null);
            }
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, showTimesUp]);

  // --- Sync Logic: Merge Helper ---
  const mergeData = useCallback((
      incomingGames: Game[], 
      incomingCategories: string[], 
      incomingTags?: string[], 
      incomingResults?: GameResult[],
      incomingPlayers?: string[],
      incomingTimer?: ActiveTimer | null,
      incomingRivalries?: Rivalry[],
      incomingMessages?: GroupMessage[]
    ) => {
      const currentGames = gamesRef.current;
      const currentCategories = categoriesRef.current;
      const currentTags = tagsRef.current;
      const currentResults = resultsRef.current;
      const currentPlayers = recentPlayersRef.current;
      const currentTimer = activeTimerRef.current;
      const currentRivalries = rivalriesRef.current;
      const currentMessages = messagesRef.current;
      
      let hasChanges = false;
      let addedCount = 0;
      let updatedCount = 0;

      // 0. Merge Timer
      if (incomingTimer) {
          if (incomingTimer.id !== dismissedTimerIdRef.current) {
              if (!currentTimer || incomingTimer.id !== currentTimer.id || incomingTimer.status !== currentTimer.status) {
                  setActiveTimer(incomingTimer);
                  if (incomingTimer.status === 'running' && incomingTimer.id !== currentTimer?.id) {
                      setShowTimesUp(false); 
                      dismissedTimerIdRef.current = null;
                      localStorage.removeItem('pursuit_dismissed_timer_id');
                      sendNotification("New Timer Started", `${incomingTimer.label} has begun!`);
                  }
              }
          }
      } else if (currentTimer && incomingTimer === null) {
          setActiveTimer(null);
      }

      // 0b. Merge Messages
      if (incomingMessages) {
          const mergedMsgsMap = new Map<string, GroupMessage>();
          currentMessages.forEach(m => mergedMsgsMap.set(m.id, m));
          
          let msgsChanged = false;
          let newIncoming = false;
          let lastSender = "";
          let lastContent = "";
          
          incomingMessages.forEach(m => {
              if (!mergedMsgsMap.has(m.id)) {
                  mergedMsgsMap.set(m.id, m);
                  msgsChanged = true;
                  // Only count as new if it's recent (prevents sounding on massive history sync)
                  if (Date.now() - m.timestamp < 30000) { 
                      newIncoming = true;
                      lastSender = m.senderName;
                      lastContent = m.content;
                  }
              }
          });

          if (msgsChanged) {
              const sortedMsgs = Array.from(mergedMsgsMap.values()).sort((a, b) => a.timestamp - b.timestamp);
              setMessages(sortedMsgs);
              
              if (newIncoming && !isMessagingOpenRef.current) {
                  playMessage();
                  sendNotification(`Message from ${lastSender}`, lastContent);
              }
          }
      }

      // 1. Merge Categories
      const newCategories = [...currentCategories];
      let categoriesChanged = false;
      incomingCategories.forEach(cat => {
          if (!newCategories.includes(cat)) {
              newCategories.push(cat);
              categoriesChanged = true;
          }
      });
      if (categoriesChanged) setCategories(newCategories);

      // 2. Merge Tags
      if (incomingTags) {
          const newTags = [...currentTags];
          let tagsChanged = false;
          incomingTags.forEach(tag => {
              if (!newTags.includes(tag)) {
                  newTags.push(tag);
                  tagsChanged = true;
              }
          });
          if (tagsChanged) setTags(newTags);
      }

      // 2b. Merge Rivalries
      if (incomingRivalries) {
          const newRivalries = [...currentRivalries];
          let rivalriesChanged = false;
          const currentIds = new Set(newRivalries.map(r => r.id));
          
          incomingRivalries.forEach(r => {
              if (!currentIds.has(r.id)) {
                  newRivalries.push(r);
                  currentIds.add(r.id);
                  rivalriesChanged = true;
              }
          });
          if (rivalriesChanged) setRivalries(newRivalries);
      }

      // 3. Merge Results (Simple Append/Dedupe by ID)
      if (incomingResults) {
          const mergedResultsMap = new Map<string, GameResult>();
          currentResults.forEach(r => mergedResultsMap.set(r.id, r));
          
          let resultsChanged = false;
          incomingResults.forEach(r => {
              if (!mergedResultsMap.has(r.id)) {
                  mergedResultsMap.set(r.id, r);
                  resultsChanged = true;
              }
          });

          if (resultsChanged) {
              setResults(Array.from(mergedResultsMap.values()).sort((a, b) => b.timestamp - a.timestamp));
          }
      }

      // 4. Merge Recent Players
      if (incomingPlayers) {
          const mergedPlayers = Array.from(new Set([...currentPlayers, ...incomingPlayers])).slice(0, 20);
          const isDifferent = JSON.stringify(mergedPlayers.sort()) !== JSON.stringify([...currentPlayers].sort());
          if (isDifferent) {
              setRecentPlayers(mergedPlayers);
          }
      }

      // 5. Smart Merge Games (including deletion logic)
      const mergedGamesMap = new Map<string, Game>();
      
      currentGames.forEach(g => mergedGamesMap.set(g.id, g));

      incomingGames.forEach(incomingGame => {
          const existingGame = mergedGamesMap.get(incomingGame.id);
          
          if (!existingGame) {
              mergedGamesMap.set(incomingGame.id, incomingGame);
              addedCount++;
              hasChanges = true;
          } else {
              const existingTime = existingGame.lastUpdated || 0;
              const incomingTime = incomingGame.lastUpdated || 0;
              // Check if contents are different OR if we are receiving a delete status
              const isDifferent = JSON.stringify(existingGame) !== JSON.stringify(incomingGame);

              // We take the incoming game if it's newer and different
              if (incomingTime > existingTime && isDifferent) {
                  mergedGamesMap.set(incomingGame.id, incomingGame);
                  updatedCount++;
                  hasChanges = true;
              }
          }
      });

      if (hasChanges) {
          const finalGamesList = Array.from(mergedGamesMap.values())
              .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
          setGames(finalGamesList);
      }
      
      return { addedCount, updatedCount, hasChanges };
  }, []);

  // --- Sync Logic: Push ---
  const pushToCloud = useCallback(async (
      currentGames: Game[], 
      currentCategories: string[], 
      currentTags: string[], 
      currentResults: GameResult[],
      currentPlayers: string[],
      currentTimer: ActiveTimer | null,
      currentRivalries: Rivalry[],
      currentMessages: GroupMessage[]
    ) => {
      if (!syncId) return;
      try {
          setIsSyncing(true);
          const exportData: ExportData = {
              version: 1,
              timestamp: Date.now(),
              games: currentGames,
              categories: currentCategories,
              tags: currentTags,
              results: currentResults,
              recentPlayers: currentPlayers,
              activeTimer: currentTimer,
              rivalries: currentRivalries,
              messages: currentMessages
          };
          await updateBlob(syncId, exportData);
      } catch (error) {
          console.error("Cloud push failed:", error);
      } finally {
          setIsSyncing(false);
      }
  }, [syncId]);

  // --- Sync Logic: Poll & Join ---
  
  // 1. Check URL for join code
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const incomingSyncId = params.get('sync_id');
      
      if (incomingSyncId) {
          setSyncId(incomingSyncId);
          window.history.replaceState({}, '', window.location.pathname);
          setIsSyncing(true);
          getBlob(incomingSyncId)
            .then(data => {
                if (data && data.games) {
                    mergeData(
                        data.games, 
                        data.categories || [], 
                        data.tags || [], 
                        data.results || [],
                        data.recentPlayers || [],
                        data.activeTimer || null,
                        data.rivalries || [],
                        data.messages || []
                    );
                    playSuccess();
                }
            })
            .catch(err => console.error("Join failed", err))
            .finally(() => setIsSyncing(false));
      }
  }, [mergeData]);

  // 2. Polling Interval (Every 30s)
  useEffect(() => {
      if (!syncId) return;

      const poll = async () => {
          try {
              setIsSyncing(true);
              const data = await getBlob(syncId);
              if (data && data.games) {
                  mergeData(
                      data.games, 
                      data.categories || [], 
                      data.tags || [], 
                      data.results || [],
                      data.recentPlayers || [],
                      data.activeTimer || null,
                      data.rivalries || [],
                      data.messages || []
                  );
              }
          } catch (e) {
              console.error("Poll failed", e);
          } finally {
              setIsSyncing(false);
          }
      };

      poll();

      const interval = setInterval(poll, 30000); // 30 seconds
      return () => clearInterval(interval);
  }, [syncId, mergeData]);


  // --- Actions Wrapped with Sync ---

  const handleStartTimer = (minutes: number, label: string) => {
      // Request permission immediately when starting interaction
      requestNotificationPermission();
      
      const now = Date.now();
      const newTimer: ActiveTimer = {
          id: crypto.randomUUID(),
          label,
          duration: minutes,
          endTime: now + (minutes * 60 * 1000),
          status: 'running',
          startedBy: user?.name || 'Unknown'
      };
      
      setActiveTimer(newTimer);
      setShowTimesUp(false);
      dismissedTimerIdRef.current = null;
      localStorage.removeItem('pursuit_dismissed_timer_id');
      playSuccess();
      pushToCloud(games, categories, tags, results, recentPlayers, newTimer, rivalries, messages);
  };

  const handleStopTimer = () => {
      if (activeTimer) {
          const endedTimer: ActiveTimer = { ...activeTimer, status: 'ended' };
          setActiveTimer(endedTimer);
          pushToCloud(games, categories, tags, results, recentPlayers, endedTimer, rivalries, messages);
          playDelete();
          setShowTimesUp(true);
          playAlarm();
      }
  };
  
  const handleDismissAlarm = () => {
      setShowTimesUp(false);
      if (activeTimer) {
        const id = activeTimer.id;
        dismissedTimerIdRef.current = id;
        localStorage.setItem('pursuit_dismissed_timer_id', id);
        
        if (activeTimer.status === 'running') {
             const endedTimer: ActiveTimer = { ...activeTimer, status: 'ended' };
             setActiveTimer(null);
             pushToCloud(games, categories, tags, results, recentPlayers, endedTimer, rivalries, messages);
        } else {
            setActiveTimer(null);
        }
      }
  };

  const handleGenerateGame = async (prompt: string, category: string, targetGroup: TargetGroup, manualTags: string[]) => {
    setIsLoading(true);
    try {
      const gameData = await generateGame(prompt, manualTags);
      const newGame: Game = {
        ...gameData,
        id: Date.now().toString(),
        rating: 0,
        category,
        targetGroup,
        lastUpdated: Date.now(),
        createdBy: user?.name,
        creatorId: user?.id
      };
      
      setGames(prev => {
          const next = [newGame, ...prev];
          pushToCloud(next, categories, tags, results, recentPlayers, activeTimer, rivalries, messages);
          return next;
      });
      
      setIsModalOpen(false);
      playSuccess();
      setSelectedCategory(category);
      if (targetGroup !== 'Both') {
          setActiveTab(targetGroup as Tab);
      }
    } catch (error) {
      console.error("Failed to generate game:", error);
      alert("Oops! Couldn't generate a game right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGame = (updatedGame: Game) => {
      setGames(prev => {
          const next = prev.map(g => g.id === updatedGame.id ? { ...updatedGame, lastUpdated: Date.now() } : g);
          pushToCloud(next, categories, tags, results, recentPlayers, activeTimer, rivalries, messages);
          return next;
      });
      setSelectedGame(updatedGame);
      playSuccess();
  }

  const handleSendMessage = (text: string) => {
      const newMessage: GroupMessage = {
          id: crypto.randomUUID(),
          senderId: user?.id || 'guest',
          senderName: user?.name || 'Guest',
          senderColor: user?.color || 'bg-slate-400',
          senderEmoji: user?.emoji,
          content: text,
          timestamp: Date.now()
      };
      
      setMessages(prev => {
          const next = [...prev, newMessage];
          pushToCloud(games, categories, tags, results, recentPlayers, activeTimer, rivalries, next);
          return next;
      });
  };

  const handleOpenRating = (game: Game) => {
    playPop();
    setRatingGame(game);
    setIsRatingModalOpen(true);
  };

  const handleOpenWinner = (game: Game) => {
      playPop();
      setWinnerGame(game);
      setIsWinnerModalOpen(true);
  }

  const handleOpenAI = (game: Game) => {
      playPop();
      setAiGame(game);
      setIsAiModalOpen(true);
  }

  const handleGameClick = (game: Game) => {
      setSelectedGame(game);
  }

  const handleUpdateRules = (gameId: string, newRules: string) => {
      setGames(prev => {
          const next = prev.map(g => g.id === gameId ? { ...g, rules: newRules, lastUpdated: Date.now() } : g);
          pushToCloud(next, categories, tags, results, recentPlayers, activeTimer, rivalries, messages);
          return next;
      });
  }

  const handleSaveRating = (id: string, rating: number) => {
    setGames(prev => {
        const next = prev.map(g => g.id === id ? { ...g, rating, lastUpdated: Date.now() } : g);
        pushToCloud(next, categories, tags, results, recentPlayers, activeTimer, rivalries, messages);
        return next;
    });
    playSuccess();
  };

  const handleLogWin = (result: GameResult) => {
      let newPlayers = recentPlayers;

      const allRivalryTeams = new Set(rivalries.flatMap(r => [r.team1, r.team2]));
      
      if (result.type === 'Individual' && !allRivalryTeams.has(result.winner)) {
           const filtered = recentPlayers.filter(p => p !== result.winner);
           newPlayers = [result.winner, ...filtered].slice(0, 8);
           setRecentPlayers(newPlayers);
      }

      setResults(prev => {
          const next = [result, ...prev];
          pushToCloud(games, categories, tags, next, newPlayers, activeTimer, rivalries, messages);
          return next;
      });

      playSuccess();
      setIsWinnerModalOpen(false);
  }

  const handleDeleteGame = (id: string) => {
      if(confirm('Are you sure you want to delete this game?')) {
          playDelete();
          // We mark as deleted instead of just removing, to ensure the deletion syncs
          setGames(prev => {
              const next = prev.map(g => g.id === id ? { ...g, isDeleted: true, lastUpdated: Date.now() } : g);
              // We also immediately push to cloud
              pushToCloud(next, categories, tags, results, recentPlayers, activeTimer, rivalries, messages);
              return next;
          });
          setSelectedGame(null); // Close detail view if open
      }
  }

  const handleCreateCategory = (name: string) => {
      if (!categories.includes(name)) {
          setCategories(prev => {
              const next = [...prev, name];
              pushToCloud(games, next, tags, results, recentPlayers, activeTimer, rivalries, messages);
              return next;
          });
          playSuccess();
      }
  };

  const handleDeleteCategory = (name: string) => {
      if(confirm(`Are you sure you want to delete the category "${name}"?`)) {
          playDelete();
          setCategories(prev => {
              const next = prev.filter(c => c !== name);
              pushToCloud(games, next, tags, results, recentPlayers, activeTimer, rivalries, messages);
              return next;
          });
          if (selectedCategory === name) {
              setSelectedCategory('All');
          }
      }
  }

  const handleCreateTag = (name: string) => {
      if (!tags.includes(name)) {
          setTags(prev => {
              const next = [...prev, name];
              pushToCloud(games, categories, next, results, recentPlayers, activeTimer, rivalries, messages);
              return next;
          });
          playSuccess();
      }
  }

  const handleDeleteTag = (name: string) => {
      if(confirm(`Delete tag "${name}"?`)) {
          playDelete();
          setTags(prev => {
              const next = prev.filter(t => t !== name);
              pushToCloud(games, categories, next, results, recentPlayers, activeTimer, rivalries, messages);
              return next;
          });
          setFilterTags(prev => prev.filter(t => t !== name));
      }
  }

  const handleCreateRivalry = (team1: string, team2: string) => {
      const newRivalry: Rivalry = {
          id: crypto.randomUUID(),
          team1,
          team2
      };
      setRivalries(prev => {
          const next = [...prev, newRivalry];
          pushToCloud(games, categories, tags, results, recentPlayers, activeTimer, next, messages);
          return next;
      });
      playSuccess();
  }

  const handleDeleteRivalry = (id: string) => {
      if(confirm("Delete this rivalry?")) {
          playDelete();
          setRivalries(prev => {
              const next = prev.filter(r => r.id !== id);
              pushToCloud(games, categories, tags, results, recentPlayers, activeTimer, next, messages);
              return next;
          });
      }
  }

  const handleSaveProfile = (profile: UserProfile) => {
      setUser(profile);
      setIsProfileModalOpen(false);
      playSuccess();
      // Ask for permission when profile is saved (early opt-in)
      requestNotificationPermission();
  };

  const handleStartLiveSync = async () => {
      try {
          setIsSyncing(true);
          const exportData: ExportData = {
              version: 1,
              timestamp: Date.now(),
              games: games,
              categories: categories,
              tags: tags,
              results: results,
              recentPlayers: recentPlayers,
              activeTimer: activeTimer,
              rivalries: rivalries,
              messages: messages
          };
          const id = await createBlob(exportData);
          setSyncId(id);
          playSuccess();
      } catch (e) {
          alert('Failed to start sync. Please try again.');
          console.error(e);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleStopSync = () => {
      if(confirm("Stop syncing? This device will no longer receive updates from the group.")) {
        setSyncId(null);
        playDelete();
      }
  };

  const handleImportData = (data: ExportData) => {
      const result = mergeData(
          data.games, 
          data.categories, 
          data.tags, 
          data.results, 
          data.recentPlayers,
          data.activeTimer,
          data.rivalries,
          data.messages
      );
      playSuccess();
      
      if (result.addedCount > 0 || result.updatedCount > 0) {
          alert(`Import Complete!\n\nAdded: ${result.addedCount} new games\nUpdated: ${result.updatedCount} existing games`);
      } else {
          alert('Import Complete! Your library is already up to date.');
      }
  };

  const handleSortToggle = () => {
      playClick();
      setSortBy(prev => {
          if (prev === 'newest') return 'rating';
          if (prev === 'rating') return 'alpha';
          return 'newest';
      });
  };

  // Ensure deleted games don't show up
  const filteredGames = games.filter(g => {
    if (g.isDeleted) return false;
    
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          g.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (g.createdBy && g.createdBy.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = g.targetGroup === 'Both' || g.targetGroup === activeTab;
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesTags = filterTags.length === 0 || filterTags.every(ft => g.tags.includes(ft));

    return matchesSearch && matchesTab && matchesCategory && matchesTags;
  }).sort((a, b) => {
      if (sortBy === 'rating') {
          return b.rating - a.rating; // Highest rating first
      }
      if (sortBy === 'alpha') {
          return a.title.localeCompare(b.title); // A-Z
      }
      return Number(b.id) - Number(a.id);
  });

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-[#1D1D1F] dark:text-white bg-[#F5F5F7] dark:bg-black transition-colors duration-500">
      
      {/* Atmospheric Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-400/30 dark:bg-orange-600/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-red-400/30 dark:bg-red-900/10 rounded-full blur-[120px] pointer-events-none transition-colors duration-500" />
      <div className="fixed top-[20%] right-[10%] w-[300px] h-[300px] bg-amber-300/20 dark:bg-amber-500/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-500" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass-panel border-b border-white/40 dark:border-white/5 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setActiveTab('Middle School')}>
                    <div className="absolute inset-0 bg-orange-600 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <PursuitLogo className="w-10 h-10 relative z-10 drop-shadow-md" />
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">Pursuit</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">Game Library</p>
                        {syncId && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                <Wifi className="w-3 h-3" />
                                Live
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Center Timer Display (If Active) */}
            {activeTimer && activeTimer.status === 'running' && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#1D1D1F] dark:bg-white dark:text-black text-white px-3 py-1.5 rounded-full shadow-lg animate-in fade-in zoom-in-95 cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedGame(games.find(g => g.title === activeTimer.label) || null)}>
                    <Timer className="w-4 h-4 text-orange-500 animate-pulse" />
                    <span className="font-mono font-bold tracking-widest">{timeLeft}</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleStopTimer(); }} 
                        className="ml-1 p-0.5 bg-white/20 dark:bg-black/10 rounded-full hover:bg-red-500 dark:hover:bg-red-500 transition-colors"
                        title="Game Over"
                    >
                        <StopCircle className="w-4 h-4" />
                    </button>
                </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-3">
                
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full transition-all shadow-sm hover:shadow-md border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/20 text-slate-600 dark:text-slate-300"
                    title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Chat Button */}
                <button
                    onClick={() => { playPop(); setIsMessagingOpen(true); }}
                    className="relative p-2.5 rounded-full transition-all shadow-sm hover:shadow-md border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/20 text-indigo-600 dark:text-indigo-400"
                    title="Team Chat"
                >
                    <MessageCircle className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <div className="h-6 w-px bg-slate-300 dark:bg-white/10 mx-1"></div>

                {/* Profile Button */}
                <button
                    onClick={() => { playPop(); setIsProfileModalOpen(true); }}
                    className="flex items-center gap-2 p-1.5 pr-3 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/20 border border-white/60 dark:border-white/10 rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer"
                    title="Your Profile"
                >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${user?.color || 'bg-slate-400'}`}>
                        {user?.emoji ? <span className="text-sm">{user.emoji}</span> : (user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5" />)}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">
                        {user?.name || 'Guest'}
                    </span>
                </button>
                
                 <button
                    onClick={() => { playPop(); setIsLeaderboardOpen(true); }}
                    className="p-2.5 rounded-full transition-all shadow-sm hover:shadow-md border border-white/60 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/20 text-orange-600 dark:text-orange-400"
                    title="Leaderboard"
                >
                    <Crown className="w-5 h-5" />
                </button>

                <button
                    onClick={() => { playPop(); setIsSyncModalOpen(true); }}
                    className={`p-2.5 rounded-full transition-all shadow-sm hover:shadow-md border border-white/60 dark:border-white/10 ${syncId ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/20 text-slate-600 dark:text-slate-300'}`}
                    title="Sync Games"
                >
                    {syncId ? <Cloud className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                </button>

                <button 
                    onClick={() => { playPop(); setIsModalOpen(true); }}
                    className="hidden sm:flex items-center gap-2 bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-slate-200 text-white dark:text-black px-5 py-2.5 rounded-full font-medium transition-all shadow-xl shadow-black/5 hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Game</span>
                </button>
                
                <button 
                     onClick={() => { playPop(); setIsModalOpen(true); }}
                     className="sm:hidden bg-[#1D1D1F] dark:bg-white text-white dark:text-black p-2.5 rounded-full shadow-lg"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* Tab Switcher (Segmented Control) */}
        <div className="flex justify-center mb-8">
            <div className="bg-slate-200/50 dark:bg-white/10 backdrop-blur-md p-1 rounded-2xl inline-flex relative shadow-inner overflow-hidden border border-white/20 dark:border-white/5">
                {['Middle School', 'High School', 'College'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => { playClick(); setActiveTab(tab as Tab); }}
                        className={`
                            relative z-10 px-4 sm:px-8 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300
                            ${activeTab === tab 
                                ? 'bg-white dark:bg-[#1D1D1F] text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search games..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                    />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    {/* Sort Button */}
                    <button
                        onClick={handleSortToggle}
                        className="p-3 bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
                        title="Sort Games"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="text-xs font-semibold">
                            {sortBy === 'newest' ? 'Newest' : sortBy === 'rating' ? 'Top Rated' : 'A-Z'}
                        </span>
                    </button>

                    <button
                        onClick={() => { playClick(); setIsFilterModalOpen(true); }}
                        className={`p-3 rounded-2xl border transition-colors shadow-sm flex items-center gap-2
                            ${filterTags.length > 0 
                                ? 'bg-orange-50 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400' 
                                : 'bg-white/70 dark:bg-white/5 border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
                            }
                        `}
                        title="Filter by Tags"
                    >
                        <Filter className="w-4 h-4" />
                        {filterTags.length > 0 && <span className="text-xs font-bold">{filterTags.length}</span>}
                    </button>

                    <div className="h-auto w-px bg-slate-300 dark:bg-white/10 mx-1"></div>

                    <button
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="p-3 bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-white/60 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm"
                        title="Manage Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <div className="h-auto w-px bg-slate-300 dark:bg-white/10 mx-1"></div>
                    <button
                        onClick={() => { playClick(); setSelectedCategory('All'); }}
                        className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all border ${selectedCategory === 'All' ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-black border-transparent shadow-md' : 'bg-white/70 dark:bg-white/5 border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'}`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { playClick(); setSelectedCategory(cat); }}
                            className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-black border-transparent shadow-md' : 'bg-white/70 dark:bg-white/5 border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Filters Display */}
            {filterTags.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2">
                    {filterTags.map(tag => (
                         <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs font-semibold rounded-full border border-orange-200 dark:border-orange-500/30">
                            {tag}
                            <button 
                                onClick={() => setFilterTags(prev => prev.filter(t => t !== tag))}
                                className="hover:text-orange-900 dark:hover:text-orange-200 focus:outline-none"
                            >
                                <X className="w-3 h-3" />
                            </button>
                         </span>
                    ))}
                    <button 
                        onClick={() => setFilterTags([])}
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 ml-2"
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>

        {/* Game Grid */}
        {filteredGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No games found</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
                    {filterTags.length > 0 
                        ? "No games match all your selected filters." 
                        : searchTerm 
                            ? "Try adjusting your search terms." 
                            : "Get started by adding a new game!"
                    }
                </p>
                {filterTags.length > 0 && (
                    <button 
                        onClick={() => setFilterTags([])} 
                        className="mt-4 text-orange-600 dark:text-orange-400 font-semibold hover:underline"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGames.map((game) => (
                    <GameCard 
                        key={game.id} 
                        game={game} 
                        onClick={handleGameClick}
                        onRateClick={handleOpenRating} 
                        onDelete={handleDeleteGame}
                        onLogWin={handleOpenWinner}
                        onOpenAI={handleOpenAI}
                    />
                ))}
            </div>
        )}
      </main>

      {/* Expanded Game Details View */}
      <GameDetailsView 
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        onRate={handleOpenRating}
        onLogWin={handleOpenWinner}
        onOpenAI={handleOpenAI}
        onDelete={handleDeleteGame}
        onUpdateGame={handleUpdateGame}
        allTags={tags}
        onCreateTag={handleCreateTag}
        activeTimer={activeTimer}
        onStartTimer={handleStartTimer}
        onStopTimer={handleStopTimer}
      />

      {/* Timer Alert Modal */}
      {showTimesUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={handleDismissAlarm} />
             <div className="relative bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in-95 bounce-in duration-500 border-4 border-red-500">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <BellRing className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-4xl font-black text-red-600 dark:text-red-500 mb-2 uppercase tracking-tighter">Time's Up!</h2>
                <p className="text-slate-600 dark:text-slate-300 font-medium text-lg mb-8">
                    {activeTimer?.label ? `"${activeTimer.label}" has ended.` : "The game is over."}
                </p>
                <button 
                    onClick={handleDismissAlarm}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-red-700 transition-colors"
                >
                    Dismiss Alarm
                </button>
             </div>
        </div>
      )}

      {/* Modals */}
      <AddGameModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onGenerate={handleGenerateGame}
        isLoading={isLoading}
        categories={categories}
        allTags={tags}
        user={user}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
        categories={categories}
        onCreateTag={handleCreateTag}
        onDeleteTag={handleDeleteTag}
        tags={tags}
        onCreateRivalry={handleCreateRivalry}
        onDeleteRivalry={handleDeleteRivalry}
        rivalries={rivalries}
        deferredPrompt={deferredPrompt}
        onInstall={handleInstallClick}
      />
      
      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        allTags={tags}
        selectedTags={filterTags}
        onToggleTag={(tag) => {
            playClick();
            setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
        }}
        onClear={() => { playClick(); setFilterTags([]); setIsFilterModalOpen(false); }}
      />
      
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSave={handleSaveRating}
        game={ratingGame}
      />

      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        games={games}
        categories={categories}
        tags={tags}
        results={results}
        recentPlayers={recentPlayers}
        onImport={handleImportData}
        syncId={syncId}
        onStartLiveSync={handleStartLiveSync}
        onStopSync={handleStopSync}
        isSyncing={isSyncing}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        initialUser={user}
      />

      <WinnerModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        game={winnerGame}
        onSave={handleLogWin}
        user={user}
        recentPlayers={recentPlayers}
        rivalries={rivalries}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        results={results}
        user={user}
        rivalries={rivalries}
      />

      <GameAIModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        game={aiGame}
        onUpdateRules={handleUpdateRules}
      />

      <MessagingModal
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        user={user}
      />
      
    </div>
  );
};

export default App;
