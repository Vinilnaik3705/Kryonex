import React from 'react';
import { motion } from 'framer-motion';

const BentoCard = ({ children, className = "", title, icon: Icon, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -3, scale: 1.005 }}
            className={`glass-card rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:shadow-card-hover ${className}`}
        >
            {/* Brand gradient glow */}
            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-64 h-64 bg-brand-gradient opacity-[0.06] blur-[90px] rounded-full pointer-events-none group-hover:opacity-[0.14] transition-opacity duration-500" />

            {/* Header */}
            {(title || Icon) && (
                <div className="flex items-center gap-2.5 mb-5 relative z-10">
                    {Icon && (
                        <div className="p-2 rounded-xl bg-brand-gradient-soft text-brand-600 border border-brand-100/50 shadow-sm">
                            <Icon size={17} />
                        </div>
                    )}
                    {title && <h3 className="text-sm font-bold text-text-main font-heading tracking-wide">{title}</h3>}
                </div>
            )}

            <div className="relative z-10">{children}</div>
        </motion.div>
    );
};

export default BentoCard;
