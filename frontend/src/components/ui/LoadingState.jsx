import React from 'react';

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse rounded-md bg-secondary ${className}`}
            {...props}
        />
    );
};

export const TableSkeleton = ({ rows = 5 }) => {
    return (
        <div className="w-full space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 px-4 border-b border-border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <div className="space-y-2 w-24">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3 ml-auto" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Skeleton;
