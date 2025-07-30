'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { statsService } from '@/lib/stats';
import toast from 'react-hot-toast';

interface UserStats {
    rating: number;
    totalGames: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    highestRating: number;
    joinedDate: string;
    favoriteOpening: string;
    averageGameLength: number;
    longestWinStreak: number;
    currentStreak: number;
    aiGamesPlayed: number;
    multiplayerGames: number;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [userStats, setUserStats] = useState<UserStats>({
        rating: 1200,
        totalGames: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        winRate: 0,
        highestRating: 1200,
        joinedDate: new Date().toISOString().split('T')[0],
        favoriteOpening: 'Italian Game',
        averageGameLength: 25,
        longestWinStreak: 0,
        currentStreak: 0,
        aiGamesPlayed: 0,
        multiplayerGames: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setNewUsername(user.displayName || '');
            loadUserStats();
        }
    }, [user]);

    // Auto-refresh stats when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && user) {
                loadUserStats();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [user]);

    const loadUserStats = async () => {
        if (!user) return;

        try {
            const stats = await statsService.getUserStats(user.uid);
            if (stats) {
                const winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames * 100) : 0;
                setUserStats({
                    ...stats,
                    winRate: Math.round(winRate * 10) / 10 // Round to 1 decimal place
                });
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    };

    const refreshStats = async () => {
        await loadUserStats();
        toast.success('Stats refreshed!');
    };

    const updateUsername = async () => {
        if (!user || !newUsername.trim()) return;

        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                username: newUsername.trim()
            });
            toast.success('Username updated successfully!');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update username');
            console.error('Error updating username:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 2000) return 'text-purple-300';
        if (rating >= 1600) return 'text-blue-300';
        if (rating >= 1200) return 'text-green-300';
        return 'text-yellow-300';
    };

    const getRatingTitle = (rating: number) => {
        if (rating >= 2200) return 'Master';
        if (rating >= 2000) return 'Expert';
        if (rating >= 1800) return 'Advanced';
        if (rating >= 1600) return 'Intermediate';
        if (rating >= 1200) return 'Club Player';
        return 'Beginner';
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center max-w-md"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
                    <p className="text-gray-300 mb-6">Please sign in to view your profile</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                    >
                        Return Home
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        duration: 35,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        rotate: -360,
                        scale: [1.2, 1, 1.2]
                    }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        rotate: 180,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6">
                {/* Premium Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-8"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
                                👤 Player Profile
                            </h1>
                            <p className="text-gray-300 text-lg">Your chess journey and achievements</p>
                        </div>
                        <div className="flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={refreshStats}
                                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-800 transition-all duration-300 shadow-lg border border-white/10"
                            >
                                🔄 Refresh
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/')}
                                className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg border border-white/10"
                            >
                                ← Back Home
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Player Info Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8"
                    >
                        {/* Profile Avatar */}
                        <div className="text-center mb-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center text-6xl shadow-2xl">
                                👤
                            </div>

                            {/* Username */}
                            {isEditing ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-bold text-xl"
                                        placeholder="Enter username"
                                        maxLength={20}
                                    />
                                    <div className="flex space-x-3">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={updateUsername}
                                            disabled={isLoading}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50"
                                        >
                                            {isLoading ? '...' : '✓'}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setIsEditing(false);
                                                setNewUsername(user.displayName || '');
                                            }}
                                            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300"
                                        >
                                            ✕
                                        </motion.button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold text-white">{user.displayName || 'Anonymous'}</h2>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsEditing(true)}
                                        className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
                                    >
                                        ✏️ Edit Username
                                    </motion.button>
                                </div>
                            )}
                        </div>

                        {/* Rating Badge */}
                        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 rounded-2xl p-6 mb-6">
                            <div className="text-center">
                                <div className="text-sm text-indigo-300 font-medium mb-2">Current Rating</div>
                                <div className={`text-4xl font-bold ${getRatingColor(userStats.rating)} mb-2`}>
                                    {userStats.rating}
                                </div>
                                <div className="text-sm text-indigo-400">
                                    {getRatingTitle(userStats.rating)}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Member Since:</span>
                                <span className="text-white font-semibold">
                                    {new Date(userStats.joinedDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Total Games:</span>
                                <span className="text-white font-semibold">{userStats.totalGames}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">AI Games:</span>
                                <span className="text-blue-300 font-semibold">{userStats.aiGamesPlayed}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Multiplayer:</span>
                                <span className="text-purple-300 font-semibold">{userStats.multiplayerGames}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Win Rate:</span>
                                <span className="text-green-300 font-semibold">{userStats.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Highest Rating:</span>
                                <span className="text-purple-300 font-semibold">{userStats.highestRating}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Statistics Panel */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Game Results */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8"
                        >
                            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                                <span className="text-2xl mr-3">📊</span> Game Statistics
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Wins */}
                                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6 text-center">
                                    <div className="text-3xl mb-2">🏆</div>
                                    <div className="text-3xl font-bold text-green-300 mb-1">{userStats.wins}</div>
                                    <div className="text-sm text-green-400">Wins</div>
                                </div>

                                {/* Draws */}
                                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-xl p-6 text-center">
                                    <div className="text-3xl mb-2">🤝</div>
                                    <div className="text-3xl font-bold text-yellow-300 mb-1">{userStats.draws}</div>
                                    <div className="text-sm text-yellow-400">Draws</div>
                                </div>

                                {/* Losses */}
                                <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-6 text-center">
                                    <div className="text-3xl mb-2">💔</div>
                                    <div className="text-3xl font-bold text-red-300 mb-1">{userStats.losses}</div>
                                    <div className="text-sm text-red-400">Losses</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300">Win Rate Progress</span>
                                    <span className="text-white font-semibold">{userStats.winRate.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-3">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${userStats.winRate}%` }}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full shadow-lg"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Advanced Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {/* Performance Metrics */}
                            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <span className="text-xl mr-2">⚡</span> Performance
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Current Streak:</span>
                                        <span className="text-blue-300 font-semibold">{userStats.currentStreak} games</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Longest Win Streak:</span>
                                        <span className="text-purple-300 font-semibold">{userStats.longestWinStreak} games</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Avg. Game Length:</span>
                                        <span className="text-teal-300 font-semibold">{userStats.averageGameLength} moves</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Favorite Opening:</span>
                                        <span className="text-indigo-300 font-semibold">{userStats.favoriteOpening}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                                <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <span className="text-xl mr-2">🏅</span> Achievements
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                                        <span className="text-2xl">🥇</span>
                                        <div>
                                            <div className="text-sm font-semibold text-yellow-300">First Victory</div>
                                            <div className="text-xs text-gray-400">Won your first game</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                                        <span className="text-2xl">🔥</span>
                                        <div>
                                            <div className="text-sm font-semibold text-purple-300">Win Streak</div>
                                            <div className="text-xs text-gray-400">Won 5 games in a row</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                                        <span className="text-2xl">📚</span>
                                        <div>
                                            <div className="text-sm font-semibold text-blue-300">Student</div>
                                            <div className="text-xs text-gray-400">Played 25+ games</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h4 className="text-xl font-bold text-white mb-6 flex items-center">
                                <span className="text-xl mr-2">🚀</span> Quick Actions
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/ai-game')}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                                >
                                    🤖 Play vs AI
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/multiplayer')}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                                >
                                    👥 Multiplayer
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/analysis')}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg"
                                >
                                    📊 Analysis
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
