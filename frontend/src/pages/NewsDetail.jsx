import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { ArrowLeft, Calendar, User, Tag, ExternalLink } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

export default function NewsDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        const fetchArticles = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await axios.get(`${API_BASE_URL}/news?category=crypto&limit=50`);
                if (!active) return;
                if (res.data?.success) {
                    const found = res.data.data.find((a) => String(a.id) === String(id));
                    if (found) {
                        setArticle(found);
                    } else {
                        setError('Article not found');
                    }
                } else {
                    setError('Failed to fetch news');
                }
            } catch (e) {
                if (!active) return;
                setError(e.message || 'Failed to fetch news');
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchArticles();

        return () => {
            active = false;
        };
    }, [id]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center text-slate-400">Loading article...</div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
                        <p className="text-slate-400 mb-4">Try returning to the dashboard or refresh the page.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-accent rounded-lg">Back</button>
                            <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded-lg">Reload</button>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                    <span>Back to Dashboard</span>
                </button>

                <div className="bg-secondary/30 rounded-2xl border border-slate-700/50 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full text-sm font-bold border bg-purple-500/20 text-purple-400 border-purple-500/30">{article.category || 'Crypto'}</span>
                        <span className="text-slate-500 text-sm">{article.time || new Date(article.publishedAt).toLocaleString()}</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-6">{article.title}</h1>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>{article.author || article.source}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tag size={16} />
                                <span>{article.source}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{new Date(article.publishedAt || article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg flex items-center gap-2 transition-colors font-semibold whitespace-nowrap">
                            Read Full Article
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </div>

                <div className="bg-secondary/30 rounded-2xl border border-slate-700/50 p-8">
                    <div className="space-y-4 text-slate-300 leading-relaxed whitespace-pre-line">
                        {article.content || article.description || ''}
                    </div>
                </div>

                {article.relatedCoins && (
                    <div className="bg-secondary/30 rounded-2xl border border-slate-700/50 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Related Coins</h3>
                        <div className="flex flex-wrap gap-3">
                            {article.relatedCoins.map((coin) => (
                                <button key={coin} onClick={() => navigate(`/trade/${coin}`)} className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white hover:bg-slate-700/50 hover:border-accent transition-all font-bold">{coin}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
