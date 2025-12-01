

export type TargetGroup = 'Middle School' | 'High School' | 'College' | 'Both';

export interface UserProfile {
  id: string;
  name: string;
  color: string; // hex code or tailwind class for avatar background
  emoji?: string; // New optional field for profile emoji
}

export interface Game {
  id: string;
  title: string;
  rules: string;
  materials: string;
  duration: string;
  rating: number; // 0 to 5
  tags: string[];
  category: string;
  targetGroup: TargetGroup;
  lastUpdated?: number; // Timestamp for sync merging
  createdBy?: string; // Name of the user who created it
  creatorId?: string; // ID of the user (for potential future ownership logic)
  isDeleted?: boolean; // Soft delete flag for sync
}

export interface GameResult {
  id: string;
  gameId: string;
  gameTitle: string;
  winner: string; // "Boys", "Girls", "Students", "Leaders", or "PlayerName"
  type: 'Team' | 'Individual';
  timestamp: number;
}

export interface ActiveTimer {
  id: string;
  label: string;
  endTime: number; // Unix timestamp when it ends
  duration: number; // Original duration in minutes
  status: 'running' | 'ended';
  startedBy: string;
}

export interface Rivalry {
  id: string;
  team1: string;
  team2: string;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderEmoji?: string;
  content: string;
  timestamp: number;
}

export interface AppState {
  games: Game[];
  isModalOpen: boolean;
  isLoading: boolean;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface ExportData {
  version: number;
  timestamp: number;
  games: Game[];
  categories: string[];
  tags?: string[];
  results?: GameResult[];
  recentPlayers?: string[];
  activeTimer?: ActiveTimer | null;
  rivalries?: Rivalry[];
  messages?: GroupMessage[];
}