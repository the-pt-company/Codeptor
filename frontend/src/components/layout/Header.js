import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plus } from 'lucide-react';
import { ProfileDropdown } from '../profile/ProfileDropdown';

/* ── Liquid Glass Header ─────────────────────────────────────────────────── */

const navLinkBase = {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    fontSize: '14px',
    padding: '6px 13px',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'background 0.18s, color 0.18s',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
};

function NavLink({ to, children, style }) {
    const [hovered, setHovered] = React.useState(false);
    return (
        <Link
            to={to}
            style={{
                ...navLinkBase,
                color: hovered ? '#0a0a0a' : '#374151',
                background: hovered ? 'rgba(0,0,0,0.06)' : 'transparent',
                ...style,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </Link>
    );
}

function PrimaryBtn({ to, children }) {
    const [hovered, setHovered] = React.useState(false);
    return (
        <Link
            to={to}
            style={{
                ...navLinkBase,
                background: hovered ? 'rgba(0,132,255,0.95)' : 'rgba(0,132,255,0.82)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '7px 15px',
                borderRadius: '11px',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: 'inset 0px 3px 4px 0px rgba(255,255,255,0.30), 0 4px 16px rgba(0,132,255,0.22)',
                transform: hovered ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.18s ease',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children}
        </Link>
    );
}

export const Header = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const headerStyle = {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        background: 'rgba(255,255,255,0.72)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        boxShadow: 'inset 0px 1px 0px rgba(255,255,255,0.80), 0 4px 24px rgba(0,0,0,0.05)',
        transition: 'none',
    };

    const logoStyle = {
        fontFamily: "'Fustat', sans-serif",
        fontWeight: '800',
        fontSize: '19px',
        letterSpacing: '-0.5px',
        color: '#0a0a0a',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const iconBg = {
        width: '30px',
        height: '30px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, rgba(0,132,255,0.9), rgba(49,154,255,0.8))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0px 2px 3px rgba(255,255,255,0.30)',
        flexShrink: 0,
    };

    const themeToggleStyle = {
        display: 'none',
    };

    return (
        <header style={headerStyle}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '60px',
            }}>
                {/* Logo */}
                <Link to="/" style={logoStyle}>
                    <div style={iconBg}>
                        {/* K icon */}
                        <svg viewBox="0 0 18 18" width="16" height="16" fill="white">
                            <path d="M3 2h2.5v5.5l5-5.5H13L8 7.8 13.5 16H10.7L6.5 9.5l-1 1V16H3V2z"/>
                        </svg>
                    </div>
                    KudosD
                </Link>

                {/* Navigation */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    {isAuthenticated ? (
                        <>
                            {/* Publish Project - Primary CTA */}
                            <Link
                                to="/publish"
                                style={{
                                    ...navLinkBase,
                                    background: 'rgba(0,132,255,0.82)',
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    padding: '7px 14px',
                                    borderRadius: '11px',
                                    border: '1px solid rgba(255,255,255,0.18)',
                                    boxShadow: 'inset 0px 3px 4px 0px rgba(255,255,255,0.30)',
                                    marginRight: '2px',
                                }}
                            >
                                <Plus style={{ width: '15px', height: '15px' }} />
                                <span className="hidden sm:inline">Publish Project</span>
                                <span className="sm:hidden">Publish</span>
                            </Link>

                            <NavLink to="/dashboard">
                                <span className="hidden sm:inline">My Projects</span>
                                <span className="sm:hidden">Projects</span>
                            </NavLink>
                            <NavLink to="/dashboard/blogs">
                                <span className="hidden sm:inline">My Blogs</span>
                                <span className="sm:hidden">Blogs</span>
                            </NavLink>
                            <NavLink to="/explore">Explore</NavLink>
                            <NavLink to="/contribute">Contribute</NavLink>

                            {/* Theme Toggle — hidden (dark mode removed) */}
                            <button style={themeToggleStyle} aria-hidden="true" />

                            {/* Profile Dropdown */}
                            <ProfileDropdown user={user} onLogout={handleLogout} />
                        </>
                    ) : (
                        <>
                            <NavLink to="/explore">Explore</NavLink>
                            <NavLink to="/contribute">Contribute</NavLink>

                            {/* Theme Toggle — hidden (dark mode removed) */}
                            <button style={themeToggleStyle} aria-hidden="true" />

                            <NavLink to="/login" style={{ marginLeft: '2px' }}>Login</NavLink>
                            <PrimaryBtn to="/register">Sign up ↗</PrimaryBtn>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};
