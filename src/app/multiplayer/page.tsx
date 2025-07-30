'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { multiplayerService, MultiplayerGame } from '@/lib/multiplayer';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function MultiplayerPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [game] = useState(new Chess());
    const [gamePosition, setGamePosition] = useState(game.fen());
    const [roomCode, setRoomCode] = useState('');
    const [isInRoom, setIsInRoom] = useState(false);
    const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
    const [opponent, setOpponent] = useState<string | null>(null);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameData, setGameData] = useState<MultiplayerGame | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Subscribe to game updates
    useEffect(() => {
        if (!isInRoom || !roomCode) return;

        const unsubscribe = multiplayerService.subscribeToGame(roomCode, (gameData) => {
            if (gameData) {
                setGameData(gameData);
                game.load(gameData.gameState.fen);
                setGamePosition(gameData.gameState.fen);

                if (user) {
                    const isWhite = gameData.players.white?.uid === user.uid;
                    const isBlack = gameData.players.black?.uid === user.uid;

                    if (isWhite) {
                        setPlayerColor('white');
                        setIsPlayerTurn(gameData.gameState.turn === 'w');
                        setOpponent(gameData.players.black?.username || null);
                    } else if (isBlack) {
                        setPlayerColor('black');
                        setIsPlayerTurn(gameData.gameState.turn === 'b');
                        setOpponent(gameData.players.white?.username || null);
                    }
                }
            } else {
                toast.error('Game not found');
                leaveRoom();
            }
        });

        return unsubscribe;
    }, [isInRoom, roomCode, user]);

    const createRoom = async () => {
        if (!user) {
            toast.error('Please sign in to create a room');
            return;
        }

        setIsLoading(true);
        try {
            const code = await multiplayerService.createRoom(user);
            setRoomCode(code);
            setIsInRoom(true);
            setPlayerColor('white');
            toast.success(`Room created: ${code}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to create room');
        } finally {
            setIsLoading(false);
        }
    };

    const joinRoom = async () => {
        if (!user) {
            toast.error('Please sign in to join a room');
            return;
        }

        if (!roomCode.trim()) {
            toast.error('Please enter a room code');
            return;
        }

        setIsLoading(true);
        try {
            await multiplayerService.joinRoom(roomCode.trim().toUpperCase(), user);
            setIsInRoom(true);
            toast.success(`Joined room: ${roomCode}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to join room');
        } finally {
            setIsLoading(false);
        }
    };

    const leaveRoom = async () => {
        if (user && roomCode) {
            try {
                await multiplayerService.leaveRoom(roomCode, user);
            } catch (error) {
                console.error('Error leaving room:', error);
            }
        }

        multiplayerService.unsubscribe();
        setIsInRoom(false);
        setRoomCode('');
        setOpponent(null);
        setPlayerColor('white');
        setGameData(null);
        game.reset();
        setGamePosition(game.fen());
        setIsPlayerTurn(true);
    };

    const onDrop = (args: any) => {
        const { sourceSquare, targetSquare } = args;
        if (!isPlayerTurn || !user || !roomCode || !targetSquare) return false;

        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (move === null) return false;

            // Make the move asynchronously but return immediately
            multiplayerService.makeMove(roomCode, {
                from: sourceSquare,
                to: targetSquare,
                san: move.san,
                fen: game.fen()
            }, user).catch(error => {
                toast.error('Failed to make move');
                game.undo();
                setGamePosition(game.fen());
            });

            setGamePosition(game.fen());
            setIsPlayerTurn(false);
            return true;
        } catch (error) {
            toast.error('Failed to make move');
            return false;
        }
    };

    useEffect(() => {
        return () => multiplayerService.unsubscribe();
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center max-w-md"
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
                    <p className="text-gray-300 mb-6">Please sign in to access multiplayer features</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                    >
                        Return Home
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    if (!isInRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div 
                        animate={{ 
                            rotate: 360,
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                            duration: 25,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
                    />
                    <motion.div 
                        animate={{ 
                            rotate: -360,
                            scale: [1.2, 1, 1.2]
                        }}
                        transition={{ 
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
                    />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto p-6">
                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                    Multiplayer Arena
                                </h1>
                                <p className="text-gray-300">Challenge friends in real-time chess battles</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push('/')}
                                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg"
                            >
                                ← Back Home
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Game Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Create Room */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group relative bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                                    <span className="text-3xl">🎮</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Create Room</h3>
                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    Host a new game and share the room code with your friend to start playing
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={createRoom}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </div>
                                    ) : (
                                        '🏁 Create New Room'
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Join Room */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group relative bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                                    <span className="text-3xl">🚪</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Join Room</h3>
                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    Enter a 6-character room code to join an existing game with a friend
                                </p>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="ENTER CODE"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-4 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg tracking-widest"
                                        maxLength={6}
                                        disabled={isLoading}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={joinRoom}
                                        disabled={!roomCode.trim() || isLoading}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Joining...</span>
                                            </div>
                                        ) : (
                                            '🎯 Join Room'
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div 
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                        duration: 35,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl"
                />
                <motion.div 
                    animate={{ 
                        rotate: -360,
                        scale: [1.1, 1, 1.1]
                    }}
                    transition={{ 
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-6">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6"
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                Live Match
                            </h1>
                            <div className="flex items-center space-x-6 text-sm">
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-400">Room:</span>
                                    <span className="font-mono font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded">{roomCode}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-400">Playing as:</span>
                                    <div className="flex items-center space-x-1">
                                        <div className={`w-3 h-3 rounded-full ${playerColor === 'white' ? 'bg-white' : 'bg-gray-800'}`} />
                                        <span className={`font-bold ${playerColor === 'white' ? 'text-blue-300' : 'text-red-300'}`}>
                                            {playerColor}
                                        </span>
                                    </div>
                                </div>
                                {opponent && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-400">vs</span>
                                        <span className="font-bold text-green-300">{opponent}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={leaveRoom}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg"
                        >
                            🚪 Leave Room
                        </motion.button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Game Board */}
                    <div className="xl:col-span-3">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8"
                        >
                            {/* Turn Indicator */}
                            <div className="mb-6 text-center">
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`inline-flex items-center space-x-3 px-6 py-3 rounded-xl border ${
                                        isPlayerTurn
                                            ? 'bg-green-500/20 border-green-400/30 text-green-300'
                                            : 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
                                    }`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${isPlayerTurn ? 'bg-green-400' : 'bg-yellow-400'} ${!isPlayerTurn ? 'animate-pulse' : ''}`} />
                                    <span className="font-semibold">
                                        {isPlayerTurn ? '🎯 Your Turn' : '⏳ Waiting for opponent...'}
                                    </span>
                                </motion.div>
                            </div>

                            {/* Chessboard */}
                            <div className="flex justify-center">
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="w-full max-w-2xl"
                                    style={{ aspectRatio: '1' }}
                                >
                                    <Chessboard
                                        options={{
                                            position: gamePosition,
                                            onPieceDrop: onDrop,
                                            boardOrientation: playerColor,
                                            allowDragging: isPlayerTurn,
                                            boardStyle: {
                                                borderRadius: '16px',
                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                            }
                                        }}
                                    />
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* Game Status */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">📊</span> Game Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Room Code:</span>
                                    <span className="font-mono font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded text-sm">{roomCode}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Your Color:</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${playerColor === 'white' ? 'bg-white' : 'bg-gray-800'}`} />
                                        <span className={`font-semibold ${playerColor === 'white' ? 'text-blue-300' : 'text-red-300'}`}>
                                            {playerColor}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Opponent:</span>
                                    <div className="flex items-center space-x-2">
                                        {opponent ? (
                                            <>
                                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                                <span className="font-semibold text-green-300">{opponent}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                                                <span className="text-yellow-300">Waiting...</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Match Status:</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${gameData?.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                        <span className={`font-semibold ${gameData?.status === 'active' ? 'text-green-300' : 'text-yellow-300'}`}>
                                            {gameData?.status === 'active' ? 'Live' : 'Waiting'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Actions */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">⚡</span> Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(roomCode);
                                        toast.success('Room code copied!');
                                    }}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                                >
                                    📋 Copy Room Code
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={leaveRoom}
                                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg"
                                >
                                    🚪 Leave Game
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
