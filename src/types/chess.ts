import { Chess } from 'chess.js';

export interface User {
    uid: string;
    email: string;
    displayName?: string;
    username: string;
    elo: number;
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDrawn: number;
    createdAt: Date;
    lastActive: Date;
}

export interface GameMove {
    from: string;
    to: string;
    promotion?: string;
    san: string;
    fen: string;
    timestamp: Date;
    evaluation?: number;
    bestMove?: string;
    isBlunder?: boolean;
    isExcellent?: boolean;
}

export interface GameState {
    id: string;
    players: {
        white: User | null;
        black: User | null;
    };
    spectators: User[];
    gameMode: 'ai' | 'multiplayer';
    aiLevel?: number;
    currentTurn: 'white' | 'black';
    moves: GameMove[];
    status: 'waiting' | 'active' | 'finished';
    result?: 'white' | 'black' | 'draw';
    resultReason?: 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | 'draw';
    timeControl: {
        initial: number; // seconds
        increment: number; // seconds
    };
    timeRemaining: {
        white: number;
        black: number;
    };
    createdAt: Date;
    updatedAt: Date;
    isAnalysisComplete?: boolean;
}

export interface GameAnalysis {
    gameId: string;
    moves: {
        moveNumber: number;
        evaluation: number;
        bestMove: string;
        actualMove: string;
        accuracy: number;
        classification: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
    }[];
    averageAccuracy: {
        white: number;
        black: number;
    };
    totalBlunders: {
        white: number;
        black: number;
    };
    openingName?: string;
    engineDepth: number;
    analyzedAt: Date;
}

export interface Room {
    id: string;
    name: string;
    password?: string;
    host: User;
    players: User[];
    spectators: User[];
    game?: GameState;
    isPrivate: boolean;
    maxPlayers: number;
    createdAt: Date;
}

export type ChessTheme = 'classic' | 'wood' | 'dark' | 'neon' | 'marble';

export interface UserSettings {
    theme: ChessTheme;
    soundEnabled: boolean;
    showCoordinates: boolean;
    showLastMove: boolean;
    autoQueen: boolean;
    premove: boolean;
}

export interface StockfishEngine {
    postMessage: (message: string) => void;
    onmessage: ((event: { data: string }) => void) | null;
    terminate: () => void;
}

export interface EngineEvaluation {
    depth: number;
    score: number;
    bestMove: string;
    pv: string[];
    nodes: number;
    nps: number;
    time: number;
    mate?: number;
}
