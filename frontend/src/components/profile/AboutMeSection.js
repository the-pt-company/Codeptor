import React, { useEffect, useRef, useState } from 'react';
import {
    User, Code2, Layers, Wrench, Sparkles,
    Github, Linkedin, Globe, ExternalLink, Plus,
    MapPin, Calendar, Terminal, BookOpen, Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Keyword maps ─────────────────────────────────────────────────────────────
const LANG_KW   = ['javascript','python','typescript','java','c++','cpp','c#','go','rust','ruby','php','swift','kotlin','scala','r','dart','elixir','haskell','lua','perl','assembly','bash','shell','sql','html','css','solidity'];
const FW_KW     = ['react','vue','angular','next','svelte','node','express','django','fastapi','flask','spring','rails','laravel','nuxt','gatsby','remix','nestjs','strapi','tailwind','bootstrap','vite','redux','prisma','trpc', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'jquery', 'material ui', 'framer motion', 'opencv', 'pandas', 'numpy', 'matplotlib', 'flask', 'django rest framework', 'drf'];
const TOOL_KW   = ['git','docker','aws','azure','gcp','kubernetes','firebase','postgres','mysql','mongo','redis','graphql','jenkins','nginx','linux','terraform','vercel','netlify','figma','postman','jira','github actions','ci/cd', 'docker-compose', 'heroku', 'supabase', 'sqlite', 'redis', 'rabbitmq', 'kafka'];
const FUND_KW   = ['data structures', 'algorithms', 'system design', 'oop', 'object oriented', 'functional programming', 'rest api', 'grpc', 'design patterns', 'networking', 'operating systems', 'dbms', 'sql optimization', 'testing', 'unit testing', 'tdd', 'agile', 'scrum', 'clean code', 'microservices', 'distributed systems', 'cloud native', 'computer science', 'machine learning', 'artificial intelligence', 'ai', 'deep learning', 'nlp'];

const categorize = (skills = []) => {
    const out = { languages: [], frameworks: [], tools: [], fundamentals: [], other: [] };
    
    const match = (skill, keywords) => {
        const s = skill.toLowerCase().trim();
        return keywords.some(k => {
            const kw = k.toLowerCase().trim();
            // Handle special characters like C++, C#
            if (kw.includes('+') || kw.includes('#') || kw.includes('.')) {
                return s.includes(kw);
            }
            // Use word boundaries for standard alphabetic keywords
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            return regex.test(s);
        });
    };

    (skills || []).forEach(s => {
        if      (match(s, LANG_KW))   out.languages.push(s);
        else if (match(s, FW_KW))     out.frameworks.push(s);
        else if (match(s, TOOL_KW))   out.tools.push(s);
        else if (match(s, FUND_KW))   out.fundamentals.push(s);
        else                          out.other.push(s);
    });
    return out;
};

// ─── Category definitions ─────────────────────────────────────────────────────
const CATS = [
    {
        key: 'languages',
        label: 'Languages',
        icon: Terminal,
        pillBase: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20',
        pillHover: 'hover:bg-blue-500/25 hover:ring-blue-500/60 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/20',
        accent: '#3b82f6',
        dotColor: 'bg-blue-500',
        headerHover: 'group-hover:text-blue-500',
        barColor: 'bg-gradient-to-r from-blue-400 to-blue-600',
        glowColor: 'rgba(59,130,246,0.15)',
    },
    {
        key: 'frameworks',
        label: 'Frameworks & Libraries',
        icon: Layers,
        pillBase: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20',
        pillHover: 'hover:bg-violet-500/25 hover:ring-violet-500/60 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-500/20',
        accent: '#8b5cf6',
        dotColor: 'bg-violet-500',
        headerHover: 'group-hover:text-violet-500',
        barColor: 'bg-gradient-to-r from-violet-400 to-violet-600',
        glowColor: 'rgba(139,92,246,0.15)',
    },
    {
        key: 'tools',
        label: 'Tools & Platforms',
        icon: Wrench,
        pillBase: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
        pillHover: 'hover:bg-emerald-500/25 hover:ring-emerald-500/60 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/20',
        accent: '#10b981',
        dotColor: 'bg-emerald-500',
        headerHover: 'group-hover:text-emerald-500',
        barColor: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
        glowColor: 'rgba(16,185,129,0.15)',
    },
    {
        key: 'fundamentals',
        label: 'Core Fundamentals',
        icon: BookOpen,
        pillBase: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20',
        pillHover: 'hover:bg-amber-500/25 hover:ring-amber-500/60 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-500/20',
        accent: '#f59e0b',
        dotColor: 'bg-amber-500',
        headerHover: 'group-hover:text-amber-500',
        barColor: 'bg-gradient-to-r from-amber-400 to-amber-600',
        glowColor: 'rgba(245,158,11,0.15)',
    },
    {
        key: 'other',
        label: 'Others',
        icon: Hash,
        pillBase: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-1 ring-gray-500/20',
        pillHover: 'hover:bg-gray-500/25 hover:ring-gray-500/60 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md hover:shadow-gray-500/20',
        accent: '#6b7280',
        dotColor: 'bg-gray-500',
        headerHover: 'group-hover:text-gray-500',
        barColor: 'bg-gradient-to-r from-gray-400 to-gray-600',
        glowColor: 'rgba(107,114,128,0.15)',
    },
];

const SOCIAL_LINKS = [
    { key: 'github_url',   label: 'GitHub',    icon: Github,   colorClass: 'hover:bg-gray-900/10 hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-100' },
    { key: 'linkedin_url', label: 'LinkedIn',  icon: Linkedin, colorClass: 'hover:bg-blue-500/10 hover:border-blue-500 hover:text-blue-600' },
    { key: 'website_url',  label: 'Portfolio', icon: Globe,    colorClass: 'hover:bg-accent/10 hover:border-accent hover:text-accent' },
];

const SkillPill = ({ skill, cat, delay, visible }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <span
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`
                inline-flex items-center text-xs px-3 py-1.5 rounded-full font-medium
                cursor-default select-none
                transition-all duration-300 ease-out
                ${cat.pillBase} ${cat.pillHover}
                ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90'}
            `}
            style={{
                transitionDelay: visible ? `${delay}ms` : '0ms',
                boxShadow: hovered ? `0 4px 12px ${cat.glowColor}` : undefined,
            }}
        >
            {skill}
        </span>
    );
};

const CategoryRow = ({ cat, items, rowDelay, visible }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={`
                group rounded-xl border border-transparent p-3 -mx-3
                transition-all duration-400 ease-out
                hover:border-border/60 hover:bg-muted/30
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'}
            `}
            style={{
                transitionDelay: visible ? `${rowDelay}ms` : '0ms',
                boxShadow: hovered ? `inset 0 0 20px ${cat.glowColor}` : undefined,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="flex items-center gap-2 mb-3">
                <span
                    className={`
                        w-2 h-2 rounded-full ${cat.dotColor}
                        transition-all duration-300
                        ${hovered ? 'scale-150 shadow-lg' : 'scale-100'}
                    `}
                    style={{ boxShadow: hovered ? `0 0 8px ${cat.accent}` : undefined }}
                />
                <cat.icon
                    className={`w-3.5 h-3.5 transition-all duration-300 ${hovered ? 'scale-110' : ''}`}
                    style={{ color: hovered ? cat.accent : undefined }}
                />
                <span
                    className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors duration-300"
                    style={{ color: hovered ? cat.accent : undefined }}
                >
                    {cat.label}
                </span>
                <span className="text-[10px] text-muted-foreground/40 font-medium">({items.length})</span>

                <div className="flex-1 h-px relative overflow-hidden rounded-full bg-border/40">
                    <div
                        className={`absolute left-0 top-0 h-full ${cat.barColor} transition-all duration-500 ease-out rounded-full`}
                        style={{ width: hovered ? '100%' : '0%' }}
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pl-4">
                {items.map((skill, i) => (
                    <SkillPill
                        key={skill}
                        skill={skill}
                        cat={cat}
                        delay={rowDelay + 60 + i * 30}
                        visible={visible}
                    />
                ))}
            </div>
        </div>
    );
};

export const AboutMeSection = ({ user, isOwnProfile }) => {
    const navigate = useNavigate();
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const [headerHovered, setHeaderHovered] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(timer);
    }, []);

    const cats = categorize(user?.skills);
    const hasSkills = Object.values(cats).some(a => a.length > 0);
    const hasBio = !!user?.bio;
    const hasSocials = SOCIAL_LINKS.some(l => user?.[l.key]);
    const totalSkills = Object.values(cats).flat().length;
    const activeCatCount = Object.values(cats).filter(a => a.length > 0).length;

    return (
        <div
            ref={ref}
            className={`
                relative bg-card border border-border rounded-2xl overflow-hidden mb-6
                transition-all duration-700 ease-out
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
        >
            <div className="relative h-[3px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500" />
                <div
                    className={`absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-400 to-blue-500 transition-opacity duration-700 ${headerHovered ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>

            <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/5 blur-3xl -translate-y-1/2 translate-x-1/4" />

            <div
                className="relative px-6 pt-5 pb-4 border-b border-border/50 flex items-center justify-between"
                onMouseEnter={() => setHeaderHovered(true)}
                onMouseLeave={() => setHeaderHovered(false)}
            >
                <div className="flex items-center gap-3">
                    <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center border
                        transition-all duration-300
                        ${headerHovered
                            ? 'bg-accent text-accent-foreground border-accent scale-110 shadow-lg shadow-accent/30'
                            : 'bg-gradient-to-br from-accent/20 to-primary/10 border-accent/20 text-accent'
                        }
                    `}>
                        <User className="w-5 h-5" />
                    </div>

                    <div>
                        <h2 className="font-heading font-bold text-xl text-foreground leading-tight flex items-center gap-2">
                            About Me
                            {hasSkills && (
                                <span className={`
                                    text-xs font-semibold px-2 py-0.5 rounded-full
                                    transition-all duration-300
                                    ${headerHovered
                                        ? 'bg-accent text-accent-foreground'
                                        : 'bg-accent/10 text-accent'
                                    }
                                `}>
                                    {totalSkills} skills
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {hasSkills
                                ? `${activeCatCount} tech categor${activeCatCount !== 1 ? 'ies' : 'y'}`
                                : isOwnProfile
                                    ? 'Complete your profile'
                                    : 'Developer profile'
                            }
                        </p>
                    </div>
                </div>

                {isOwnProfile && (
                    <button
                        onClick={() => navigate('/settings')}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground font-medium hover:border-accent hover:text-accent hover:bg-accent/5 transition-all duration-200"
                    >
                        <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform duration-300" />
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="relative p-6 space-y-5">
                <div
                    className={`transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: '120ms' }}
                >
                    {hasBio ? (
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            {user.bio}
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            {isOwnProfile
                                ? <>No bio yet. <button onClick={() => navigate('/settings')} className="text-accent hover:underline font-medium">Add one →</button></>
                                : 'No bio provided.'
                            }
                        </p>
                    )}
                </div>

                {(user?.location || user?.created_at) && (
                    <div
                        className={`flex flex-wrap items-center gap-4 text-xs text-muted-foreground transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: '180ms' }}
                    >
                        {user?.location && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {user.location}
                            </span>
                        )}
                        {user?.created_at && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        )}
                    </div>
                )}

                {(hasSocials || isOwnProfile) && (
                    <div
                        className={`flex flex-wrap gap-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: '220ms' }}
                    >
                        {SOCIAL_LINKS.map(({ key, label, icon: Icon, colorClass }) => {
                            const url = user?.[key];
                            return url ? (
                                <a
                                    key={key}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background/50 text-muted-foreground text-xs font-medium transition-all duration-200 ${colorClass}`}
                                >
                                    <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                                    {label}
                                    <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                                </a>
                            ) : isOwnProfile ? (
                                <button
                                    key={key}
                                    onClick={() => navigate('/settings')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border/60 text-muted-foreground/50 text-xs font-medium hover:border-accent hover:text-accent hover:bg-accent/5 transition-all duration-200"
                                >
                                    <Plus className="w-3 h-3" />
                                    {label}
                                </button>
                            ) : null;
                        })}
                    </div>
                )}

                {hasSkills && (
                    <div
                        className={`flex items-center gap-3 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
                        style={{ transitionDelay: '280ms' }}
                    >
                        <div className="flex-1 h-px bg-border/50" />
                        <div className="flex items-center gap-1.5 px-2">
                            <Code2 className="w-3 h-3 text-muted-foreground/60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Tech Stack</span>
                        </div>
                        <div className="flex-1 h-px bg-border/50" />
                    </div>
                )}

                {hasSkills && (
                    <div className="space-y-1">
                        {CATS.map((cat, catIdx) => {
                            const items = cats[cat.key];
                            if (!items.length) return null;
                            return (
                                <CategoryRow
                                    key={cat.key}
                                    cat={cat}
                                    items={items}
                                    rowDelay={320 + catIdx * 100}
                                    visible={visible}
                                />
                            );
                        })}
                    </div>
                )}

                {!hasSkills && isOwnProfile && (
                    <div
                        className={`
                            group text-center py-8 border border-dashed border-border/60 rounded-xl
                            hover:border-accent/40 hover:bg-accent/3 transition-all duration-300
                            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                        `}
                        style={{ transitionDelay: '300ms' }}
                    >
                        <Code2 className="w-9 h-9 mx-auto text-muted-foreground/30 mb-3 group-hover:text-accent/50 transition-colors duration-300" />
                        <p className="text-sm font-medium text-muted-foreground mb-1">No skills listed yet</p>
                        <p className="text-xs text-muted-foreground/60 mb-3">Showcase your tech stack to stand out</p>
                        <button
                            onClick={() => navigate('/settings')}
                            className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold"
                        >
                            <Plus className="w-3 h-3" /> Add your stack →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AboutMeSection;
