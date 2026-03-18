import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const GoogleAuthButton = () => {
    const [loading, setLoading] = useState(false);
    const { googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            await googleLogin(credentialResponse.credential);
            toast.success('Signed in with Google!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Google auth error:', error);
            toast.error(error.response?.data?.detail || 'Google sign-in failed');
        } finally {
            setLoading(false);
        }
    };

    const handleError = () => {
        toast.error('Google sign-in was cancelled or failed');
    };

    return (
        <div className="w-full space-y-4">
            {/* Divider */}
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <span className="relative bg-card px-4 text-xs text-muted-foreground uppercase tracking-wider">
                    or
                </span>
            </div>

            {/* Google Login Button */}
            <div
                className="flex justify-center"
                style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}
            >
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    width="360"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    logo_alignment="left"
                    theme="outline"
                />
            </div>
        </div>
    );
};
