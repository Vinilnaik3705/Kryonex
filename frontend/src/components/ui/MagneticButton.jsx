import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * MagneticButton — a button/link that subtly follows the cursor.
 * Wrap content; pass `as="a"` for links or `to` for router links.
 */
export default function MagneticButton({
    children,
    className = '',
    strength = 0.35,
    as = 'button',
    href,
    to,
    onClick,
    ...rest
}) {
    const ref = useRef(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });

    const handleMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        setPos({ x: x * strength, y: y * strength });
    };

    const reset = () => setPos({ x: 0, y: 0 });

    const commonProps = {
        ref,
        className,
        onMouseMove: handleMove,
        onMouseLeave: reset,
        onClick,
        ...rest,
    };

    const MotionTag = motion[as] || motion.button;

    // Router link
    if (to) {
        // Lazy import to avoid hard dependency at module load
        // (framer-motion renders <motion.a>; we render a plain Link for routing)
        return (
            <motion.a
                href={to}
                onClick={(e) => { e.preventDefault(); onClick && onClick(e); }}
                style={{ display: 'inline-block' }}
                animate={{ x: pos.x, y: pos.y }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 0.4 }}
                {...commonProps}
            >
                {children}
            </motion.a>
        );
    }

    return (
        <MotionTag
            href={href}
            style={{ display: 'inline-block' }}
            animate={{ x: pos.x, y: pos.y }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 0.4 }}
            {...commonProps}
        >
            {children}
        </MotionTag>
    );
}
