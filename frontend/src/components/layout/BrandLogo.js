import React from 'react';

export const BrandLogo = ({ size = 30, color = '#111111', className = '' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
    >
        <path
            d="M78 34H128V124L180 68H240L172 139L244 222H182L135 159C128.5 151 116 155.6 116 166V222H78V144C78 143.3 78 142.7 78 142C78 141.3 78 140.7 78 140V34Z"
            fill={color}
        />
        <path
            d="M78 34C78 34 78 96 78 140C78 171.5 100.8 192 132 192H128V222H118C95 222 78 205 78 182V34Z"
            fill={color}
        />
    </svg>
);
