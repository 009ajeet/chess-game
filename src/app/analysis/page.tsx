'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { stockfishEngine, analyzeGame, classifyMove } from '@/lib/stockfish';
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

    useEffect(() => {
        // Initialize engine for analysis
        const initEngine = async () => {
            try {
                await stockfishEngine.initialize();
                setEngineReady(true);
                console.log('Analysis engine ready');
            } catch (error) {
                console.error('Failed to initialize engine for analysis:', error);
            }
        };

        initEngine();

        // Load demo game
        loadDemoGame();

        return () => {
            stockfishEngine.terminate();
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

        try {
            const currentMoves = demoMoves.slice(0, currentMove);
            const evaluations = await analyzeGame(currentMoves, (progress) => {
                console.log(`Analysis progress: ${Math.round(progress * 100)}%`);
            });

            const gameAnalysis: GameAnalysis[] = [];

            for (let i = 0; i < currentMoves.length; i++) {
                const evaluation = evaluations[i];
                const prevEval = i > 0 ? evaluations[i - 1].score : 0;

                gameAnalysis.push({
                    moveNumber: i + 1,
                    move: currentMoves[i],
                    fen: evaluation.bestMove || '',
                    evaluation: evaluation.score,
                    classification: classifyMove(evaluation.score, prevEval),
                    bestMove: evaluation.bestMove
                });
            }

            setAnalysis(gameAnalysis);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const toggleAutoPlay = () => {
        setIsAutoPlay(!isAutoPlay);
    };

    const goBack = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
            {/* Premium Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        rotate: -360,
                        scale: [1.2, 1, 1.2]
                    }}
                    transition={{
                        duration: 35,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        rotate: 180,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"
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
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent mb-3">
                                🔬 Game Analysis Lab
                            </h1>
                            <p className="text-gray-300 text-lg">Professional-grade chess analysis powered by Stockfish</p>
                            <div className="flex items-center space-x-4 mt-3">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${engineReady ? 'bg-emerald-400' : 'bg-yellow-400'} ${!engineReady ? 'animate-pulse' : ''}`} />
                                    <span className={`text-sm font-medium ${engineReady ? 'text-emerald-300' : 'text-yellow-300'}`}>
                                        Engine {engineReady ? 'Ready' : 'Initializing...'}
                                    </span>
                                </div>
                                <div className="w-px h-6 bg-white/20" />
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-400">Demo Game:</span>
                                    <span className="text-sm font-bold text-emerald-300">Spanish Opening</span>
                                </div>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={goBack}
                            className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-6 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg border border-white/10"
                        >
                            ← Back Home
                        </motion.button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Premium Game Board */}
                    <div className="xl:col-span-3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-8"
                        >
                            {/* Premium Move Counter */}
                            <div className="mb-8 text-center">
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="inline-flex items-center space-x-4 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30"
                                >
                                    <div className="flex items-center space-x-2">
                                        <span className="text-2xl">📊</span>
                                        <div>
                                            <div className="text-sm text-emerald-300 font-medium">Position</div>
                                            <div className="text-lg font-bold text-white">
                                                Move {currentMove} of {demoMoves.length}
                                            </div>
                                        </div>
                                    </div>
                                    {isAnalyzing && (
                                        <>
                                            <div className="w-px h-8 bg-emerald-400/30" />
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-emerald-300 font-medium">Analyzing...</span>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            </div>

                            {/* Premium Chessboard */}
                            <div className="flex justify-center mb-8">
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
                                            boardOrientation: "white",
                                            allowDragging: false,
                                            boardStyle: {
                                                borderRadius: '16px',
                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                                border: '2px solid rgba(16, 185, 129, 0.3)',
                                            }
                                        }}
                                    />
                                </motion.div>
                            </div>

                            {/* Premium Game Controls */}
                            <div className="flex justify-center space-x-3 mb-6">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => goToMove(0)}
                                    disabled={currentMove === 0}
                                    className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg border border-white/10"
                                >
                                    ⏮️ Start
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={previousMove}
                                    disabled={currentMove === 0}
                                    className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg border border-white/10"
                                >
                                    ⏪ Prev
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleAutoPlay}
                                    className={`px-6 py-3 rounded-xl text-white transition-all duration-300 shadow-lg border border-white/10 ${isAutoPlay
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                                        }`}
                                >
                                    {isAutoPlay ? '⏸️ Pause' : '▶️ Auto Play'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={nextMove}
                                    disabled={currentMove >= demoMoves.length}
                                    className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg border border-white/10"
                                >
                                    Next ⏩
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => goToMove(demoMoves.length)}
                                    disabled={currentMove >= demoMoves.length}
                                    className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-3 rounded-xl hover:from-slate-700 hover:to-slate-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 shadow-lg border border-white/10"
                                >
                                    End ⏭️
                                </motion.button>
                            </div>

                            {/* Premium Analysis Button */}
                            <div className="text-center">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={analyzeCurrentGame}
                                    disabled={isAnalyzing || !engineReady}
                                    className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white px-8 py-4 rounded-xl hover:from-emerald-700 hover:via-teal-700 hover:to-green-700 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-600 disabled:cursor-not-allowed font-bold text-lg transition-all duration-300 shadow-xl border border-white/10"
                                >
                                    {isAnalyzing ? (
                                        <div className="flex items-center space-x-3">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>� Deep Analysis in Progress...</span>
                                        </div>
                                    ) : (
                                        '� Analyze Game with Stockfish'
                                    )}
                                </motion.button>
                                {!engineReady && (
                                    <p className="text-yellow-300 text-sm mt-3 flex items-center justify-center space-x-2">
                                        <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                        <span>Engine initializing...</span>
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Premium Analysis Panel */}
                    <div className="space-y-6">
                        {/* Premium Game Info */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <span className="text-2xl mr-3">🎯</span> Game Intelligence
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Opening:</span>
                                    <span className="font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg">Spanish Opening</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Current Move:</span>
                                    <span className="font-bold text-white">{Math.ceil(currentMove / 2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Total Moves:</span>
                                    <span className="font-bold text-white">{Math.ceil(demoMoves.length / 2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Engine Status:</span>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${engineReady ? 'bg-emerald-400' : 'bg-yellow-400'} ${!engineReady ? 'animate-pulse' : ''}`} />
                                        <span className={`font-bold ${engineReady ? 'text-emerald-300' : 'text-yellow-300'}`}>
                                            {engineReady ? 'Ready' : 'Initializing...'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Analysis Depth:</span>
                                    <span className="font-bold text-teal-300">Depth 15</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Premium Analysis Results */}
                        {analysis.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                            >
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                    <span className="text-2xl mr-3">📈</span> Move Analysis
                                </h3>
                                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                                    {analysis.map((moveAnalysis, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${index === currentMove - 1
                                                    ? 'bg-emerald-500/20 border-emerald-400/40 shadow-lg'
                                                    : 'bg-slate-800/30 border-slate-600/30 hover:bg-slate-700/40 hover:border-slate-500/40'
                                                }`}
                                            onClick={() => goToMove(index + 1)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-white">
                                                    {Math.ceil((index + 1) / 2)}.{index % 2 === 0 ? ' ' : '.. '}
                                                    {moveAnalysis.move}
                                                </span>
                                                <span
                                                    className={`text-xs px-3 py-1 rounded-full font-bold ${moveAnalysis.classification === 'excellent'
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                                            : moveAnalysis.classification === 'good'
                                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                                                : moveAnalysis.classification === 'inaccuracy'
                                                                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                                                                    : moveAnalysis.classification === 'mistake'
                                                                        ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                                                                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                                                        }`}
                                                >
                                                    {moveAnalysis.classification}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                Evaluation: {moveAnalysis.evaluation > 0 ? '+' : ''}{moveAnalysis.evaluation.toFixed(2)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Premium Quick Actions */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                                <span className="text-2xl mr-3">⚡</span> Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/ai-game')}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg border border-white/10"
                                >
                                    🤖 Challenge AI
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push('/multiplayer')}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg border border-white/10"
                                >
                                    👥 Multiplayer Arena
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={loadDemoGame}
                                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg border border-white/10"
                                >
                                    🔄 Reset Demo
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Premium Features Badge */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md border border-emerald-400/30 rounded-2xl p-6"
                        >
                            <div className="text-center">
                                <div className="text-3xl mb-3">💎</div>
                                <h4 className="text-lg font-bold text-emerald-300 mb-2">Premium Analysis</h4>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    Powered by Stockfish engine with deep position evaluation and professional-grade move classification
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
