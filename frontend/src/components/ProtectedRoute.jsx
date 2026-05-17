import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
    const { isLoaded, isSignedIn } = useAuth();

    // Wait for Clerk to finish loading — prevents bounce when session
    // is still being synced after a fresh redirect from sign-in
    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center">
                <Loader className="animate-spin text-accent" size={40} />
            </div>
        );
    }

    if (!isSignedIn) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
