import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Plus, Sun, Moon } from 'lucide-react';
import { ProfileDropdown } from '../profile/ProfileDropdown';

export const Header = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const isDark = theme === 'dark';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header
            className={`sticky top-0 z-[100] w-full border-b transition-all duration-300 ${
                isDark
                    ? 'bg-background/80 border-border shadow-md backdrop-blur-xl'
                    : 'bg-white/70 backdrop-blur-xl border-border shadow-sm'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link
                    to="/"
                    className="text-xl tracking-tight text-foreground no-underline hover:opacity-80 transition-opacity select-none font-bold flex items-center"
                    style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px' }}
                >
                    KudosDev<sup className="text-[10px] align-super opacity-70">®</sup>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1 sm:gap-2">
                    {isAuthenticated ? (
                        <>
                            {/* Publish Project - Primary CTA */}
                            <Link
                                to="/publish"
                                className="hidden sm:inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-1.5 rounded-full transition-transform hover:scale-105 shadow-sm mr-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Publish</span>
                            </Link>

                            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors hidden sm:block">
                                Projects
                            </Link>
                            <Link to="/dashboard/blogs" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors hidden sm:block">
                                Blogs
                            </Link>
                            <Link to="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors">
                                Explore
                            </Link>
                            <Link to="/contribute" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors hidden md:block">
                                Contribute
                            </Link>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex items-center justify-center"
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {/* Profile Dropdown */}
                            <div className="ml-1">
                                <ProfileDropdown user={user} onLogout={handleLogout} />
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors">
                                Explore
                            </Link>
                            <Link to="/contribute" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors hidden sm:block">
                                Contribute
                            </Link>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors flex items-center justify-center"
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors ml-1">
                                Login
                            </Link>
                            <Link to="/register" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 py-1.5 rounded-full transition-transform hover:scale-105 shadow-sm ml-1">
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};
