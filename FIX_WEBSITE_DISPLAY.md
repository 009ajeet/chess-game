# 🚨 URGENT: Fix Website Display Issue

## Problem: README.md showing instead of chess game

## Solution: Follow these exact steps

### Step 1: Go to GitHub Pages Settings
1. Open: https://github.com/009ajeet/chess-game/settings/pages
2. Look for "Source" section

### Step 2: Change Source to GitHub Actions
1. Click the dropdown under "Source"
2. Select **"GitHub Actions"** (NOT "Deploy from a branch")
3. Click "Save"

### Step 3: Remove Custom Domain (if present)
1. Look for "Custom domain" field
2. If it has "blog.ajeeet879y9.dev" or any domain, **DELETE IT**
3. Leave the field completely **EMPTY**
4. Click "Save"

### Step 4: Trigger Deployment
1. Go to: https://github.com/009ajeet/chess-game/actions
2. Click "Run workflow" if you see it
3. OR wait 2-3 minutes for automatic deployment

### Step 5: Check Your Live Site
Visit: **https://009ajeet.github.io/chess-game/**

## Expected Result:
- ✅ Chess game interface loads
- ✅ You can play AI chess
- ✅ All buttons work
- ✅ NO README.md content

## If Still Showing README:
1. Clear browser cache (Ctrl+F5)
2. Wait 5 more minutes for GitHub to update
3. Try incognito/private browsing mode

## Success Indicator:
You should see a chess board and "Play vs Computer" interface, NOT documentation text.

---
**This MUST be done in GitHub settings - the code is already correct!**
