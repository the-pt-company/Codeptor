import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import {
    X, Download, Copy, Check, Twitter, Linkedin,
    Star, BookOpen, Eye, Code2, MessageSquare, Share2, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { resolveMediaUrl } from '../../lib/api';

// ─── Card Variant Definitions ──────────────────────────────────────────────────
const CARD_VARIANTS = [
    { id: 'spectrum', label: 'Spectrum', types: ['profile'] },
    { id: 'glass', label: 'Glass', types: ['profile'] },
    { id: 'neon', label: 'Neon', types: ['profile'] },
    { id: 'minimal', label: 'Minimal', types: ['profile', 'project'] },
    { id: 'sleek', label: 'Sleek', types: ['project'] },
    { id: 'glitch', label: 'Glitch', types: ['project'] },
];

// ─── Individual Card Styles ────────────────────────────────────────────────────
const SpectrumCard = ({ user, stats }) => (
    <div
        style={{
            width: 480, height: 280,
            background: 'linear-gradient(135deg, #FF0080 0%, #7928CA 50%, #FF8A00 100%)',
            borderRadius: 24, padding: 36, fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}
    >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, mixBlendMode: 'overlay', backgroundImage: 'radial-gradient(circle at 20% 20%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: 28, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, color: 'white', shadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                {user?.full_name?.[0] || user?.username?.[0] || 'D'}
            </div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1, textShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{user?.full_name || user?.username}</div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontWeight: 600 }}>@{user?.username}</div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
            {[
                { label: 'PROJECTS', value: stats?.projects || 0 },
                { label: 'BLOGS', value: stats?.blogPosts || 0 },
                { label: 'NETWORK', value: stats?.followers || 0 },
            ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(0,0,0,0.15)', borderRadius: 16, padding: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: 800, letterSpacing: 0.5 }}>{s.label}</div>
                </div>
            ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.2)' }}>
                Expert Developer
            </div>
            <div style={{ fontSize: 14, color: 'white', fontWeight: 900, letterSpacing: -0.5, opacity: 0.8 }}>Codeptor</div>
        </div>
    </div>
);

const GlassCard = ({ user, stats }) => (
    <div
        style={{
            width: 480, height: 280,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.85) 50%, rgba(59,130,246,0.9) 100%)',
            borderRadius: 24, padding: 36, fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}
    >
        {/* Glass orbs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -30, width: 220, height: 220, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}>
                {user?.full_name?.[0] || user?.username?.[0] || 'D'}
            </div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{user?.full_name || user?.username}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>@{user?.username}</div>
                {user?.bio && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4, maxWidth: 280 }}>{user.bio?.slice(0, 60)}{user.bio?.length > 60 ? '...' : ''}</div>}
            </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
            {[
                { label: 'Projects', value: stats?.projects || 0, icon: '📦' },
                { label: 'Blogs', value: stats?.blogPosts || 0, icon: '✍️' },
                { label: 'Followers', value: stats?.followers || 0, icon: '👥' },
            ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>{s.icon} {s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.label}</div>
                </div>
            ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 6 }}>
                {user?.skills?.slice(0, 3).map(s => (
                    <span key={s} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{s}</span>
                ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Codeptor</div>
        </div>
    </div>
);

const NeonCard = ({ user, stats }) => (
    <div
        style={{
            width: 480, height: 280,
            background: '#0a0a0f',
            borderRadius: 24, padding: 36, fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            border: '1px solid rgba(99,102,241,0.4)',
            boxShadow: '0 0 40px rgba(99,102,241,0.15), inset 0 0 60px rgba(99,102,241,0.03)',
        }}
    >
        {/* Neon glow spots */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(20px)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 200, height: 200, background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />

        {/* Grid lines */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* Top */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: 'white', boxShadow: '0 0 20px rgba(99,102,241,0.6)' }}>
                {user?.full_name?.[0] || user?.username?.[0] || 'D'}
            </div>
            <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1.2, textShadow: '0 0 20px rgba(99,102,241,0.8)' }}>{user?.full_name || user?.username}</div>
                <div style={{ fontSize: 13, color: '#6366f1', marginTop: 2, fontWeight: 600 }}>@{user?.username}</div>
                {user?.bio && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{user.bio?.slice(0, 65)}{user.bio?.length > 65 ? '...' : ''}</div>}
            </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
            {[
                { label: 'Projects', value: stats?.projects || 0 },
                { label: 'Blogs', value: stats?.blogPosts || 0 },
                { label: 'Followers', value: stats?.followers || 0 },
            ].map(s => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#818cf8', textShadow: '0 0 12px rgba(99,102,241,0.7)' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
                </div>
            ))}
        </div>

        {/* Skills + branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div style={{ display: 'flex', gap: 6 }}>
                {user?.skills?.slice(0, 3).map(s => (
                    <span key={s} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{s}</span>
                ))}
            </div>
            <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 800, textShadow: '0 0 10px rgba(99,102,241,0.5)' }}>Codeptor ⚡</div>
        </div>
    </div>
);

const SleekProjectCard = ({ project }) => (
    <div
        style={{
            width: 480, height: 280,
            background: '#0a0a0f',
            borderRadius: 24, padding: 36, fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            border: '1px solid #1e1e2d',
        }}
    >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'linear-gradient(45deg, transparent 60%, rgba(99,102,241,0.05) 100%)' }} />
        
        <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
            <div style={{ width: 140, height: 80, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#16161e', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                {project?.thumbnail_url ? (
                    <img src={resolveMediaUrl(project.thumbnail_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: 32 }}>⚡</div>
                )}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: -0.5, lineHeight: 1.1 }}>{project?.title}</div>
                <div style={{ display: 'inline-block', fontSize: 10, background: '#6366f1', color: 'white', padding: '2px 8px', borderRadius: 4, marginTop: 8, fontWeight: 900, textTransform: 'uppercase' }}>{project?.category}</div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', position: 'relative' }}>
            {project?.tech_stack?.slice(0, 4).map(tech => (
                <span key={tech} style={{ background: '#16161e', color: '#94a3b8', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, border: '1px solid #1e1e2d shadow-sm' }}>{tech}</span>
            ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid #1e1e2d', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>{project?.user_username}</div>
            </div>
            <div style={{ fontSize: 14, color: '#6366f1', fontWeight: 900, letterSpacing: -0.5 }}>Codeptor</div>
        </div>
    </div>
);

const GlitchProjectCard = ({ project }) => (
    <div
        style={{
            width: 480, height: 280,
            background: '#ffffff',
            borderRadius: 24, padding: 36, fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            border: '2px solid #000',
        }}
    >
        <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, background: '#0ff', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 24, height: 24, background: '#f0f', zIndex: 0 }} />
        
        <div style={{ position: 'relative' }}>
            <div style={{ background: '#000', color: '#fff', display: 'inline-block', padding: '4px 12px', fontSize: 12, fontWeight: 900, marginBottom: 12, transform: 'skewX(-10deg)' }}>
                FEATURED PROJECT
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 1000, color: '#000', lineHeight: 1, letterSpacing: -1, textTransform: 'uppercase' }}>
                {project?.title}
            </h2>
        </div>

        <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            {project?.tech_stack?.slice(0, 5).map(tech => (
                <div key={tech} style={{ border: '2px solid #000', padding: '4px 10px', fontSize: 12, fontWeight: 900, background: '#fff' }}>
                    {tech}
                </div>
            ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
            <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#666', textTransform: 'uppercase' }}>Built by</div>
                <div style={{ fontSize: 18, fontWeight: 1000, color: '#000' }}>@{project?.user_username}</div>
            </div>
            <div style={{ fontSize: 18, color: '#000', fontWeight: 1000, letterSpacing: -1 }}>CODEPTOR.</div>
        </div>
    </div>
);

const MinimalCard = ({ user, stats, project, type }) => (
    <div
        style={{
            width: 480, height: 280,
            background: '#ffffff',
            borderRadius: 24, padding: 36, fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            border: '1px solid #e2e8f0',
        }}
    >
        {/* Accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' }} />

        {/* Header Section */}
        {type === 'profile' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: '#6366f1' }}>
                    {user?.full_name?.[0] || user?.username?.[0] || 'D'}
                </div>
                <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{user?.full_name || user?.username}</div>
                    <div style={{ fontSize: 13, color: '#6366f1', marginTop: 2, fontWeight: 600 }}>@{user?.username}</div>
                </div>
            </div>
        ) : (
            <div style={{ position: 'relative' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{project?.category}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{project?.title}</div>
            </div>
        )}

        {/* Content Section */}
        {type === 'profile' ? (
            <div style={{ display: 'flex', gap: 0, border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                {[
                    { label: 'Projects', value: stats?.projects || 0 },
                    { label: 'Blogs', value: stats?.blogPosts || 0 },
                    { label: 'Followers', value: stats?.followers || 0 },
                ].map((s, i) => (
                    <div key={s.label} style={{ flex: 1, padding: '12px 14px', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none', background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>
        ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {project?.tech_stack?.slice(0, 6).map(tech => (
                    <span key={tech} style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>#{tech}</span>
                ))}
            </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {type === 'profile' ? (
                <div style={{ display: 'flex', gap: 6 }}>
                    {user?.skills?.slice(0, 3).map(s => (
                        <span key={s} style={{ background: '#f1f5f9', color: '#475569', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{s}</span>
                    ))}
                </div>
            ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>by @{project?.user_username}</div>
            )}
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>Codeptor</div>
        </div>
    </div>
);

const IndustrialProjectCard = ({ project }) => (
    <div
        style={{
            width: 480, height: 280,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            borderRadius: 24, padding: 36, fontFamily: 'system-ui, sans-serif',
            position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            border: '1px solid rgba(255,255,255,0.1)',
        }}
    >
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        
        {/* Top Info */}
        <div style={{ display: 'flex', gap: 20, position: 'relative' }}>
            <div style={{ width: 120, height: 70, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', background: '#1e293b' }}>
                {project?.thumbnail_url ? (
                    <img src={resolveMediaUrl(project.thumbnail_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>📦</div>
                )}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{project?.title}</div>
                <div style={{ fontSize: 11, color: '#818cf8', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{project?.category}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.4 }}>{project?.description?.slice(0, 80)}...</div>
            </div>
        </div>

        {/* Tech Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
            {project?.tech_stack?.slice(0, 5).map(tech => (
                <span key={tech} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>{tech}</span>
            ))}
        </div>

        {/* Author Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(45deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 900 }}>
                    {project?.user_username?.[0]?.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>@{project?.user_username}</div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>Codeptor</div>
        </div>
    </div>
);

// ─── Card Renderer Map ─────────────────────────────────────────────────────────
const CARD_MAP = { 
    spectrum: SpectrumCard,
    glass: GlassCard, 
    neon: NeonCard, 
    minimal: MinimalCard, 
    sleek: SleekProjectCard,
    glitch: GlitchProjectCard,
    industrial: IndustrialProjectCard 
};

// ─── Main Modal ────────────────────────────────────────────────────────────────
const OVERLAY = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const MODAL = {
    hidden: { opacity: 0, scale: 0.9, y: 24 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 250 } },
    exit: { opacity: 0, scale: 0.93, y: 12, transition: { duration: 0.18 } }
};


export default function ShareCardModal({ isOpen, onClose, user, stats, project, type = 'profile' }) {
    const [variant, setVariant] = useState(type === 'project' ? 'sleek' : 'spectrum');
    const [exporting, setExporting] = useState(false);
    const [copied, setCopied] = useState(false);
    const cardRef = useRef(null);
    const CardComponent = CARD_MAP[variant];
    
    const profileUrl = type === 'profile' 
        ? `${window.location.origin}/profile/${user?.username}`
        : `${window.location.origin}/project/${project?.project_id}`;

    const downloadCard = useCallback(async () => {
        if (!cardRef.current) return;
        setExporting(true);
        try {
            const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement('a');
            const name = type === 'profile' ? user?.username : project?.title?.toLowerCase().replace(/\s+/g, '-');
            link.download = `codeptor-${name}-card.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Card downloaded successfully!');
        } catch (err) {
            toast.error('Failed to export card');
        } finally {
            setExporting(false);
        }
    }, [type, user?.username, project?.title]);

    const copyLink = useCallback(async () => {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        toast.success(type === 'profile' ? 'Profile link copied!' : 'Project link copied!');
        setTimeout(() => setCopied(false), 2500);
    }, [profileUrl, type]);

    const shareOnTwitter = () => {
        const text = type === 'profile' 
            ? `Check out ${user?.full_name || user?.username}'s developer profile on Codeptor!`
            : `Check out this project "${project?.title}" on Codeptor!`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`, '_blank');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[998] flex items-center justify-center p-4"
                    variants={OVERLAY}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

                    <motion.div
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
                        variants={MODAL}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400" />

                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-200">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Share {type === 'profile' ? 'Profile' : 'Project'} Card</h3>
                                        <p className="text-xs text-gray-500">Download or share your designer card</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                    <X className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {/* Style Switcher */}
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                                {CARD_VARIANTS.filter(v => v.types.includes(type)).map(v => (
                                    <motion.button
                                        key={v.id}
                                        onClick={() => setVariant(v.id)}
                                        className={`flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold border-2 transition-all shadow-sm ${variant === v.id
                                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:text-gray-700'}`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span>{v.emoji}</span>
                                        {v.label}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Card Preview */}
                            <motion.div
                                key={variant}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className="flex justify-center mb-5 overflow-hidden rounded-2xl"
                            >
                                <div
                                    ref={cardRef}
                                    style={{ transform: 'scale(0.7)', transformOrigin: 'top center', marginBottom: -85 }}
                                >
                                    <CardComponent user={user} stats={stats} project={project} type={type} />
                                </div>
                            </motion.div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <motion.button
                                    onClick={downloadCard}
                                    disabled={exporting}
                                    className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-violet-200 disabled:opacity-70"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Download className="w-4 h-4" />
                                    {exporting ? 'Exporting…' : 'Download PNG'}
                                </motion.button>

                                <motion.button
                                    onClick={copyLink}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${copied ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'}`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </motion.button>
                            </div>

                            <motion.button
                                onClick={shareOnTwitter}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#000] text-white font-bold text-sm hover:bg-gray-900 transition-all"
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Twitter className="w-4 h-4" />
                                Share on X / Twitter
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
