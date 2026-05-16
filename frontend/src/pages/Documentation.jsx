import React from 'react';
import StaticPage from '../components/ui/StaticPage';

export default function Documentation() {
    return (
        <StaticPage
            eyebrow="Project Docs"
            title="Documentation"
            description="Start here for a quick overview of Kryonex, how the simulation works, and where each major feature lives in the app."
            sections={[
                {
                    title: 'Getting Started',
                    body: [
                        'Create an account, sign in, and open the Dashboard to see the main market overview.',
                        'Use Markets to explore live pricing, Trade to open the simulator, and Portfolio to track positions and performance.'
                    ]
                },
                {
                    title: 'Core Areas',
                    list: [
                        'Dashboard: market summary and AI insights',
                        'Markets: browse coins and open the coin drawer',
                        'Watchlist: save assets you want to follow',
                        'Portfolio: view simulated holdings and P/L'
                    ]
                }
            ]}
        />
    );
}
