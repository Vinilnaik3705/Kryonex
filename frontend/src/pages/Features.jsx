import React from 'react';
import StaticPage from '../components/ui/StaticPage';

export default function Features() {
    return (
        <StaticPage
            eyebrow="Platform Features"
            title="Features List"
            description="A quick overview of the main Kryonex features currently available in the app."
            sections={[
                {
                    title: 'Trading Experience',
                    list: [
                        'Live market views for crypto, ETFs, and stocks',
                        'Simulated buy/sell workflow',
                        'Wallet and portfolio tracking',
                        'Watchlist management'
                    ]
                },
                {
                    title: 'Analysis Tools',
                    list: [
                        'AI crypto analyst chatbot',
                        'Heatmap and market overview panels',
                        'Candlestick charts and trend cards',
                        'Command palette for fast navigation'
                    ]
                }
            ]}
        />
    );
}
