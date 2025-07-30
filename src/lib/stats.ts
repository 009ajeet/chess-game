import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserStats {
    totalGames: number;
    wins: number;
    draws: number;
    losses: number;
    rating: number;
    highestRating: number;
    currentStreak: number;
    longestWinStreak: number;
    aiGamesPlayed: number;
    multiplayerGames: number;
    joinedDate: string;
    lastGameDate: string;
    favoriteOpening: string;
    averageGameLength: number;
}

export class StatsService {
    async updateUserStats(
        userId: string, 
        gameType: 'ai' | 'multiplayer',
        result: 'win' | 'loss' | 'draw',
        ratingChange?: number,
        gameLength?: number
    ): Promise<void> {
        if (!db) {
            console.log('Firebase not available - running in demo mode');
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            let currentStats: Partial<UserStats>;
            
            if (userSnap.exists()) {
                currentStats = userSnap.data() as UserStats;
            } else {
                // Initialize user stats
                currentStats = {
                    totalGames: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    rating: 1200,
                    highestRating: 1200,
                    currentStreak: 0,
                    longestWinStreak: 0,
                    aiGamesPlayed: 0,
                    multiplayerGames: 0,
                    joinedDate: new Date().toISOString(),
                    favoriteOpening: 'Italian Game',
                    averageGameLength: 25
                };
            }

            // Update basic stats
            const updates: any = {
                totalGames: (currentStats.totalGames || 0) + 1,
                lastGameDate: new Date().toISOString()
            };

            // Update game type counter
            if (gameType === 'ai') {
                updates.aiGamesPlayed = (currentStats.aiGamesPlayed || 0) + 1;
            } else {
                updates.multiplayerGames = (currentStats.multiplayerGames || 0) + 1;
            }

            // Update result stats
            if (result === 'win') {
                updates.wins = (currentStats.wins || 0) + 1;
                updates.currentStreak = (currentStats.currentStreak || 0) + 1;
                updates.longestWinStreak = Math.max(
                    currentStats.longestWinStreak || 0, 
                    updates.currentStreak
                );
            } else if (result === 'loss') {
                updates.losses = (currentStats.losses || 0) + 1;
                updates.currentStreak = 0;
            } else {
                updates.draws = (currentStats.draws || 0) + 1;
                updates.currentStreak = 0;
            }

            // Update rating
            if (ratingChange !== undefined) {
                const newRating = Math.max(100, (currentStats.rating || 1200) + ratingChange);
                updates.rating = newRating;
                updates.highestRating = Math.max(currentStats.highestRating || 1200, newRating);
            }

            // Update average game length
            if (gameLength !== undefined) {
                const currentAvg = currentStats.averageGameLength || 25;
                const totalGames = currentStats.totalGames || 0;
                updates.averageGameLength = Math.round(
                    (currentAvg * totalGames + gameLength) / (totalGames + 1)
                );
            }

            await setDoc(userRef, updates, { merge: true });
            console.log('User stats updated:', userId, result, gameType);
        } catch (error) {
            console.error('Error updating user stats:', error);
        }
    }

    async getUserStats(userId: string): Promise<UserStats | null> {
        if (!db) {
            console.log('Firebase not available - returning demo stats');
            return {
                totalGames: 47,
                wins: 28,
                draws: 8,
                losses: 11,
                rating: 1367,
                highestRating: 1420,
                currentStreak: 3,
                longestWinStreak: 7,
                aiGamesPlayed: 32,
                multiplayerGames: 15,
                joinedDate: '2024-01-15',
                lastGameDate: new Date().toISOString(),
                favoriteOpening: 'Italian Game',
                averageGameLength: 34
            };
        }

        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data() as UserStats;
            }
            return null;
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }

    calculateRatingChange(playerRating: number, opponentRating: number, result: 'win' | 'loss' | 'draw'): number {
        const K = 32; // K-factor for rating calculation
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
        
        let actualScore: number;
        if (result === 'win') actualScore = 1;
        else if (result === 'loss') actualScore = 0;
        else actualScore = 0.5;

        return Math.round(K * (actualScore - expectedScore));
    }
}

export const statsService = new StatsService();
