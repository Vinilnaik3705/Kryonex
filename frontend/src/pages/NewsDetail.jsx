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
                    <div className="text-center text-text-muted">Loading article...</div>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-text-main mb-2">{error}</h2>
                        <p className="text-text-muted mb-4">Try returning to the dashboard or refresh the page.</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-brand-gradient text-white rounded-lg">Back</button>
                            <button onClick={() => window.location.reload()} className="px-4 py-2 border border-border rounded-lg text-text-main">Reload</button>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="surface-card rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 rounded-full text-sm font-bold border bg-brand-50 text-brand-600 border-brand-100">{article.category || 'Crypto'}</span>
                        <span className="text-text-dim text-sm">{article.time || new Date(article.publishedAt).toLocaleString()}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-bold text-text-main font-heading tracking-tight mb-6">{article.title}</h1>

                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6 text-sm text-text-muted">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-text-dim" />
                                <span>{article.author || article.source}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tag size={16} className="text-text-dim" />
                                <span>{article.source}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-text-dim" />
                                <span>{new Date(article.publishedAt || article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold whitespace-nowrap">
                            Read Full Article
                            <ExternalLink size={16} />
                        </a>
                    </div>
                </div>

                <div className="surface-card rounded-2xl p-8">
                    <div className="space-y-4 text-text-muted leading-relaxed whitespace-pre-line">
                        {article.content || article.description || ''}
                    </div>
                </div>

                {article.relatedCoins && (
                    <div className="surface-card rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-text-main font-heading mb-4">Related Coins</h3>
                        <div className="flex flex-wrap gap-3">
                            {article.relatedCoins.map((coin) => (
                                <button key={coin} onClick={() => navigate(`/trade/${coin}`)} className="px-4 py-2 bg-hover border border-border rounded-xl text-text-main hover:border-brand-300 hover:bg-brand-50 transition-all font-bold">{coin}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
