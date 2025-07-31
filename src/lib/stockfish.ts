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

        try {
            // Try to initialize real Stockfish WASM in browser
            if (typeof window !== 'undefined') {
                console.log('Attempting to initialize real Stockfish engine...');
                
                // Try dynamic import for Stockfish WASM
                let StockfishModule;
                try {
                    const stockfishImport = await import('stockfish' as any);
                    StockfishModule = stockfishImport.default || stockfishImport;
                } catch (importError) {
                    console.warn('Failed to import stockfish module, falling back to mock:', importError);
                    this.createMockEngine();
                    return Promise.resolve();
                }
                
                if (typeof StockfishModule === 'function') {
                    this.engine = new (StockfishModule as any)() as StockfishEngine;
                } else {
                    throw new Error('Stockfish module is not a constructor function');
                }

                return new Promise((resolve, reject) => {
                    if (!this.engine) {
                        console.error('Failed to create Stockfish engine, using mock');
                        this.createMockEngine();
                        resolve();
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
                            console.log('Real Stockfish engine initialized successfully!');
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
                // Server-side: use mock engine
                console.log('Server-side detected, using mock engine');
                this.createMockEngine();
                return Promise.resolve();
            }
        } catch (error) {
            console.error('Failed to initialize real Stockfish:', error);
            console.log('Falling back to mock engine');
            this.createMockEngine();
            return Promise.resolve();
        }
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
                        // Determine if this is analysis or move request
                        const isAnalysis = message.includes('depth');
                        
                        if (isAnalysis) {
                            // Simulate analysis with multiple depth updates
                            setTimeout(() => {
                                for (let depth = 8; depth <= 15; depth++) {
                                    setTimeout(() => {
                                        const evaluation = this.generateMockEvaluation(depth);
                                        const mockInfo = `info depth ${depth} score cp ${evaluation.score} nodes ${evaluation.nodes} nps ${evaluation.nps} time ${evaluation.time} pv ${evaluation.bestMove} e7e5 g1f3`;
                                        this.engine?.onmessage?.({ data: mockInfo } as any);
                                        
                                        // Trigger evaluation callback if available
                                        if (this.evalCallback && depth >= 12) {
                                            this.evalCallback({
                                                depth: depth,
                                                score: evaluation.score / 100, // Convert centipawns to pawns
                                                nodes: evaluation.nodes,
                                                nps: evaluation.nps,
                                                time: evaluation.time,
                                                bestMove: evaluation.bestMove,
                                                pv: [evaluation.bestMove, 'e7e5', 'g1f3']
                                            });
                                        }
                                    }, depth * 50); // Stagger depth updates
                                }
                            }, 100);
                        } else {
                            // Regular move generation
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
                        }
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

    private generateMockEvaluation(depth: number): { score: number, nodes: number, nps: number, time: number, bestMove: string } {
        try {
            const chess = new Chess();
            
            // Set up the board position
            if (this.currentPosition.includes('fen')) {
                const fenMatch = this.currentPosition.match(/fen\s+(.+)/);
                if (fenMatch && fenMatch[1]) {
                    try {
                        const fenOnly = fenMatch[1].split(' moves')[0].trim();
                        chess.load(fenOnly);
                    } catch (e) {
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
                            break;
                        }
                    }
                }
            }

            const legalMoves = chess.moves({ verbose: true });
            if (legalMoves.length === 0) {
                return {
                    score: 0,
                    nodes: depth * 1000,
                    nps: 50000,
                    time: depth * 100,
                    bestMove: 'e2e4'
                };
            }

            // Get best move using our enhanced evaluation
            const moveScores = this.evaluateAllMoves(chess, legalMoves);
            const bestMove = moveScores[0].move;
            
            let moveString = bestMove.from + bestMove.to;
            if (bestMove.promotion) {
                moveString += bestMove.promotion;
            }

            // Generate realistic evaluation score based on position
            let score = Math.round(moveScores[0].score * 10); // Convert to centipawns
            
            // Add some position-based evaluation
            if (chess.inCheck()) {
                score += chess.turn() === 'w' ? -30 : 30;
            }
            
            if (chess.isCheckmate()) {
                score = chess.turn() === 'w' ? -30000 : 30000;
            } else if (chess.isDraw()) {
                score = 0;
            }

            return {
                score: Math.max(-3000, Math.min(3000, score)), // Clamp to reasonable range
                nodes: depth * 1000 + Math.floor(Math.random() * 5000),
                nps: 45000 + Math.floor(Math.random() * 20000),
                time: depth * 80 + Math.floor(Math.random() * 200),
                bestMove: moveString
            };

        } catch (error) {
            console.error('Error generating mock evaluation:', error);
            return {
                score: 0,
                nodes: depth * 1000,
                nps: 50000,
                time: depth * 100,
                bestMove: 'e2e4'
            };
        }
    }

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
        console.log(`Selecting move for ELO ${elo} with ${legalMoves.length} legal moves`);

        // Calculate move scores and select based on skill level
        const moveScores = this.evaluateAllMoves(chess, legalMoves);

        // Beginner level (800-1000): Frequent blunders, basic pattern recognition
        if (elo <= 1000) {
            // 25% chance of completely random move (major blunder)
            if (Math.random() < 0.25) {
                console.log('Beginner making random blunder');
                return legalMoves[Math.floor(Math.random() * legalMoves.length)];
            }

            // 40% chance of sub-optimal move
            if (Math.random() < 0.4) {
                const randomSelection = moveScores.slice(Math.floor(moveScores.length * 0.3));
                return randomSelection[Math.floor(Math.random() * randomSelection.length)].move;
            }

            // Otherwise try to make a decent move
            return this.selectFromTopMoves(moveScores, 0.6);
        }

        // Novice level (1000-1200): Some tactics, misses opportunities
        if (elo <= 1200) {
            // 15% chance of poor move
            if (Math.random() < 0.15) {
                console.log('Novice making suboptimal move');
                const poorMoves = moveScores.slice(Math.floor(moveScores.length * 0.4));
                return poorMoves[Math.floor(Math.random() * poorMoves.length)].move;
            }

            // Usually plays decent moves
            return this.selectFromTopMoves(moveScores, 0.75);
        }

        // Club level (1200-1400): Good basics, occasional tactical oversights
        if (elo <= 1400) {
            // 8% chance of mistake
            if (Math.random() < 0.08) {
                console.log('Club player making mistake');
                const weakMoves = moveScores.slice(Math.floor(moveScores.length * 0.3));
                return weakMoves[Math.floor(Math.random() * Math.min(5, weakMoves.length))].move;
            }

            return this.selectFromTopMoves(moveScores, 0.85);
        }

        // Intermediate (1400-1600): Solid tactical play, good positional sense
        if (elo <= 1600) {
            // 5% chance of suboptimal move
            if (Math.random() < 0.05) {
                return this.selectFromTopMoves(moveScores, 0.8);
            }

            return this.selectFromTopMoves(moveScores, 0.92);
        }

        // Advanced (1600-1800): Strong tactical and positional play
        if (elo <= 1800) {
            // 3% chance of slightly suboptimal move
            if (Math.random() < 0.03) {
                return this.selectFromTopMoves(moveScores, 0.9);
            }

            return this.selectFromTopMoves(moveScores, 0.95);
        }

        // Expert+ (1800+): Very strong play, rare errors
        const errorRate = elo <= 2000 ? 0.02 : elo <= 2200 ? 0.015 : 0.01;
        if (Math.random() < errorRate) {
            console.log(`Expert level making rare error (${errorRate * 100}% chance)`);
            return this.selectFromTopMoves(moveScores, 0.92);
        }

        // Almost always plays the best moves
        return this.selectFromTopMoves(moveScores, 0.98);
    }

    private evaluateAllMoves(chess: Chess, legalMoves: any[]): Array<{ move: any, score: number }> {
        const moveScores = legalMoves.map(move => ({
            move,
            score: this.evaluateMove(chess, move)
        }));

        // Sort by score (higher is better)
        moveScores.sort((a, b) => b.score - a.score);

        console.log(`Top 3 moves:`, moveScores.slice(0, 3).map(m => `${m.move.from}${m.move.to} (${m.score.toFixed(1)})`));
        return moveScores;
    }

    private evaluateMove(chess: Chess, move: any): number {
        let score = 0;
        const pieceValues = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
        const elo = this.currentEloRating;

        // Make the move on a copy to evaluate
        const tempChess = new Chess(chess.fen());
        const madeMove = tempChess.move(move);
        if (!madeMove) return -1000;

        // Material gain/loss
        if (move.captured) {
            score += (pieceValues[move.captured as keyof typeof pieceValues] || 0) * 100;
            console.log(`Capture: +${(pieceValues[move.captured as keyof typeof pieceValues] || 0) * 100}`);
        }

        // Promotion
        if (move.promotion) {
            score += (pieceValues[move.promotion as keyof typeof pieceValues] || 0) * 80;
        }

        // Check/checkmate
        if (tempChess.isCheckmate()) {
            score += 10000;
        } else if (tempChess.inCheck()) {
            score += 50;
        }

        // Castling (safety)
        if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) {
            score += 80;
        }

        // Center control (important for all levels)
        const centerSquares = ['e4', 'e5', 'd4', 'd5'];
        const nearCenterSquares = ['c3', 'c4', 'c5', 'c6', 'f3', 'f4', 'f5', 'f6'];

        if (centerSquares.includes(move.to)) {
            score += 30;
        } else if (nearCenterSquares.includes(move.to)) {
            score += 15;
        }

        // Development in opening (first 10 moves)
        if (chess.history().length < 20) {
            if (['n', 'b'].includes(move.piece) && ['1', '8'].includes(move.from[1])) {
                score += 40; // Developing pieces
            }

            // Avoid moving same piece twice
            if (this.hasMovedPieceBefore(chess, move.piece, move.from)) {
                score -= 20;
            }
        }

        // Advanced positional factors (higher ELO only)
        if (elo > 1400) {
            score += this.evaluateAdvancedPositions(chess, tempChess, move);
        }

        // Tactical patterns (ELO 1200+)
        if (elo > 1200) {
            score += this.evaluateTacticalPatterns(chess, tempChess, move);
        }

        // King safety considerations
        score += this.evaluateKingSafety(tempChess, move);

        // Avoid moving into threats (basic safety)
        if (this.isSquareAttacked(tempChess, move.to, chess.turn() === 'w' ? 'b' : 'w')) {
            const pieceValue = pieceValues[move.piece as keyof typeof pieceValues] || 0;
            score -= pieceValue * 30; // Penalty for moving into attack
        }

        return score;
    }

    private selectFromTopMoves(moveScores: Array<{ move: any, score: number }>, percentile: number): any {
        const topCount = Math.max(1, Math.floor(moveScores.length * percentile));
        const topMoves = moveScores.slice(0, topCount);

        // Add some randomness even among top moves
        const weights = topMoves.map((_, index) => Math.pow(0.8, index));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

        let random = Math.random() * totalWeight;
        for (let i = 0; i < topMoves.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                console.log(`Selected move ${i + 1} of top ${topCount}: ${topMoves[i].move.from}${topMoves[i].move.to} (score: ${topMoves[i].score.toFixed(1)})`);
                return topMoves[i].move;
            }
        }

        return topMoves[0].move;
    }

    private evaluateAdvancedPositions(originalChess: Chess, afterMove: Chess, move: any): number {
        let score = 0;

        // Piece activity and mobility
        const ourMoves = afterMove.moves().length;
        const opponentColor = afterMove.turn();
        afterMove.load(afterMove.fen().replace(` ${opponentColor} `, ` ${opponentColor === 'w' ? 'b' : 'w'} `));
        const opponentMoves = afterMove.moves().length;

        score += (ourMoves - opponentMoves) * 2; // Mobility advantage

        // Pawn structure
        score += this.evaluatePawnStructure(afterMove);

        // Piece coordination
        score += this.evaluatePieceCoordination(afterMove, move);

        return score;
    }

    private evaluateTacticalPatterns(chess: Chess, tempChess: Chess, move: any): number {
        let score = 0;

        // Look for forks, pins, skewers
        score += this.findTacticalMotifs(tempChess, move);

        // Discovered attacks
        if (this.createsDiscoveredAttack(chess, move)) {
            score += 60;
        }

        // Double attacks
        if (this.createsDoubleAttack(tempChess, move)) {
            score += 50;
        }

        return score;
    }

    private evaluateKingSafety(chess: Chess, move: any): number {
        let score = 0;

        // Penalty for exposing king
        if (move.piece === 'k') {
            const kingFile = move.to[0];
            const kingRank = parseInt(move.to[1]);

            // Avoid moving king to center early
            if (chess.history().length < 30 && ['d', 'e'].includes(kingFile) && [3, 4, 5, 6].includes(kingRank)) {
                score -= 40;
            }
        }

        return score;
    }

    // Helper methods for advanced evaluation
    private hasMovedPieceBefore(chess: Chess, piece: string, square: string): boolean {
        const history = chess.history({ verbose: true });
        return history.some(move => move.piece === piece && move.from === square);
    }

    private isSquareAttacked(chess: Chess, square: string, byColor: string): boolean {
        // Simple check - in real implementation would be more sophisticated
        const tempChess = new Chess(chess.fen());
        const originalTurn = tempChess.turn();

        // Switch turn to check if square is attacked
        const fen = tempChess.fen().replace(` ${originalTurn} `, ` ${byColor} `);
        try {
            tempChess.load(fen);
            const moves = tempChess.moves({ verbose: true });
            return moves.some(move => move.to === square);
        } catch {
            return false;
        }
    }

    private evaluatePawnStructure(chess: Chess): number {
        // Basic pawn structure evaluation
        let score = 0;
        const board = chess.board();

        // Count doubled pawns, isolated pawns, etc.
        // This is a simplified version
        for (let file = 0; file < 8; file++) {
            let whitePawns = 0, blackPawns = 0;
            for (let rank = 0; rank < 8; rank++) {
                const piece = board[rank][file];
                if (piece && piece.type === 'p') {
                    if (piece.color === 'w') whitePawns++;
                    else blackPawns++;
                }
            }

            // Penalty for doubled pawns
            if (whitePawns > 1) score -= (whitePawns - 1) * 10;
            if (blackPawns > 1) score += (blackPawns - 1) * 10;
        }

        return score;
    }

    private evaluatePieceCoordination(chess: Chess, move: any): number {
        // Simplified piece coordination evaluation
        let score = 0;

        // Bonus for pieces supporting each other
        const defenders = this.countDefenders(chess, move.to);
        score += defenders * 5;

        return score;
    }

    private findTacticalMotifs(chess: Chess, move: any): number {
        let score = 0;

        // Check for forks (attacking multiple pieces)
        const attacks = this.getAttackedSquares(chess, move.to, chess.turn());
        const valuableTargets = attacks.filter(square => {
            try {
                const piece = chess.get(square as any);
                return piece && piece.color !== chess.turn() && ['r', 'q', 'k'].includes(piece.type);
            } catch {
                return false;
            }
        });

        if (valuableTargets.length > 1) {
            score += 80; // Fork bonus
        }

        return score;
    }

    private createsDiscoveredAttack(chess: Chess, move: any): boolean {
        // Simplified discovered attack detection
        return false; // Would need more complex implementation
    }

    private createsDoubleAttack(chess: Chess, move: any): boolean {
        // Simplified double attack detection
        return false; // Would need more complex implementation
    }

    private countDefenders(chess: Chess, square: string): number {
        // Count pieces defending a square
        let count = 0;
        const moves = chess.moves({ verbose: true });

        moves.forEach(move => {
            if (move.to === square) count++;
        });

        return count;
    }

    private getAttackedSquares(chess: Chess, fromSquare: string, color: string): string[] {
        // Get all squares attacked by a piece on fromSquare
        try {
            const moves = chess.moves({ verbose: true, square: fromSquare as any });
            return moves.map(move => move.to);
        } catch {
            return [];
        }
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

    getBestMove(fen: string, timeMs = 2000, onBestMove?: (move: string) => void): void {
        if (!this.engine || !this.isReady) return;

        this.bestMoveCallback = onBestMove || null;

        // Set position using FEN (proper UCI format)
        this.engine.postMessage(`position fen ${fen}`);
        
        // Use both time and depth for stronger play
        const depth = Math.min(18, Math.max(8, Math.floor(this.currentEloRating / 150)));
        this.engine.postMessage(`go depth ${depth} movetime ${timeMs}`);
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
