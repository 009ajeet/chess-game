// Button Test Component
'use client';

import { useState } from 'react';

export default function ButtonTest() {
    const [clickCount, setClickCount] = useState(0);

    const handleClick = () => {
        console.log('Button clicked!');
        setClickCount(prev => prev + 1);
        alert(`Button clicked ${clickCount + 1} times!`);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Button Test</h1>
                <p className="mb-4">Click count: {clickCount}</p>
                <button
                    onClick={handleClick}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Test Button
                </button>
                <div className="mt-4">
                    <button
                        onClick={() => alert('Direct inline works!')}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
                    >
                        Inline Handler
                    </button>
                    <button
                        onClick={function () { alert('Function expression works!'); }}
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                    >
                        Function Expression
                    </button>
                </div>
            </div>
        </div>
    );
}
