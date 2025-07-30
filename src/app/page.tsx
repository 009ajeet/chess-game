'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [gameMode, setGameMode] = useState<'ai' | 'multiplayer' | null>(null);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('Home component mounted');
    console.log('User:', user);
    console.log('Loading:', loading);
    console.log('Functions defined:', {
      handleStartAIGame: typeof handleStartAIGame,
      handleQuickMatch: typeof handleQuickMatch,
      handleViewDemo: typeof handleViewDemo
    });
  }, [user, loading]);

  const handleSignIn = () => {
    console.log('Sign in clicked'); // Debug log
    setShowAuthModal(true);
  };

  const handleStartAIGame = (e?: React.MouseEvent) => {
    console.log('Start AI Game clicked'); // Debug log
    console.log('Event handler called successfully');
    console.log('Event:', e);
    e?.preventDefault();
    e?.stopPropagation();
    setGameMode('ai');
    router.push('/ai-game');
  };

  const handleQuickMatch = (e?: React.MouseEvent) => {
    console.log('Quick Match clicked'); // Debug log
    console.log('Event handler called successfully');
    console.log('Event:', e);
    e?.preventDefault();
    e?.stopPropagation();
    setGameMode('multiplayer');
    router.push('/multiplayer');
  };

  const handleViewDemo = (e?: React.MouseEvent) => {
    console.log('View Demo clicked'); // Debug log
    console.log('Event handler called successfully');
    console.log('Event:', e);
    e?.preventDefault();
    e?.stopPropagation();
    router.push('/analysis');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {/* Debug button even during loading */}
          <button
            onClick={() => alert('Loading state button works!')}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            Test During Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Test Button - Remove this after testing */}
      <button
        onClick={() => {
          console.log('Test button clicked!');
          alert('Test button works!');
        }}
        className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded"
      >
        Test Click
      </button>

      {/* Additional diagnostic buttons */}
      <div className="fixed top-4 left-4 z-50 space-y-2">
        <button
          onClick={() => console.log('Diagnostic 1 clicked')}
          className="block bg-yellow-500 text-black px-2 py-1 rounded text-xs"
        >
          Diag 1
        </button>
        <button
          onClick={handleStartAIGame}
          className="block bg-orange-500 text-white px-2 py-1 rounded text-xs"
        >
          AI Test
        </button>
      </div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">AI Chess Platform</h1>
            </div>
            {!user ? (
              <button
                onClick={handleSignIn}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.username}!</span>
                <button
                  onClick={async () => {
                    console.log('Logout clicked'); // Debug log
                    try {
                      await logout();
                    } catch (error) {
                      console.error('Logout error:', error);
                    }
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Chess Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Play against our advanced AI engine with 10 difficulty levels, challenge friends in real-time multiplayer,
            and analyze your games with professional-grade Stockfish evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Play vs AI</h3>
              <p className="text-gray-600 mb-6">
                Challenge our Stockfish-powered AI with difficulty levels from beginner to grandmaster.
              </p>
              <button
                onClick={handleStartAIGame}
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium transition-colors cursor-pointer"
                onMouseDown={() => console.log('Start AI Game mousedown')}
              >
                Start AI Game
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Play with Friends</h3>
              <p className="text-gray-600 mb-6">
                Create or join rooms to play real-time chess with friends around the world.
              </p>
              <button
                onClick={handleQuickMatch}
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium transition-colors cursor-pointer"
                onMouseDown={() => console.log('Quick Match mousedown')}
              >
                Quick Match
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Game Analysis</h3>
              <p className="text-gray-600 mb-6">
                Get detailed post-game analysis with move evaluation and improvement suggestions.
              </p>
              <button
                onClick={handleViewDemo}
                style={{ pointerEvents: 'auto', zIndex: 10 }}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 font-medium transition-colors cursor-pointer"
                onMouseDown={() => console.log('View Demo mousedown')}
              >
                View Demo
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">♔</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Stockfish AI</h4>
              <p className="text-sm text-gray-600">Industry-standard chess engine with adjustable difficulty</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Real-time Multiplayer</h4>
              <p className="text-sm text-gray-600">Play with friends in real-time with room system</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Game Analysis</h4>
              <p className="text-sm text-gray-600">Detailed post-game analysis with move evaluation</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">ELO Rating</h4>
              <p className="text-sm text-gray-600">Track your progress with competitive rating system</p>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
