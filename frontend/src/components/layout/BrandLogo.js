import React from 'react';

export const BrandLogo = ({ size = 30, className = '' }) => (
    <div
        className={className}
        aria-hidden="true"
        style={{
            width: size,
            height: size,
            borderRadius: Math.max(8, Math.round(size * 0.28)),
            background: 'linear-gradient(135deg, #111111, #2f2f2f)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.max(12, Math.round(size * 0.52)),
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: "'Fustat', sans-serif",
        }}
    >
        C
    </div>
);
