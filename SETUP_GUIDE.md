# 🚀 AI Chess Platform - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Firebase Configuration](#firebase-configuration)
4. [Environment Setup](#environment-setup)
5. [Running the Application](#running-the-application)
6. [Debugging Guide](#debugging-guide)
7. [Architecture Overview](#architecture-overview)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and **npm** installed
- **Git** (optional, for version control)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Firebase account** (free tier is sufficient)
- **Internet connection** for Firebase and dependencies

---

## 📦 Installation

### Step 1: Navigate to Project Directory
```bash
cd "C:\Users\91807\Desktop\chess game"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Verify Installation
```bash
npm list --depth=0
```

**Expected packages:**
- Next.js 15.4.5
- React 19.1.0
- Firebase 12.0.0
- chess.js 1.4.0
- react-chessboard 5.2.1
- Stockfish 16.0.0
- And more...

---

## 🔥 Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name (e.g., "ai-chess-platform")
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In Firebase Console, click **"Authentication"**
2. Go to **"Sign-in method"** tab
3. Enable **"Email/Password"**
4. Enable **"Google"** provider
   - Add your email as authorized domain
   - Set public-facing name: "AI Chess Platform"

### Step 3: Create Firestore Database

1. Click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select your region (closest to users)

### Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **"Add app"** → Web app (</> icon)
4. Enter app nickname: "AI Chess Platform"
5. Copy the configuration object

---

## 🌍 Environment Setup

### Step 1: Create Environment File

Copy the example file and add your Firebase config:
```bash
copy .env.local.example .env.local
```

### Step 2: Update .env.local

Edit `.env.local` with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123DEF
```

### Step 3: Update Firebase Security Rules

In Firebase Console → Firestore → Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Games can be read/written by participants
    match /games/{gameId} {
      allow read, write: if request.auth != null;
    }
    
    // Rooms can be accessed by anyone
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🎮 Running the Application

### Development Mode
```bash
npm run dev
```

Visit: `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 🐛 Debugging Guide

### Common Issues and Fixes

#### 1. **Hydration Errors**
**Error:** React hydration mismatch
**Solution:** 
- Clear browser cache
- Restart dev server
- Check for client/server rendering differences

#### 2. **Firebase Connection Issues**
**Error:** Firebase configuration errors
**Solution:**
- Verify `.env.local` file exists and has correct values
- Check Firebase project is active
- Ensure authentication is enabled

#### 3. **Chess Engine Issues**
**Error:** Stockfish not working
**Solution:**
- Check browser supports WebAssembly
- Clear browser cache
- Try different browser

#### 4. **Module Resolution Errors**
**Error:** Cannot resolve modules
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Debug Commands

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update
```

---

## 🏗️ Architecture Overview

### Frontend Stack
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Animations and transitions

### Chess Engine
- **Stockfish WASM**: Professional chess engine
- **chess.js**: Game logic and move validation
- **react-chessboard 5.x**: Interactive chessboard component

### Backend Services
- **Firebase Auth**: User authentication (Google OAuth + Email)
- **Firestore**: Real-time database for games and users
- **Firebase Hosting**: (Optional) for deployment

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── page.tsx        # Landing page
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── ChessBoard.tsx  # Main chessboard component
│   ├── GameAnalysis.tsx# Game analysis interface
│   └── AuthModal.tsx   # Authentication modal
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
│   └── useGame.ts      # Game state management
├── lib/                # Utility libraries
│   ├── firebase.ts     # Firebase configuration
│   └── stockfish.ts    # Chess engine wrapper
└── types/              # TypeScript definitions
    └── chess.ts        # Chess-related interfaces
```

---

## 🔧 Troubleshooting

### Issue: Can't start development server
```bash
# Kill any existing processes
taskkill /f /im node.exe
npm run dev
```

### Issue: Port 3000 is busy
```bash
# Use different port
npm run dev -- -p 3001
```

### Issue: Build fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Issue: Firebase authentication not working
1. Check Firebase project is active
2. Verify domain is added to authorized domains
3. Check `.env.local` configuration
4. Clear browser cookies and local storage

### Issue: Chess pieces not showing
1. Clear browser cache
2. Check network connection
3. Try incognito/private browsing mode
4. Update browser to latest version

### Issue: Stockfish engine not working
1. Check browser supports WebAssembly:
   ```javascript
   console.log(typeof WebAssembly === 'object');
   ```
2. Try different browser
3. Check for ad blockers or security extensions

---

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Firebase Hosting
```bash
npm run build
npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Manual Deployment
```bash
npm run build
# Upload 'out' or '.next' folder to hosting service
```

---

## 📞 Support

If you encounter issues:

1. **Check this guide** for common solutions
2. **Clear browser cache** and restart dev server
3. **Check browser console** for error messages
4. **Verify environment variables** in `.env.local`
5. **Test in incognito mode** to rule out extensions

---

## ✅ Success Checklist

Before considering setup complete:

- [ ] Dependencies installed successfully
- [ ] Firebase project created and configured
- [ ] `.env.local` file created with correct values
- [ ] Development server starts without errors
- [ ] Can access localhost:3000
- [ ] Landing page loads correctly
- [ ] Can click "Sign In" button (even if Firebase not configured)
- [ ] No console errors in browser
- [ ] TypeScript compilation successful

---

**🎉 Congratulations! Your AI Chess Platform is ready to use!**

The platform includes:
- ✅ AI chess engine with 10 difficulty levels
- ✅ Real-time multiplayer support
- ✅ Professional game analysis
- ✅ Google OAuth authentication
- ✅ Modern responsive UI
- ✅ Mobile-friendly design
