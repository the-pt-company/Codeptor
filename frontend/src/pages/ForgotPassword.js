import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { authAPI } from '../lib/api';
import { getErrorMessage } from '../lib/utils';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.forgotPassword({ email });
            setSubmitted(true);
            toast.success('Reset link sent to your email');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to send reset link'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-8">
                    {!submitted ? (
                        <>
                            <div className="text-center">
                                <h1 className="font-heading font-bold text-4xl tracking-tight text-foreground">
                                    Reset Password
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Enter your email and we'll send you a link to reset your password.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-card border border-border rounded-lg p-8 shadow-sm">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input
                                                id="email"
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                placeholder="you@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>

                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to login
                                    </Link>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-6 bg-card border border-border rounded-lg p-8 shadow-sm">
                            <div className="flex justify-center">
                                <CheckCircle2 className="w-16 h-16 text-green-500" />
                            </div>
                            <div>
                                <h2 className="font-heading font-bold text-2xl text-foreground">Check your email</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                                    Please check your inbox and follow the instructions.
                                </p>
                            </div>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Return to login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
