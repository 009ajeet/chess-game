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
    const [analysisProgress, setAnalysisProgress] = useState(0);

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
        setAnalysisProgress(0);

        try {
            const currentMoves = demoMoves.slice(0, currentMove);
            console.log(`Starting analysis of ${currentMoves.length} moves...`);
            
            const evaluations = await analyzeGame(currentMoves, (progress) => {
                setAnalysisProgress(progress);
                console.log(`Analysis progress: ${Math.round(progress * 100)}%`);
            });

            console.log('Analysis completed, evaluations received:', evaluations.length);

            const gameAnalysis: GameAnalysis[] = [];

            for (let i = 0; i < currentMoves.length; i++) {
                const evaluation = evaluations[i];
                if (!evaluation) {
                    console.warn(`No evaluation for move ${i + 1}`);
                    continue;
                }
                
                const prevEval = i > 0 ? evaluations[i - 1]?.score || 0 : 0;

                gameAnalysis.push({
                    moveNumber: i + 1,
                    move: currentMoves[i],
                    fen: evaluation.bestMove || '',
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

    const goBack = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Game Analysis Demo</h1>
                            <p className="text-gray-600">Analyze chess games with Stockfish engine</p>
                        </div>
                        <button
                            onClick={goBack}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Game Board */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="mb-4 text-center">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    Spanish Opening Demo Game
                                </h3>
                                <p className="text-gray-600">
                                    Move {currentMove} of {demoMoves.length}
                                    {isAnalyzing && <span className="text-blue-600 ml-2">🔍 Analyzing...</span>}
                                </p>
                            </div>

                            <div className="flex justify-center mb-6">
                                <div style={{ width: '100%', maxWidth: '500px' }}>
                                    <Chessboard
                                        options={{
                                            position: gamePosition,
                                            boardOrientation: "white",
                                            allowDragging: false,
                                            boardStyle: {
                                                borderRadius: '4px',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Game Controls */}
                            <div className="flex justify-center space-x-2 mb-4">
                                <button
                                    onClick={() => goToMove(0)}
                                    disabled={currentMove === 0}
                                    className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    ⏮️ Start
                                </button>
                                <button
                                    onClick={previousMove}
                                    disabled={currentMove === 0}
                                    className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    ⏪ Prev
                                </button>
                                <button
                                    onClick={toggleAutoPlay}
                                    className={`px-4 py-2 rounded text-white ${isAutoPlay ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {isAutoPlay ? '⏸️ Pause' : '▶️ Auto Play'}
                                </button>
                                <button
                                    onClick={nextMove}
                                    disabled={currentMove >= demoMoves.length}
                                    className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Next ⏩
                                </button>
                                <button
                                    onClick={() => goToMove(demoMoves.length)}
                                    disabled={currentMove >= demoMoves.length}
                                    className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    End ⏭️
                                </button>
                            </div>

                            {/* Analysis Control */}
                            <div className="text-center">
                                <button
                                    onClick={analyzeCurrentGame}
                                    disabled={isAnalyzing || !engineReady}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                                >
                                    {isAnalyzing ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>🧠 Analyzing... {Math.round(analysisProgress * 100)}%</span>
                                        </div>
                                    ) : (
                                        '🧠 Analyze Game with Stockfish'
                                    )}
                                </button>
                                {!engineReady && (
                                    <p className="text-yellow-600 text-sm mt-2">⚙️ Engine loading...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Analysis Panel */}
                    <div className="space-y-6">
                        {/* Game Info */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Game Info</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Opening:</span>
                                    <span className="font-medium">Spanish Opening</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Current Move:</span>
                                    <span className="font-medium">{Math.ceil(currentMove / 2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Moves:</span>
                                    <span className="font-medium">{Math.ceil(demoMoves.length / 2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Engine:</span>
                                    <span className={`font-medium ${engineReady ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {engineReady ? 'Ready' : 'Loading...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Results */}
                        {analysis.length > 0 && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Move Analysis</h3>
                                <div className="max-h-96 overflow-y-auto space-y-2">
                                    {analysis.map((moveAnalysis, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded cursor-pointer transition-colors ${index === currentMove - 1
                                                    ? 'bg-blue-100 border border-blue-300'
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                            onClick={() => goToMove(index + 1)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                    {Math.ceil((index + 1) / 2)}.{index % 2 === 0 ? ' ' : '.. '}
                                                    {moveAnalysis.move}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-1 rounded ${moveAnalysis.classification === 'excellent'
                                                            ? 'bg-green-100 text-green-800'
                                                            : moveAnalysis.classification === 'good'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : moveAnalysis.classification === 'inaccuracy'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : moveAnalysis.classification === 'mistake'
                                                                        ? 'bg-orange-100 text-orange-800'
                                                                        : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {moveAnalysis.classification}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Eval: {moveAnalysis.evaluation > 0 ? '+' : ''}{moveAnalysis.evaluation.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/ai-game')}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Play vs AI
                                </button>
                                <button
                                    onClick={() => router.push('/multiplayer')}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Multiplayer Game
                                </button>
                                <button
                                    onClick={loadDemoGame}
                                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Reset Demo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
