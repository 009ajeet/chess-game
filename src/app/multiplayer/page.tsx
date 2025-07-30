'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { multiplayerService, MultiplayerGame } from '@/lib/multiplayer';
import toast from 'react-hot-toast';

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
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
                    <p className="text-gray-600 mb-6">Please sign in to play multiplayer chess</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!isInRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Multiplayer Chess</h1>
                                <p className="text-gray-600">Play with friends in real-time</p>
                            </div>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">🎮</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Room</h3>
                                <p className="text-gray-600 mb-6">
                                    Start a new game and share the room code with your friend
                                </p>
                                <button
                                    onClick={createRoom}
                                    disabled={isLoading}
                                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Creating...' : 'Create New Room'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">🚪</span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Join Room</h3>
                                <p className="text-gray-600 mb-6">
                                    Enter a room code to join an existing game
                                </p>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Enter room code"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        maxLength={6}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={joinRoom}
                                        disabled={!roomCode.trim() || isLoading}
                                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400"
                                    >
                                        {isLoading ? 'Joining...' : 'Join Room'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Multiplayer Chess</h1>
                            <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-600">Room: <strong>{roomCode}</strong></span>
                                <span className="text-sm text-gray-600">
                                    Playing as: <strong className={playerColor === 'white' ? 'text-blue-600' : 'text-red-600'}>
                                        {playerColor}
                                    </strong>
                                </span>
                                {opponent && (
                                    <span className="text-sm text-gray-600">
                                        vs <strong>{opponent}</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={leaveRoom}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Leave Room
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-lg p-4">
                            <div className="aspect-square max-w-2xl mx-auto">
                                <Chessboard
                                    options={{
                                        position: gamePosition,
                                        onPieceDrop: onDrop,
                                        boardOrientation: playerColor,
                                        allowDragging: isPlayerTurn,
                                        boardStyle: {
                                            borderRadius: '4px',
                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                        }
                                    }}
                                />
                            </div>

                            <div className="mt-4 text-center">
                                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${isPlayerTurn
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {isPlayerTurn ? '🎯 Your Turn' : '⏳ Waiting for opponent...'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Status</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Room Code:</span>
                                    <span className="font-mono font-bold">{roomCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Your Color:</span>
                                    <span className={`font-semibold ${playerColor === 'white' ? 'text-blue-600' : 'text-red-600'}`}>
                                        {playerColor}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Opponent:</span>
                                    <span className="font-semibold">
                                        {opponent || 'Waiting...'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-semibold ${gameData?.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                                        }`}>
                                        {gameData?.status === 'active' ? 'Playing' : 'Waiting'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(roomCode);
                                        toast.success('Room code copied!');
                                    }}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    📋 Copy Room Code
                                </button>
                                <button
                                    onClick={leaveRoom}
                                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                    🚪 Leave Game
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
