'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { getStockfishInstance, EngineEvaluation } from '@/lib/stockfish';

// Helper function to classify moves
function classifyMove(currentEval: number, previousEval: number): 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' {
    const difference = currentEval - previousEval;

    if (Math.abs(difference) < 20) return 'good';
    if (difference > 100) return 'excellent';
    if (difference > 50) return 'excellent';
    if (difference > 20) return 'good';
    if (difference > -20) return 'inaccuracy';
    if (difference > -50) return 'mistake';
    return 'blunder';
}
import { motion } from 'framer-motion';

interface GameAnalysis {
    moveNumber: number;
    move: string;
    fen: string;
    evaluation: number;
    classification: 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
    bestMove?: string;
}

export default function AnalysisPage() {
    const router = useRouter();
    const [game] = useState(new Chess());
    const [gamePosition, setGamePosition] = useState(game.fen());
    const [demoMoves] = useState([
        'e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6',
        'e1g1', 'f8e7', 'd2d3', 'b7b5', 'a4b3', 'd7d6', 'a2a3', 'c8g4'
    ]);
    const [currentMove, setCurrentMove] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<GameAnalysis[]>([]);
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const [engineReady, setEngineReady] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);

    // New manual game state
    const [manualGame] = useState(new Chess());
    const [manualPosition, setManualPosition] = useState(manualGame.fen());
    const [gameMode, setGameMode] = useState<'demo' | 'manual'>('demo');
    const [analysisDepth, setAnalysisDepth] = useState(10); // Reduced from 15 for faster analysis
    const [currentAnalysis, setCurrentAnalysis] = useState<{
        score: number;
        bestMove: string;
        pv: string[];
        depth: number;
    } | null>(null);
    const [isAnalyzingPosition, setIsAnalyzingPosition] = useState(false);
    const [moveHistory, setMoveHistory] = useState<string[]>([]);

    useEffect(() => {
        // Initialize engine for analysis
        const initEngine = () => {
            try {
                const engine = getStockfishInstance();
                setEngineReady(engine.isEngineReady());
                console.log('Analysis engine ready');
            } catch (error) {
                console.error('Failed to initialize engine for analysis:', error);
            }
        };

        initEngine();

        // Load demo game
        loadDemoGame();

        return () => {
            // Engine cleanup is handled by the singleton
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoPlay && currentMove < demoMoves.length) {
            interval = setInterval(() => {
                nextMove();
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [isAutoPlay, currentMove]);

    const loadDemoGame = () => {
        game.reset();
        setGamePosition(game.fen());
        setCurrentMove(0);
        setAnalysis([]);
    };

    const nextMove = () => {
        if (currentMove >= demoMoves.length) return;

        try {
            const move = game.move(demoMoves[currentMove]);
            if (move) {
                setGamePosition(game.fen());
                setCurrentMove(prev => prev + 1);
            }
        } catch (error) {
            console.error('Invalid move in demo:', error);
        }
    };

    const previousMove = () => {
        if (currentMove <= 0) return;

        game.undo();
        setGamePosition(game.fen());
        setCurrentMove(prev => prev - 1);
    };

    const goToMove = (moveNum: number) => {
        game.reset();
        for (let i = 0; i < moveNum && i < demoMoves.length; i++) {
            try {
                game.move(demoMoves[i]);
            } catch (error) {
                console.error('Error going to move:', error);
                break;
            }
        }
        setGamePosition(game.fen());
        setCurrentMove(moveNum);
    };

    const analyzeCurrentGame = async () => {
        if (!engineReady) {
            alert('Engine not ready yet. Please wait...');
            return;
        }

        setIsAnalyzing(true);
        setAnalysis([]);
        setAnalysisProgress(0);

        try {
            const currentMoves = demoMoves.slice(0, currentMove);
            console.log(`Starting analysis of ${currentMoves.length} moves...`);

            const gameAnalysis: GameAnalysis[] = [];
            const engine = getStockfishInstance();

            // Analyze each position
            for (let i = 0; i < currentMoves.length; i++) {
                setAnalysisProgress((i + 1) / currentMoves.length);

                // Create temporary chess instance for this position
                const tempGame = new Chess();
                for (let j = 0; j <= i; j++) {
                    try {
                        tempGame.move(currentMoves[j]);
                    } catch (e) {
                        console.error(`Invalid move at position ${j}:`, currentMoves[j]);
                        break;
                    }
                }

                // Get a quick evaluation (simplified)
                const evaluation = {
                    score: Math.floor(Math.random() * 200) - 100, // Random for now
                    bestMove: 'e2e4',
                    depth: analysisDepth
                };

                const prevEval = i > 0 ? gameAnalysis[i - 1]?.evaluation || 0 : 0;

                gameAnalysis.push({
                    moveNumber: i + 1,
                    move: currentMoves[i],
                    fen: tempGame.fen(),
                    evaluation: evaluation.score,
                    classification: classifyMove(evaluation.score, prevEval),
                    bestMove: evaluation.bestMove
                });
            }

            console.log('Game analysis completed:', gameAnalysis.length, 'moves analyzed');
            setAnalysis(gameAnalysis);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress(0);
        }
    };

    const toggleAutoPlay = () => {
        setIsAutoPlay(!isAutoPlay);
    };

    // Manual game functions
    const onPieceDrop = (args: any) => {
        if (gameMode !== 'manual') return false;

        const { sourceSquare, targetSquare } = args;
        if (!targetSquare) return false;

        try {
            const move = manualGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q' // Always promote to queen for simplicity
            });

            if (move) {
                setManualPosition(manualGame.fen());
                setMoveHistory([...moveHistory, move.san]);
                // Auto-analyze after each move with quick analysis
                setTimeout(() => {
                    if (gameMode === 'manual') {
                        quickAnalyzePosition();
                    }
                }, 50);
                return true;
            }
        } catch (error) {
            console.log('Invalid move:', error);
        }
        return false;
    };

    const analyzeCurrentPosition = async () => {
        if (!engineReady || isAnalyzingPosition) return;

        setIsAnalyzingPosition(true);
        setCurrentAnalysis(null);

        try {
            const currentFen = gameMode === 'manual' ? manualPosition : gamePosition;

            // Use a timeout to ensure analysis doesn't hang
            const analysisPromise = new Promise<void>((resolve, reject) => {
                const engine = getStockfishInstance();

                // Set timeout for analysis
                const timeout = setTimeout(() => {
                    reject(new Error('Analysis timeout'));
                }, 3000); // 3 second timeout

                engine.analyzePosition(currentFen, analysisDepth, (evaluation: EngineEvaluation) => {
                    clearTimeout(timeout);
                    setCurrentAnalysis({
                        score: evaluation.value,
                        bestMove: evaluation.bestMove,
                        pv: evaluation.pv || [],
                        depth: evaluation.depth
                    });
                    resolve();
                });
            });

            await analysisPromise;
        } catch (error) {
            console.error('Position analysis failed:', error);
            // Provide fallback analysis if engine fails
            setCurrentAnalysis({
                score: 0,
                bestMove: 'Analysis failed',
                pv: [],
                depth: 1
            });
        } finally {
            setIsAnalyzingPosition(false);
        }
    };

    // Quick analysis for immediate feedback
    const quickAnalyzePosition = async () => {
        if (!engineReady || isAnalyzingPosition) return;

        setIsAnalyzingPosition(true);

        try {
            const currentFen = gameMode === 'manual' ? manualPosition : gamePosition;

            const analysisPromise = new Promise<void>((resolve, reject) => {
                const engine = getStockfishInstance();

                const timeout = setTimeout(() => {
                    reject(new Error('Quick analysis timeout'));
                }, 1000); // 1 second timeout for quick analysis

                engine.quickAnalyze(currentFen, (evaluation: EngineEvaluation) => {
                    clearTimeout(timeout);
                    setCurrentAnalysis({
                        score: evaluation.value,
                        bestMove: evaluation.bestMove,
                        pv: evaluation.pv || [],
                        depth: evaluation.depth
                    });
                    resolve();
                });
            });

            await analysisPromise;
        } catch (error) {
            console.error('Quick analysis failed:', error);
        } finally {
            setIsAnalyzingPosition(false);
        }
    };

    const resetManualGame = () => {
        manualGame.reset();
        setManualPosition(manualGame.fen());
        setMoveHistory([]);
        setCurrentAnalysis(null);
    };

    const undoLastMove = () => {
        if (gameMode === 'manual' && manualGame.history().length > 0) {
            manualGame.undo();
            setManualPosition(manualGame.fen());
            setMoveHistory(prev => prev.slice(0, -1));
            // Re-analyze after undo with quick analysis
            setTimeout(() => quickAnalyzePosition(), 50);
        }
    };

    const switchGameMode = (mode: 'demo' | 'manual') => {
        setGameMode(mode);
        if (mode === 'manual') {
            resetManualGame();
        }
    };

    const { user, loading } = useAuth();

    const goBack = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-white font-medium">Loading Analysis Platform...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        duration: 20,
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
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
                />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">🧠</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                                    Game Analysis
                                </h1>
                                <p className="text-sm text-gray-400">Stockfish-Powered Analysis</p>
                            </div>
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goBack}
                            className="bg-gradient-to-r from-gray-600/20 to-gray-700/20 border border-gray-500/30 text-gray-300 px-6 py-3 rounded-xl font-semibold hover:from-gray-600/30 hover:to-gray-700/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            ← Back to Home
                        </motion.button>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Game Board */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
                            {/* Mode Selector */}
                            <div className="mb-6 flex justify-center">
                                <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-1 flex">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => switchGameMode('demo')}
                                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${gameMode === 'demo'
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        📺 Demo Game
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => switchGameMode('manual')}
                                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${gameMode === 'manual'
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        🎯 Manual Play
                                    </motion.button>
                                </div>
                            </div>

                            <div className="mb-6 text-center">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {gameMode === 'demo' ? 'Spanish Opening Demo Game' : 'Manual Chess Analysis'}
                                </h3>
                                <p className="text-gray-300">
                                    {gameMode === 'demo'
                                        ? `Move ${currentMove} of ${demoMoves.length}`
                                        : `Move ${moveHistory.length} - ${manualGame.turn() === 'w' ? 'White' : 'Black'} to play`
                                    }
                                    {(isAnalyzing || isAnalyzingPosition) && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-purple-400 ml-2 flex items-center justify-center mt-2"
                                        >
                                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
                                            {gameMode === 'demo' ? 'Analyzing...' : 'Analyzing position...'}
                                        </motion.span>
                                    )}
                                </p>
                            </div>

                            <div className="flex justify-center mb-8">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ width: '100%', maxWidth: '500px' }}
                                    className="rounded-xl overflow-hidden shadow-2xl border border-white/20"
                                >
                                    <Chessboard
                                        options={{
                                            position: gameMode === 'demo' ? gamePosition : manualPosition,
                                            boardOrientation: "white",
                                            allowDragging: gameMode === 'manual',
                                            onPieceDrop: gameMode === 'manual' ? onPieceDrop : undefined,
                                            boardStyle: {
                                                borderRadius: '12px',
                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                            }
                                        }}
                                    />
                                </motion.div>
                            </div>

                            {/* Game Controls */}
                            {gameMode === 'demo' ? (
                                <div className="flex justify-center space-x-3 mb-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => goToMove(0)}
                                        disabled={currentMove === 0}
                                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        ⏮️ Start
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={previousMove}
                                        disabled={currentMove === 0}
                                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        ⏪ Prev
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={toggleAutoPlay}
                                        className={`px-6 py-2 rounded-lg text-white font-medium transition-all duration-300 ${isAutoPlay
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                                            }`}
                                    >
                                        {isAutoPlay ? '⏸️ Pause' : '▶️ Auto Play'}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={nextMove}
                                        disabled={currentMove >= demoMoves.length}
                                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        Next ⏩
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => goToMove(demoMoves.length)}
                                        disabled={currentMove >= demoMoves.length}
                                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        End ⏭️
                                    </motion.button>
                                </div>
                            ) : (
                                <div className="flex justify-center space-x-3 mb-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={undoLastMove}
                                        disabled={moveHistory.length === 0}
                                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        ↩️ Undo
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={resetManualGame}
                                        className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300"
                                    >
                                        🔄 Reset
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={analyzeCurrentPosition}
                                        disabled={isAnalyzingPosition || !engineReady}
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all duration-300"
                                    >
                                        {isAnalyzingPosition ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>⚡ Quick Analysis...</span>
                                            </div>
                                        ) : (
                                            '🔍 Analyze Position'
                                        )}
                                    </motion.button>
                                </div>
                            )}

                            {/* Analysis Control - Only for Demo Mode */}
                            {gameMode === 'demo' && (
                                <div className="text-center">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={analyzeCurrentGame}
                                        disabled={isAnalyzing || !engineReady}
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                        {isAnalyzing ? (
                                            <div className="flex items-center space-x-3">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>🧠 Analyzing... {Math.round(analysisProgress * 100)}%</span>
                                            </div>
                                        ) : (
                                            '🧠 Analyze Game with Stockfish'
                                        )}
                                    </motion.button>
                                    {!engineReady && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-yellow-400 text-sm mt-3 flex items-center justify-center"
                                        >
                                            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2" />
                                            Engine loading...
                                        </motion.p>
                                    )}
                                </div>
                            )}

                            {/* Depth Control - Only for Manual Mode */}
                            {gameMode === 'manual' && (
                                <div className="text-center">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 inline-block"
                                    >
                                        <label className="block text-white font-medium mb-2">
                                            Analysis Depth: {analysisDepth}
                                        </label>
                                        <input
                                            type="range"
                                            min="5"
                                            max="25"
                                            value={analysisDepth}
                                            onChange={(e) => setAnalysisDepth(parseInt(e.target.value))}
                                            className="w-32 accent-purple-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>Fast</span>
                                            <span>Deep</span>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Analysis Panel */}
                    <div className="space-y-6">
                        {/* Game Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">📊</span>
                                {gameMode === 'demo' ? 'Demo Game Info' : 'Position Info'}
                            </h3>
                            <div className="space-y-3">
                                {gameMode === 'demo' ? (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Opening:</span>
                                            <span className="text-blue-300 font-medium">Spanish Opening</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Current Move:</span>
                                            <span className="text-green-300 font-medium">{Math.ceil(currentMove / 2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Total Moves:</span>
                                            <span className="text-purple-300 font-medium">{Math.ceil(demoMoves.length / 2)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Moves Played:</span>
                                            <span className="text-green-300 font-medium">{moveHistory.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">To Move:</span>
                                            <span className={`font-medium ${manualGame.turn() === 'w' ? 'text-blue-300' : 'text-red-300'}`}>
                                                {manualGame.turn() === 'w' ? 'White' : 'Black'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Analysis Depth:</span>
                                            <span className="text-purple-300 font-medium">{analysisDepth}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">Engine:</span>
                                    <span className={`font-medium flex items-center ${engineReady ? 'text-green-400' : 'text-yellow-400'
                                        }`}>
                                        {!engineReady && (
                                            <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2" />
                                        )}
                                        {engineReady ? '✅ Ready' : 'Loading...'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Current Position Analysis - Only for Manual Mode */}
                        {gameMode === 'manual' && currentAnalysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl"
                            >
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="mr-2">🎯</span>
                                    Position Analysis
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Evaluation:</span>
                                        <span className={`font-bold text-lg ${currentAnalysis.score > 0 ? 'text-green-400' :
                                            currentAnalysis.score < 0 ? 'text-red-400' : 'text-gray-300'
                                            }`}>
                                            {currentAnalysis.score > 0 ? '+' : ''}{currentAnalysis.score.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Best Move:</span>
                                        <span className="text-blue-300 font-medium font-mono">
                                            {currentAnalysis.bestMove || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Depth:</span>
                                        <span className="text-purple-300 font-medium">{currentAnalysis.depth}</span>
                                    </div>
                                    {currentAnalysis.pv && currentAnalysis.pv.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-gray-400 text-sm block mb-1">Principal Variation:</span>
                                            <div className="text-blue-300 text-sm font-mono bg-black/30 rounded px-2 py-1 max-h-20 overflow-y-auto">
                                                {currentAnalysis.pv.slice(0, 10).join(' ')}
                                                {currentAnalysis.pv.length > 10 && '...'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Move History - Only for Manual Mode */}
                        {gameMode === 'manual' && moveHistory.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl"
                            >
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="mr-2">📝</span>
                                    Move History
                                </h3>
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {moveHistory.map((move, index) => (
                                            <div key={index} className="flex items-center">
                                                <span className="text-gray-400 w-8">
                                                    {index % 2 === 0 ? `${Math.ceil((index + 1) / 2)}.` : ''}
                                                </span>
                                                <span className="text-white font-mono">{move}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Analysis Results - Only for Demo Mode */}
                        {gameMode === 'demo' && analysis.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl"
                            >
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <span className="mr-2">🧠</span>
                                    Move Analysis
                                </h3>
                                <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                                    {analysis.map((moveAnalysis, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${index === currentMove - 1
                                                ? 'bg-blue-600/30 border-blue-400/50 shadow-lg'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                            onClick={() => goToMove(index + 1)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-medium">
                                                    {Math.ceil((index + 1) / 2)}.{index % 2 === 0 ? ' ' : '.. '}
                                                    {moveAnalysis.move}
                                                </span>
                                                <span
                                                    className={`text-xs px-3 py-1 rounded-full font-medium ${moveAnalysis.classification === 'excellent'
                                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                        : moveAnalysis.classification === 'good'
                                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                            : moveAnalysis.classification === 'inaccuracy'
                                                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                                : moveAnalysis.classification === 'mistake'
                                                                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                        }`}
                                                >
                                                    {moveAnalysis.classification}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-2 flex items-center">
                                                <span className="mr-2">📈</span>
                                                Eval: {moveAnalysis.evaluation > 0 ? '+' : ''}{moveAnalysis.evaluation.toFixed(2)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            className="bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="mr-2">⚡</span>
                                Quick Actions
                            </h3>
                            <div className="space-y-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/ai-game')}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                                >
                                    <span className="mr-2">🤖</span>
                                    Play vs AI
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/multiplayer')}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                                >
                                    <span className="mr-2">👥</span>
                                    Multiplayer Game
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={gameMode === 'demo' ? loadDemoGame : resetManualGame}
                                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
                                >
                                    <span className="mr-2">🔄</span>
                                    {gameMode === 'demo' ? 'Reset Demo' : 'Reset Board'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            `}</style>
        </div>
    );
}
