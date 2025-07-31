# ChessVerse - Modern Online Chess Platform

**Play chess like never before** - [Live Demo](https://009ajeet.github.io/chess-game/)

ChessVerse is a modern chess platform that brings the classic game to the digital age. Whether you're looking to sharpen your skills against our advanced AI or challenge friends in real-time multiplayer matches, we've got you covered.

## Why ChessVerse?

We built this platform because we love chess and wanted to create something that feels both familiar and fresh. No clunky interfaces or confusing menus - just clean, intuitive chess that works seamlessly across all your devices.

### What makes it special:

**Smart AI Opponents** - Our AI doesn't just make random moves. It's powered by Stockfish and carefully calibrated to provide realistic opponents from 800 to 2600 ELO. Whether you're just learning or you're a seasoned player, you'll find the right challenge.

**Real-time Multiplayer** - Create a room, share the code with a friend, and you're ready to play. No complicated signup process or friend requests - just pure chess.

**Game Analysis** - After each game, dive deep into your performance. See where you made brilliant moves and where you could improve.

**Clean Design** - We spent countless hours perfecting the user experience. Every animation, every transition, every color choice was made with one goal: let you focus on the game.

## Tech Stack

This isn't just another chess site thrown together over a weekend. We've used modern, battle-tested technologies:

- **Next.js 14** with TypeScript for bulletproof development
- **Firebase** for real-time multiplayer and authentication  
- **Stockfish WASM** for world-class chess engine performance
- **Tailwind CSS** and **Framer Motion** for that smooth, responsive feel

## Getting Started

Want to run this locally or contribute? Here's how:

1. **Clone the repo**
   ```bash
   git clone https://github.com/009ajeet/chess-game.git
   cd chess-game
   npm install
   ```

2. **Set up Firebase**
   
   You'll need a Firebase project with Authentication and Firestore enabled. Create a `.env.local` file:
   
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Run it**
   ```bash
   npm run dev
   ```

That's it! Open `http://localhost:3000` and start playing.

## Project Structure

We've organized everything to be as clear as possible:

```
src/
├── app/                 # Pages (Next.js App Router)
├── components/          # Reusable UI components  
├── contexts/           # React contexts for global state
├── lib/                # Core game logic and utilities
└── types/              # TypeScript definitions
```

The main magic happens in:
- `lib/stockfish.ts` - AI engine integration
- `lib/multiplayer.ts` - Real-time game synchronization  
- `app/ai-game/` - Single player vs AI
- `app/multiplayer/` - Real-time multiplayer

## Features

**AI Difficulty Levels**: From complete beginner (800 ELO) to grandmaster level (2600 ELO). Each level plays differently - beginners make more tactical mistakes, while higher levels calculate deeper and rarely blunder.

**Multiplayer Rooms**: Create a 6-character room code, share it with anyone, and start playing immediately. No accounts required for basic play.

**Game Analysis**: After each game, see a complete breakdown of your performance including accuracy percentage, best moves, and where you went wrong.

**Responsive Design**: Looks great on desktop, tablet, or phone. The board automatically adapts to your screen size.

## Contributing

Found a bug? Have an idea for a feature? We'd love your help!

1. Fork the repo
2. Create a branch for your feature
3. Make your changes  
4. Open a pull request

## Browser Support

Works on all modern browsers that support WebAssembly (needed for the chess engine):
- Chrome 80+
- Firefox 75+  
- Safari 13+
- Edge 80+

## License

MIT License - feel free to use this code for your own projects.

## Credits

Built with love using some amazing open source libraries:
- [Stockfish](https://stockfishchess.org/) for the chess engine
- [chess.js](https://github.com/jhlywa/chess.js) for game logic
- [react-chessboard](https://github.com/Clariity/react-chessboard) for the beautiful board component

---

*Enjoy the game! ♟️*
