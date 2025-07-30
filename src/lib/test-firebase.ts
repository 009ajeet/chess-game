// Simple test to verify Firebase connection
import { auth, db } from '@/lib/firebase';

export const testFirebase = () => {
    console.log('Testing Firebase connection...');
    console.log('Auth instance:', auth);
    console.log('Firestore instance:', db);
    console.log('Firebase Auth currentUser:', auth.currentUser);

    // Test authentication state
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
    });
};

// You can call this in the browser console to test Firebase
if (typeof window !== 'undefined') {
    (window as any).testFirebase = testFirebase;
}
