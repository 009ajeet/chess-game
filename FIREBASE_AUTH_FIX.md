# 🔥 Firebase Google Auth Setup Guide

## ❌ Current Error: `auth/operation-not-allowed`

This means Google Sign-in is not enabled in your Firebase project. Here's how to fix it:

---

## 🛠️ **Step-by-Step Fix:**

### **Step 1: Go to Firebase Console**
1. Open https://console.firebase.google.com/
2. Select your project: `my-app-ef9e2`

### **Step 2: Enable Google Authentication**
1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"** (if first time)
3. Go to **"Sign-in method"** tab
4. Find **"Google"** in the list
5. Click on **"Google"** row
6. Toggle **"Enable"** switch to ON
7. Add your email in **"Project support email"**
8. Click **"Save"**

### **Step 3: Enable Email/Password (Optional)**
1. Still in "Sign-in method" tab
2. Click on **"Email/Password"** 
3. Toggle **"Enable"** switch to ON
4. Click **"Save"**

### **Step 4: Add Authorized Domains**
1. Scroll down to **"Authorized domains"**
2. Make sure these are listed:
   - `localhost` (for development)
   - `my-app-ef9e2.firebaseapp.com` (your domain)
3. If `localhost` is missing, click **"Add domain"** and add it

---

## ✅ **After Enabling - Test Again:**

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Clear browser cache:**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)

3. **Test Google Sign-in:**
   - Click "Sign In" button
   - Click "Sign in with Google"
   - Should now work without errors

---

## 🔧 **Alternative: Email/Password Only**

If you prefer not to use Google sign-in for now:

1. **Enable only Email/Password** in Firebase Console
2. **Test with email signup:**
   - Click "Sign In" → "Sign up instead"
   - Enter email, password, username
   - Should work immediately

---

## 📱 **Quick Test Commands:**

```bash
# Restart development server
cd "C:\Users\91807\Desktop\chess game"
npm run dev

# Clear Next.js cache if needed
rm -rf .next
npm run dev
```

---

## 🎯 **Expected Behavior After Fix:**

- ✅ "Sign In" button opens modal
- ✅ "Sign in with Google" works without errors
- ✅ Email/Password signup works
- ✅ User state persists after login
- ✅ "Welcome, [username]!" appears in header

The `auth/operation-not-allowed` error will disappear once you enable the authentication methods in Firebase Console.
