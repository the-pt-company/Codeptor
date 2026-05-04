import React from 'react';
import SentinelBackground from '../components/sentinel/SentinelBackground';

export default function SentinelLanding() {
    return (
        <div className="sentinel-theme min-h-screen selection:bg-primary selection:text-primary-foreground overflow-hidden bg-background">
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                <SentinelBackground />
            </div>
        </div>
    );
}
