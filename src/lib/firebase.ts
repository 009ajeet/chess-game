import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Check if we have real Firebase environment variables
const hasRealFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key" &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== "demo-project";

console.log('Firebase config check:', { 
    hasRealConfig: hasRealFirebaseConfig,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'present' : 'missing'
});

let app, auth, db, analytics;

if (hasRealFirebaseConfig) {
    // Initialize Firebase with real configuration
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    console.log('Initializing Firebase with real config');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
} else {
    // Demo mode - don't initialize Firebase at all
    console.warn('Running in demo mode - Firebase services disabled');
    app = null;
    auth = null;
    db = null;
    analytics = null;
}

export { auth, db, analytics };
export default app;
