import {
    collection,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    arrayUnion,
    deleteDoc,
    Timestamp,
    Firestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types/chess';

// Type guard for database
function assertDbExists(db: any): asserts db is Firestore {
    if (!db) {
        throw new Error('Firebase not initialized - running in demo mode');
    }
}

export interface MultiplayerGame {
    id: string;
    players: {
        white?: {
            uid: string;
            username: string;
            ready: boolean;
        };
        black?: {
            uid: string;
            username: string;
            ready: boolean;
        };
    };
    gameState: {
        fen: string;
        pgn: string;
        turn: 'w' | 'b';
        isGameOver: boolean;
        result?: 'white' | 'black' | 'draw';
        winner?: string;
    };
    moves: Array<{
        from: string;
        to: string;
        san: string;
        fen: string;
        timestamp: Timestamp;
        player: string;
    }>;
    createdAt: Timestamp;
    lastMove?: Timestamp;
    status: 'waiting' | 'active' | 'finished';
}

export class MultiplayerService {
    private unsubscribeGame: (() => void) | null = null;

    async createRoom(user: User): Promise<string> {
        assertDbExists(db);

        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        const gameData: MultiplayerGame = {
            id: roomId,
            players: {
                white: {
                    uid: user.uid,
                    username: user.username,
                    ready: true
                }
            },
            gameState: {
                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                pgn: '',
                turn: 'w',
                isGameOver: false
            },
            moves: [],
            createdAt: Timestamp.now(),
            status: 'waiting'
        };

        await setDoc(doc(db, 'games', roomId), gameData);
        console.log('Room created:', roomId);
        return roomId;
    }

    async joinRoom(roomId: string, user: User): Promise<boolean> {
        assertDbExists(db);

        try {
            const gameRef = doc(db, 'games', roomId);
            const gameSnap = await getDoc(gameRef);

            if (!gameSnap.exists()) {
                throw new Error('Room not found');
            }

            const gameData = gameSnap.data() as MultiplayerGame;

            // Check if room is full
            if (gameData.players.white && gameData.players.black) {
                throw new Error('Room is full');
            }

            // Check if user is already in the room
            if (gameData.players.white?.uid === user.uid) {
                return true; // Already joined as white
            }

            // Join as black player
            await updateDoc(gameRef, {
                'players.black': {
                    uid: user.uid,
                    username: user.username,
                    ready: true
                },
                status: 'active'
            });

            console.log('Joined room:', roomId, 'as black');
            return true;
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    }

    async makeMove(roomId: string, move: { from: string; to: string; san: string; fen: string }, user: User): Promise<void> {
        assertDbExists(db);

        const gameRef = doc(db, 'games', roomId);

        const moveData = {
            from: move.from,
            to: move.to,
            san: move.san,
            fen: move.fen,
            timestamp: Timestamp.now(),
            player: user.uid
        };

        await updateDoc(gameRef, {
            'gameState.fen': move.fen,
            'gameState.turn': move.fen.includes(' w ') ? 'w' : 'b',
            moves: arrayUnion(moveData),
            lastMove: Timestamp.now()
        });

        console.log('Move made:', move.san);
    }

    subscribeToGame(roomId: string, callback: (game: MultiplayerGame | null) => void): () => void {
        if (!db) {
            console.warn('Firebase not initialized - multiplayer disabled');
            return () => { };
        }

        // Cleanup previous subscription
        if (this.unsubscribeGame) {
            this.unsubscribeGame();
        }

        const gameRef = doc(db, 'games', roomId);
        this.unsubscribeGame = onSnapshot(gameRef, (doc) => {
            if (doc.exists()) {
                const gameData = doc.data() as MultiplayerGame;
                callback(gameData);
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Error listening to game:', error);
            callback(null);
        });

        return this.unsubscribeGame;
    }

    async leaveRoom(roomId: string, user: User): Promise<void> {
        if (!db) return;

        try {
            const gameRef = doc(db, 'games', roomId);
            const gameSnap = await getDoc(gameRef);

            if (!gameSnap.exists()) return;

            const gameData = gameSnap.data() as MultiplayerGame;

            // If user is the only player, delete the room
            if (gameData.players.white?.uid === user.uid && !gameData.players.black) {
                await deleteDoc(gameRef);
                console.log('Room deleted:', roomId);
            } else {
                // Remove the player from the room
                const updates: any = {};
                if (gameData.players.white?.uid === user.uid) {
                    updates['players.white'] = null;
                }
                if (gameData.players.black?.uid === user.uid) {
                    updates['players.black'] = null;
                }
                updates.status = 'waiting';

                await updateDoc(gameRef, updates);
                console.log('Left room:', roomId);
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    }

    unsubscribe(): void {
        if (this.unsubscribeGame) {
            this.unsubscribeGame();
            this.unsubscribeGame = null;
        }
    }

    async updatePlayerStats(userId: string, result: 'win' | 'loss' | 'draw', newRating?: number): Promise<void> {
        assertDbExists(db);

        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const currentStats = {
                    totalGames: userData.totalGames || 0,
                    wins: userData.wins || 0,
                    draws: userData.draws || 0,
                    losses: userData.losses || 0,
                    rating: userData.rating || 1200,
                    highestRating: userData.highestRating || userData.rating || 1200,
                    currentStreak: userData.currentStreak || 0,
                    longestWinStreak: userData.longestWinStreak || 0
                };

                const updates: any = {
                    totalGames: currentStats.totalGames + 1,
                    lastGameDate: Timestamp.now()
                };

                // Update game result stats
                if (result === 'win') {
                    updates.wins = currentStats.wins + 1;
                    updates.currentStreak = currentStats.currentStreak + 1;
                    updates.longestWinStreak = Math.max(currentStats.longestWinStreak, updates.currentStreak);
                } else if (result === 'loss') {
                    updates.losses = currentStats.losses + 1;
                    updates.currentStreak = 0;
                } else {
                    updates.draws = currentStats.draws + 1;
                    updates.currentStreak = 0;
                }

                // Update rating if provided
                if (newRating !== undefined) {
                    updates.rating = newRating;
                    updates.highestRating = Math.max(currentStats.highestRating, newRating);
                }

                await updateDoc(userRef, updates);
                console.log('Updated player stats for:', userId, result);
            } else {
                // Create initial stats if user doesn't exist
                const initialStats = {
                    totalGames: 1,
                    wins: result === 'win' ? 1 : 0,
                    draws: result === 'draw' ? 1 : 0,
                    losses: result === 'loss' ? 1 : 0,
                    rating: newRating || 1200,
                    highestRating: newRating || 1200,
                    currentStreak: result === 'win' ? 1 : 0,
                    longestWinStreak: result === 'win' ? 1 : 0,
                    joinedDate: Timestamp.now(),
                    lastGameDate: Timestamp.now()
                };

                await setDoc(userRef, initialStats, { merge: true });
                console.log('Created initial stats for:', userId);
            }
        } catch (error) {
            console.error('Error updating player stats:', error);
        }
    }

    async finishGame(roomId: string, result: 'white' | 'black' | 'draw', gameData: MultiplayerGame): Promise<void> {
        assertDbExists(db);

        try {
            // Update game status
            await updateDoc(doc(db, 'games', roomId), {
                'gameState.isGameOver': true,
                'gameState.result': result,
                status: 'finished',
                finishedAt: Timestamp.now()
            });

            // Update player stats
            const whitePlayer = gameData.players.white;
            const blackPlayer = gameData.players.black;

            if (whitePlayer && blackPlayer) {
                if (result === 'white') {
                    await this.updatePlayerStats(whitePlayer.uid, 'win');
                    await this.updatePlayerStats(blackPlayer.uid, 'loss');
                } else if (result === 'black') {
                    await this.updatePlayerStats(blackPlayer.uid, 'win');
                    await this.updatePlayerStats(whitePlayer.uid, 'loss');
                } else {
                    await this.updatePlayerStats(whitePlayer.uid, 'draw');
                    await this.updatePlayerStats(blackPlayer.uid, 'draw');
                }
            }

            console.log('Game finished:', roomId, 'Result:', result);
        } catch (error) {
            console.error('Error finishing game:', error);
        }
    }
}

export const multiplayerService = new MultiplayerService();
