# AI Chess Platform - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a professional-grade AI chess platform built with Next.js 14, TypeScript, Firebase, and Stockfish WASM. The platform features:

- AI chess engine with 10 difficulty levels
- Real-time multiplayer with room system
- Complete game analysis and move evaluation
- Google authentication via Firebase
- Modern responsive UI with Tailwind CSS

## Code Standards
- Use TypeScript with strict type checking
- Follow Next.js 14 App Router patterns
- Use functional components with React hooks
- Implement proper error handling and loading states
- Use Tailwind CSS for styling with dark/light mode support
- Follow Firebase best practices for authentication and real-time data

## Key Libraries
- `chess.js` for game logic and move validation
- `react-chessboard` for the chessboard UI component
- `stockfish` for AI chess engine integration
- `firebase` for authentication and real-time database
- `framer-motion` for smooth animations
- `react-hot-toast` for user notifications

## Architecture Patterns
- Use custom hooks for game state management
- Implement Firebase context providers for auth
- Create reusable components for chess pieces and board
- Use TypeScript interfaces for game data structures
- Implement proper separation of concerns between UI and game logic
