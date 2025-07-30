import { StockfishEngine, EngineEvaluation } from '@/types/chess';
import { Chess } from 'chess.js';

class StockfishWrapper {
    private engine: StockfishEngine | null = null;
    private isReady = false;
    private evalCallback: ((evaluation: EngineEvaluation) => void) | null = null;
    private bestMoveCallback: ((move: string) => void) | null = null;

    async initialize(): Promise<void> {
        if (this.engine) {
            this.terminate();
        }

        // Always use mock engine for now to avoid module issues
        console.log('Using mock Stockfish engine for development');
        this.createMockEngine();
        return Promise.resolve();

        /* TODO: Re-enable real Stockfish once module is properly configured
        try {
            // First try browser-based approach
            if (typeof window !== 'undefined') {
                console.log('Attempting to initialize Stockfish in browser...');
                
                // Try dynamic import for Stockfish WASM
                let StockfishModule;
                try {
                    StockfishModule = await import('stockfish');
                } catch (importError) {
                    console.warn('Failed to import stockfish module:', importError);
                    throw importError;
                }
                
                const Stockfish = StockfishModule.default || StockfishModule;
                
                if (typeof Stockfish === 'function') {
                    this.engine = new (Stockfish as any)() as StockfishEngine;
                } else {
                    throw new Error('Stockfish module is not a constructor function');
                }

                return new Promise((resolve, reject) => {
                    if (!this.engine) {
                        reject(new Error('Failed to create Stockfish engine'));
                        return;
                    }

                    const timeout = setTimeout(() => {
                        console.warn('Stockfish initialization timeout, falling back to mock engine');
                        this.createMockEngine();
                        resolve();
                    }, 10000);

                    this.engine.onmessage = (event: any) => {
                        const message = event.data || event;

                        if (message === 'uciok') {
                            this.engine!.postMessage('isready');
                        } else if (message === 'readyok') {
                            this.isReady = true;
                            clearTimeout(timeout);
                            console.log('Stockfish engine initialized successfully');
                            resolve();
                        } else if (typeof message === 'string' && message.startsWith('info')) {
                            this.parseEvaluation(message);
                        } else if (typeof message === 'string' && message.startsWith('bestmove')) {
                            this.parseBestMove(message);
                        }
                    };

                    this.engine.postMessage('uci');
                });
            } else {
                // Server-side: just create mock engine
                console.log('Server-side detected, using mock engine');
                this.createMockEngine();
                return Promise.resolve();
            }
        } catch (error) {
            console.error('Failed to initialize Stockfish:', error);
            console.log('Falling back to mock engine for development');
            // Graceful fallback - create a mock engine for development
            this.createMockEngine();
            return Promise.resolve(); // Don't throw error, just use mock
        }
        */
    }

    private createMockEngine(): void {
        console.log('Creating enhanced mock Stockfish engine for development');
        this.isReady = true;

        this.engine = {
            postMessage: (message: string) => {
                console.log('Mock Stockfish received:', message);
                // Simulate responses with delay
                setTimeout(() => {
                    if (message === 'uci') {
                        this.engine?.onmessage?.({ data: 'uciok' } as any);
                    } else if (message === 'isready') {
                        this.engine?.onmessage?.({ data: 'readyok' } as any);
                    } else if (message.startsWith('go')) {
                        // Simulate thinking with info messages (faster)
                        setTimeout(() => {
                            // Send analysis info quickly
                            const depth = Math.floor(Math.random() * 10) + 8;
                            const score = Math.floor(Math.random() * 100) - 50;
                            const nodes = Math.floor(Math.random() * 50000) + 5000;
                            const nps = Math.floor(Math.random() * 200000) + 50000;
                            const time = Math.floor(Math.random() * 800) + 200;

                            const mockInfo = `info depth ${depth} score cp ${score} nodes ${nodes} nps ${nps} time ${time} pv e2e4 e7e5 g1f3`;
                            this.engine?.onmessage?.({ data: mockInfo } as any);
                        }, 100);

                        // Simulate a best move response after short thinking
                        setTimeout(() => {
                            try {
                                // Generate a more intelligent move using chess.js
                                let bestMove = this.generateMockMove(message);
                                console.log('Mock engine sending bestmove:', bestMove);
                                this.engine?.onmessage?.({ data: `bestmove ${bestMove}` } as any);

                                // Also trigger the callback directly if it exists
                                if (this.bestMoveCallback) {
                                    console.log('Calling bestMove callback with:', bestMove);
                                    this.bestMoveCallback(bestMove);
                                }
                            } catch (error) {
                                console.error('Error in mock move generation:', error);
                                // Send a simple fallback move
                                const fallback = 'e2e4';
                                this.engine?.onmessage?.({ data: `bestmove ${fallback}` } as any);
                                if (this.bestMoveCallback) {
                                    this.bestMoveCallback(fallback);
                                }
                            }
                        }, 300 + Math.random() * 500); // Much shorter thinking time: 0.3-0.8s
                    } else if (message.startsWith('position')) {
                        // Store the position for move generation
                        this.currentPosition = message;
                        console.log('Mock engine: Position set');
                    } else if (message.startsWith('setoption')) {
                        // Acknowledge option set
                        console.log('Mock engine: Option set -', message);
                    }
                }, 20 + Math.random() * 50); // Much smaller random delay: 20-70ms
            },
            terminate: () => {
                console.log('Mock Stockfish terminated');
            },
            onmessage: null
        } as StockfishEngine;
    }

    private currentPosition: string = 'position startpos';

    private generateMockMove(goCommand: string): string {
        try {
            // Parse the current position and generate legal moves
            const chess = new Chess();

            console.log('Current position command:', this.currentPosition);
            console.log('Go command:', goCommand);

            // Reset to ensure clean state
            chess.reset();

            // Extract FEN from position command if available
            if (this.currentPosition.includes('fen')) {
                const fenMatch = this.currentPosition.match(/fen\s+(.+)/);
                if (fenMatch && fenMatch[1]) {
                    try {
                        // Remove any trailing commands (like moves)
                        const fenOnly = fenMatch[1].split(' moves')[0].trim();
                        chess.load(fenOnly);
                        console.log('Loaded FEN position:', fenOnly);
                    } catch (e) {
                        console.warn('Invalid FEN, using startpos:', e);
                        chess.reset();
                    }
                }
            } else if (this.currentPosition.includes('moves')) {
                // Apply moves from startpos
                const movesMatch = this.currentPosition.match(/moves\s+(.+)/);
                if (movesMatch) {
                    const moves = movesMatch[1].split(' ').filter(m => m.trim());
                    console.log('Applying moves from startpos:', moves);
                    for (const move of moves) {
                        try {
                            const result = chess.move(move);
                            if (!result) {
                                console.warn('Failed to apply move:', move);
                                break;
                            }
                        } catch (e) {
                            console.warn('Error applying move:', move, e);
                            break;
                        }
                    }
                }
            }

            console.log('Current board state:', chess.fen());
            console.log('Turn:', chess.turn());

            // Get all legal moves
            const legalMoves = chess.moves({ verbose: true });

            if (legalMoves.length === 0) {
                console.warn('No legal moves available');
                return 'e2e4'; // Fallback
            }

            // Debug: Log all legal moves to see what chess.js is returning
            console.log('All legal moves:', legalMoves.map(m => `${m.from}->${m.to}${m.promotion ? '=' + m.promotion : ''} (${m.piece})`));

            // Filter out any invalid moves (same square, missing data, etc.)
            const validMoves = legalMoves.filter(move => {
                // Check for basic validity
                const hasValidSquares = move.from && move.to && typeof move.from === 'string' && typeof move.to === 'string';
                const differentSquares = move.from !== move.to;
                const validLength = move.from.length === 2 && move.to.length === 2;

                const isValid = hasValidSquares && differentSquares && validLength;

                if (!isValid) {
                    console.warn('Filtering out invalid move:', {
                        move,
                        hasValidSquares,
                        differentSquares,
                        validLength,
                        from: move.from,
                        to: move.to
                    });
                }
                return isValid;
            });

            if (validMoves.length === 0) {
                console.error('No valid moves after filtering, using fallback');
                return 'e2e4';
            }

            // Simple strategy: prefer center control, then random
            const centerMoves = validMoves.filter(move =>
                ['e4', 'e5', 'd4', 'd5'].includes(move.to) ||
                ['e2', 'e7', 'd2', 'd7'].includes(move.from)
            );

            let selectedMove;
            if (centerMoves.length > 0 && Math.random() > 0.4) {
                selectedMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
            } else {
                selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            }

            // Double-check the selected move
            if (!selectedMove || selectedMove.from === selectedMove.to || !selectedMove.from || !selectedMove.to) {
                console.error('Selected move is still invalid:', selectedMove);
                // Use the first valid move as emergency fallback
                selectedMove = validMoves[0];
                if (!selectedMove) {
                    console.error('No valid moves available at all, using hard fallback');
                    return 'e2e4';
                }
            }

            // Build move string with proper promotion handling
            let moveString = selectedMove.from + selectedMove.to;

            // Only add promotion if it's actually a promotion move
            if (selectedMove.promotion) {
                // Check if this is actually a valid promotion move
                const fromRank = parseInt(selectedMove.from[1]);
                const toRank = parseInt(selectedMove.to[1]);
                const piece = selectedMove.piece;

                // Valid promotion: pawn moving to rank 8 (white) or rank 1 (black)
                if (piece === 'p' && (toRank === 8 || toRank === 1)) {
                    moveString += selectedMove.promotion;
                    console.log('Valid promotion move:', moveString);
                } else {
                    console.warn('Invalid promotion detected and removed:', selectedMove);
                    // Don't add promotion for non-promotion moves
                }
            }

            console.log('Generated valid move:', moveString, 'from', selectedMove.from, 'to', selectedMove.to);

            // Final validation before returning
            if (moveString.length < 4 || moveString.substring(0, 2) === moveString.substring(2, 4)) {
                console.error('Final validation failed - same square move detected:', moveString);
                // Emergency fallback to a known safe move
                const emergencyMoves = ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'e2e3', 'd2d3'];
                for (const emergency of emergencyMoves) {
                    try {
                        const testChess = new Chess();
                        testChess.load(chess.fen());
                        if (testChess.move(emergency)) {
                            console.log('Using emergency move:', emergency);
                            return emergency;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                return 'e2e4'; // Ultimate fallback
            }

            return moveString;

        } catch (error) {
            console.error('Error generating mock move:', error);
            // Simple fallback moves based on game state
            const fallbackMoves = ['e2e4', 'd2d4', 'g1f3', 'b1c3'];
            return fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
        }
    }

    setSkillLevel(level: number): void {
        if (!this.engine || !this.isReady) return;

        // Map 1-10 difficulty to custom rating system
        // Level 1: 400, Level 2: 800, Level 3: 1100, Level 4: 1300, Level 5: 1500, etc.
        let eloRating: number;
        switch (level) {
            case 1: eloRating = 400; break;
            case 2: eloRating = 800; break;
            case 3: eloRating = 1100; break;
            case 4: eloRating = 1300; break;
            case 5: eloRating = 1500; break;
            case 6: eloRating = 1700; break;
            case 7: eloRating = 1900; break;
            case 8: eloRating = 2100; break;
            case 9: eloRating = 2300; break;
            case 10: eloRating = 2500; break;
            default: eloRating = 1500; break;
        }

        // Map rating to Stockfish skill levels (0-20)
        const skillLevel = Math.min(20, Math.max(0, Math.floor((eloRating - 400) / 100)));

        this.engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
        this.engine.postMessage(`setoption name UCI_LimitStrength value true`);
        this.engine.postMessage(`setoption name UCI_Elo value ${eloRating}`);

        console.log(`Set difficulty level ${level} (ELO: ${eloRating}, Skill: ${skillLevel})`);
    }

    analyzePosition(fen: string, depth = 15, onEvaluation?: (evaluation: EngineEvaluation) => void): void {
        if (!this.engine || !this.isReady) return;

        this.evalCallback = onEvaluation || null;

        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage(`go depth ${depth}`);
    }

    getBestMove(fen: string, timeMs = 1000, onBestMove?: (move: string) => void): void {
        if (!this.engine || !this.isReady) return;

        this.bestMoveCallback = onBestMove || null;

        // Set position using FEN (proper UCI format)
        this.engine.postMessage(`position fen ${fen}`);
        this.engine.postMessage(`go movetime ${timeMs}`);
    }

    stop(): void {
        if (!this.engine) return;
        this.engine.postMessage('stop');
    }

    terminate(): void {
        if (this.engine) {
            this.engine.terminate();
            this.engine = null;
            this.isReady = false;
        }
    }

    private parseEvaluation(message: string): void {
        if (!this.evalCallback) return;

        const parts = message.split(' ');
        const evaluation: Partial<EngineEvaluation> = {};

        for (let i = 0; i < parts.length; i++) {
            switch (parts[i]) {
                case 'depth':
                    evaluation.depth = parseInt(parts[i + 1]);
                    break;
                case 'score':
                    if (parts[i + 1] === 'cp') {
                        evaluation.score = parseInt(parts[i + 2]) / 100;
                    } else if (parts[i + 1] === 'mate') {
                        evaluation.mate = parseInt(parts[i + 2]);
                        evaluation.score = evaluation.mate > 0 ? 999 : -999;
                    }
                    break;
                case 'nodes':
                    evaluation.nodes = parseInt(parts[i + 1]);
                    break;
                case 'nps':
                    evaluation.nps = parseInt(parts[i + 1]);
                    break;
                case 'time':
                    evaluation.time = parseInt(parts[i + 1]);
                    break;
                case 'pv':
                    evaluation.pv = parts.slice(i + 1);
                    evaluation.bestMove = parts[i + 1];
                    break;
            }
        }

        if (evaluation.depth && evaluation.score !== undefined && evaluation.bestMove) {
            this.evalCallback(evaluation as EngineEvaluation);
        }
    }

    private parseBestMove(message: string): void {
        console.log('Parsing bestmove message:', message);
        if (!this.bestMoveCallback) {
            console.log('No bestMoveCallback set');
            return;
        }

        const parts = message.split(' ');
        if (parts[0] === 'bestmove' && parts[1]) {
            console.log('Calling bestMoveCallback with move:', parts[1]);
            this.bestMoveCallback(parts[1]);
        } else {
            console.log('Invalid bestmove format:', message);
        }
    }
}

// Create a singleton instance
export const stockfishEngine = new StockfishWrapper();

// Utility functions for game analysis
export const analyzeGame = async (
    moves: string[],
    onProgress?: (progress: number) => void
): Promise<EngineEvaluation[]> => {
    const evaluations: EngineEvaluation[] = [];

    await stockfishEngine.initialize();

    for (let i = 0; i < moves.length; i++) {
        const fen = getFenAfterMoves(moves.slice(0, i + 1));

        await new Promise<void>((resolve) => {
            stockfishEngine.analyzePosition(fen, 12, (evaluation) => {
                evaluations.push(evaluation);
                resolve();
            });
        });

        if (onProgress) {
            onProgress((i + 1) / moves.length);
        }
    }

    return evaluations;
};

export const classifyMove = (
    actualEval: number,
    bestEval: number
): 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' => {
    const diff = Math.abs(actualEval - bestEval);

    if (diff <= 0.1) return 'excellent';
    if (diff <= 0.25) return 'good';
    if (diff <= 0.5) return 'inaccuracy';
    if (diff <= 1.0) return 'mistake';
    return 'blunder';
};

// Helper function to get FEN after a series of moves
function getFenAfterMoves(moves: string[]): string {
    try {
        const chess = new Chess();

        for (const move of moves) {
            const result = chess.move(move);
            if (!result) {
                console.error(`Invalid move: ${move}`);
                break;
            }
        }

        return chess.fen();
    } catch (error) {
        console.error('Error generating FEN:', error);
        // Return starting position as fallback
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
}
