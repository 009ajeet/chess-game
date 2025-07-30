'use client';

import React, { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Square } from 'chess.js';
import { useGame } from '@/hooks/useGame';
import { ChessTheme } from '@/types/chess';

interface ChessBoardProps {
    gameMode: 'ai' | 'multiplayer';
    aiLevel?: number;
    gameId?: string;
    theme?: ChessTheme;
    playerColor?: 'white' | 'black';
    onGameEnd?: (result: 'white' | 'black' | 'draw') => void;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
    gameMode,
    aiLevel = 5,
    gameId,
    theme = 'classic',
    playerColor = 'white',
    onGameEnd,
}) => {
    const [moveFrom, setMoveFrom] = useState<Square | null>(null);
    const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, boolean>>({});
    const [moveSquares, setMoveSquares] = useState<Record<string, { background: string }>>({});
    const [optionSquares, setOptionSquares] = useState<Record<string, { background: string }>>({});

    const {
        game,
        gameState,
        isLoading,
        makeMove,
        getValidMoves,
        position,
        turn,
        isCheck,
        isCheckmate,
        isDraw,
    } = useGame({
        gameMode,
        aiLevel,
        gameId,
        timeControl: { initial: 600, increment: 5 },
    });

    const getBoardTheme = (theme: ChessTheme) => {
        switch (theme) {
            case 'wood':
                return {
                    lightSquareStyle: { backgroundColor: '#f0d9b5' },
                    darkSquareStyle: { backgroundColor: '#b58863' },
                };
            case 'dark':
                return {
                    lightSquareStyle: { backgroundColor: '#4a4a4a' },
                    darkSquareStyle: { backgroundColor: '#2a2a2a' },
                };
            case 'neon':
                return {
                    lightSquareStyle: { backgroundColor: '#00ff88' },
                    darkSquareStyle: { backgroundColor: '#0088ff' },
                };
            case 'marble':
                return {
                    lightSquareStyle: { backgroundColor: '#f5f5dc' },
                    darkSquareStyle: { backgroundColor: '#8b7355' },
                };
            default: // classic
                return {
                    lightSquareStyle: { backgroundColor: '#f2f2f2' },
                    darkSquareStyle: { backgroundColor: '#999999' },
                };
        }
    };

    const getMoveOptions = useCallback((square: Square) => {
        const moves = getValidMoves(square);
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares: Record<string, { background: string }> = {};
        moves.forEach((move: any) => {
            // Handle verbose move object
            const targetSquare = move.to || move;
            const targetPiece = game.get(targetSquare as Square);
            const sourcePiece = game.get(square);

            newSquares[targetSquare] = {
                background:
                    targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color
                        ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                        : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
            };
        });
        newSquares[square] = {
            background: 'rgba(255, 255, 0, 0.4)',
        };
        setOptionSquares(newSquares);
        return true;
    }, [game, getValidMoves]);

    const onSquareClick = useCallback(async (square: Square) => {
        // Don't allow moves if it's not player's turn
        if (gameMode === 'ai' && turn !== (playerColor === 'white' ? 'w' : 'b')) {
            return;
        }

        // Don't allow moves if game is over
        if (isCheckmate || isDraw) {
            return;
        }

        setRightClickedSquares({});

        function resetFirstMove(square: Square) {
            const hasOptions = getMoveOptions(square);
            if (hasOptions) setMoveFrom(square);
        }

        // from square
        if (!moveFrom) {
            resetFirstMove(square);
            return;
        }

        // to square
        if (moveFrom === square) {
            setMoveFrom(null);
            setOptionSquares({});
            return;
        }

        const piece = game.get(moveFrom);
        if (piece && piece.color !== (turn === 'w' ? 'w' : 'b')) {
            resetFirstMove(square);
            return;
        }

        // Attempt to make move
        const moveResult = await makeMove(moveFrom, square);

        if (moveResult) {
            setMoveFrom(null);
            setOptionSquares({});
            setMoveSquares({
                [moveFrom]: { background: 'rgba(255, 255, 0, 0.4)' },
                [square]: { background: 'rgba(255, 255, 0, 0.4)' },
            });
        } else {
            resetFirstMove(square);
        }
    }, [moveFrom, getMoveOptions, game, turn, makeMove, gameMode, playerColor, isCheckmate, isDraw]);

    const onSquareRightClick = useCallback((square: Square) => {
        const colour = 'rgba(0, 0, 255, 0.4)';
        setRightClickedSquares({
            ...rightClickedSquares,
            [square]: rightClickedSquares[square]
                ? !rightClickedSquares[square]
                : true,
        });
    }, [rightClickedSquares]);

    const customSquareStyles = {
        ...moveSquares,
        ...optionSquares,
        ...Object.keys(rightClickedSquares).reduce(
            (acc, square) => ({
                ...acc,
                [square]: rightClickedSquares[square]
                    ? { backgroundColor: 'rgba(0, 0, 255, 0.4)' }
                    : {},
            }),
            {}
        ),
    };

    // Check for game end
    React.useEffect(() => {
        if (isCheckmate) {
            const winner = turn === 'w' ? 'black' : 'white';
            onGameEnd?.(winner);
        } else if (isDraw) {
            onGameEnd?.('draw');
        }
    }, [isCheckmate, isDraw, turn, onGameEnd]);

    const handleSquareClick = useCallback(async ({ square }: { square: string }) => {
        await onSquareClick(square as Square);
    }, [onSquareClick]);

    const handleSquareRightClick = useCallback(({ square }: { square: string }) => {
        onSquareRightClick(square as Square);
    }, [onSquareRightClick]);

    return (
        <div className="relative">
            <Chessboard
                options={{
                    position: position,
                    onSquareClick: handleSquareClick,
                    onSquareRightClick: handleSquareRightClick,
                    boardOrientation: playerColor,
                    squareStyles: customSquareStyles,
                    allowDragging: !isCheckmate && !isDraw,
                    animationDurationInMs: 200,
                    boardStyle: {
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        width: '400px',
                        height: '400px',
                    },
                    lightSquareStyle: getBoardTheme(theme).lightSquareStyle,
                    darkSquareStyle: getBoardTheme(theme).darkSquareStyle,
                }}
            />

            {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="bg-white p-4 rounded-lg flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="text-gray-700">AI is thinking...</span>
                    </div>
                </div>
            )}

            {isCheck && !isCheckmate && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    CHECK
                </div>
            )}

            {isCheckmate && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="bg-white p-6 rounded-lg text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkmate!</h2>
                        <p className="text-gray-600">
                            {turn === 'w' ? 'Black' : 'White'} wins
                        </p>
                    </div>
                </div>
            )}

            {isDraw && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="bg-white p-6 rounded-lg text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Draw!</h2>
                        <p className="text-gray-600">Game ended in a draw</p>
                    </div>
                </div>
            )}
        </div>
    );
};
