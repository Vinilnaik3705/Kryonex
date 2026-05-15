import React from 'react';
import { motion } from 'framer-motion';

const BentoCard = ({ children, className = "", title, icon: Icon, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            className={`bg-card border border-border rounded-xl p-4 relative overflow-hidden group ${className}`}
        >
            {/* Subtle Gradient Glow Effect */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-accent/[0.04] blur-[80px] rounded-full pointer-events-none group-hover:bg-accent/[0.08] transition-colors duration-500" />

            {/* Header if Title/Icon provided */}
            {(title || Icon) && (
                <div className="flex items-center gap-2.5 mb-5 relative z-10">
                    {Icon && (
                        <div className="p-2 rounded-lg bg-accent/[0.08] text-accent border border-accent/[0.12]">
                            <Icon size={17} />
                        </div>
                    )}
                    {title && <h3 className="text-sm font-bold text-white">{title}</h3>}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

export default BentoCard;
