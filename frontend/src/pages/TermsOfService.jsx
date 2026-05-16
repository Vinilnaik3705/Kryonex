import React from 'react';
import StaticPage from '../components/ui/StaticPage';

export default function TermsOfService() {
    return (
        <StaticPage
            eyebrow="Legal"
            title="Terms of Service"
            description="These terms cover your use of Kryonex, the simulated trading experience, and related platform features."
            sections={[
                {
                    title: 'Simulation Only',
                    body: 'Kryonex is a trading simulator and market analysis platform. Content and balances shown in the app are for demonstration and educational use only.'
                },
                {
                    title: 'Account Use',
                    body: 'You are responsible for maintaining access to your account. Session limits and sign-out behavior may be enforced to protect your data and account security.'
                },
                {
                    title: 'Acceptable Use',
                    list: [
                        'Do not abuse the platform or attempt unauthorized access.',
                        'Do not attempt to manipulate simulation data or market feeds.',
                        'Follow applicable laws and platform rules while using the service.'
                    ]
                }
            ]}
        />
    );
}
