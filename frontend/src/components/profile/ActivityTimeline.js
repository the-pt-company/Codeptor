import React, { useEffect, useRef, useState } from 'react';
import {
    Rocket, Edit3, Star, UserPlus, Award, GitBranch,
    Activity, BookOpen, Zap, TrendingUp
} from 'lucide-react';

// ─── Event type config ────────────────────────────────────────────────────────
const EVENT_TYPES = {
    published: {
        icon: Rocket,
        label: 'Published project',
        gradient: 'from-green-500 to-emerald-600',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        text: 'text-green-600 dark:text-green-400',
        glow: 'shadow-green-500/30',
        ring: 'ring-green-500/30',
        dot: 'bg-green-500',
    },
    updated: {
        icon: Edit3,
        label: 'Published blog',
        gradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        glow: 'shadow-blue-500/30',
        ring: 'ring-blue-500/30',
        dot: 'bg-blue-500',
    },
    starred: {
        icon: Star,
        label: 'Received a star',
        gradient: 'from-amber-500 to-yellow-600',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        glow: 'shadow-amber-500/30',
        ring: 'ring-amber-500/30',
        dot: 'bg-amber-500',
    },
    follower: {
        icon: UserPlus,
        label: 'New follower',
        gradient: 'from-purple-500 to-violet-600',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        glow: 'shadow-purple-500/30',
        ring: 'ring-purple-500/30',
        dot: 'bg-purple-500',
    },
    badge: {
        icon: Award,
        label: 'Earned badge',
        gradient: 'from-orange-500 to-red-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        text: 'text-orange-600 dark:text-orange-400',
        glow: 'shadow-orange-500/30',
        ring: 'ring-orange-500/30',
        dot: 'bg-orange-500',
    },
    blog: {
        icon: BookOpen,
        label: 'Blog published',
        gradient: 'from-teal-500 to-cyan-600',
        bg: 'bg-teal-500/10',
        border: 'border-teal-500/20',
        text: 'text-teal-600 dark:text-teal-400',
        glow: 'shadow-teal-500/30',
        ring: 'ring-teal-500/30',
        dot: 'bg-teal-500',
    },
};

const DEFAULT_TYPE = {
    icon: GitBranch,
    label: 'Activity',
    gradient: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    glow: 'shadow-slate-500/30',
    ring: 'ring-slate-500/30',
    dot: 'bg-slate-500',
};

// ─── Single activity item ─────────────────────────────────────────────────────
const ActivityItem = ({ activity, index, visible, isLast }) => {
    const [hovered, setHovered] = useState(false);
    const cfg = EVENT_TYPES[activity.type] || DEFAULT_TYPE;
    const Icon = cfg.icon;

    return (
        <div
            className={`
                relative flex gap-4 group
                transition-all duration-700 ease-out
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
            `}
            style={{ transitionDelay: `${index * 90}ms` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Timeline line */}
            {!isLast && (
                <div
                    className={`absolute left-5 top-10 w-0.5 bottom-0 transition-all duration-500 ${hovered ? 'bg-border' : 'bg-border/40'}`}
                    style={{ height: 'calc(100% - 16px)' }}
                />
            )}

            {/* Icon bubble */}
            <div className="flex-shrink-0 relative z-10">
                <div
                    className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        bg-gradient-to-br ${cfg.gradient}
                        shadow-md ${hovered ? `shadow-lg ${cfg.glow}` : ''}
                        ring-2 ${cfg.ring} ring-offset-2 ring-offset-background
                        transition-all duration-300
                        ${hovered ? 'scale-110 -rotate-3' : 'scale-100 rotate-0'}
                    `}
                >
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>

            {/* Content card */}
            <div
                className={`
                    flex-1 min-w-0 mb-4 p-3 rounded-xl border
                    transition-all duration-300 ease-out
                    ${cfg.bg} ${cfg.border}
                    ${hovered ? 'border-opacity-60 shadow-sm -translate-y-0.5' : ''}
                `}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${cfg.text}`}>
                            {cfg.label}
                        </p>
                        <p className="text-sm font-semibold text-foreground leading-snug truncate">
                            {activity.title}
                            {activity.project && (
                                <span className="text-accent font-bold"> — {activity.project}</span>
                            )}
                        </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 mt-0.5 font-medium">
                        {activity.time}
                    </span>
                </div>

                {/* Animated progress bar on hover */}
                <div
                    className={`mt-2 h-0.5 rounded-full bg-gradient-to-r ${cfg.gradient} transition-all duration-500 ease-out ${hovered ? 'opacity-60' : 'opacity-0'}`}
                    style={{ width: hovered ? '100%' : '0%' }}
                />
            </div>
        </div>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyActivity = ({ isOwnProfile, visible }) => (
    <div
        className={`
            flex flex-col items-center justify-center py-14 transition-all duration-700
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        `}
    >
        <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/15 flex items-center justify-center">
                <Zap className="w-7 h-7 text-accent/60" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                <TrendingUp className="w-2.5 h-2.5 text-accent" />
            </div>
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No Activity Yet</p>
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            {isOwnProfile
                ? 'Start publishing projects and blogs to see your activity stream here.'
                : 'This developer hasn\'t published anything yet.'}
        </p>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const ActivityTimeline = ({ activities = [], isOwnProfile }) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
            { threshold: 0.08 }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const displayed = showAll ? activities : activities.slice(0, 5);
    const hasMore = activities.length > 5;

    return (
        <div
            ref={ref}
            className={`
                bg-card border border-border rounded-2xl overflow-hidden
                transition-all duration-700 ease-out
                ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
            `}
        >
            {/* Gradient strip */}
            <div className="h-[3px] bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/15 to-primary/5 flex items-center justify-center border border-accent/20">
                        <Activity className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h2 className="font-heading font-bold text-xl text-foreground leading-tight">Recent Activity</h2>
                        {activities.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {activities.length} event{activities.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Live</span>
                </div>
            </div>

            {/* Timeline body */}
            <div className="px-5 pt-5 pb-4">
                {activities.length === 0 ? (
                    <EmptyActivity isOwnProfile={isOwnProfile} visible={visible} />
                ) : (
                    <>
                        <div>
                            {displayed.map((act, i) => (
                                <ActivityItem
                                    key={`${act.type}-${i}`}
                                    activity={act}
                                    index={i}
                                    visible={visible}
                                    isLast={i === displayed.length - 1}
                                />
                            ))}
                        </div>

                        {hasMore && (
                            <button
                                onClick={() => setShowAll(v => !v)}
                                className={`
                                    w-full mt-2 py-2.5 rounded-xl text-xs font-semibold
                                    border border-border/60 text-muted-foreground
                                    hover:border-accent/40 hover:text-accent hover:bg-accent/5
                                    transition-all duration-200
                                    ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                                `}
                                style={{ transitionDelay: `${Math.min(displayed.length, 5) * 90 + 100}ms` }}
                            >
                                {showAll ? '↑ Show less' : `↓ Show ${activities.length - 5} more events`}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ActivityTimeline;
