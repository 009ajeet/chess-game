'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '@/contexts/AuthContext';
import { stockfishEngine } from '@/lib/stockfish';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { statsService } from '@/lib/stats';
import toast from 'react-hot-toast';

export default function AIGamePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [game, setGame] = useState(new Chess());
    const [gamePosition, setGamePosition] = useState(game.fen());
    const [difficulty, setDifficulty] = useState(5);
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameStatus, setGameStatus] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [engineReady, setEngineReady] = useState(false);
    const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
    const [gameEnded, setGameEnded] = useState(false);

    useEffect(() => {
        // Initialize Stockfish
        const initEngine = async () => {
            try {
                await stockfishEngine.initialize();
                stockfishEngine.setSkillLevel(difficulty);
                setEngineReady(true);
                console.log('Stockfish initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Stockfish:', error);
                setEngineReady(false);
            }
        };

        initEngine();
        setGameStartTime(new Date()); // Set game start time

        return () => {
            stockfishEngine.terminate();
        };
    }, []);

    useEffect(() => {
        if (engineReady) {
            stockfishEngine.setSkillLevel(difficulty);
        }
    }, [difficulty, engineReady]);

    const makeAIMove = useCallback(async () => {
        if (!engineReady || isPlayerTurn || game.isGameOver()) return;

        setIsThinking(true);

        try {
            // Increase thinking time based on difficulty level for stronger play
            const thinkingTime = Math.max(1500, difficulty * 400); // 1.5s to 4s based on difficulty
            
            await new Promise<void>((resolve) => {
                stockfishEngine.getBestMove(game.fen(), thinkingTime, (bestMove) => {
                    try {
                        console.log(`AI (Level ${difficulty}) suggested move:`, bestMove, 'after', thinkingTime + 'ms thinking');

                        // Validate move format
                        if (!bestMove || bestMove.length < 4) {
                            console.error('Invalid move format:', bestMove);
                            resolve();
                            return;
                        }

                        const move = game.move(bestMove);
                        if (move) {
                            console.log('AI move applied successfully:', move);
                            setGamePosition(game.fen());
                            setIsPlayerTurn(true);
                            updateGameStatus();
                        } else {
                            console.error('AI move rejected by chess.js:', bestMove);
                            // Try a different approach - get legal moves and pick one
                            const legalMoves = game.moves();
                            if (legalMoves.length > 0) {
                                const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                                console.log('Using fallback random move:', randomMove);
                                const fallbackMove = game.move(randomMove);
                                if (fallbackMove) {
                                    setGamePosition(game.fen());
                                    setIsPlayerTurn(true);
                                    updateGameStatus();
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Invalid AI move:', error);
                        console.log('Attempting fallback move...');
                        // Fallback: make a random legal move
                        try {
                            const legalMoves = game.moves();
                            if (legalMoves.length > 0) {
                                const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                                const fallbackMove = game.move(randomMove);
                                if (fallbackMove) {
                                    setGamePosition(game.fen());
                                    setIsPlayerTurn(true);
                                    updateGameStatus();
                                }
                            }
                        } catch (fallbackError) {
                            console.error('Fallback move also failed:', fallbackError);
                        }
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.error('AI move error:', error);
        } finally {
            setIsThinking(false);
        }
    }, [game, engineReady, isPlayerTurn]);

    useEffect(() => {
        if (!isPlayerTurn && !game.isGameOver() && engineReady) {
            const timer = setTimeout(makeAIMove, 500);
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, makeAIMove, engineReady]);

    const updateGameStatus = async () => {
        if (game.isCheckmate()) {
            const winner = game.turn() === 'w' ? 'black' : 'white';
            setGameStatus(winner === 'black' ? 'Black wins by checkmate!' : 'White wins by checkmate!');

            // Update stats if user is logged in and game hasn't ended yet
            if (user && !gameEnded && gameStartTime) {
                setGameEnded(true);
                const playerWins = winner === 'white'; // Player is white
                const gameLength = Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000 / 60); // minutes

                try {
                    await statsService.updateUserStats(
                        user.uid,
                        'ai',
                        playerWins ? 'win' : 'loss',
                        undefined, // No rating change for AI games
                        gameLength
                    );
                    toast.success(playerWins ? 'Victory! Stats updated.' : 'Good game! Stats updated.');
                } catch (error) {
                    console.error('Error updating stats:', error);
                }
            }
        } else if (game.isDraw()) {
            setGameStatus('Game ended in a draw!');

            // Update stats for draw
            if (user && !gameEnded && gameStartTime) {
                setGameEnded(true);
                const gameLength = Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000 / 60); // minutes

                try {
                    await statsService.updateUserStats(
                        user.uid,
                        'ai',
                        'draw',
                        undefined, // No rating change for AI games
                        gameLength
                    );
                    toast.success('Draw! Stats updated.');
                } catch (error) {
                    console.error('Error updating stats:', error);
                }
            }
        } else if (game.isCheck()) {
            setGameStatus('Check!');
        } else {
            setGameStatus('');
        }
    };

    const onDrop = (args: any) => {
        const { sourceSquare, targetSquare } = args;
        if (!isPlayerTurn || isThinking || !targetSquare) return false;

        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // Always promote to queen for simplicity
            });

            if (move) {
                setGamePosition(game.fen());
                setIsPlayerTurn(false);
                updateGameStatus();
                return true;
            }
        } catch (error) {
            console.error('Invalid move:', error);
        }

        return false;
    };

    const resetGame = () => {
        const newGame = new Chess();
        setGame(newGame);
        setGamePosition(newGame.fen());
        setIsPlayerTurn(true);
        setGameStatus('');
        setIsThinking(false);
        setGameEnded(false);
        setGameStartTime(new Date());
    };

    const goBack = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        rotate: -360,
                        scale: [1.1, 1, 1.1]
                    }}
                    transition={{
                        duration: 25,
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
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                                AI Challenge
                            </h1>
                            <p className="text-gray-300">Test your skills against Stockfish-powered AI</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goBack}
                            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg"
                        >
                            ← Back Home
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
                            {/* Status Bar */}
                            <div className="mb-6 text-center">
                                {isThinking && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="inline-flex items-center space-x-3 bg-blue-500/20 border border-blue-400/30 rounded-xl px-6 py-3"
                                    >
                                        <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
                                        <span className="text-blue-300 font-medium">AI is calculating...</span>
                                    </motion.div>
                                )}
                                {gameStatus && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="inline-block bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl px-6 py-3"
                                    >
                                        <span className="text-lg font-bold text-purple-300">{gameStatus}</span>
                                    </motion.div>
                                )}
                                {!engineReady && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="inline-flex items-center space-x-3 bg-yellow-500/20 border border-yellow-400/30 rounded-xl px-6 py-3"
                                    >
                                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-yellow-300 font-medium">Initializing engine...</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Chessboard */}
                            <div className="flex justify-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className="w-full max-w-lg"
                                    style={{ aspectRatio: '1' }}
                                >
                                    <Chessboard
                                        options={{
                                            position: gamePosition,
                                            onPieceDrop: onDrop,
                                            boardOrientation: "white",
                                            allowDragging: isPlayerTurn && !isThinking && engineReady,
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
                        {/* Difficulty Settings */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">🎯</span> Difficulty Level
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 font-medium">Level {difficulty}</span>
                                    <span className="text-sm px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-300">
                                        {(() => {
                                            const eloMappings = {
                                                1: '800 ELO',
                                                2: '1000 ELO',
                                                3: '1200 ELO',
                                                4: '1400 ELO',
                                                5: '1600 ELO',
                                                6: '1800 ELO',
                                                7: '2000 ELO',
                                                8: '2200 ELO',
                                                9: '2400 ELO',
                                                10: '2600 ELO'
                                            };
                                            return eloMappings[difficulty as keyof typeof eloMappings] || '1500 ELO';
                                        })()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                        disabled={!engineReady}
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>1</span>
                                        <span>5</span>
                                        <span>10</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Game Stats */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">📊</span> Game Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Current Turn:</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white' : 'bg-gray-800'}`} />
                                        <span className="text-white font-medium">
                                            {game.turn() === 'w' ? 'White' : 'Black'}
                                        </span>
                                        {isThinking && <span className="text-blue-400 text-sm">(AI)</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Move Number:</span>
                                    <span className="text-white font-medium">{Math.ceil(game.history().length / 2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Engine Status:</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${engineReady ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                        <span className={`font-medium ${engineReady ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {engineReady ? 'Ready' : 'Loading...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Game Controls */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">⚡</span> Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={resetGame}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                                >
                                    🔄 New Game
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/multiplayer')}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                                >
                                    👥 Multiplayer
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/analysis')}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                                >
                                    📈 Analysis
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
