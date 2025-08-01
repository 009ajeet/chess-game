declare module 'stockfish.wasm' {
    function Stockfish(): Promise<Worker>;
    export default Stockfish;
}

declare module 'stockfish' {
    interface StockfishEngine {
        postMessage(message: string): void;
        onmessage: ((message: string) => void) | null;
        terminate?(): void;
    }

    function Stockfish(): StockfishEngine;
    export default Stockfish;
}
