import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { ArrowLeft } from 'lucide-react';

const styles = `
    @keyframes glow-pulse {
        0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3), 0 0 40px rgba(0, 212, 255, 0.1); }
        50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.2); }
    }
    
    button {
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
    
    button:hover {
        transform: translateY(-4px) scale(1.03) !important;
        box-shadow: 0 16px 32px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.3) !important;
    }
    
    input:hover {
        border-color: rgb(0, 212, 255) !important;
        background-color: rgba(30, 41, 59, 0.95) !important;
        box-shadow: 0 0 16px rgba(0, 212, 255, 0.4), inset 0 0 8px rgba(0, 212, 255, 0.15) !important;
    }
    
    input:focus {
        border-color: rgb(0, 212, 255) !important;
        background-color: rgba(30, 41, 59, 1) !important;
        box-shadow: 0 0 24px rgba(0, 212, 255, 0.6), inset 0 0 12px rgba(0, 212, 255, 0.2) !important;
    }

    /* Make Clerk social buttons readable on dark background */
    .cl-socialButtonsBlockButton,
    .cl-socialButtonsBlockButton:hover,
    .cl-socialButtonsBlockButton:focus {
        color: #ffffff !important;
        background-color: rgba(15, 23, 42, 0.92) !important;
        border: 1px solid rgba(148, 163, 184, 0.28) !important;
        box-shadow: none !important;
        transform: none !important;
    }

    .cl-socialButtonsBlockButton svg,
    .cl-socialButtonsBlockButton img {
        width: 18px !important;
        height: 18px !important;
        flex-shrink: 0 !important;
        opacity: 1 !important;
        filter: none !important;
    }

    .cl-socialButtonsBlockButtonsContainer {
        gap: 12px !important;
    }
    
    /* Keep Clerk social buttons at their default layout */
`;

export default function Login() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-primary relative overflow-hidden">
            <style>{styles}</style>
            
            <div className="absolute top-0 left-0 w-96 h-96 bg-accent/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <Link to="/" className="inline-flex items-center text-text-muted hover:text-text-main transition-colors mb-6 hover:scale-110">
                    <ArrowLeft size={20} className="mr-2" /> Back to Home
                </Link>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-text-main mb-2">Welcome Back</h1>
                    <p className="text-text-muted">Sign in to continue your trading journey</p>
                </div>

                <SignIn 
                    appearance={{
                        baseTheme: "dark",
                        variables: {
                            colorPrimary: "#00d4ff",
                            colorText: "#ffffff",
                            colorTextSecondary: "#a0aec0",
                            colorBackground: "#0f172a",
                            colorInputBackground: "#1e293b",
                            colorInputBorder: "#334155",
                            colorSuccess: "#00d4ff",
                        },
                        elements: {
                            rootBox: "w-full",
                            card: "bg-card/95 border-2 border-accent/40 rounded-2xl shadow-2xl p-8 backdrop-blur transition-all duration-300",
                            headerTitle: "text-2xl font-bold text-white",
                            headerSubtitle: "text-text-muted/80 text-sm",
                            formButtonPrimary: "!bg-gradient-to-r !from-accent !to-blue-500 hover:!from-accent/90 hover:!to-blue-400 !text-white !font-bold !py-3 !px-4 !rounded-lg !w-full !transition-all !duration-300 !shadow-lg !shadow-accent/25 !hover:shadow-xl !hover:shadow-accent/50",
                            formFieldInput: "!bg-tertiary/80 !border-2 !border-border/80 hover:!border-accent/80 !rounded-lg !py-3 !px-4 !text-white placeholder:!text-text-muted/60 focus:!border-accent focus:!ring-2 focus:!ring-accent/50 !outline-none !transition-all !duration-300",
                            formFieldLabel: "!text-white/90 !text-sm !font-semibold",
                            dividerLine: "!bg-border/60",
                            dividerText: "!text-text-muted/70 !text-xs !font-medium",
                            footerActionLink: "!text-accent hover:!text-blue-400 !font-semibold !transition-colors !duration-200 hover:!underline",
                            footerActionText: "!text-text-muted/80 !text-sm",
                        }
                    }}
                    fallbackRedirectUrl="/dashboard"
                    signUpUrl="/register"
                />
            </div>
        </div>
    );
}
