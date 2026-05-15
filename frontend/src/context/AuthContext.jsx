import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { isLoaded, isSignedIn } = useClerkAuth();
    const { user } = useUser();

    const { signOut } = useClerk();

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
        loading: !isLoaded,
        logout: () => signOut(),
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
