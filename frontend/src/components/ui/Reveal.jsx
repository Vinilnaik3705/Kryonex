import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reveal — staggered fade-up wrapper using whileInView.
 * Set `index` for stagger delay, or pass `delay` directly.
 */
export default function Reveal({
    children,
    delay = 0,
    index = 0,
    y = 24,
    once = true,
    className = '',
    as = 'div',
}) {
    const MotionTag = motion[as] || motion.div;
    return (
        <MotionTag
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once, margin: '-80px' }}
            transition={{ duration: 0.6, delay: delay + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </MotionTag>
    );
}
