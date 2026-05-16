import React from 'react';
import StaticPage from '../components/ui/StaticPage';

export default function PrivacyPolicy() {
    return (
        <StaticPage
            eyebrow="Legal"
            title="Privacy Policy"
            description="This page explains what we collect, how we use it, and how user data is handled inside Kryonex."
            sections={[
                {
                    title: 'What We Collect',
                    body: [
                        'Account information provided by Clerk, including name, email, and session metadata.',
                        'Trading simulation state such as wallet balance, portfolio holdings, and watchlist selections for the signed-in user.'
                    ]
                },
                {
                    title: 'How We Use It',
                    body: [
                        'To keep your portfolio and simulation state persistent across sessions.',
                        'To provide market features, dashboard access, and personalized watchlists while you are signed in.'
                    ]
                },
                {
                    title: 'Data Control',
                    body: 'If you clear your browser storage or sign out, local fallback data may be removed. Server-side simulation data remains tied to your account unless you request deletion.'
                }
            ]}
        />
    );
}
