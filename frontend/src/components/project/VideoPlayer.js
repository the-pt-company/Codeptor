import React, { useState, useMemo } from 'react';
import { Play, Film, ExternalLink } from 'lucide-react';

/**
 * ProjectVideoPlayer — Universal video embed component.
 * 
 * Supports:
 *  - YouTube (youtube.com/watch, youtu.be, youtube.com/embed)
 *  - Vimeo   (vimeo.com/{id})
 *  - Loom    (loom.com/share/{id})
 *  - Direct  (.mp4, .webm, .mov files)
 *  - Fallback link card for unrecognised URLs
 */

// ── URL Parsing Helpers ───────────────────────────────────────────────────────

function getYouTubeId(url) {
    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') return u.pathname.slice(1);
        if (u.hostname.includes('youtube.com')) {
            if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1]?.split('?')[0];
            return u.searchParams.get('v');
        }
    } catch { /* ignore */ }
    return null;
}

function getVimeoId(url) {
    try {
        const u = new URL(url);
        if (u.hostname.includes('vimeo.com')) {
            const parts = u.pathname.split('/').filter(Boolean);
            return parts[parts.length - 1];
        }
    } catch { /* ignore */ }
    return null;
}

function getLoomId(url) {
    try {
        const u = new URL(url);
        if (u.hostname.includes('loom.com') && u.pathname.includes('/share/')) {
            return u.pathname.split('/share/')[1]?.split('?')[0];
        }
    } catch { /* ignore */ }
    return null;
}

function isDirectVideo(url) {
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

function detectVideoType(url) {
    if (!url) return { type: null };
    const ytId = getYouTubeId(url);
    if (ytId) return { type: 'youtube', id: ytId };
    const vimeoId = getVimeoId(url);
    if (vimeoId) return { type: 'vimeo', id: vimeoId };
    const loomId = getLoomId(url);
    if (loomId) return { type: 'loom', id: loomId };
    if (isDirectVideo(url)) return { type: 'direct', id: url };
    return { type: 'link', id: url };
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProjectVideoPlayer({ url }) {
    const [playing, setPlaying] = useState(false);
    const video = useMemo(() => detectVideoType(url), [url]);

    if (!url || !video.type) return null;

    // ── YouTube ───────────────────────────────────────────────────────────
    if (video.type === 'youtube') {
        const thumbUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
        return (
            <VideoShell label="Watch Project Demo">
                {!playing ? (
                    <ThumbnailOverlay
                        src={thumbUrl}
                        alt="YouTube video thumbnail"
                        onPlay={() => setPlaying(true)}
                    />
                ) : (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                        title="Project demo video"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                )}
            </VideoShell>
        );
    }

    // ── Vimeo ─────────────────────────────────────────────────────────────
    if (video.type === 'vimeo') {
        return (
            <VideoShell label="Watch Project Demo">
                <iframe
                    src={`https://player.vimeo.com/video/${video.id}?title=0&byline=0&portrait=0`}
                    title="Project demo video"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            </VideoShell>
        );
    }

    // ── Loom ──────────────────────────────────────────────────────────────
    if (video.type === 'loom') {
        return (
            <VideoShell label="Watch Project Demo">
                <iframe
                    src={`https://www.loom.com/embed/${video.id}`}
                    title="Project demo video"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            </VideoShell>
        );
    }

    // ── Direct Video File ─────────────────────────────────────────────────
    if (video.type === 'direct') {
        return (
            <VideoShell label="Watch Project Demo">
                <video
                    src={url}
                    controls
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                >
                    Your browser does not support the video tag.
                </video>
            </VideoShell>
        );
    }

    // ── Fallback: External Link Card ──────────────────────────────────────
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/20 flex items-center justify-center">
                    <Film className="w-4 h-4 text-violet-500" />
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Project Demo</h2>
            </div>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all hover:scale-[1.02]"
            >
                <ExternalLink className="w-5 h-5 transition-transform group-hover:scale-110" />
                Watch Demo Video
            </a>
        </div>
    );
}

// ── Sub-Components ────────────────────────────────────────────────────────────

function VideoShell({ label, children }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-500/20 flex items-center justify-center">
                    <Film className="w-4 h-4 text-violet-500" />
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{label}</h2>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-lg shadow-slate-200 dark:shadow-slate-900/50">
                {children}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
                Demo walkthrough of this project
            </p>
        </div>
    );
}

function ThumbnailOverlay({ src, alt, onPlay }) {
    const [imgError, setImgError] = useState(false);

    return (
        <button
            onClick={onPlay}
            className="absolute inset-0 w-full h-full group cursor-pointer"
            aria-label="Play demo video"
        >
            {/* Thumbnail Image */}
            {!imgError ? (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setImgError(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
            )}

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 group-hover:from-black/70 transition-all" />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                    <Play className="w-8 h-8 text-white ml-1 fill-white" />
                </div>
            </div>

            {/* Bottom Label */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="text-xs font-semibold text-white/80 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    ▶ Watch Demo
                </span>
            </div>
        </button>
    );
}
