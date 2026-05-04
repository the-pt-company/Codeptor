import React, { Suspense } from 'react';

const Spline = React.lazy(() => import('@splinetool/react-spline'));

const SentinelBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden">
            <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
                <Spline
                    scene="https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode"
                    className="w-full h-full"
                />
            </Suspense>
            {/* Dark overlay to ensure text readability */}
            <div className="absolute inset-0 bg-black/30 z-[1] pointer-events-none" />
        </div>
    );
};

export default SentinelBackground;
