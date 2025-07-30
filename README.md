# AI Chess Platform

# Professional AI Chess Platform

A modern, professional-grade chess platform built with Next.js 14, TypeScript, and Firebase. Features AI opponents with 10 difficulty levels, real-time multiplayer, and comprehensive game analysis.

🎮 **Play Live**: https://009ajeet.github.io/chess-game/

## Features
- ♟️ AI Chess Engine with 10 difficulty levels
- 🌐 Real-time multiplayer chess
- 📊 Complete game analysis
- 🔐 Google authentication
- 🎨 Modern responsive UI

## 🚀 Features

### 🧠 AI Chess Engine
- **10 Difficulty Levels**: From beginner (Level 1) to grandmaster (Level 10)
- **Stockfish Integration**: Industry-standard chess engine with WASM support
- **Smart Difficulty Scaling**: Adjustable ELO ratings and move time controls
- **Human-like Play**: Strategic depth that adapts to player skill level

### 🎮 Game Modes
- **Play vs Computer**: Challenge the AI with selectable difficulty
- **Real-time Multiplayer**: Play with friends through room system
- **Private Rooms**: Create and join games via username or room links
- **Quick Match**: Instant matchmaking for competitive play

### 📊 Game Analysis
- **Free Post-game Analysis**: Available for all users
- **Move Evaluation**: Best move suggestions and alternatives
- **Blunder Detection**: Automatic highlighting of mistakes
- **Accuracy Ratings**: Percentage-based performance metrics
- **Move-by-move Breakdown**: Detailed evaluation of each position

### 🔐 Authentication
- **Google Authentication**: Seamless Firebase integration
- **No Custom Server**: Serverless architecture with Firebase
- **Unique Usernames**: Custom username selection during onboarding
- **Secure User Management**: Firebase handles all authentication

### 👤 User System
- **Player Profiles**: Username, ELO rating, and statistics
- **ELO Rating System**: Competitive ranking for multiplayer games
- **Game History**: Complete record of past games
- **Performance Stats**: Win/loss ratios and improvement tracking

### 🎨 Modern UI/UX
- **Responsive Design**: Seamless experience on mobile and desktop
- **Smooth Animations**: Framer Motion for piece movement
- **Multiple Themes**: Classic, Wood, Dark, Neon, and Marble boards
- **Interactive Features**: Drag-and-drop, move highlighting, and hints
- **Real-time Updates**: Live game state synchronization

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety and developer experience
- **Tailwind CSS**: Utility-first styling with responsive design
- **Framer Motion**: Smooth animations and transitions

### Chess Engine
- **Stockfish WASM**: Browser-based chess engine
- **chess.js**: Game logic and move validation
- **react-chessboard**: Interactive chessboard component

### Backend & Authentication
- **Firebase**: Authentication, Firestore database, hosting
- **Google Auth**: OAuth2 integration for user management
- **Real-time Database**: Live synchronization for multiplayer

### Development Tools
- **ESLint**: Code linting and quality enforcement
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase account and project setup
- Modern web browser with WASM support

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd ai-chess-platform
npm install
```

### 2. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Copy your Firebase config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main landing page
│   ├── layout.tsx         # Root layout with providers
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ChessBoard.tsx     # Interactive chessboard
│   ├── GameAnalysis.tsx   # Post-game analysis
│   └── AuthModal.tsx      # Authentication modal
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom React hooks
│   └── useGame.ts         # Game state management
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   └── stockfish.ts       # Chess engine integration
└── types/                 # TypeScript definitions
    └── chess.ts           # Chess-related interfaces
```

## 🎯 Key Features Implementation

### AI Engine Integration
The platform uses Stockfish WASM for chess analysis and AI opponents:
- Difficulty levels map to Stockfish skill settings (0-20)
- Dynamic time controls based on selected difficulty
- Real-time position evaluation for game analysis

### Real-time Multiplayer
Firebase Realtime Database powers the multiplayer experience:
- Room-based game system with spectator support
- Live move synchronization between players
- Connection state management and reconnection

### Game Analysis Engine
Post-game analysis provides comprehensive insights:
- Stockfish evaluation at configurable depth
- Move classification (excellent, good, inaccuracy, mistake, blunder)
- Accuracy percentage calculation
- Best move alternatives for each position

### Authentication Flow
Seamless user onboarding with Firebase Auth:
- Google OAuth2 integration
- Custom username selection
- Automatic user profile creation
- Persistent authentication state

## 🔧 Configuration

### AI Difficulty Levels
```typescript
Level 1-3: Beginner (ELO 800-1200)
Level 4-6: Intermediate (ELO 1200-1600)
Level 7-8: Advanced (ELO 1600-2000)
Level 9-10: Expert (ELO 2000+)
```

### Game Time Controls
- Rapid: 10+5 (10 minutes + 5 second increment)
- Blitz: 5+3 (5 minutes + 3 second increment)
- Bullet: 1+1 (1 minute + 1 second increment)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
npx vercel --prod
```

### Firebase Hosting
```bash
npm run build
npm install -g firebase-tools
firebase deploy
```

## 🔒 Security

- Firebase Security Rules for Firestore
- Client-side authentication state management
- Environment variable protection
- Input validation and sanitization

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

WebAssembly support required for Stockfish engine.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stockfish](https://stockfishchess.org/) - Chess engine
- [chess.js](https://github.com/jhlywa/chess.js) - Chess logic library
- [react-chessboard](https://github.com/Clariity/react-chessboard) - Chessboard component
- [Firebase](https://firebase.google.com/) - Backend services

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using Next.js 14, TypeScript, and Firebase**
