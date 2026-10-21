import React from 'react';
import { motion } from 'framer-motion';

/**
 * PageTransition — subtle fade/slide on route mount.
 * Wrap page content. Uses initial/animate (mount) — pair with AnimatePresence in router for exit.
 */
export default function PageTransition({ children, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
