import React, { createContext, useContext, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser, useClerk, useSession } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { isLoaded, isSignedIn, getToken, sessionId } = useClerkAuth();
    const { user } = useUser();
    const { session } = useSession();

    const { signOut } = useClerk();

    useEffect(() => {
        if (!isLoaded || !session) return undefined;

        const checkExpiry = async () => {
            if (!isSignedIn || !session.createdAt) return;

            const startedAt = new Date(session.createdAt).getTime();
            const ageMs = Date.now() - startedAt;
            const maxAgeMs = 24 * 60 * 60 * 1000;

            if (ageMs >= maxAgeMs) {
                await signOut();
            }
        };

        checkExpiry();
        const interval = setInterval(checkExpiry, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isLoaded, isSignedIn, signOut, session]);

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
