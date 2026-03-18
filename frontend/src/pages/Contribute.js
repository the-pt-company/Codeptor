import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import {
    Users, Rocket, Search, Clock,
    Github, Loader2, RefreshCw, Code2,
    ExternalLink, AlertCircle, Globe
} from 'lucide-react';
import { projectAPI } from '../lib/api';

/**
 * Format a date string into relative time (e.g. "2 days ago")
 */
const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff)) return '';
    
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
};

export default function Contribute() {
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('all');

    const categories = [
        { value: 'all', label: 'All Projects' },
        { value: 'web_app', label: 'Web' },
        { value: 'mobile', label: 'Mobile' },
        { value: 'backend', label: 'Backend' },
        { value: 'ai_ml', label: 'AI/ML' },
        { value: 'library', label: 'Library' },
    ];

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                exclude_self: true,
                category: category !== 'all' ? category : undefined
            };
            const res = await projectAPI.getAll(params);
            setProjects(res.data || []);
        } catch (err) {
            console.error('Project fetch error:', err);
            setError('Could not load projects. Please try again.');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const filteredProjects = projects.filter(project => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tech_stack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="text-center mb-10 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <Users className="w-64 h-64" />
                    </div>
                    <div className="relative">
                        <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-foreground mb-3">
                            Project Contribution Feed
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
                            Discover open-source projects hosted by our community. 
                            Contribute your skills, collaborate with others, and build your developer credibility.
                        </p>
                        
                        {/* Info Banner */}
                        <div className="flex items-center justify-center gap-4 py-3 px-6 rounded-2xl bg-accent/5 border border-accent/10 max-w-xl mx-auto">
                            <Rocket className="w-5 h-5 text-accent animate-pulse" />
                            <p className="text-sm text-foreground font-medium">
                                Contributing is the fastest way to learn and network!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="space-y-6 mb-10">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects by name, description, or stack…"
                            className="
                                w-full pl-12 pr-4 py-3
                                rounded-xl border border-input bg-card
                                text-foreground placeholder:text-muted-foreground
                                focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                                transition-all shadow-sm
                            "
                        />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.value}
                                onClick={() => setCategory(cat.value)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium transition-all
                                    ${category === cat.value
                                        ? 'bg-accent text-accent-foreground shadow-sm'
                                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'}
                                `}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Code2 className="w-5 h-5 text-accent" />
                            Available Projects
                            {!loading && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    {filteredProjects.length} found
                                </span>
                            )}
                        </h2>
                        <button
                            onClick={fetchProjects}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Feed
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-10 h-10 text-accent animate-spin" />
                            <p className="text-sm text-muted-foreground">Loading projects from community…</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center py-16 bg-destructive/5 rounded-2xl border border-destructive/10">
                            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
                            <p className="text-sm text-destructive font-medium mb-1">{error}</p>
                            <button
                                onClick={fetchProjects}
                                className="text-sm text-accent hover:underline mt-2"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Project Grid */}
                    {!loading && !error && filteredProjects.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredProjects.map(project => (
                                <ProjectContributionCard key={project.project_id} project={project} />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && filteredProjects.length === 0 && (
                        <div className="text-center py-24 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                            <Rocket className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                {searchQuery ? 'No matching projects found' : 'No projects available for contribution yet'}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
                                {searchQuery 
                                    ? 'Try adjusting your search terms or filters.' 
                                    : 'Check back later or be the first to post a project that needs contributors!'}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCategory('all');
                                    }}
                                    className="px-6 py-2 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-all"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

/**
 * Project Contribution Card Component
 */
function ProjectContributionCard({ project }) {
    const handleContribute = () => {
        if (project.github_url) {
            window.open(project.github_url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className="group flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden hover:border-accent/40 hover:shadow-xl transition-all duration-300">
            {/* Project Header */}
            <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                            {project.category === 'web_app' ? <Globe className="w-6 h-6 text-accent" /> : <Code2 className="w-6 h-6 text-accent" />}
                        </div>
                        <div>
                            <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-accent transition-colors truncate max-w-[200px]">
                                {project.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>by @{project.user_username}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTimeAgo(project.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {project.status.replace('_', ' ')}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                    {project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.tech_stack.slice(0, 4).map(tech => (
                        <span
                            key={tech}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-muted border border-border text-muted-foreground font-medium"
                        >
                            {tech}
                        </span>
                    ))}
                    {project.tech_stack.length > 4 && (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-muted/50 text-muted-foreground font-medium">
                            +{project.tech_stack.length - 4} more
                        </span>
                    )}
                </div>
            </div>

            {/* Card Footer / Action */}
            <div className="px-6 py-4 bg-muted/50 border-t border-border mt-auto">
                <button
                    onClick={handleContribute}
                    className="
                        w-full inline-flex items-center justify-center gap-2 
                        px-4 py-2.5 rounded-xl
                        bg-foreground text-background font-bold text-sm
                        hover:bg-accent hover:text-accent-foreground
                        transition-all duration-200 shadow-sm
                    "
                >
                    <Github className="w-4 h-4" />
                    Contribute on GitHub
                    <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                </button>
            </div>
        </div>
    );
}
