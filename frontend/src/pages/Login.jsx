import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Github } from 'lucide-react';
import AuroraBackground from '../components/ui/AuroraBackground';

export default function Login() {
    const { loginWithGoogle, loginWithGithub } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-primary relative overflow-hidden">
            <AuroraBackground />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md relative z-10"
            >
                <Link to="/" className="inline-flex items-center text-text-muted hover:text-text-main transition-all duration-300 mb-8 hover:translate-x-1 group">
                    <ArrowLeft size={18} className="mr-2 group-hover:scale-110 transition-transform" /> Back to Home
                </Link>

                <div className="surface-card rounded-3xl p-8 relative overflow-hidden hover:shadow-card-hover transition-all duration-500">
                    {/* Top edge glow line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />

                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gradient shadow-glow-soft mb-5"
                        >
                            <span className="text-white font-bold text-2xl font-heading">K</span>
                        </motion.div>
                        <h1 className="font-heading text-3xl font-bold text-text-main tracking-tighter mb-2">Welcome back</h1>
                        <p className="text-text-muted text-sm">Access your trading simulator and dashboard</p>
                    </div>

                    <div className="space-y-3">
                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            onClick={loginWithGoogle}
                            className="w-full flex items-center justify-center gap-3 bg-card hover:bg-hover border border-border hover:border-brand-200 hover:shadow-glow-soft rounded-2xl py-3 px-4 font-bold text-text-main transition-all duration-300"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span>Sign in with Google</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ y: 0 }}
                            onClick={loginWithGithub}
                            className="w-full flex items-center justify-center gap-3 bg-text-main hover:bg-text-muted border border-border rounded-2xl py-3 px-4 font-bold text-white transition-all duration-300"
                        >
                            <Github className="w-5 h-5" />
                            <span>Sign in with GitHub</span>
                        </motion.button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border text-center text-xs">
                        <span className="text-text-muted">Don't have an account? </span>
                        <Link to="/register" className="text-brand-600 hover:text-brand-700 font-bold transition-colors">
                            Sign up here
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
