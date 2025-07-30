# 🔧 Firebase Setup for Multiplayer

## ⚠️ IMPORTANT: Enable Google Authentication

Your chess platform is live, but to play with friends, you need to enable Google authentication in Firebase:

### 📋 Step-by-Step Instructions:

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/project/my-app-ef9e2/authentication/providers

2. **Enable Google Provider:**
   - Click on "Google" in the sign-in methods list
   - Toggle the "Enable" switch to ON
   - Click "Save"

3. **Test the Website:**
   - Visit: https://009ajeet.github.io/chess-game/
   - Click "Sign In" → "Sign in with Google"
   - Should work without errors

### 🎮 After Setup:

1. **Create Room:** Sign in and create a multiplayer room
2. **Share Code:** Give the 6-character room code to your friend
3. **Friend Joins:** They sign in and enter your room code
4. **Play Chess:** Real-time moves between both players!

### 🐛 If Still Not Working:

- Both players must be signed in with Google accounts
- Make sure Firebase Google authentication is enabled
- Try refreshing the page after signing in
- Check that you're using the same room code

**⚡ Once Google auth is enabled, multiplayer will work perfectly!**
