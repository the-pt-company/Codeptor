import React, { useEffect, useRef, useState } from 'react';
import {
    User, Code2, Layers, Wrench, Cpu, Sparkles,
    Github, Linkedin, Globe, ExternalLink, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Categorization logic ─────────────────────────────────────────────────────
const LANG_KW   = ['javascript','python','typescript','java','c++','c#','go','rust','ruby','php','swift','kotlin','scala','r','dart','elixir','haskell','lua','perl','assembly','bash','shell','sql','html','css'];
const FW_KW     = ['react','vue','angular','next','svelte','node','express','django','fastapi','flask','spring','rails','laravel','nuxt','gatsby','remix','nestjs','strapi','tailwind','bootstrap','vite','redux','prisma'];
const TOOL_KW   = ['git','docker','aws','azure','gcp','kubernetes','firebase','postgres','mysql','mongo','redis','graphql','jenkins','nginx','linux','terraform','vercel','netlify','figma','postman','jira'];

const categorize = (skills = []) => {
    const out = { languages: [], frameworks: [], tools: [], other: [] };
    (skills || []).forEach(s => {
        const l = s.toLowerCase();
        if      (LANG_KW.some(k => l.includes(k)))  out.languages.push(s);
        else if (FW_KW.some(k => l.includes(k)))    out.frameworks.push(s);
        else if (TOOL_KW.some(k => l.includes(k)))  out.tools.push(s);
        else                                          out.other.push(s);
    });
    return out;
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATS = [
    {
        key: 'languages',
        label: 'Languages',
        icon: Code2,
        pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/25 hover:bg-blue-500/20 hover:ring-blue-500/50',
        accent: '#3b82f6',
        dot: 'bg-blue-500',
    },
    {
        key: 'frameworks',
        label: 'Frameworks & Libraries',
        icon: Layers,
        pill: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/25 hover:bg-violet-500/20 hover:ring-violet-500/50',
        accent: '#8b5cf6',
        dot: 'bg-violet-500',
    },
    {
        key: 'tools',
        label: 'Tools & Platforms',
        icon: Wrench,
        pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20 hover:ring-emerald-500/50',
        accent: '#10b981',
        dot: 'bg-emerald-500',
    },
    {
        key: 'other',
        label: 'Other Skills',
        icon: Cpu,
        pill: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/25 hover:bg-orange-500/20 hover:ring-orange-500/50',
        accent: '#f97316',
        dot: 'bg-orange-500',
    },
];

const SOCIAL_LINKS = [
    { key: 'github_url',   label: 'GitHub',    icon: Github,   hoverClass: 'hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200' },
    { key: 'linkedin_url', label: 'LinkedIn',  icon: Linkedin, hoverClass: 'hover:border-blue-500 hover:text-blue-600'                          },
    { key: 'website_url',  label: 'Portfolio', icon: Globe,    hoverClass: 'hover:border-accent hover:text-accent'                              },
];

// ─── Animated skill pill ──────────────────────────────────────────────────────
const SkillPill = ({ skill, pillClass, delay = 0, visible }) => (
    <span
        className={`
            inline-flex items-center text-xs px-3 py-1.5 rounded-full font-medium cursor-default
            transition-all duration-500 ease-out select-none
            ${pillClass}
            ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'}
        `}
        style={{ transitionDelay: `${delay}ms` }}
    >
        {skill}
    </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const AboutMeSection = ({ user, isOwnProfile }) => {
    const navigate = useNavigate();
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const [hoveredCat, setHoveredCat] = useState(null);

    const cats = categorize(user?.skills);
    const hasSkills = Object.values(cats).some(a => a.length > 0);
    const hasBio = !!user?.bio;
    const hasSocials = SOCIAL_LINKS.some(l => user?.[l.key]);

    // Nothing to show for visitors if no bio, skills, or socials
    if (!hasBio && !hasSkills && !hasSocials && !isOwnProfile) return null;

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.1 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    // Flatten all skills for total count
    const totalSkills = Object.values(cats).flat().length;

    return (
        <div
            ref={ref}
            className={`
                bg-card border border-border rounded-2xl overflow-hidden mb-6
                transition-all duration-700 ease-out
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
            `}
        >
            {/* ── Gradient top strip ── */}
            <div className="h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 via-emerald-400 to-orange-400" />

            {/* ── Header ── */}
            <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center border border-accent/20">
                        <User className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-xl text-foreground leading-tight">About Me</h2>
                        {hasSkills && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {totalSkills} skill{totalSkills !== 1 ? 's' : ''} across {Object.values(cats).filter(a => a.length > 0).length} categories
                            </p>
                        )}
                    </div>
                </div>
                {isOwnProfile && (
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* ── Bio ── */}
                {(hasBio || isOwnProfile) && (
                    <div
                        className={`transition-all duration-600 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: '100ms' }}
                    >
                        {hasBio ? (
                            <p className="text-sm text-foreground/80 leading-relaxed">{user.bio}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                No bio added yet.{' '}
                                <button onClick={() => navigate('/settings')} className="text-accent hover:underline">Add one →</button>
                            </p>
                        )}
                    </div>
                )}

                {/* ── Socials row ── */}
                {(hasSocials || isOwnProfile) && (
                    <div
                        className={`flex flex-wrap gap-2 transition-all duration-600 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: '180ms' }}
                    >
                        {SOCIAL_LINKS.map(({ key, label, icon: Icon, hoverClass }) => {
                            const url = user?.[key];
                            return url ? (
                                <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground text-xs font-medium transition-all ${hoverClass}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                    <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                                </a>
                            ) : isOwnProfile ? (
                                <button
                                    key={key}
                                    onClick={() => navigate('/settings')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-medium hover:border-accent hover:text-accent transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Add {label}
                                </button>
                            ) : null;
                        })}
                    </div>
                )}

                {/* ── Tech Stack ── */}
                {hasSkills && (
                    <div className="space-y-5">
                        <div
                            className={`flex items-center gap-2 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
                            style={{ transitionDelay: '250ms' }}
                        >
                            <div className="flex-1 h-px bg-border/60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">Tech Stack</span>
                            <div className="flex-1 h-px bg-border/60" />
                        </div>

                        {CATS.map((cat, catIdx) => {
                            const items = cats[cat.key];
                            if (!items.length) return null;
                            const isHovered = hoveredCat === cat.key;

                            return (
                                <div
                                    key={cat.key}
                                    className={`transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                                    style={{ transitionDelay: `${300 + catIdx * 80}ms` }}
                                    onMouseEnter={() => setHoveredCat(cat.key)}
                                    onMouseLeave={() => setHoveredCat(null)}
                                >
                                    {/* Category label */}
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full ${cat.dot} transition-all duration-300 ${isHovered ? 'scale-150' : ''}`}
                                        />
                                        <cat.icon
                                            className="w-3.5 h-3.5 transition-colors duration-300"
                                            style={{ color: isHovered ? cat.accent : undefined }}
                                        />
                                        <span
                                            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300"
                                            style={{ color: isHovered ? cat.accent : undefined }}
                                        >
                                            {cat.label}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/50">({items.length})</span>
                                    </div>

                                    {/* Pills */}
                                    <div className="flex flex-wrap gap-1.5 pl-4">
                                        {items.map((skill, i) => (
                                            <SkillPill
                                                key={skill}
                                                skill={skill}
                                                pillClass={cat.pill}
                                                delay={320 + catIdx * 80 + i * 35}
                                                visible={visible}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty state for own profile */}
                {!hasSkills && isOwnProfile && (
                    <div
                        className={`text-center py-6 border border-dashed border-border rounded-xl transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <Code2 className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">No skills added yet</p>
                        <button
                            onClick={() => navigate('/settings')}
                            className="text-xs text-accent hover:underline font-medium"
                        >
                            Add your tech stack →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AboutMeSection;
