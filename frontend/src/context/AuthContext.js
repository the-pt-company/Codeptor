import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { auth } from '../lib/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Firebase user is logged in, now fetch our custom user profile from backend
                    const response = await authAPI.getMe();
                    setUser({ ...firebaseUser, ...response.data });
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                    // If backend sync failed, might be a partial registration state.
                    // We can still set the firebase user, but parts of the app might lack full_name/username
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Let onAuthStateChanged handle the setUser
        return userCredential.user;
    };

    const register = async (userData) => {
        // 1. Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        
        // 2. Call backend to sync / create the Firestore profile
        // The api interceptor will automatically attach the new user's ID token!
        const response = await authAPI.sync({
            full_name: userData.full_name,
            username: userData.username
        });
        
        const fullUser = { ...userCredential.user, ...response.data };
        setUser(fullUser);
        return fullUser;
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
    };

    const googleLogin = async () => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        
        // Ensure backend has the user profile
        const response = await authAPI.sync({
            full_name: userCredential.user.displayName,
            username: userCredential.user.email.split('@')[0], // default username
        });
        
        const fullUser = { ...userCredential.user, ...response.data };
        setUser(fullUser);
        return fullUser;
    };

    const updateUser = async (data) => {
        const response = await authAPI.updateMe(data);
        setUser(prev => ({ ...prev, ...response.data }));
        return response.data;
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        googleLogin,
        updateUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
