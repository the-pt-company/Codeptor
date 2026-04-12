import React from 'react';

export const BrandLogo = ({ size = 30, className = '' }) => (
    <img
        src="/Codeptor.png"
        width={size}
        height={size}
        className={className}
        alt="Codeptor"
        style={{ width: size, height: size, objectFit: 'contain' }}
    />
);
