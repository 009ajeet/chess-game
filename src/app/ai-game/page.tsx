'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useAuth } from '@/contexts/AuthContext';
import { stockfishEngine } from '@/lib/stockfish';
import { useRouter } from 'next/navigation';

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
            await new Promise<void>((resolve) => {
                stockfishEngine.getBestMove(game.fen(), 1000, (bestMove) => {
                    try {
                        console.log('AI suggested move:', bestMove, 'for position:', game.fen());

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

    const updateGameStatus = () => {
        if (game.isCheckmate()) {
            setGameStatus(game.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!');
        } else if (game.isDraw()) {
            setGameStatus('Game ended in a draw!');
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
    };

    const goBack = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Play vs AI</h1>
                            <p className="text-gray-600">Challenge our Stockfish-powered chess engine</p>
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
                                {isThinking && (
                                    <div className="text-blue-600 font-medium">
                                        🤖 AI is thinking...
                                    </div>
                                )}
                                {gameStatus && (
                                    <div className="text-lg font-bold text-red-600">
                                        {gameStatus}
                                    </div>
                                )}
                                {!engineReady && (
                                    <div className="text-yellow-600 font-medium">
                                        ⚙️ Initializing chess engine...
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <div style={{ width: '100%', maxWidth: '500px' }}>
                                    <Chessboard
                                        options={{
                                            position: gamePosition,
                                            onPieceDrop: onDrop,
                                            boardOrientation: "white",
                                            allowDragging: isPlayerTurn && !isThinking && engineReady,
                                            boardStyle: {
                                                borderRadius: '4px',
                                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Game Controls */}
                    <div className="space-y-6">
                        {/* Difficulty Settings */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Difficulty Level</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700">
                                        Level: {difficulty}
                                    </label>
                                    <span className="text-xs text-gray-500">
                                        {difficulty <= 3 ? 'Beginner' : difficulty <= 6 ? 'Intermediate' : difficulty <= 8 ? 'Advanced' : 'Expert'}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    disabled={!engineReady}
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>1</span>
                                    <span>5</span>
                                    <span>10</span>
                                </div>
                            </div>
                        </div>

                        {/* Game Info */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Game Info</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Turn:</span>
                                    <span className="font-medium">
                                        {game.turn() === 'w' ? 'White' : 'Black'}
                                        {isThinking ? ' (AI)' : ' (You)'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Move:</span>
                                    <span className="font-medium">{Math.ceil(game.history().length / 2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Engine:</span>
                                    <span className={`font-medium ${engineReady ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {engineReady ? 'Ready' : 'Loading...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Controls</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={resetGame}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    New Game
                                </button>
                                <button
                                    onClick={() => router.push('/multiplayer')}
                                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Play Multiplayer
                                </button>
                                <button
                                    onClick={() => router.push('/analysis')}
                                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Analyze Game
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
