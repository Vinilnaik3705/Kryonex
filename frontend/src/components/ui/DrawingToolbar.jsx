import React from 'react';
import { MousePointer2, TrendingUp, Minus, Square, Type, Eraser } from 'lucide-react';

const TOOLS = [
    { id: 'cursor', icon: MousePointer2, label: 'Cursor' },
    { id: 'trendline', icon: TrendingUp, label: 'Trendline' },
    { id: 'horizontal', icon: Minus, label: 'Horizontal Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export default function DrawingToolbar({ activeTool, onSelect }) {
    return (
        <div className="flex flex-col gap-2 p-2 bg-card border-r border-border h-full">
            {TOOLS.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => onSelect(tool.id)}
                    className={`p-2 rounded-lg transition-all group relative ${activeTool === tool.id
                            ? 'bg-accent text-white'
                            : 'text-text-dim hover:bg-hover hover:text-text-main'
                        }`}
                    title={tool.label}
                >
                    <tool.icon size={18} />

                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded text-[10px] font-bold text-text-main opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-card">
                        {tool.label}
                    </div>
                </button>
            ))}
        </div>
    );
}
