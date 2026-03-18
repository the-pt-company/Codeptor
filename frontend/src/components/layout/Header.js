import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BookOpen, Moon, Sun, Plus } from 'lucide-react';
import { ProfileDropdown } from '../profile/ProfileDropdown';

export const Header = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="border-b border-border bg-card transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-heading font-bold text-xl text-foreground">
                            KudosDev
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1 sm:gap-2">
                        {isAuthenticated ? (
                            <>
                                {/* Publish Project - Primary CTA */}
                                <Link
                                    to="/publish"
                                    className="
                                        inline-flex items-center gap-1.5 
                                        bg-accent text-accent-foreground 
                                        hover:bg-accent/90 
                                        px-3 py-1.5 rounded-md 
                                        text-sm font-medium 
                                        transition-all active:scale-95
                                        shadow-sm
                                    "
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Publish Project</span>
                                    <span className="sm:hidden">Publish</span>
                                </Link>

                                {/* My Projects */}
                                <Link
                                    to="/dashboard"
                                    className="text-sm text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md hover:bg-muted"
                                >
                                    <span className="hidden sm:inline">My Projects</span>
                                    <span className="sm:hidden">Projects</span>
                                </Link>

                                {/* My Blogs */}
                                <Link
                                    to="/dashboard/blogs"
                                    className="text-sm text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md hover:bg-muted"
                                >
                                    <span className="hidden sm:inline">My Blogs</span>
                                    <span className="sm:hidden">Blogs</span>
                                </Link>

                                {/* Explore */}
                                <Link
                                    to="/explore"
                                    className="text-sm text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md hover:bg-muted"
                                >
                                    Explore
                                </Link>


                                {/* Contributions */}
                                <Link
                                    to="/contribute"
                                    className="text-sm text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md hover:bg-muted"
                                >
                                    Contributions
                                </Link>

                                {/* Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-md hover:bg-muted transition-colors text-foreground"
                                    aria-label="Toggle theme"
                                >
                                    {theme === 'light' ? (
                                        <Moon className="w-5 h-5" />
                                    ) : (
                                        <Sun className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Profile Dropdown */}
                                <ProfileDropdown user={user} onLogout={handleLogout} />
                            </>
                        ) : (
                            <>
                                {/* Explore - visible to everyone */}
                                <Link
                                    to="/explore"
                                    className="text-sm text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md hover:bg-muted"
                                >
                                    Explore
                                </Link>


                                {/* Contributions - visible to everyone */}
                                <Link
                                    to="/contribute"
                                    className="text-sm text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md hover:bg-muted"
                                >
                                    Contributions
                                </Link>

                                {/* Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-md hover:bg-muted transition-colors text-foreground"
                                    aria-label="Toggle theme"
                                >
                                    {theme === 'light' ? (
                                        <Moon className="w-5 h-5" />
                                    ) : (
                                        <Sun className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Login */}
                                <Link
                                    to="/login"
                                    className="text-sm text-foreground hover:text-accent transition-colors px-3 py-2 rounded-md hover:bg-muted"
                                >
                                    Login
                                </Link>

                                {/* Sign Up */}
                                <Link
                                    to="/register"
                                    className="text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-all"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};
