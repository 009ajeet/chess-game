'use client';

import { useState } from 'react';

// Minimal test component without auth context
export default function SimpleTest() {
    const [clicked, setClicked] = useState('None');

    const testAI = () => {
        console.log('AI button clicked');
        setClicked('AI Game');
        alert('AI Game clicked!');
    };

    const testMultiplayer = () => {
        console.log('Multiplayer button clicked');
        setClicked('Multiplayer');
        alert('Multiplayer clicked!');
    };

    const testDemo = () => {
        console.log('Demo button clicked');
        setClicked('Demo');
        alert('Demo clicked!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Simple Button Test</h1>

            <div className="max-w-4xl mx-auto">
                <p className="text-center mb-8">Last clicked: {clicked}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h3 className="text-xl font-bold mb-4">AI Game</h3>
                        <button
                            onClick={testAI}
                            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
                        >
                            Start AI Game
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h3 className="text-xl font-bold mb-4">Multiplayer</h3>
                        <button
                            onClick={testMultiplayer}
                            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700"
                        >
                            Quick Match
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h3 className="text-xl font-bold mb-4">Demo</h3>
                        <button
                            onClick={testDemo}
                            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700"
                        >
                            View Demo
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <a href="/" className="text-blue-600 hover:text-blue-800">Back to Main Page</a>
                </div>
            </div>
        </div>
    );
}
