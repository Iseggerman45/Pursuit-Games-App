export type TargetGroup = 'Middle School' | 'High School' | 'College';

export interface UserProfile {
  id: string;
  name: string;
  color: string;
  emoji?: string;
}

export interface Player {
  id: string;
  name: string;
  age: string;
  gender: 'Male' | 'Female' | 'Other';
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
  lastUpdated?: number;
}

export interface Game {
  id: string;
  title: string;
  rules: string;
  materials: string;
  duration: string;
  minPlayers: string;
  rating: number;
  ratingCount?: number;
  tags: string[];
  category: string;
  targetGroups: TargetGroup[];
  lastUpdated?: number;
  createdBy?: string;
  creatorId?: string;
  isDeleted?: boolean;
  folderId?: string;
  diagramUrl?: string;
  diagramData?: string; // JSON string of DiagramObject[]
  hasDiagram?: boolean; // Flag to indicate if a separate asset exists in cloud
}

export interface DiagramObject {
    id: string;
    type: 'player' | 'cone' | 'ball' | 'zone' | 'label';
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    label?: string;
    fill?: boolean;
}

export interface GameResult {
  id: string;
  gameId: string;
  gameTitle: string;
  winner: string;
  type: 'Team' | 'Individual';
  timestamp: number;
}

export interface ActiveTimer {
  id: string;
  label: string;
  endTime: number;
  duration: number;
  status: 'running' | 'alerting' | 'ended';
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
  folders?: Folder[];
  categories: string[];
  tags?: string[];
  results?: GameResult[];
  recentPlayers?: string[];
  activeTimer?: ActiveTimer | null;
  rivalries?: Rivalry[];
  messages?: GroupMessage[];
  players?: Player[];
  syncId?: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}