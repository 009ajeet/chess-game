'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleStartAIGame = () => {
    router.push('/ai-game');
  };

  const handleQuickMatch = () => {
    router.push('/multiplayer');
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
          <p className="text-xl text-white font-medium">Loading Chess Platform...</p>
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
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">♟</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  ChessMaster Pro
                </h1>
                <p className="text-sm text-gray-400">Professional Chess Platform</p>
              </div>
            </motion.div>

            {!user ? (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignIn}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign In to Play
              </motion.button>
            ) : (
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/profile')}
                  className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg hover:from-indigo-600/30 hover:to-purple-600/30 transition-all duration-300 flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>Profile</span>
                </motion.button>
                <div className="text-right">
                  <p className="text-white font-semibold">Welcome back!</p>
                  <p className="text-blue-300 text-sm">{user.username}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="bg-red-600/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg hover:bg-red-600/30 transition-all duration-300"
                >
                  Logout
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Master the Game
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience chess like never before with our AI-powered platform featuring
            <span className="text-blue-400 font-semibold"> Stockfish engine</span>,
            real-time multiplayer, and professional game analysis.
          </p>
        </motion.div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* AI Game Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Challenge</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Test your skills against our advanced Stockfish-powered AI with 10 difficulty levels.
                From beginner-friendly to grandmaster strength.
              </p>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-blue-400 font-semibold">10</p>
                    <p className="text-xs text-gray-400">Levels</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-400 font-semibold">2600</p>
                    <p className="text-xs text-gray-400">Max ELO</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-400 font-semibold">∞</p>
                    <p className="text-xs text-gray-400">Games</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartAIGame}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Challenge AI
              </motion.button>
            </div>
          </motion.div>

          {/* Multiplayer Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className="group relative bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Multiplayer Arena</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Challenge friends in real-time chess battles. Create private rooms,
                share codes, and enjoy seamless cross-device gameplay.
              </p>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-purple-400 font-semibold">2</p>
                    <p className="text-xs text-gray-400">Players</p>
                  </div>
                  <div className="text-center">
                    <p className="text-pink-400 font-semibold">Real-time</p>
                    <p className="text-xs text-gray-400">Sync</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-400 font-semibold">Global</p>
                    <p className="text-xs text-gray-400">Access</p>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuickMatch}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Play with Friends
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="text-center bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-blue-400/40 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-400 text-2xl">⚡</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Lightning Fast</h4>
            <p className="text-gray-400 text-sm">Optimized performance with instant move validation</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="text-center bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-green-400/40 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-400 text-2xl">🎯</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Professional Analysis</h4>
            <p className="text-gray-400 text-sm">Stockfish-powered move suggestions and evaluation</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => router.push('/profile')}
            className="text-center bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-indigo-400/40 transition-all duration-300 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-500/30 transition-all duration-300">
              <span className="text-indigo-400 text-2xl">👤</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Player Profile</h4>
            <p className="text-gray-400 text-sm">Track stats, rating, and achievements</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="text-center bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-400/40 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-400 text-2xl">🌐</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Cross-Platform</h4>
            <p className="text-gray-400 text-sm">Play seamlessly across all devices</p>
          </motion.div>
        </motion.div>
      </div>

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
