import React from 'react';
import { Search, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const EmptyState = ({
    icon: Icon = FolderOpen,
    title = 'No data found',
    description = 'Try adjusting your filters or search query.',
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-hover rounded-full flex items-center justify-center mb-6 border border-border"
            >
                <Icon size={32} className="text-text-dim" />
            </motion.div>
            <h3 className="text-xl font-bold text-text-main mb-2">{title}</h3>
            <p className="text-text-muted max-w-sm mb-8">{description}</p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
