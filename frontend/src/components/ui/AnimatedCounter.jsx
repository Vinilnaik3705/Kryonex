import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

/**
 * AnimatedCounter — counts up from 0 to `value` when scrolled into view.
 * Preserves formatting: prefix ($), suffix, decimals, thousands separators.
 */
export default function AnimatedCounter({
    value = 0,
    duration = 1800,
    decimals = 0,
    prefix = '',
    suffix = '',
    className = '',
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!inView) return;
        let raf;
        const start = performance.now();
        const animate = (now) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            setDisplay(value * eased);
            if (t < 1) raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [inView, value, duration]);

    const formatted = Number(display).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return (
        <span ref={ref} className={className}>
            {prefix}{formatted}{suffix}
        </span>
    );
}
