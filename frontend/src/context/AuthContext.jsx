import React, { createContext, useContext, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { isLoaded, isSignedIn, getToken, sessionId } = useClerkAuth();
    const { user } = useUser();

    const { signOut } = useClerk();

    useEffect(() => {
        if (!isLoaded) return undefined;

        const sessionStartKey = user?.id ? `kryonex_session_started_at:${user.id}` : null;

        if (isSignedIn && sessionStartKey) {
            const existing = Number(localStorage.getItem(sessionStartKey));
            if (!Number.isFinite(existing)) {
                localStorage.setItem(sessionStartKey, Date.now().toString());
            }
        }

        const checkExpiry = async () => {
            if (!isSignedIn || !sessionStartKey) return;

            const startedAt = Number(localStorage.getItem(sessionStartKey));
            if (!Number.isFinite(startedAt)) return;

            const ageMs = Date.now() - startedAt;
            const maxAgeMs = 24 * 60 * 60 * 1000;

            if (ageMs >= maxAgeMs) {
                localStorage.removeItem(sessionStartKey);
                await signOut();
            }
        };

        checkExpiry();
        const interval = setInterval(checkExpiry, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isLoaded, isSignedIn, signOut, user?.id]);

    // Map Clerk's auth state to our context for compatibility
    const authContextValue = {
        user: isSignedIn ? {
            id: user?.id,
            email: user?.primaryEmailAddress?.emailAddress,
            name: user?.fullName || user?.firstName,
            image: user?.imageUrl,
        } : null,
        isSignedIn,
        isLoaded,
        sessionId,
        getToken,
        loading: !isLoaded,
        logout: async () => {
            if (user?.id) {
                localStorage.removeItem(`kryonex_session_started_at:${user.id}`);
            }
            await signOut();
        },
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
