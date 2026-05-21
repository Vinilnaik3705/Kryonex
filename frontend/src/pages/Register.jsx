import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Github } from 'lucide-react';

export default function Register() {
    const { loginWithGoogle, loginWithGithub } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-primary relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <Link to="/" className="inline-flex items-center text-text-muted hover:text-text-main transition-all duration-300 mb-8 hover:translate-x-1 group">
                    <ArrowLeft size={18} className="mr-2 group-hover:scale-110 transition-transform" /> Back to Home
                </Link>

                <div className="bg-card/40 border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-accent/30 transition-all duration-500">
                    {/* Top edge subtle glow line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 text-accent mb-4 font-bold text-xl tracking-wider">
                            K
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
                        <p className="text-text-muted text-sm">Start your simulated trading journey today</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={loginWithGoogle}
                            className="w-full flex items-center justify-center gap-3 bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-accent/60 rounded-xl py-3 px-4 font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-accent/10 hover:shadow-xl active:translate-y-0 group"
                        >
                            <svg className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Sign up with Google</span>
                        </button>

                        <button
                            onClick={loginWithGithub}
                            className="w-full flex items-center justify-center gap-3 bg-slate-950/90 hover:bg-slate-900/90 border border-white/10 hover:border-white/30 rounded-xl py-3 px-4 font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 group"
                        >
                            <Github className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            <span>Sign up with GitHub</span>
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs">
                        <span className="text-text-muted">Already have an account? </span>
                        <Link to="/login" className="text-accent hover:text-accent/80 font-bold transition-colors">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
