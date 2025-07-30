'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { GameState, GameMove, User } from '@/types/chess';
import { doc, onSnapshot, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stockfishEngine } from '@/lib/stockfish';
import toast from 'react-hot-toast';

interface UseGameOptions {
    gameId?: string;
    gameMode: 'ai' | 'multiplayer';
    aiLevel?: number;
    timeControl?: { initial: number; increment: number };
}

export const useGame = (options: UseGameOptions) => {
    const [game, setGame] = useState(new Chess());
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPlayerTime, setCurrentPlayerTime] = useState(0);
    const [opponentTime, setOpponentTime] = useState(0);

    // Initialize game
    useEffect(() => {
        if (options.gameId) {
            // Load existing game from Firestore
            const unsubscribe = onSnapshot(
                doc(db, 'games', options.gameId),
                (doc) => {
                    if (doc.exists()) {
                        const data = doc.data() as GameState;
                        setGameState(data);

                        // Reconstruct chess position from moves
                        const newGame = new Chess();
                        data.moves.forEach(move => {
                            newGame.move(move.san);
                        });
                        setGame(newGame);
                    }
                }
            );

            return unsubscribe;
        } else {
            // Create new game
            initializeNewGame();
        }
    }, [options.gameId]);

    // Timer management
    useEffect(() => {
        if (!gameState || gameState.status !== 'active') return;

        const interval = setInterval(() => {
            const currentPlayer = game.turn() === 'w' ? 'white' : 'black';

            if (currentPlayer === 'white') {
                setCurrentPlayerTime(prev => Math.max(0, prev - 1));
            } else {
                setOpponentTime(prev => Math.max(0, prev - 1));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState, game]);

    // AI move handling
    useEffect(() => {
        if (
            options.gameMode === 'ai' &&
            gameState?.status === 'active' &&
            game.turn() === 'b' &&
            !game.isGameOver()
        ) {
            makeAIMove();
        }
    }, [gameState, game.turn()]);

    const initializeNewGame = useCallback(async () => {
        const newGameState: GameState = {
            id: '',
            players: {
                white: null,
                black: null,
            },
            spectators: [],
            gameMode: options.gameMode,
            aiLevel: options.aiLevel,
            currentTurn: 'white',
            moves: [],
            status: 'waiting',
            timeControl: options.timeControl || { initial: 600, increment: 5 },
            timeRemaining: {
                white: options.timeControl?.initial || 600,
                black: options.timeControl?.initial || 600,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setGameState(newGameState);
        setCurrentPlayerTime(newGameState.timeRemaining.white);
        setOpponentTime(newGameState.timeRemaining.black);
    }, [options]);

    const makeMove = useCallback(async (from: string, to: string, promotion?: string) => {
        if (!gameState || gameState.status !== 'active') return false;

        try {
            const move = game.move({
                from,
                to,
                promotion: promotion as any,
            });

            if (!move) return false;

            const newMove: GameMove = {
                from,
                to,
                promotion,
                san: move.san,
                fen: game.fen(),
                timestamp: new Date(),
            };

            const updatedGameState: GameState = {
                ...gameState,
                moves: [...gameState.moves, newMove],
                currentTurn: game.turn() === 'w' ? 'white' : 'black',
                timeRemaining: {
                    white: game.turn() === 'w' ? currentPlayerTime : gameState.timeRemaining.white,
                    black: game.turn() === 'b' ? opponentTime : gameState.timeRemaining.black,
                },
                updatedAt: new Date(),
            };

            // Check for game end
            if (game.isGameOver()) {
                if (game.isCheckmate()) {
                    updatedGameState.status = 'finished';
                    updatedGameState.result = game.turn() === 'w' ? 'black' : 'white';
                    updatedGameState.resultReason = 'checkmate';
                } else if (game.isDraw()) {
                    updatedGameState.status = 'finished';
                    updatedGameState.result = 'draw';
                    updatedGameState.resultReason = game.isStalemate() ? 'stalemate' : 'draw';
                }
            }

            setGameState(updatedGameState);

            // Update in Firestore if multiplayer
            if (options.gameMode === 'multiplayer' && options.gameId) {
                await updateDoc(doc(db, 'games', options.gameId), updatedGameState as any);
            }

            return true;
        } catch (error) {
            console.error('Move error:', error);
            toast.error('Invalid move');
            return false;
        }
    }, [game, gameState, currentPlayerTime, opponentTime, options]);

    const makeAIMove = useCallback(async () => {
        if (!gameState || options.gameMode !== 'ai') return;

        setIsLoading(true);

        try {
            await stockfishEngine.initialize();
            stockfishEngine.setSkillLevel(options.aiLevel || 5);

            await new Promise<void>((resolve) => {
                stockfishEngine.getBestMove(game.fen(), 2000, (bestMove) => {
                    if (bestMove && bestMove !== '(none)') {
                        const from = bestMove.slice(0, 2);
                        const to = bestMove.slice(2, 4);
                        const promotion = bestMove.length > 4 ? bestMove[4] : undefined;

                        setTimeout(() => {
                            makeMove(from, to, promotion);
                            resolve();
                        }, 500); // Small delay for better UX
                    } else {
                        resolve();
                    }
                });
            });
        } catch (error) {
            console.error('AI move error:', error);
            toast.error('AI move failed');
        } finally {
            setIsLoading(false);
        }
    }, [game, gameState, makeMove, options.aiLevel]);

    const resign = useCallback(async (player: 'white' | 'black') => {
        if (!gameState) return;

        const updatedGameState: GameState = {
            ...gameState,
            status: 'finished',
            result: player === 'white' ? 'black' : 'white',
            resultReason: 'resignation',
            updatedAt: new Date(),
        };

        setGameState(updatedGameState);

        if (options.gameMode === 'multiplayer' && options.gameId) {
            await updateDoc(doc(db, 'games', options.gameId), updatedGameState as any);
        }

        toast.success(`${player === 'white' ? 'Black' : 'White'} wins by resignation!`);
    }, [gameState, options]);

    const offerDraw = useCallback(async () => {
        // Implementation for draw offers
        toast.success('Draw offer sent');
    }, []);

    const getValidMoves = useCallback((square: string) => {
        return game.moves({ square: square as any, verbose: true });
    }, [game]);

    const isSquareAttacked = useCallback((square: string, color: 'white' | 'black') => {
        return game.isAttacked(square as any, color === 'white' ? 'w' : 'b');
    }, [game]);

    return {
        game,
        gameState,
        isLoading,
        currentPlayerTime,
        opponentTime,
        makeMove,
        resign,
        offerDraw,
        getValidMoves,
        isSquareAttacked,
        position: game.fen(),
        history: game.history({ verbose: true }),
        turn: game.turn(),
        isCheck: game.isCheck(),
        isCheckmate: game.isCheckmate(),
        isDraw: game.isDraw(),
        isGameOver: game.isGameOver(),
    };
};
