import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import {
    X, Download, Share2, Copy, MapPin, Calendar,
    Code2, Briefcase, BookOpen, Eye, Github, Linkedin, Globe
} from 'lucide-react';

/**
 * ProfileShareCard – renders a stunning, gradient profile card
 * that can be downloaded as PNG or shared via Web Share API.
 */
export const ProfileShareCard = ({ user, stats, onClose }) => {
    const cardRef = useRef(null);
    const [capturing, setCapturing] = useState(false);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Capture the card as a canvas, then produce a Blob
    const captureCard = async () => {
        if (!cardRef.current) return null;
        setCapturing(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });
            return canvas;
        } finally {
            setCapturing(false);
        }
    };

    const handleDownload = async () => {
        const canvas = await captureCard();
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `${user?.username || 'profile'}-codeptor.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('Profile card downloaded!');
    };

    const handleShare = async () => {
        const canvas = await captureCard();
        if (!canvas) return;
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `${user?.username}-codeptor.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({
                        title: `${user?.full_name}'s Developer Profile`,
                        text: `Check out ${user?.full_name}'s profile on Codeptor!`,
                        files: [file],
                    });
                    toast.success('Shared successfully!');
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        toast.error('Sharing failed');
                    }
                }
            } else {
                // Fallback: copy profile URL
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success('Profile link copied to clipboard!');
                } catch {
                    toast.error('Failed to share');
                }
            }
        }, 'image/png');
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success('Profile link copied!');
        } catch {
            toast.error('Failed to copy');
        }
    };

    return (
        /* Modal Backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Modal Container */}
            <div className="relative w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* ─── The Card (This is what gets captured) ─── */}
                <div
                    ref={cardRef}
                    style={{
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
                        borderRadius: '20px',
                        padding: '2px',
                    }}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                            borderRadius: '18px',
                            padding: '32px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Decorative gradient orbs */}
                        <div style={{
                            position: 'absolute', top: '-60px', right: '-60px',
                            width: '200px', height: '200px',
                            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
                            borderRadius: '50%',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-40px', left: '-40px',
                            width: '160px', height: '160px',
                            background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
                            borderRadius: '50%',
                        }} />

                        {/* Top: Branding */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: 'bold', color: '#fff',
                                }}>
                                    C
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.5px' }}>
                                    Codeptor
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#475569', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                Developer Card
                            </span>
                        </div>

                        {/* Avatar + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt={user.full_name}
                                    style={{
                                        width: '72px', height: '72px', borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '3px solid #334155',
                                    }}
                                    crossOrigin="anonymous"
                                />
                            ) : (
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px', fontWeight: 'bold', color: '#fff',
                                    border: '3px solid #334155',
                                }}>
                                    {getInitials(user?.full_name)}
                                </div>
                            )}
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0, lineHeight: 1.2 }}>
                                    {user?.full_name || 'Developer'}
                                </h2>
                                <p style={{ fontSize: '14px', color: '#6366f1', margin: '2px 0 0', fontWeight: '500' }}>
                                    @{user?.username}
                                </p>
                            </div>
                        </div>

                        {/* Bio */}
                        {user?.bio && (
                            <p style={{
                                fontSize: '13px', color: '#94a3b8', lineHeight: '1.6',
                                marginBottom: '16px', position: 'relative', zIndex: 1,
                                maxHeight: '60px', overflow: 'hidden',
                            }}>
                                {user.bio}
                            </p>
                        )}

                        {/* Meta: Location + Joined */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                            {user?.location && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                    <MapPin size={14} color="#64748b" />
                                    {user.location}
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                                <Calendar size={14} color="#64748b" />
                                Joined {formatDate(user?.created_at)}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '12px', marginBottom: '20px', position: 'relative', zIndex: 1,
                        }}>
                            {[
                                { label: 'Projects', value: stats?.projects || 0, Icon: Briefcase },
                                { label: 'Blogs', value: stats?.blogPosts || 0, Icon: BookOpen },
                                { label: 'Blog Views', value: stats?.blogViews || 0, Icon: Eye },
                                { label: 'Profile Visits', value: stats?.profileVisits || 0, Icon: Eye },
                            ].map(({ label, value, Icon }) => (
                                <div key={label} style={{
                                    background: 'rgba(30,41,59,0.8)',
                                    border: '1px solid #334155',
                                    borderRadius: '12px',
                                    padding: '12px 8px',
                                    textAlign: 'center',
                                }}>
                                    <Icon size={16} color="#6366f1" style={{ margin: '0 auto 6px' }} />
                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>
                                        {value}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                                        {label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Skills / Tech Stack */}
                        {user?.skills && user.skills.length > 0 && (
                            <div style={{ marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <Code2 size={14} color="#6366f1" />
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        Tech Stack
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {user.skills.slice(0, 8).map(skill => (
                                        <span
                                            key={skill}
                                            style={{
                                                fontSize: '11px', fontWeight: '500',
                                                padding: '4px 10px', borderRadius: '6px',
                                                background: 'rgba(99,102,241,0.12)',
                                                color: '#a5b4fc',
                                                border: '1px solid rgba(99,102,241,0.2)',
                                            }}
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Social Links */}
                        {(user?.github_url || user?.linkedin_url || user?.website_url) && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', position: 'relative', zIndex: 1 }}>
                                {user.github_url && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontSize: '11px', color: '#94a3b8',
                                        padding: '4px 10px', borderRadius: '6px',
                                        background: 'rgba(148,163,184,0.08)',
                                        border: '1px solid rgba(148,163,184,0.1)',
                                    }}>
                                        <Github size={12} /> GitHub
                                    </div>
                                )}
                                {user.linkedin_url && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontSize: '11px', color: '#60a5fa',
                                        padding: '4px 10px', borderRadius: '6px',
                                        background: 'rgba(96,165,250,0.08)',
                                        border: '1px solid rgba(96,165,250,0.1)',
                                    }}>
                                        <Linkedin size={12} /> LinkedIn
                                    </div>
                                )}
                                {user.website_url && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        fontSize: '11px', color: '#06b6d4',
                                        padding: '4px 10px', borderRadius: '6px',
                                        background: 'rgba(6,182,212,0.08)',
                                        border: '1px solid rgba(6,182,212,0.1)',
                                    }}>
                                        <Globe size={12} /> Portfolio
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer watermark */}
                        <div style={{
                            marginTop: '16px', paddingTop: '14px',
                            borderTop: '1px solid #1e293b',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            position: 'relative', zIndex: 1,
                        }}>
                            <span style={{ fontSize: '10px', color: '#334155' }}>
                                codeptor.com/{user?.username}
                            </span>
                            <span style={{ fontSize: '10px', color: '#334155' }}>
                                Built with Codeptor
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── Actions (outside card — not captured) ─── */}
                <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                        onClick={handleDownload}
                        disabled={capturing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-all disabled:opacity-60 shadow-lg shadow-accent/20"
                    >
                        <Download className="w-4 h-4" />
                        {capturing ? 'Capturing…' : 'Download PNG'}
                    </button>
                    <button
                        onClick={handleShare}
                        disabled={capturing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all disabled:opacity-60 backdrop-blur-sm"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all backdrop-blur-sm"
                    >
                        <Copy className="w-4 h-4" />
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileShareCard;
