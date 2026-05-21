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
                    <h2 className="text-xl font-extrabold text-white">Settings</h2>
                    <p className="text-[rgba(255,255,255,0.3)] mt-0.5 text-[12px]">Manage your account preferences and security</p>
                </div>

                <BentoCard title="Profile Information" icon={User}>
                    <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent to-blue-600 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-xl">
                            {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-white">{user?.name || 'Your Name'}</h3>
                            <p className="text-[rgba(255,255,255,0.4)] text-[13px]">{user?.email || 'you@example.com'}</p>
                            {user?.provider === 'google' && (
                                <a href="https://myaccount.google.com/profile" target="_blank" rel="noopener noreferrer" className="text-accent text-[12px] font-bold mt-1.5 hover:text-white transition-colors inline-block">
                                    Change Profile via Google ↗
                                </a>
                            )}
                            {user?.provider === 'github' && (
                                <a href="https://github.com/settings/profile" target="_blank" rel="noopener noreferrer" className="text-accent text-[12px] font-bold mt-1.5 hover:text-white transition-colors inline-block">
                                    Change Profile via GitHub ↗
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="th-label block">Display Name</label>
                            <input type="text" value={user?.name || ''} className="w-full bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2.5 text-[13px] font-bold text-white focus:outline-none focus:border-accent/40" readOnly />
                        </div>
                        <div className="space-y-1.5">
                            <label className="th-label block">Email Address</label>
                            <input type="email" value={user?.email || ''} className="w-full bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2.5 text-[13px] font-bold text-white focus:outline-none focus:border-accent/40" readOnly />
                        </div>
                    </div>
                </BentoCard>



                <BentoCard title="Security" icon={Shield}>
                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-[rgba(255,255,255,0.06)] transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#050d14] rounded-lg text-accent group-hover:text-white transition-colors border border-[rgba(255,255,255,0.06)]">
                                    <Key size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[13px] text-white">Change Password</p>
                                    <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-0.5">Update your account password</p>
                                </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold bg-white/[0.06] px-2 py-1 rounded text-[rgba(255,255,255,0.5)] tracking-wider">Last changed 30d ago</span>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-[rgba(255,255,255,0.06)] transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#050d14] rounded-lg text-success group-hover:text-white transition-colors border border-[rgba(255,255,255,0.06)]">
                                    <Smartphone size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-[13px] text-white">Two-Factor Authentication</p>
                                    <p className="text-[11px] text-[rgba(255,255,255,0.3)] mt-0.5">Secure your account with 2FA</p>
                                </div>
                            </div>
                            <span className="text-[10px] uppercase font-extrabold bg-success/[0.12] text-success px-2 py-1 rounded tracking-wider">Enabled</span>
                        </button>
                    </div>
                </BentoCard>
            </div>
        </MainLayout>
    );
}
