'use client';

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { GameAnalysis, GameMove } from '@/types/chess';
import { analyzeGame, classifyMove } from '@/lib/stockfish';
import { ChartBarIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline';

interface GameAnalysisProps {
    gameId: string;
    moves: GameMove[];
    onClose: () => void;
}

export const GameAnalysisComponent: React.FC<GameAnalysisProps> = ({
    gameId,
    moves,
    onClose,
}) => {
    const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        performAnalysis();
    }, [moves]);

    const performAnalysis = async () => {
        if (moves.length === 0) return;

        setIsAnalyzing(true);
        setProgress(0);

        try {
            const moveStrings = moves.map(m => m.san);
            const evaluations = await analyzeGame(moveStrings, setProgress);

            const analysisData: GameAnalysis = {
                gameId,
                moves: [],
                averageAccuracy: { white: 0, black: 0 },
                totalBlunders: { white: 0, black: 0 },
                engineDepth: 12,
                analyzedAt: new Date(),
            };

            let whiteTotal = 0;
            let blackTotal = 0;
            let whiteCount = 0;
            let blackCount = 0;

            // Analyze each move
            for (let i = 0; i < evaluations.length; i++) {
                const evaluation = evaluations[i];
                const move = moves[i];
                const isWhiteMove = i % 2 === 0;

                // Calculate accuracy (simplified)
                const accuracy = Math.max(0, 100 - Math.abs(evaluation.score) * 10);
                const classification = classifyMove(evaluation.score, evaluation.score);

                analysisData.moves.push({
                    moveNumber: Math.floor(i / 2) + 1,
                    evaluation: evaluation.score,
                    bestMove: evaluation.bestMove,
                    actualMove: move.san,
                    accuracy,
                    classification,
                });

                // Track accuracy by color
                if (isWhiteMove) {
                    whiteTotal += accuracy;
                    whiteCount++;
                    if (classification === 'blunder') {
                        analysisData.totalBlunders.white++;
                    }
                } else {
                    blackTotal += accuracy;
                    blackCount++;
                    if (classification === 'blunder') {
                        analysisData.totalBlunders.black++;
                    }
                }
            }

            analysisData.averageAccuracy.white = whiteCount > 0 ? whiteTotal / whiteCount : 0;
            analysisData.averageAccuracy.black = blackCount > 0 ? blackTotal / blackCount : 0;

            setAnalysis(analysisData);
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getClassificationColor = (classification: string) => {
        switch (classification) {
            case 'excellent': return 'text-green-600';
            case 'good': return 'text-blue-600';
            case 'inaccuracy': return 'text-yellow-600';
            case 'mistake': return 'text-orange-600';
            case 'blunder': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getClassificationIcon = (classification: string) => {
        switch (classification) {
            case 'excellent': return '✨';
            case 'good': return '✓';
            case 'inaccuracy': return '?!';
            case 'mistake': return '?';
            case 'blunder': return '??';
            default: return '';
        }
    };

    if (isAnalyzing) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Analyzing Game</h2>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <ChartBarIcon className="h-6 w-6 text-blue-500" />
                            <span className="text-gray-700">Running Stockfish analysis...</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600">
                            Analyzing move {Math.round(progress * moves.length)} of {moves.length}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">Game Analysis</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <TrophyIcon className="h-5 w-5 text-blue-500" />
                                <h3 className="font-semibold text-gray-900">Accuracy</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">White:</span>
                                    <span className="font-medium">{analysis.averageAccuracy.white.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Black:</span>
                                    <span className="font-medium">{analysis.averageAccuracy.black.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <ChartBarIcon className="h-5 w-5 text-red-500" />
                                <h3 className="font-semibold text-gray-900">Blunders</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">White:</span>
                                    <span className="font-medium">{analysis.totalBlunders.white}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Black:</span>
                                    <span className="font-medium">{analysis.totalBlunders.black}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <ClockIcon className="h-5 w-5 text-green-500" />
                                <h3 className="font-semibold text-gray-900">Analysis</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Depth:</span>
                                    <span className="font-medium">{analysis.engineDepth}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Moves:</span>
                                    <span className="font-medium">{analysis.moves.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Move-by-Move Analysis */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Move Analysis</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {analysis.moves.map((moveAnalysis, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className="font-medium text-gray-900 w-8">
                                            {moveAnalysis.moveNumber}.
                                        </span>
                                        <span className="font-mono text-gray-800 w-16">
                                            {moveAnalysis.actualMove}
                                        </span>
                                        <span className={`text-sm ${getClassificationColor(moveAnalysis.classification)}`}>
                                            {getClassificationIcon(moveAnalysis.classification)} {moveAnalysis.classification}
                                        </span>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <span className="text-sm text-gray-600">
                                            Accuracy: {moveAnalysis.accuracy.toFixed(1)}%
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            Eval: {moveAnalysis.evaluation > 0 ? '+' : ''}{moveAnalysis.evaluation.toFixed(2)}
                                        </span>
                                        {moveAnalysis.bestMove !== moveAnalysis.actualMove && (
                                            <span className="text-sm text-blue-600">
                                                Best: {moveAnalysis.bestMove}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
