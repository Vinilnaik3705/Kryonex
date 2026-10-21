import React, { useState } from 'react';
import { Settings, Play, Plus, Trash2, Info } from 'lucide-react';

export default function StrategyBuilder() {
    const [rules, setRules] = useState([
        { id: 1, indicator: 'SMA', condition: 'Crosses Over', value: 'EMA', action: 'Buy' }
    ]);

    const addRule = () => {
        setRules([...rules, {
            id: Date.now(),
            indicator: 'RSI',
            condition: 'Less Than',
            value: '30',
            action: 'Buy'
        }]);
    };

    const removeRule = (id) => {
        setRules(rules.filter(r => r.id !== id));
    };

    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                        <Settings className="text-accent" /> Strategy Builder
                    </h3>
                    <p className="text-xs text-text-dim mt-1">Define logic for automated trading simulations</p>
                </div>
                <button
                    onClick={addRule}
                    className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl text-accent font-bold text-xs hover:bg-accent hover:text-white transition-all"
                >
                    <Plus size={14} /> Add Rule
                </button>
            </div>

            <div className="space-y-3">
                {rules.map((rule) => (
                    <div key={rule.id} className="flex flex-wrap items-center gap-3 p-4 bg-hover rounded-xl border border-border">
                        <span className="text-xs font-bold text-text-dim uppercase tracking-widest">IF</span>
                        <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-text-main focus:outline-none focus:border-accent">
                            <option>{rule.indicator}</option>
                            <option>RSI</option>
                            <option>MACD</option>
                            <option>Price</option>
                        </select>
                        <select className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-text-main focus:outline-none focus:border-accent">
                            <option>{rule.condition}</option>
                            <option>Crosses Under</option>
                            <option>Greater Than</option>
                            <option>Less Than</option>
                        </select>
                        <input
                            type="text"
                            defaultValue={rule.value}
                            className="w-20 bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-text-main focus:outline-none focus:border-accent"
                        />
                        <span className="text-xs font-bold text-text-dim uppercase tracking-widest">THEN</span>
                        <select className="bg-success/10 border border-success/20 text-success rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none">
                            <option>{rule.action}</option>
                            <option>Sell</option>
                        </select>
                        <button
                            onClick={() => removeRule(rule.id)}
                            className="ml-auto p-2 text-text-dim hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-between p-4 bg-accent/5 rounded-xl border border-accent/10">
                <div className="flex items-center gap-3 text-text-muted">
                    <Info size={16} />
                    <span className="text-xs font-medium">This strategy will be used for backtesting simulation</span>
                </div>
                <button className="flex items-center gap-2 px-6 py-2 bg-success text-white font-bold rounded-xl shadow-lg shadow-success/20 hover:scale-105 transition-all">
                    <Play size={14} fill="currentColor" /> Run Backtest
                </button>
            </div>
        </div>
    );
}
