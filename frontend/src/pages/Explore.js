import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import { projectAPI, blogAPI, userAPI, resolveMediaUrl } from '../lib/api';
import { useEventStream } from '../hooks/useEventStream';
import BlogCard from '../components/blog/BlogCard';
import { motion } from 'framer-motion';
import { useTilt } from '../hooks/useTilt';
import { Search, Filter, TrendingUp, Clock, Star,
    ExternalLink, Github, Users, Code2, Briefcase, PenSquare
} from 'lucide-react';

// Color map for tech badges
const TECH_COLORS = {
    react: { bg: '#e0f2fe', text: '#0369a1' }, vue: { bg: '#dcfce7', text: '#15803d' },
    angular: { bg: '#fee2e2', text: '#dc2626' }, 'next.js': { bg: '#f1f5f9', text: '#334155' },
    'node.js': { bg: '#dcfce7', text: '#166534' }, python: { bg: '#fef3c7', text: '#92400e' },
    typescript: { bg: '#dbeafe', text: '#1d4ed8' }, javascript: { bg: '#fef9c3', text: '#854d0e' },
    rust: { bg: '#ffedd5', text: '#9a3412' }, go: { bg: '#e0f2fe', text: '#075985' },
    firestore: { bg: '#dcfce7', text: '#14532d' }, fastapi: { bg: '#d1fae5', text: '#065f46' },
    tailwindcss: { bg: '#e0f2fe', text: '#0c4a6e' },
};
const getTechColor = (tech) => TECH_COLORS[tech.toLowerCase().replace(/\s+/g, '')] || { bg: '#f1f5f9', text: '#475569' };

// Tech stack options for filtering
const TECH_STACKS = [
    'React', 'Vue', 'Angular', 'Next.js', 'Node.js',
    'Python', 'Django', 'FastAPI', 'Go', 'Rust',
    'TypeScript', 'JavaScript', 'PostgreSQL', 'Firestore'
];

// Sort options
const SORT_OPTIONS = [
    { value: 'trending', label: 'Trending', icon: TrendingUp },
    { value: 'newest', label: 'Newest', icon: Clock },
    { value: 'popular', label: 'Most Popular', icon: Star }
];

const BLOG_CATEGORIES = ['all', 'devlog', 'tutorial', 'opinion', 'showcase'];

export default function Explore() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('projects');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('trending');
    const [selectedTech, setSelectedTech] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Data states
    const [projects, setProjects] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'projects') {
                const response = await projectAPI.getAll();
                setProjects(response.data || []);
            } else if (activeTab === 'blogs') {
                const params = {};
                if (activeCategory !== 'all') params.category = activeCategory;
                const res = await blogAPI.getAll(params);
                setBlogs(res.data || []);
            } else if (activeTab === 'developers') {
                const params = { limit: 20 };
                if (searchQuery) params.q = searchQuery;
                const res = await userAPI.getDevelopers(params);
                setDevelopers(res.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, activeCategory, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Subscribe to live project updates via SSE
    useEventStream({
        'project:new': (project) => {
            setProjects(prev => [project, ...prev]);
        },
        'project:updated': (project) => {
            setProjects(prev =>
                prev.map(p => p.project_id === project.project_id ? project : p)
            );
        },
        'project:deleted': (data) => {
            const deletedId = data.project_id || data.id;
            setProjects(prev => prev.filter(p => p.project_id !== deletedId));
        },
        'blog:new': (blog) => {
            if (blog.status === 'published') {
                setBlogs(prev => [blog, ...prev]);
            }
        },
        'blog:updated': (blog) => {
            setBlogs(prev =>
                prev.map(b => b.blog_id === blog.blog_id ? blog : b)
            );
        },
        'blog:deleted': (data) => {
            const deletedId = data.blog_id || data.id;
            setBlogs(prev => prev.filter(b => b.blog_id !== deletedId));
        },
    });

    // Filter projects based on search and tech stack (exclude own)
    const filteredProjects = projects.filter(project => {
        if (user && project.user_username === user.username) return false;

        const matchesSearch = !searchQuery ||
            project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.user_username?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTech = selectedTech.length === 0 ||
            selectedTech.some(tech => project.tech_stack?.includes(tech));

        return matchesSearch && matchesTech;
    });

    const toggleTech = (tech) => {
        setSelectedTech(prev =>
            prev.includes(tech)
                ? prev.filter(t => t !== tech)
                : [...prev, tech]
        );
    };

    // Filter blogs based on search (exclude own)
    const filteredBlogs = blogs.filter(blog => {
        if (user && blog.author_username === user.username) return false;

        return !searchQuery ||
            blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.author_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.author_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="text-center mb-8">
                    <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-foreground mb-3">
                        Explore
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Discover projects, blogs, and developers. Find inspiration, learn, and connect.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search developers, projects, or technologies…"
                        className="
                            w-full pl-12 pr-4 py-3.5
                            rounded-xl border border-input bg-card
                            text-foreground placeholder:text-muted-foreground
                            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                            text-base transition-all shadow-sm
                        "
                    />
                </div>

                {/* Tabs & Filters Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-muted rounded-lg">
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`
                                px-4 py-2 rounded-md text-sm font-medium transition-all
                                ${activeTab === 'projects'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'}
                            `}
                        >
                            <Code2 className="w-4 h-4 inline-block mr-2" />
                            Projects
                        </button>
                        <button
                            onClick={() => setActiveTab('blogs')}
                            className={`
                                px-4 py-2 rounded-md text-sm font-medium transition-all
                                ${activeTab === 'blogs'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'}
                            `}
                        >
                            <PenSquare className="w-4 h-4 inline-block mr-2" />
                            Blogs
                        </button>
                        <button
                            onClick={() => setActiveTab('developers')}
                            className={`
                                px-4 py-2 rounded-md text-sm font-medium transition-all
                                ${activeTab === 'developers'
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'}
                            `}
                        >
                            <Users className="w-4 h-4 inline-block mr-2" />
                            Developers
                        </button>
                    </div>

                    {/* Sort & Filter Controls */}
                    <div className="flex items-center gap-3">
                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="
                                px-3 py-2 rounded-md border border-input bg-card
                                text-sm text-foreground
                                focus:outline-none focus:ring-2 focus:ring-ring
                            "
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`
                                inline-flex items-center gap-2 px-3 py-2 rounded-md border
                                text-sm font-medium transition-colors
                                ${showFilters
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-input bg-card text-foreground hover:bg-muted'}
                            `}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {selectedTech.length > 0 && (
                                <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                                    {selectedTech.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filter Panel — only for projects tab */}
                {showFilters && activeTab === 'projects' && (
                    <div className="mb-6 p-4 rounded-lg border border-border bg-card">
                        <h3 className="text-sm font-medium text-foreground mb-3">Tech Stack</h3>
                        <div className="flex flex-wrap gap-2">
                            {TECH_STACKS.map(tech => (
                                <button
                                    key={tech}
                                    onClick={() => toggleTech(tech)}
                                    className={`
                                        px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                                        ${selectedTech.includes(tech)
                                            ? 'bg-accent text-accent-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                                    `}
                                >
                                    {tech}
                                </button>
                            ))}
                        </div>
                        {selectedTech.length > 0 && (
                            <button
                                onClick={() => setSelectedTech([])}
                                className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}

                {/* Blog Category Filter — only for blogs tab */}
                {activeTab === 'blogs' && (
                    <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
                        {BLOG_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`
                                    px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all
                                    ${activeCategory === cat
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
                                <div className="h-32 bg-muted rounded-md mb-4" />
                                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'projects' ? (
                    /* Projects Grid */
                    filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map(project => (
                                <ProjectCard key={project.project_id} project={project} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No projects found"
                            description="Be the first to publish a project!"
                        />
                    )
                ) : activeTab === 'blogs' ? (
                    /* Blogs Grid */
                    filteredBlogs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBlogs.map(blog => (
                                <BlogCard key={blog.blog_id} blog={blog} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No blogs found"
                            description="Be the first to publish a blog post!"
                        />
                    )
                ) : (
                    /* Developers Grid */
                    developers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {developers.map(dev => (
                                <DeveloperCard key={dev.username} developer={dev} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title={searchQuery ? "No developers matching your search" : "No developers yet"}
                            description={searchQuery ? "Try a different search term" : "New developers will appear here as they join!"}
                        />
                    )
                )}
            </main>
            <Footer />
        </div>
    );
}

/* Project Card Component */
const ProjectCard = ({ project, index = 0 }) => {
    const tilt = useTilt(6);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
            whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(99,102,241,0.18)' }}
            whileTap={{ scale: 0.98 }}
            {...tilt}
            style={{ borderRadius: 16, willChange: 'transform' }}
        >
        <Link
            to={`/project/${project.project_id}`}
            className="group rounded-[16px] border border-slate-200 bg-white overflow-hidden hover:border-indigo-300 transition-all block shadow-sm"
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-slate-50 relative overflow-hidden">
                {project.thumbnail_url ? (
                    <img
                        src={resolveMediaUrl(project.thumbnail_url)}
                        alt={project.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <Code2 className="w-12 h-12 text-slate-300" />
                    </div>
                )}
                {/* Category badge */}
                <span className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full text-slate-600 font-semibold border border-slate-200/80">
                    {project.category}
                </span>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1 text-sm">
                    {project.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tech_stack?.slice(0, 3).map(tech => {
                        const c = getTechColor(tech);
                        return (
                            <span
                                key={tech}
                                style={{ background: c.bg, color: c.text }}
                                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                            >
                                {tech}
                            </span>
                        );
                    })}
                    {project.tech_stack?.length > 3 && (
                        <span className="text-[11px] text-slate-400">+{project.tech_stack.length - 3}</span>
                    )}
                </div>

                {/* Author & Stats */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                        by{' '}
                        <Link
                            to={`/profile/${project.user_username}`}
                            className="text-indigo-500 hover:underline font-medium"
                            onClick={(e) => e.stopPropagation()}
                        >
                            @{project.user_username}
                        </Link>
                    </span>
                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                        {project.github_url && <Github className="w-3.5 h-3.5" />}
                        {project.live_url && <ExternalLink className="w-3.5 h-3.5" />}
                    </div>
                </div>
            </div>
        </Link>
        </motion.div>
    );
};

/* Developer Card Component */
const DeveloperCard = ({ developer }) => {
    const getInitials = (name) => {
        if (!name) return 'D';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Link
            to={`/profile/${developer.username}`}
            className="group rounded-lg border border-border bg-card p-4 hover:border-accent/50 hover:shadow-lg transition-all text-center"
        >
            {/* Avatar */}
            {developer.avatar_url ? (
                <img
                    src={developer.avatar_url}
                    alt={developer.full_name}
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-border group-hover:border-accent transition-colors"
                />
            ) : (
                <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-accent flex items-center justify-center text-accent-foreground text-lg font-medium">
                    {getInitials(developer.full_name)}
                </div>
            )}

            {/* Name */}
            <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                {developer.full_name}
            </h3>
            <p className="text-sm text-muted-foreground">
                @{developer.username}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap justify-center gap-1 mt-3">
                {developer.skills?.slice(0, 3).map(skill => (
                    <span
                        key={skill}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                        {skill}
                    </span>
                ))}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-4 mt-4 pt-3 border-t border-border text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {developer.project_count || 0} projects
                </span>
            </div>
        </Link>
    );
};

/* Empty State Component */
const EmptyState = ({ title, description }) => (
    <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);
