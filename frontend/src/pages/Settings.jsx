import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { User, Shield, Sun, Smartphone, Key } from 'lucide-react';
import BentoCard from '../components/ui/BentoCard';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const { user } = useAuth();

    return (
        <MainLayout>
            <div className="space-y-5 max-w-4xl mx-auto">
                <div>
                    <h2 className="text-xl font-bold text-text-main font-heading">Settings</h2>
                    <p className="text-text-dim mt-0.5 text-[12px]">Manage your account preferences and security</p>
                </div>

                <BentoCard title="Profile Information" icon={User}>
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center text-xl font-bold text-white shadow-glow-soft">
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main">{user?.name || 'Your Name'}</h3>
                            <p className="text-text-muted text-[13px]">{user?.email || 'you@example.com'}</p>
                            {user?.provider === 'google' && (
                                <a href="https://myaccount.google.com/profile" target="_blank" rel="noopener noreferrer" className="text-brand-600 text-[12px] font-bold mt-1.5 hover:text-brand-700 transition-colors inline-block">
                                    Change Profile via Google ↗
                                </a>
                            )}
                            {user?.provider === 'github' && (
                                <a href="https://github.com/settings/profile" target="_blank" rel="noopener noreferrer" className="text-brand-600 text-[12px] font-bold mt-1.5 hover:text-brand-700 transition-colors inline-block">
                                    Change Profile via GitHub ↗
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="th-label block">Display Name</label>
                            <input type="text" value={user?.name || ''} className="w-full bg-hover border border-border rounded-xl px-4 py-2.5 text-[13px] font-bold text-text-main focus:outline-none focus:border-brand-400 transition-colors" readOnly />
                        </div>
                        <div className="space-y-1.5">
                            <label className="th-label block">Email Address</label>
                            <input type="email" value={user?.email || ''} className="w-full bg-hover border border-border rounded-xl px-4 py-2.5 text-[13px] font-bold text-text-main focus:outline-none focus:border-brand-400 transition-colors" readOnly />
                        </div>
                    </div>
                </BentoCard>



                <BentoCard title="Security" icon={Shield}>
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 bg-hover hover:bg-secondary rounded-xl border border-border transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-card rounded-lg text-brand-600 group-hover:text-brand-700 transition-colors border border-border">
                                    <Key size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[13px] text-text-main">Change Password</p>
                                    <p className="text-[11px] text-text-dim mt-0.5">Update your account password</p>
                                </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold bg-secondary px-2 py-1 rounded text-text-dim tracking-wider">Last changed 30d ago</span>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-hover hover:bg-secondary rounded-xl border border-border transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-card rounded-lg text-success group-hover:text-success transition-colors border border-border">
                                    <Smartphone size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[13px] text-text-main">Two-Factor Authentication</p>
                                    <p className="text-[11px] text-text-dim mt-0.5">Secure your account with 2FA</p>
                                </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold bg-success/10 text-success px-2 py-1 rounded tracking-wider">Enabled</span>
                        </button>
                    </div>
                </BentoCard>
            </div>
        </MainLayout>
    );
}
