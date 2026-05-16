import React from 'react';
import StaticPage from '../components/ui/StaticPage';

export default function Updates() {
    return (
        <StaticPage
            eyebrow="Release Notes"
            title="Updates"
            description="Recent platform changes and active improvements being rolled out across the trading experience."
            sections={[
                {
                    title: 'Recent Improvements',
                    list: [
                        'Mobile-friendly watchlist cards and coin drawer actions',
                        'Persistent user simulation state stored by Clerk user',
                        'Dashboard redirect improvements after sign-in',
                        'Policy pages and footer routes now available'
                    ]
                },
                {
                    title: 'In Progress',
                    body: 'We are continuing to refine the simulation experience, session handling, and mobile interactions.'
                }
            ]}
        />
    );
}
