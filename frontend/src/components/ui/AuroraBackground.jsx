import React, { useRef } from 'react';

/**
 * AuroraBackground — drifting blurred gradient orbs + optional grid overlay.
 * Pure CSS animations (GPU-friendly), theme-aware. Used as a page hero backdrop.
 */
export default function AuroraBackground({
    showGrid = true,
    showDots = false,
    orbs = true,
    className = '',
    children,
}) {
    const ref = useRef(null);

    return (
        <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
            {/* Grid */}
            {showGrid && (
                <div className="absolute inset-0 grid-overlay grid-fade opacity-70" />
            )}
            {/* Dots */}
            {showDots && (
                <div className="absolute inset-0 dotted-overlay grid-fade opacity-60" />
            )}

            {/* Aurora orbs */}
            {orbs && (
                <>
                    <div
                        className="aurora-orb animate-aurora"
                        style={{
                            width: '45vw', height: '45vw', maxWidth: 640, maxHeight: 640,
                            top: '-10%', left: '-8%',
                             background: 'radial-gradient(circle at 30% 30%, rgba(124,92,255,0.24), transparent 60%)',
                        }}
                    />
                    <div
                        className="aurora-orb animate-aurora-slow"
                        style={{
                            width: '40vw', height: '40vw', maxWidth: 560, maxHeight: 560,
                            top: '8%', right: '-10%',
                             background: 'radial-gradient(circle at 70% 30%, rgba(165,107,255,0.18), transparent 60%)',
                        }}
                    />
                    <div
                        className="aurora-orb animate-aurora"
                        style={{
                            width: '38vw', height: '38vw', maxWidth: 520, maxHeight: 520,
                            bottom: '-12%', left: '30%',
                             background: 'radial-gradient(circle at 50% 50%, rgba(124,92,255,0.14), transparent 60%)',
                            animationDelay: '-6s',
                        }}
                    />
                </>
            )}

            {/* Top sheen */}
            <div
                className="absolute inset-x-0 top-0 h-40 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, var(--color-primary), transparent)' }}
            />
            {children}
        </div>
    );
}
