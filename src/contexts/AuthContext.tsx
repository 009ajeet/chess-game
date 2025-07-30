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

    useEffect(() => {
        if (!auth) return;

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
                    console.error('Error handling user authentication:', error);
                    toast.error('Authentication error occurred');
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            toast.success('Signed in successfully!');
        } catch (error: any) {
            console.error('Google sign-in error:', error);
            toast.error('Failed to sign in with Google');
        }
    };

    const signUpWithEmail = async (email: string, password: string, username: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser: User = {
                uid: userCredential.user.uid,
                email: userCredential.user.email!,
                displayName: username,
                username: username,
                elo: 1200,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesDrawn: 0,
                createdAt: new Date(),
                lastActive: new Date(),
            };

            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            toast.success('Account created successfully!');
        } catch (error: any) {
            console.error('Email sign-up error:', error);
            toast.error(error.message || 'Failed to create account');
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Signed in successfully!');
        } catch (error: any) {
            console.error('Email sign-in error:', error);
            toast.error('Invalid email or password');
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setFirebaseUser(null);
            toast.success('Signed out successfully!');
        } catch (error: any) {
            console.error('Logout error:', error);
            toast.error('Failed to sign out');
        }
    };

    const updateUserProfile = async (updates: Partial<User>) => {
        if (!user) return;

        try {
            const updatedUser = { ...user, ...updates };
            await updateDoc(doc(db, 'users', user.uid), updates);
            setUser(updatedUser);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile');
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

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
