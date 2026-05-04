import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Maximize2, Minimize2, X, Film, ExternalLink, GripVertical, Play } from 'lucide-react';

// ── URL Parsing Helpers ──────────────────────────────────────────────────────

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

export default function VideoCVPlayer({ url, userName }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [isMinimizedCollapsed, setIsMinimizedCollapsed] = useState(false); // pill mode

    // Drag state
    const [position, setPosition] = useState({ x: null, y: null }); // null = use CSS default (bottom-right)
    const dragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const video = useMemo(() => detectVideoType(url), [url]);

    const handleMouseDown = useCallback((e) => {
        if (isExpanded) return; // disable drag when expanded
        dragging.current = true;
        const rect = containerRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        e.preventDefault();
    }, [isExpanded]);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current) return;
            const newX = e.clientX - dragOffset.current.x;
            const newY = e.clientY - dragOffset.current.y;
            setPosition({ x: newX, y: newY });
        };
        const onMouseUp = () => { dragging.current = false; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    if (!url || !video.type || !isVisible) return null;

    const renderVideo = () => {
        if (video.type === 'youtube') {
            return (
                <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=0&rel=0`}
                    title="Video CV"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            );
        }
        if (video.type === 'vimeo') {
            return (
                <iframe
                    src={`https://player.vimeo.com/video/${video.id}?title=0&byline=0&portrait=0`}
                    title="Video CV"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            );
        }
        if (video.type === 'loom') {
            return (
                <iframe
                    src={`https://www.loom.com/embed/${video.id}`}
                    title="Video CV"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
            );
        }
        if (video.type === 'direct') {
            return (
                <video
                    src={url}
                    controls
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                />
            );
        }
        // Fallback: link
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-4 text-center gap-3">
                <Film className="w-8 h-8 text-violet-400" />
                <p className="text-xs text-slate-300 font-medium">Video CV</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    Open
                </a>
            </div>
        );
    };

    // Determine positioning style
    const positionStyle = position.x !== null
        ? { position: 'fixed', left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
        : { position: 'fixed', bottom: '1.5rem', right: '1.5rem' };

    // ── Minimized pill mode ─────────────────────────────────────────────────
    if (isMinimizedCollapsed) {
        return (
            <div
                style={positionStyle}
                className="z-50 cursor-pointer"
            >
                {/* Pulsing dot + pill button */}
                <button
                    onClick={() => setIsMinimizedCollapsed(false)}
                    className="group flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full shadow-2xl border border-white/10 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
                    aria-label="Open Video CV"
                >
                    {/* Live pulse dot */}
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Video CV
                </button>
            </div>
        );
    }

    // ── Expanded / Minimized player ─────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                ...positionStyle,
                zIndex: 50,
                transition: 'width 0.3s ease, height 0.3s ease',
                width: isExpanded ? 'min(92vw, 640px)' : 292,
                height: isExpanded ? 'auto' : 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900"
        >
            {/* ── Top Header Bar ─────────────────────────────────────────────── */}
            <div
                className="flex items-center justify-between px-3 py-2 select-none"
                style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    cursor: isExpanded ? 'default' : 'grab',
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Left: drag handle + label */}
                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <GripVertical className="w-4 h-4 text-white/50 flex-shrink-0" />
                    )}
                    <Film className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
                    <span className="text-white text-xs font-bold tracking-wide truncate max-w-[150px]">
                        {userName ? `${userName}'s Video CV` : 'Video CV'}
                    </span>
                    {/* Live badge */}
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] text-white font-bold uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                    </span>
                </div>

                {/* Right: controls */}
                <div className="flex items-center gap-1 ml-2">
                    {/* Minimize to pill */}
                    <button
                        onClick={() => setIsMinimizedCollapsed(true)}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                        aria-label="Minimize to pill"
                        title="Minimize"
                    >
                        <Minimize2 className="w-3 h-3" />
                    </button>
                    {/* Expand / shrink */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    </button>
                    {/* Close */}
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-colors"
                        aria-label="Close"
                        title="Close"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* ── Video Area ─────────────────────────────────────────────────── */}
            <div
                className="relative bg-black"
                style={{
                    paddingTop: isExpanded ? '56.25%' : '56.25%', // always 16:9
                }}
            >
                {renderVideo()}
            </div>

            {/* ── Bottom Footer ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-t border-white/5">
                <span className="text-[10px] text-slate-400 font-medium">
                    Interview-ready profile
                </span>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Open
                </a>
            </div>
        </div>
    );
}
