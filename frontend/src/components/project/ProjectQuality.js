import React, { useState } from 'react';
import { Award, X, Info, Code2, FileText, Link2, Image, Zap, TrendingUp, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shared quality scoring logic — used on both Profile cards and ProjectDetail.
 */
export function calculateProjectQuality(project) {
    let score = 40;
    const breakdown = [];

    // Tech stack diversity (Max 20)
    const techScore = Math.min((project.tech_stack?.length || 0) * 4, 20);
    score += techScore;
    breakdown.push({
        key: 'tech',
        icon: Code2,
        label: 'Tech Complexity',
        value: techScore,
        max: 20,
        desc: `${project.tech_stack?.length || 0} technologies used`,
        detail: 'Based on the number of distinct technologies in your stack',
    });

    // Documentation depth (Max 15)
    const descScore = Math.min(Math.floor((project.description?.length || 0) / 100), 15);
    score += descScore;
    breakdown.push({
        key: 'docs',
        icon: FileText,
        label: 'Documentation',
        value: descScore,
        max: 15,
        desc: `${project.description?.length || 0} chars of description`,
        detail: 'Depth and clarity of project documentation',
    });

    // Availability — GitHub + Live URL (Max 15)
    let availScore = 0;
    if (project.github_url) availScore += 8;
    if (project.live_url) availScore += 7;
    score += availScore;
    breakdown.push({
        key: 'avail',
        icon: Globe,
        label: 'Availability',
        value: availScore,
        max: 15,
        desc: [project.github_url ? 'Open source' : null, project.live_url ? 'Live demo' : null].filter(Boolean).join(' · ') || 'No public links',
        detail: 'Whether source code and/or a live demo are accessible',
    });

    // Media & presentation (Max 10)
    const hasMedia = (project.media_urls?.length || 0) > 0 || !!project.thumbnail_url;
    const mediaScore = hasMedia ? 10 : 0;
    score += mediaScore;
    breakdown.push({
        key: 'media',
        icon: Image,
        label: 'Presentation',
        value: mediaScore,
        max: 10,
        desc: hasMedia ? `${(project.media_urls?.length || 0) + (project.thumbnail_url ? 1 : 0)} media assets` : 'No media',
        detail: 'Screenshots, thumbnails, and demo visuals',
    });

    const total = Math.min(score, 100);

    // Grade
    let grade, gradeBg, gradeText, label;
    if (total >= 90) { grade = 'A+'; gradeBg = 'bg-emerald-500'; gradeText = 'text-white'; label = 'Exceptional'; }
    else if (total >= 80) { grade = 'A';  gradeBg = 'bg-emerald-400'; gradeText = 'text-white'; label = 'Excellent'; }
    else if (total >= 70) { grade = 'B+'; gradeBg = 'bg-blue-500';    gradeText = 'text-white'; label = 'Very Good'; }
    else if (total >= 60) { grade = 'B';  gradeBg = 'bg-blue-400';    gradeText = 'text-white'; label = 'Good'; }
    else if (total >= 50) { grade = 'C';  gradeBg = 'bg-amber-400';   gradeText = 'text-white'; label = 'Fair'; }
    else                  { grade = 'D';  gradeBg = 'bg-slate-400';   gradeText = 'text-white'; label = 'Needs Work'; }

    return { total, breakdown, grade, gradeBg, gradeText, label };
}

/**
 * ScoreBar — animated progress bar for each metric
 */
function ScoreBar({ item, scoreColor, delay = 0 }) {
    const pct = item.max ? (item.value / item.max) * 100 : 0;
    const Icon = item.icon;
    return (
        <div className="group relative">
            <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    {item.label}
                </span>
                <span className="text-slate-500 font-medium">{item.value}/{item.max}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, delay, ease: 'easeOut' }}
                    className={`h-full rounded-full ${scoreColor}`}
                />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
            {/* Hover tooltip */}
            <div className="absolute left-0 bottom-full mb-2 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 w-52 leading-relaxed pointer-events-none">
                {item.detail}
            </div>
        </div>
    );
}

/**
 * ProjectQualityModal — full explanatory modal
 */
function ProjectQualityModal({ project, quality, onClose }) {
    const scoreColorClass = quality.total >= 80 ? 'bg-emerald-500'
        : quality.total >= 60 ? 'bg-blue-500'
        : quality.total >= 50 ? 'bg-amber-400'
        : 'bg-slate-400';

    return (
        <div
            className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-slate-100">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${quality.gradeBg} flex items-center justify-center shadow-lg`}>
                            <Award className={`w-6 h-6 ${quality.gradeText}`} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg leading-tight">Quality Score</h3>
                            <p className="text-slate-500 text-sm">How this project is evaluated</p>
                        </div>
                    </div>

                    {/* Big score */}
                    <div className="flex items-end gap-2 mt-5">
                        <span className="text-6xl font-black text-slate-900 leading-none">{quality.total}</span>
                        <div className="mb-1.5">
                            <span className="text-xl text-slate-400 font-medium">/100</span>
                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${quality.gradeBg} ${quality.gradeText} mt-1 inline-block`}>
                                {quality.label}
                            </div>
                        </div>
                    </div>

                    {/* Overall progress */}
                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${quality.total}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${scoreColorClass}`}
                        />
                    </div>
                </div>

                {/* Breakdown */}
                <div className="p-6 space-y-5">
                    {quality.breakdown.map((item, i) => (
                        <ScoreBar key={item.key} item={item} scoreColor={scoreColorClass} delay={0.1 + i * 0.1} />
                    ))}
                </div>

                {/* Footer explanation */}
                <div className="px-6 pb-6">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            The Quality Score is calculated automatically based on <strong>tech stack complexity</strong>, <strong>documentation depth</strong>, <strong>public availability</strong> (GitHub + demo), and <strong>visual presentation</strong>. A base score of 40 is given to every project.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

/**
 * ProjectQualityBadge — compact badge shown on project cards.
 * Click opens the full modal.
 */
export function ProjectQualityBadge({ project, className = '' }) {
    const [open, setOpen] = useState(false);
    const quality = calculateProjectQuality(project);

    const badgeClass = quality.total >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
        : quality.total >= 60 ? 'text-blue-600 bg-blue-50 border-blue-200'
        : quality.total >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-slate-500 bg-slate-50 border-slate-200';

    return (
        <>
            <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
                className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border transition-all hover:scale-105 ${badgeClass} ${className}`}
                title={`Quality Score: ${quality.total}/100 — Click to see breakdown`}
            >
                <Award className="w-3 h-3" />
                {quality.total}
            </button>
            <AnimatePresence>
                {open && (
                    <ProjectQualityModal
                        project={project}
                        quality={quality}
                        onClose={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

/**
 * ProjectQualityScore — full sidebar card for ProjectDetail page.
 */
export function ProjectQualityScore({ project }) {
    const [modalOpen, setModalOpen] = useState(false);
    const quality = calculateProjectQuality(project);

    const scoreColorClass = quality.total >= 80 ? 'bg-emerald-500 text-emerald-500'
        : quality.total >= 60 ? 'bg-blue-500 text-blue-500'
        : quality.total >= 50 ? 'bg-amber-400 text-amber-400'
        : 'bg-slate-400 text-slate-500';
    const [bgColor, textColor] = scoreColorClass.split(' ');

    const cardBg = quality.total >= 80 ? 'bg-emerald-50 border-emerald-100'
        : quality.total >= 60 ? 'bg-blue-50 border-blue-100'
        : quality.total >= 50 ? 'bg-amber-50 border-amber-100'
        : 'bg-slate-50 border-slate-100';

    return (
        <>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className={`rounded-2xl border p-6 shadow-sm ${cardBg}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Award className={`w-5 h-5 ${textColor}`} />
                        <h3 className="font-bold text-gray-900">Quality Score</h3>
                    </div>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="p-1 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-600 transition-colors"
                        title="View full breakdown"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </div>

                {/* Score display */}
                <div className="flex items-end gap-2 mb-2">
                    <span className={`text-5xl font-black tracking-tight ${textColor}`}>{quality.total}</span>
                    <div className="mb-1">
                        <span className="text-slate-500 font-medium">/100</span>
                        <div className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${quality.gradeBg} ${quality.gradeText} mt-1 inline-block ml-1`}>
                            {quality.label}
                        </div>
                    </div>
                </div>

                {/* Overall bar */}
                <div className="h-2 bg-white/50 rounded-full overflow-hidden mb-5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${quality.total}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${bgColor}`}
                    />
                </div>

                {/* Per-category bars */}
                <div className="space-y-4">
                    {quality.breakdown.map((item, i) => (
                        <ScoreBar key={item.key} item={item} scoreColor={bgColor} delay={0.5 + i * 0.1} />
                    ))}
                </div>

                <button
                    onClick={() => setModalOpen(true)}
                    className="mt-5 w-full text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-white/40 transition-colors"
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    How is this score calculated?
                </button>
            </motion.div>

            <AnimatePresence>
                {modalOpen && (
                    <ProjectQualityModal
                        project={project}
                        quality={quality}
                        onClose={() => setModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

export default ProjectQualityScore;
