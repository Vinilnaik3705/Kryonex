import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AuroraBackground from './AuroraBackground';
import Reveal from './Reveal';

const StaticPage = ({ title, eyebrow, description, sections = [], backTo = '/', backLabel = 'Back to Home' }) => {
    return (
        <div className="min-h-screen bg-primary text-text-main relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"><AuroraBackground orbs={false} /></div>
            <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24 relative">
                <div className="mb-12">
                    <Link to={backTo} className="inline-flex items-center gap-2 text-text-muted hover:text-text-main transition-colors mb-8 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        {backLabel}
                    </Link>
                    {eyebrow && (
                        <span className="pill mb-4 !text-brand-600 border-brand-100 bg-brand-50">{eyebrow}</span>
                    )}
                    <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tighter leading-[1.05]">{title}</h1>
                    {description && <p className="mt-5 text-text-muted max-w-3xl text-lg leading-relaxed">{description}</p>}
                </div>

                <div className="grid gap-5">
                    {sections.map((section, i) => (
                        <Reveal key={section.title} index={i}>
                            <section className="surface-card rounded-3xl p-6 sm:p-8 hover:shadow-card-hover transition-shadow">
                                <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3 text-text-main">{section.title}</h2>
                                {Array.isArray(section.body) ? (
                                    <div className="space-y-3 text-text-muted leading-relaxed">
                                        {section.body.map((paragraph) => (<p key={paragraph}>{paragraph}</p>))}
                                    </div>
                                ) : (
                                    <p className="text-text-muted leading-relaxed">{section.body}</p>
                                )}
                                {section.list && (
                                    <ul className="mt-4 space-y-2 text-text-muted list-disc list-inside marker:text-brand-400">
                                        {section.list.map((item) => (<li key={item}>{item}</li>))}
                                    </ul>
                                )}
                            </section>
                        </Reveal>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaticPage;
