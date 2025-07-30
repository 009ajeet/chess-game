# 🚀 GitHub Pages Deployment Guide

## Step 1: Repository Created ✅

Your repository is already created at: https://github.com/009ajeet/chess-game

## Step 2: Connect Local Repository to GitHub

Copy and run these commands in your terminal:

```bash
# Navigate to your project (if not already there)
cd "c:\Users\91807\Desktop\chess game"

# Add GitHub as remote origin
git remote add origin https://github.com/009ajeet/chess-game.git

# Create and switch to main branch
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select **"GitHub Actions"**
5. The workflow will automatically run when you push to main

## Step 4: Add Firebase Secrets (Important!)

1. In your repository, go to "Settings" → "Secrets and variables" → "Actions"
2. Click "New repository secret" and add each of these:

| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your Firebase app ID |

## Step 5: Update Repository Name in Config

If your repository name is NOT "chess-game", edit these files:

**next.config.js** (lines 9-10):
```javascript
basePath: process.env.NODE_ENV === 'production' ? '/YOUR-REPO-NAME' : '',
assetPrefix: process.env.NODE_ENV === 'production' ? '/YOUR-REPO-NAME/' : '',
```

**README.md** (update the demo link):
```markdown
Visit the live application: [AI Chess Platform](https://YOUR_USERNAME.github.io/YOUR-REPO-NAME/)
```

## Step 6: Push and Deploy

```bash
# If you made any changes above, commit them
git add .
git commit -m "Update repository configuration"
git push origin main
```

## Step 7: Access Your Live Site

After the GitHub Action completes (2-5 minutes):

🌐 **Your chess platform will be live at:**
`https://009ajeet.github.io/chess-game/`

## 🔍 Troubleshooting

### If deployment fails:
1. Check "Actions" tab in your repository for error details
2. Ensure all Firebase secrets are correctly added
3. Verify the repository name matches in next.config.js

### If Firebase doesn't work:
1. Add your GitHub Pages domain to Firebase authorized domains:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add: `YOUR_USERNAME.github.io`

### If chess board doesn't load:
1. Check browser console for errors
2. Ensure all dependencies are in package.json
3. Check if the build process completed successfully

## 🎉 Success!

Once deployed, you'll have a fully functional chess platform hosted for free on GitHub Pages!

**Features that will work:**
- ✅ AI Chess gameplay (all 10 difficulty levels)
- ✅ Game analysis
- ✅ Responsive design
- ✅ Firebase authentication (once configured)
- ✅ Real-time multiplayer (once Firebase is set up)

**Next Steps:**
1. Share your live URL with friends
2. Consider adding a custom domain
3. Monitor usage via GitHub Pages analytics
4. Continue developing new features
