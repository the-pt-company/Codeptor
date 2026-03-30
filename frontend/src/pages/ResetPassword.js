import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { authAPI } from '../lib/api';
import { getErrorMessage } from '../lib/utils';
import { Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const hasValidToken = Boolean(token);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasValidToken) {
            toast.error('This reset link is invalid. Please request a new one.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPassword({
                token,
                new_password: password
            });
            setSuccess(true);
            toast.success('Password reset successfully');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to reset password'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-8">
                    {!success ? (
                        <>
                            <div className="text-center">
                                <h1 className="font-heading font-bold text-4xl tracking-tight text-foreground">
                                    Set New Password
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {hasValidToken
                                        ? 'Please enter your new password below.'
                                        : 'This reset link is missing or invalid. Please request a new one.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-card border border-border rounded-lg p-8 shadow-sm">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                placeholder="••••••••"
                                                disabled={!hasValidToken}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input
                                                id="confirmPassword"
                                                type={showConfirm ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                placeholder="••••••••"
                                                disabled={!hasValidToken}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !hasValidToken}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Resetting...' : hasValidToken ? 'Reset Password' : 'Invalid Reset Link'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-6 bg-card border border-border rounded-lg p-8 shadow-sm">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500" />
                            </div>
                            <div>
                                <h2 className="font-heading font-bold text-2xl text-foreground">Password Reset!</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Your password has been successfully updated. You can now log in with your new password.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="w-full block bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-all text-center"
                                >
                                    Log In Now
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
