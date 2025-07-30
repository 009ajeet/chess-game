'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User as FirebaseUser,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types/chess';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email: string, password: string, username: string) => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Check if Firebase is available (not in demo mode)
        if (!auth || !db) {
            // Demo mode - create a mock user
            console.log('Demo mode: Creating mock user');
            const mockUser: User = {
                uid: 'demo-user',
                email: 'demo@example.com',
                username: 'Demo Player',
                displayName: 'Demo Player',
                photoURL: null,
                rating: 1200,
                gamesPlayed: 0,
                gamesWon: 0,
                createdAt: new Date(),
                lastActive: new Date(),
            };
            setUser(mockUser);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setFirebaseUser(firebaseUser);

            if (firebaseUser) {
                try {
                    // Get or create user document
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        setUser({
                            ...userData,
                            lastActive: new Date(),
                        });

                        // Update last active timestamp
                        await updateDoc(doc(db, 'users', firebaseUser.uid), {
                            lastActive: new Date(),
                        });
                    } else {
                        // Create new user document
                        const newUser: User = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email!,
                            displayName: firebaseUser.displayName || '',
                            username: firebaseUser.displayName || `user_${firebaseUser.uid.slice(0, 8)}`,
                            elo: 1200,
                            gamesPlayed: 0,
                            gamesWon: 0,
                            gamesLost: 0,
                            gamesDrawn: 0,
                            createdAt: new Date(),
                            lastActive: new Date(),
                        };

                        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
                        setUser(newUser);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    toast.error('Failed to load user data');
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, [mounted]);

    const signInWithGoogle = async () => {
        if (!auth) {
            toast.success('Demo mode: Signed in as Demo Player');
            return;
        }

        try {
            console.log('🔄 Attempting Google sign-in...');
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            console.log('✅ Google sign-in successful!', result.user.email);
            toast.success('Successfully signed in with Google!');
        } catch (error: any) {
            console.error('❌ Google sign-in error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            if (error.code === 'auth/operation-not-allowed') {
                toast.error('Google sign-in is not enabled. Please enable it in Firebase Console.');
                console.log('🔧 To fix: Go to Firebase Console → Authentication → Sign-in method → Enable Google');
            } else if (error.code === 'auth/popup-closed-by-user') {
                toast.error('Sign-in was cancelled');
            } else {
                toast.error(error.message || 'Failed to sign in with Google');
            }
        }
    };

    const signUpWithEmail = async (email: string, password: string, username: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Create user document with custom username
            const newUser: User = {
                uid: result.user.uid,
                email: result.user.email!,
                displayName: username,
                username,
                elo: 1200,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesDrawn: 0,
                createdAt: new Date(),
                lastActive: new Date(),
            };

            await setDoc(doc(db, 'users', result.user.uid), newUser);
            toast.success('Account created successfully!');
        } catch (error: any) {
            console.error('Email sign up error:', error);
            toast.error(error.message || 'Failed to create account');
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Successfully signed in!');
        } catch (error: any) {
            console.error('Email sign in error:', error);
            toast.error(error.message || 'Failed to sign in');
            throw error;
        }
    };

    const logout = async () => {
        if (!auth) {
            // Demo mode - just clear the user
            setUser(null);
            setFirebaseUser(null);
            toast.success('Demo mode: Signed out');
            return;
        }

        try {
            await signOut(auth);
            toast.success('Successfully signed out!');
        } catch (error: any) {
            console.error('Sign out error:', error);
            toast.error('Failed to sign out');
        }
    };

    const updateUserProfile = async (updates: Partial<User>) => {
        if (!user) return;

        try {
            await updateDoc(doc(db, 'users', user.uid), updates);
            setUser({ ...user, ...updates });
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile');
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        firebaseUser,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        logout,
        updateUserProfile,
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        console.log('AuthProvider not mounted yet');
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-600">Initializing...</p>
                </div>
            </div>
        );
    }

    console.log('AuthProvider mounted, rendering children');
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
