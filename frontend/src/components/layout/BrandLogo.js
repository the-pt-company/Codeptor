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
            d="M74 32H124V118L172 70H230L165 137L232 224H175L133 165C129 159.5 122 157 115.5 158.8V224H74V32Z"
            fill={color}
        />
        <path
            d="M74 124C74 153.8 96.2 181.5 132 190.5L124 224C94 224 74 204 74 174V124Z"
            fill={color}
        />
        <path
            d="M124 159C129.8 159 135.2 162.1 138.1 167.1L156 196H126V172C126 165.4 120.6 160 114 160C107.4 160 102 165.4 102 172V196H74V159H124Z"
            fill={color}
        />
    </svg>
);
