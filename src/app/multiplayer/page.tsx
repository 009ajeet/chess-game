'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

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

    const createRoom = () => {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoomCode(code);
        setIsInRoom(true);
        setPlayerColor('white');
        console.log('Room created:', code);
        // TODO: Implement Firebase room creation
    };

    const joinRoom = () => {
        if (roomCode.trim()) {
            setIsInRoom(true);
            setPlayerColor('black');
            console.log('Joining room:', roomCode);
            // TODO: Implement Firebase room joining
        }
    };

    const leaveRoom = () => {
        setIsInRoom(false);
        setRoomCode('');
        setOpponent(null);
        setPlayerColor('white');
        // Reset game
        game.reset();
        setGamePosition(game.fen());
    };

    const onDrop = (args: any) => {
        const { sourceSquare, targetSquare } = args;
        if (!isPlayerTurn || !targetSquare) return false;

        try {
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (move) {
                setGamePosition(game.fen());
                setIsPlayerTurn(false);
                // TODO: Send move to Firebase
                return true;
            }
        } catch (error) {
            console.error('Invalid move:', error);
        }

        return false;
    };

    const goBack = () => {
        router.push('/');
    };

    if (!isInRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Multiplayer Chess</h1>
                                <p className="text-gray-600">Play with friends in real-time</p>
                            </div>
                            <button
                                onClick={goBack}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>

                    {/* Room Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Create Room */}
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
                                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium transition-colors"
                                >
                                    Create New Room
                                </button>
                            </div>
                        </div>

                        {/* Join Room */}
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
                                    />
                                    <button
                                        onClick={joinRoom}
                                        disabled={!roomCode.trim()}
                                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Join Room
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Multiplayer Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Real-time Play</h4>
                                <p className="text-sm text-gray-600">Moves are synchronized instantly between players</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <span className="text-2xl">🔒</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Private Rooms</h4>
                                <p className="text-sm text-gray-600">Secure room codes ensure only invited players can join</p>
                            </div>

                            <div className="text-center">
                                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <span className="text-2xl">💬</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-2">Game Chat</h4>
                                <p className="text-sm text-gray-600">Communicate with your opponent during the game</p>
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
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Room: {roomCode}</h1>
                            <p className="text-gray-600">Playing as {playerColor}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={leaveRoom}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Leave Room
                            </button>
                            <button
                                onClick={goBack}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Game Board */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="mb-4 text-center">
                                {!opponent && (
                                    <div className="text-blue-600 font-medium">
                                        🔗 Waiting for opponent to join...
                                        <br />
                                        <span className="text-sm">Share room code: <strong>{roomCode}</strong></span>
                                    </div>
                                )}
                                {opponent && (
                                    <div className="text-green-600 font-medium">
                                        🎮 Playing against {opponent}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center">
                                <div style={{ width: '100%', maxWidth: '500px' }}>
                                    <Chessboard
                                        options={{
                                            position: gamePosition,
                                            onPieceDrop: onDrop,
                                            allowDragging: isPlayerTurn && !!opponent,
                                            boardOrientation: playerColor,
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

                    {/* Game Info & Chat */}
                    <div className="space-y-6">
                        {/* Game Info */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Game Info</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Room:</span>
                                    <span className="font-medium">{roomCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">You:</span>
                                    <span className="font-medium capitalize">{playerColor}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Turn:</span>
                                    <span className="font-medium">
                                        {game.turn() === 'w' ? 'White' : 'Black'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`font-medium ${opponent ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {opponent ? 'In Game' : 'Waiting...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigator.clipboard?.writeText(roomCode)}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Copy Room Code
                                </button>
                                <button
                                    onClick={() => router.push('/ai-game')}
                                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    Play vs AI
                                </button>
                                <button
                                    onClick={() => router.push('/analysis')}
                                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    Game Analysis
                                </button>
                            </div>
                        </div>

                        {/* Implementation Note */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="text-sm text-yellow-800">
                                <strong>🚧 Development Note:</strong>
                                <br />
                                Multiplayer functionality is partially implemented.
                                Real-time synchronization with Firebase will be added in the next iteration.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
