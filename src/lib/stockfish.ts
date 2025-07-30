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
            const chess = new Chess();
            console.log('Current position command:', this.currentPosition);

            // Set up the board position
            chess.reset();
            if (this.currentPosition.includes('fen')) {
                const fenMatch = this.currentPosition.match(/fen\s+(.+)/);
                if (fenMatch && fenMatch[1]) {
                    try {
                        const fenOnly = fenMatch[1].split(' moves')[0].trim();
                        chess.load(fenOnly);
                    } catch (e) {
                        console.warn('Invalid FEN, using startpos:', e);
                        chess.reset();
                    }
                }
            } else if (this.currentPosition.includes('moves')) {
                const movesMatch = this.currentPosition.match(/moves\s+(.+)/);
                if (movesMatch) {
                    const moves = movesMatch[1].split(' ').filter(m => m.trim());
                    for (const move of moves) {
                        try {
                            const result = chess.move(move);
                            if (!result) break;
                        } catch (e) {
                            console.warn('Error applying move:', move, e);
                            break;
                        }
                    }
                }
            }

            const legalMoves = chess.moves({ verbose: true });
            if (legalMoves.length === 0) {
                return 'e2e4'; // Fallback
            }

            // Get the selected move based on skill level
            const selectedMove = this.selectMoveBySkill(chess, legalMoves);
            
            // Build move string
            let moveString = selectedMove.from + selectedMove.to;
            if (selectedMove.promotion) {
                const fromRank = parseInt(selectedMove.from[1]);
                const toRank = parseInt(selectedMove.to[1]);
                const piece = selectedMove.piece;
                
                if (piece === 'p' && (toRank === 8 || toRank === 1)) {
                    moveString += selectedMove.promotion;
                }
            }

            console.log(`Level ${this.currentSkillLevel} (${this.currentEloRating} ELO) selected:`, moveString);
            return moveString;

        } catch (error) {
            console.error('Error generating mock move:', error);
            const fallbackMoves = ['e2e4', 'd2d4', 'g1f3', 'b1c3'];
            return fallbackMoves[Math.floor(Math.random() * fallbackMoves.length)];
        }
    }

    private selectMoveBySkill(chess: Chess, legalMoves: any[]): any {
        const elo = this.currentEloRating;
        
        // Beginner level (800-1000): Often makes blunders, random moves
        if (elo <= 1000) {
            // 30% chance of random move (blunder simulation)
            if (Math.random() < 0.3) {
                return legalMoves[Math.floor(Math.random() * legalMoves.length)];
            }
            // Otherwise prefer simple development or captures
            const captures = legalMoves.filter(move => move.captured);
            const development = legalMoves.filter(move => 
                ['n', 'b'].includes(move.piece) && 
                ['1', '8'].includes(move.from[1])
            );
            
            if (captures.length > 0 && Math.random() < 0.7) {
                return captures[Math.floor(Math.random() * captures.length)];
            }
            if (development.length > 0 && Math.random() < 0.5) {
                return development[Math.floor(Math.random() * development.length)];
            }
            return legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }

        // Novice level (1000-1200): Basic tactics, some positional understanding
        if (elo <= 1200) {
            // Prioritize captures and checks
            const captures = legalMoves.filter(move => move.captured);
            const checks = legalMoves.filter(move => {
                const tempChess = new Chess(chess.fen());
                tempChess.move(move);
                return tempChess.inCheck();
            });
            
            // 15% chance of suboptimal move
            if (Math.random() < 0.15) {
                return legalMoves[Math.floor(Math.random() * legalMoves.length)];
            }
            
            if (checks.length > 0 && Math.random() < 0.6) {
                return checks[Math.floor(Math.random() * checks.length)];
            }
            if (captures.length > 0 && Math.random() < 0.8) {
                return captures[Math.floor(Math.random() * captures.length)];
            }
            
            // Center control for opening
            if (chess.history().length < 10) {
                const centerMoves = legalMoves.filter(move =>
                    ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'].includes(move.to)
                );
                if (centerMoves.length > 0) {
                    return centerMoves[Math.floor(Math.random() * centerMoves.length)];
                }
            }
            
            return this.getRandomGoodMove(legalMoves);
        }

        // Club level (1200-1400): Good basics, occasional tactical errors
        if (elo <= 1400) {
            // 10% chance of mistake
            if (Math.random() < 0.1) {
                return legalMoves[Math.floor(Math.random() * legalMoves.length)];
            }
            
            return this.selectTacticalMove(chess, legalMoves) || this.getPositionalMove(chess, legalMoves);
        }

        // Intermediate (1400-1600): Solid tactical play
        if (elo <= 1600) {
            // 7% chance of suboptimal move
            if (Math.random() < 0.07) {
                return this.getRandomGoodMove(legalMoves);
            }
            
            return this.selectTacticalMove(chess, legalMoves) || this.getPositionalMove(chess, legalMoves);
        }

        // Advanced (1600-1800): Strong tactical and positional play
        if (elo <= 1800) {
            // 5% chance of slightly suboptimal move
            if (Math.random() < 0.05) {
                return this.getRandomGoodMove(legalMoves);
            }
            
            return this.selectAdvancedMove(chess, legalMoves);
        }

        // Expert+ (1800+): Very strong play, rare errors
        // 2-3% chance of suboptimal move for 1800-2000
        // 1% chance for 2000+
        const errorRate = elo <= 2000 ? 0.03 : 0.01;
        if (Math.random() < errorRate) {
            return this.getRandomGoodMove(legalMoves);
        }
        
        return this.selectAdvancedMove(chess, legalMoves);
    }

    private selectTacticalMove(chess: Chess, legalMoves: any[]): any {
        // Look for tactical opportunities: captures, checks, threats
        const captures = legalMoves.filter(move => move.captured);
        const checks = legalMoves.filter(move => {
            const tempChess = new Chess(chess.fen());
            tempChess.move(move);
            return tempChess.inCheck();
        });
        
        // Prefer valuable captures
        if (captures.length > 0) {
            const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
            captures.sort((a, b) => {
                const aValue = pieceValues[a.captured as keyof typeof pieceValues] || 0;
                const bValue = pieceValues[b.captured as keyof typeof pieceValues] || 0;
                return bValue - aValue;
            });
            
            // Take the best capture 80% of the time
            if (Math.random() < 0.8) {
                return captures[0];
            }
            return captures[Math.floor(Math.random() * Math.min(3, captures.length))];
        }
        
        // Consider checks
        if (checks.length > 0 && Math.random() < 0.3) {
            return checks[Math.floor(Math.random() * checks.length)];
        }
        
        return null;
    }

    private selectAdvancedMove(chess: Chess, legalMoves: any[]): any {
        // Advanced move selection with deeper tactical understanding
        const tacticalMove = this.selectTacticalMove(chess, legalMoves);
        if (tacticalMove) return tacticalMove;
        
        // Advanced positional concepts
        return this.getPositionalMove(chess, legalMoves);
    }

    private getPositionalMove(chess: Chess, legalMoves: any[]): any {
        // Basic positional preferences
        const gamePhase = this.getGamePhase(chess);
        
        if (gamePhase === 'opening') {
            // Opening principles: develop pieces, control center, castle
            const development = legalMoves.filter(move => 
                (['n', 'b'].includes(move.piece) && ['1', '8'].includes(move.from[1])) ||
                (['e4', 'e5', 'd4', 'd5', 'c4', 'c5'].includes(move.to))
            );
            
            // Check for castling moves
            const castlingMoves = legalMoves.filter(move => 
                move.flags?.includes('k') || move.flags?.includes('q')
            );
            
            if (castlingMoves.length > 0) {
                return castlingMoves[0];
            }
            
            if (development.length > 0) {
                return development[Math.floor(Math.random() * development.length)];
            }
        }
        
        return this.getRandomGoodMove(legalMoves);
    }

    private getRandomGoodMove(legalMoves: any[]): any {
        // Filter out obviously bad moves (moving into attacks, etc.)
        const saferMoves = legalMoves.filter(move => {
            // Basic safety check - don't move high-value pieces to attacked squares
            if (['q', 'r'].includes(move.piece)) {
                // This is a simplified check - in real implementation we'd check if square is attacked
                return Math.random() < 0.8; // 80% chance to avoid risky moves
            }
            return true;
        });
        
        const movesToConsider = saferMoves.length > 0 ? saferMoves : legalMoves;
        return movesToConsider[Math.floor(Math.random() * movesToConsider.length)];
    }

    private getGamePhase(chess: Chess): 'opening' | 'middlegame' | 'endgame' {
        const moveCount = chess.history().length;
        if (moveCount < 20) return 'opening';
        
        // Count pieces to determine phase
        const fen = chess.fen();
        const pieces = fen.split(' ')[0];
        const majorPieces = (pieces.match(/[QRqr]/g) || []).length;
        
        if (majorPieces <= 4) return 'endgame';
        return 'middlegame';
    }

    private currentSkillLevel: number = 5;
    private currentEloRating: number = 1500;

    setSkillLevel(level: number): void {
        this.currentSkillLevel = level;
        
        // Realistic ELO mapping for 10 difficulty levels
        const eloMappings = {
            1: 800,   // Beginner - makes many blunders
            2: 1000,  // Novice - basic tactics, some blunders  
            3: 1200,  // Club player - decent opening, occasional mistakes
            4: 1400,  // Intermediate - solid basics, some tactical errors
            5: 1600,  // Advanced amateur - good tactics, positional understanding
            6: 1800,  // Expert - strong tactical play, fewer mistakes
            7: 2000,  // Class A - advanced tactics, good strategy
            8: 2200,  // Master level - excellent play, rare errors
            9: 2400,  // International Master strength 
            10: 2600  // Grandmaster level - near perfect play
        };

        this.currentEloRating = eloMappings[level as keyof typeof eloMappings] || 1500;
        const stockfishSkill = Math.min(20, Math.max(0, Math.floor((this.currentEloRating - 800) / 90)));

        if (this.engine && this.isReady) {
            // Configure Stockfish for realistic strength
            this.engine.postMessage(`setoption name Skill Level value ${stockfishSkill}`);
            this.engine.postMessage(`setoption name UCI_LimitStrength value true`);
            this.engine.postMessage(`setoption name UCI_Elo value ${this.currentEloRating}`);
            
            // Add some randomness for lower levels to simulate human-like errors
            if (this.currentEloRating < 1600) {
                this.engine.postMessage(`setoption name MultiPV value 3`);
            }
        }

        console.log(`Set difficulty level ${level} (ELO: ${this.currentEloRating}, Stockfish Skill: ${stockfishSkill})`);
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
