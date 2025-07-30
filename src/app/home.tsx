export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <h1 className="text-2xl font-bold text-gray-900">AI Chess Platform</h1>
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Sign In
                        </button>
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
                            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium">
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
                            <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium">
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
                            <button className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 font-medium">
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
        </div>
    );
}
