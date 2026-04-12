import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { projectAPI, resolveMediaUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTilt } from '../hooks/useTilt';
import ShareModal from '../components/share/ShareModal';
import ShareCardModal from '../components/share/ShareCardModal';
import {
    Github, ExternalLink, Calendar, ArrowLeft, Code2,
    Share2, MessageSquare, Star, Bookmark, ChevronLeft,
    ChevronRight, X, ExternalLinkIcon, Eye, Clock,
    Layers, Heart, Globe
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Color palette for tech badges ───────────────────────────────────────────
const TECH_COLORS = {
    react: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
    vue: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
    angular: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    'next.js': { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
    'node.js': { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    python: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    typescript: { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
    javascript: { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' },
    rust: { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
    go: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
    java: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    mongodb: { bg: '#dcfce7', text: '#14532d', border: '#86efac' },
    postgresql: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    fastapi: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
    django: { bg: '#dcfce7', text: '#14532d', border: '#86efac' },
    tailwindcss: { bg: '#e0f2fe', text: '#0c4a6e', border: '#7dd3fc' },
    default: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

const getTechColor = (tech) => {
    const key = tech.toLowerCase().replace(/\s+/g, '');
    return TECH_COLORS[key] || TECH_COLORS['default'];
};

// ─── Skeleton Component ───────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] rounded-xl ${className}`}
        style={{ animation: 'shimmer 1.5s infinite', backgroundImage: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)' }}
    />
);

const ProjectSkeleton = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="w-24 h-5 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="w-32 h-5" />
                <Skeleton className="w-2/3 h-14" />
                <Skeleton className="w-full h-6" />
                <Skeleton className="w-full aspect-video rounded-2xl" />
                <div className="space-y-3">
                    <Skeleton className="w-full h-4" /><Skeleton className="w-5/6 h-4" /><Skeleton className="w-4/5 h-4" />
                </div>
            </div>
            <div className="space-y-6">
                <Skeleton className="w-full h-40 rounded-2xl" />
                <Skeleton className="w-full h-36 rounded-2xl" />
                <Skeleton className="w-full h-28 rounded-2xl" />
            </div>
        </div>
    </div>
);

// ─── Lightbox Modal ───────────────────────────────────────────────────────────
const Lightbox = ({ images, initialIndex, onClose }) => {
    const [current, setCurrent] = useState(initialIndex);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length);
            if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [images.length, onClose]);

    return (
        <div
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
            style={{ animation: 'fadeIn 0.2s ease' }}
        >
            <div className="relative max-w-6xl w-full" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img
                        src={resolveMediaUrl(images[current])}
                        alt={`Screenshot ${current + 1}`}
                        className="w-full max-h-[80vh] object-contain bg-black"
                        style={{ animation: 'fadeIn 0.2s ease' }}
                    />
                </div>

                {images.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => setCurrent(c => (c + 1) % images.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        <div className="flex justify-center gap-2 mt-4">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                <p className="text-center text-white/50 text-sm mt-3">
                    {current + 1} / {images.length}  · Press Esc or click outside to close
                </p>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectDetail() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [heroVisible, setHeroVisible] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [showShareCard, setShowShareCard] = useState(false);
    const sidebarRef = useRef(null);

    const [isBookmarked, setIsBookmarked] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const tiltContent = useTilt(3);
    const tiltCommunity = useTilt(4);
    const tiltDev = useTilt(5);
    const tiltLinks = useTilt(5);
    const tiltStack = useTilt(5);
    const tiltMeta = useTilt(5);

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            try {
                const response = await projectAPI.getById(projectId);
                if (response.data) {
                    setProject(response.data);
                    setLikeCount(response.data.stars || 0);
                } else {
                    setError('Project not found');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to load project');
            } finally {
                setLoading(false);
                setHeroVisible(true);
            }
        };
        if (projectId) fetchProject();
    }, [projectId]);

    const handleShare = useCallback(async () => {
        setShareOpen(true);
    }, []);

    const handleLike = () => {
        if (!isAuthenticated) { toast.error('Login to star this project'); return; }
        setLiked(v => !v);
        setLikeCount(c => liked ? c - 1 : c + 1);
    };

    const coverImage = project?.thumbnail_url || project?.media_urls?.[0] || null;
    const allImages = project
        ? [
            coverImage,
            ...(project.media_urls || []).filter((url) => url && url !== coverImage)
        ].filter(Boolean)
        : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#fafafa]">
                <Header />
                <ProjectSkeleton />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center shadow-lg">
                            <Code2 className="w-10 h-10 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h1>
                        <p className="text-gray-500 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/explore')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Explore
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const formattedDate = new Date(project.created_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <>
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
                <Header />

                <main className="flex-grow">
                    {/* ── Hero Banner ── */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 px-4">
                        {/* Decorative orbs */}
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-7xl mx-auto relative z-10"
                        >
                            {/* Back Button */}
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back
                            </button>

                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                                <div className="flex-1">
                                    {/* Badges */}
                                    <div className="flex flex-wrap items-center gap-3 mb-5">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
                                            <Layers className="w-3 h-3" />
                                            {project.category}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium border border-white/10">
                                            <Calendar className="w-3 h-3" />
                                            {formattedDate}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                            ${project.status === 'published'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`
                                        }>
                                            <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                            {project.status}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-4">
                                        {project.title}
                                    </h1>

                                    {/* Description */}
                                    <p className="text-lg text-slate-300 max-w-2xl leading-relaxed">
                                        {project.description}
                                    </p>
                                </div>

                                {/* Hero Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    {project.live_url && (
                                        <a
                                            href={project.live_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 shadow-lg shadow-black/20 text-sm"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Live Demo
                                        </a>
                                    )}
                                    {project.github_url && (
                                        <a
                                            href={project.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm"
                                        >
                                            <Github className="w-4 h-4" />
                                            GitHub
                                        </a>
                                    )}
                                    <button
                                        onClick={handleShare}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Main Content ── */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                            {/* ── Left Column ── */}
                            <div className="lg:col-span-2 space-y-10">

                                {/* Featured Thumbnail */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                >
                                    {allImages.length > 0 ? (
                                        <>
                                            {/* Main Image */}
                                            <div
                                                className="aspect-video rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in shadow-xl shadow-slate-200 group relative"
                                                onClick={() => setLightboxIndex(0)}
                                            >
                                                <img
                                                    src={resolveMediaUrl(allImages[0])}
                                                    alt={project.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-lg" />
                                                    <Eye className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>

                                            {/* Gallery Thumbnails */}
                                            {allImages.length > 1 && (
                                                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 gallery-scroll">
                                                    {allImages.map((img, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => setLightboxIndex(i)}
                                                            className={`flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 shadow-sm ${lightboxIndex === i ? 'border-blue-500' : 'border-transparent hover:border-slate-300'}`}
                                                        >
                                                            <img
                                                                src={resolveMediaUrl(img)}
                                                                alt={`Screenshot ${i + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        /* Placeholder */
                                        <div className="aspect-video rounded-2xl overflow-hidden relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center shadow-xl">
                                            <div className="absolute inset-0">
                                                <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl" />
                                                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl" />
                                            </div>
                                            <div className="relative text-center">
                                                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                                                    <Code2 className="w-10 h-10 text-white/60" />
                                                </div>
                                                <p className="text-white/40 text-sm font-medium">No project image available</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Project Overview */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    {...tiltContent}
                                    className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
                                >
                                    <h2 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <Eye className="w-4 h-4 text-blue-500" />
                                        </span>
                                        Project Overview
                                    </h2>
                                    <div className="prose prose-slate max-w-none">
                                        <p className="text-gray-600 leading-relaxed text-base mb-4">
                                            {project.description}
                                        </p>
                                        <p className="text-gray-500 leading-relaxed text-sm">
                                            This project was built to demonstrate a modern tech stack implementation. 
                                            All code follows clean architecture principles and production-ready practices.
                                        </p>
                                    </div>

                                    {project.documentation_url && (
                                        <a
                                            href={project.documentation_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-sm font-medium transition-all hover:border-slate-300"
                                        >
                                            <ExternalLinkIcon className="w-4 h-4" />
                                            View Documentation
                                        </a>
                                    )}
                                </motion.div>

                                {/* Community Actions */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    {...tiltCommunity}
                                    className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm"
                                >
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                                            <Heart className="w-4 h-4 text-amber-500" />
                                        </span>
                                        Community
                                    </h2>
                                    <div className="flex flex-wrap gap-4">
                                        {/* Like */}
                                        <button
                                            onClick={handleLike}
                                            className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border-2 font-bold transition-all hover:scale-105 active:scale-95 ${liked
                                                ? 'bg-amber-50 border-amber-200 text-amber-600'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'
                                            }`}
                                        >
                                            <Star className={`w-5 h-5 transition-transform group-hover:scale-125 ${liked ? 'fill-amber-400 text-amber-400' : ''}`} />
                                            <span>Star</span>
                                            {likeCount > 0 && (
                                                <span className="text-sm font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{likeCount}</span>
                                            )}
                                        </button>

                                        {/* Discussion */}
                                        <Link
                                            to={`/project/${project.project_id}/discussion`}
                                            className="group flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-600 font-bold hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-105"
                                        >
                                            <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-125" />
                                            Join Discussion
                                        </Link>

                                        {/* Bookmark */}
                                        <button
                                            onClick={() => { setIsBookmarked(v => !v); toast.success(isBookmarked ? 'Removed from bookmarks' : 'Bookmarked!'); }}
                                            className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border-2 font-bold transition-all hover:scale-105 active:scale-95 ${isBookmarked
                                                ? 'bg-violet-50 border-violet-200 text-violet-600'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600'
                                            }`}
                                        >
                                            <Bookmark className={`w-5 h-5 transition-transform group-hover:scale-125 ${isBookmarked ? 'fill-violet-500 text-violet-500' : ''}`} />
                                            {isBookmarked ? 'Saved' : 'Save'}
                                        </button>

                                        {/* Share */}
                                        <button
                                            onClick={handleShare}
                                            className="group flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-600 font-bold hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all hover:scale-105"
                                        >
                                            <Share2 className="w-5 h-5 transition-transform group-hover:scale-125" />
                                            Share
                                        </button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* ── Right Sidebar ── */}
                            <div className="space-y-6" ref={sidebarRef}>

                                {/* Developer Card */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    {...tiltDev}
                                    className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
                                >
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.12em] mb-4">Developer</p>
                                    <Link
                                        to={`/profile/${project.user_username}`}
                                        className="group flex items-center gap-4"
                                    >
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                                {project.user_username?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                @{project.user_username}
                                            </h4>
                                            <p className="text-sm text-slate-500">{project.user_full_name}</p>
                                            <span className="text-xs text-blue-500 font-semibold group-hover:underline">View Profile →</span>
                                        </div>
                                    </Link>
                                </motion.div>

                                {/* Links Card */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    {...tiltLinks}
                                    className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-3"
                                >
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.12em] mb-4">Links</p>

                                    {project.live_url && (
                                        <a
                                            href={project.live_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-600 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                                        >
                                            <Globe className="w-4 h-4" />
                                            Live Demo
                                        </a>
                                    )}
                                    {project.github_url && (
                                        <a
                                            href={project.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                                        >
                                            <Github className="w-4 h-4" />
                                            GitHub Repo
                                        </a>
                                    )}
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-slate-50 text-slate-700 font-bold border border-slate-200 hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share Project
                                    </button>
                                </motion.div>

                                {/* Tech Stack Card */}
                                {project.tech_stack?.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 }}
                                        {...tiltStack}
                                        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
                                    >
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.12em] mb-4">Tech Stack</p>
                                        <div className="flex flex-wrap gap-2">
                                            {project.tech_stack.map(tech => {
                                                const color = getTechColor(tech);
                                                return (
                                                    <span
                                                        key={tech}
                                                        style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-default hover:scale-105 transition-transform"
                                                    >
                                                        {tech}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Metadata Card */}
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 }}
                                    {...tiltMeta}
                                    className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
                                >
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.12em] mb-4">Details</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-slate-500">
                                                <Calendar className="w-4 h-4" /> Published
                                            </span>
                                            <span className="font-semibold text-slate-800">{formattedDate}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-slate-500">
                                                <Layers className="w-4 h-4" /> Category
                                            </span>
                                            <span className="font-semibold text-slate-800">{project.category}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-slate-500">
                                                <Clock className="w-4 h-4" /> Status
                                            </span>
                                            <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${project.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {project.status}
                                            </span>
                                        </div>
                                        {allImages.length > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-slate-500">
                                                    <Eye className="w-4 h-4" /> Project Images
                                                </span>
                                                <span className="font-semibold text-slate-800">{allImages.length}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Discussion CTA */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                <Link
                                    to={`/project/${project.project_id}/discussion`}
                                    className="group block bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-center hover:from-slate-800 hover:to-slate-700 transition-all hover:scale-[1.02] shadow-lg shadow-slate-200"
                                >
                                    <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-6 h-6 text-blue-300" />
                                    </div>
                                    <p className="text-white font-bold text-sm mb-1">Join the Discussion</p>
                                    <p className="text-slate-400 text-xs">Share your thoughts or ask questions</p>
                                </Link>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>

            {lightboxIndex !== null && (
                <Lightbox
                    images={allImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            <ShareModal
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                url={window.location.href}
                title={`Check out ${project.title} on Codeptor!`}
                description={project.description}
                type="project"
                onGenerateCard={() => setShowShareCard(true)}
            />

            {/* Share Card Modal */}
            {showShareCard && (
                <ShareCardModal
                    isOpen={showShareCard}
                    onClose={() => setShowShareCard(false)}
                    project={project}
                    type="project"
                />
            )}
        </>
    );
}
