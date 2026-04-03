import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../lib/api';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
    Plus, ExternalLink, LayoutGrid, List, Search,
    MoreVertical, Edit2, Trash2, Archive, Pin, Copy, Eye, Clock
} from 'lucide-react';

// Filter/Sort options
const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Active' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'archived', label: 'Archived' }
];

const SORT_OPTIONS = [
    { value: 'updated', label: 'Recently Updated' },
    { value: 'created', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Alphabetically' }
];

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // View & filter state
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('updated');
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await projectAPI.getMy();
            setProjects(response.data);
        } catch (error) {
            toast.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort projects
    const filteredProjects = projects
        .filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'updated':
                    return new Date(b.updated_at) - new Date(a.updated_at);
                case 'created':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'name':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

    // Quick actions
    const handleDelete = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectAPI.delete(projectId);
                setProjects(projects.filter(p => p.project_id !== projectId));
                toast.success('Project deleted');
            } catch (error) {
                console.error('Delete project error:', error);
                toast.error('Failed to delete project');
            }
        }
    };

    const handleDuplicate = (project) => {
        toast.info('Duplicate feature coming soon');
    };

    const handleArchive = async (project) => {
        try {
            await projectAPI.update(project.project_id, { status: 'archived' });
            fetchProjects();
            toast.success('Project archived');
        } catch (error) {
            toast.error('Failed to archive project');
        }
    };

    const handlePin = (project) => {
        toast.info('Pin to profile feature coming soon');
    };

    // Format relative time
    const formatRelativeTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString();
    };

    // Get status badge styling
    const getStatusBadge = (status) => {
        const styles = {
            completed: 'bg-green-500/10 text-green-500',
            in_progress: 'bg-yellow-500/10 text-yellow-500',
            archived: 'bg-muted text-muted-foreground'
        };
        const labels = {
            completed: 'Active',
            in_progress: 'In Progress',
            archived: 'Archived'
        };
        return { style: styles[status] || styles.archived, label: labels[status] || status };
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* User Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-2xl tracking-tight text-foreground">
                                My Projects
                            </h1>
                            <p className="text-sm text-muted-foreground">@{user?.username}</p>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <div className="space-y-6">
                    {/* Header & Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="font-heading font-semibold text-xl tracking-tight text-foreground">
                                My Projects
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {projects.length} project{projects.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* View Toggle */}
                            <div className="flex items-center border border-border rounded-md p-0.5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'grid'
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="Grid view"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'list'
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    title="List view"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>

                            {/* New Project Button */}
                            <button
                                onClick={() => navigate('/publish')}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-all active:scale-95 inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Project
                            </button>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <LoadingState viewMode={viewMode} />
                    ) : filteredProjects.length === 0 ? (
                        projects.length === 0 ? (
                            <EmptyState onCreateClick={() => navigate('/publish')} />
                        ) : (
                            <NoResultsState onClearFilters={() => { setSearchQuery(''); setStatusFilter('all'); }} />
                        )
                    ) : viewMode === 'grid' ? (
                        <GridView
                            projects={filteredProjects}
                            formatRelativeTime={formatRelativeTime}
                            getStatusBadge={getStatusBadge}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onEdit={(p) => navigate(`/publish/${p.project_id}`)}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onArchive={handleArchive}
                            onPin={handlePin}
                        />
                    ) : (
                        <ListView
                            projects={filteredProjects}
                            formatRelativeTime={formatRelativeTime}
                            getStatusBadge={getStatusBadge}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onEdit={(p) => navigate(`/publish/${p.project_id}`)}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onArchive={handleArchive}
                            onPin={handlePin}
                        />
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}

// Grid View Component
function GridView({ projects, formatRelativeTime, getStatusBadge, activeMenu, setActiveMenu, onEdit, onDelete, onDuplicate, onArchive, onPin }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
                const status = getStatusBadge(project.status);
                return (
                    <Link
                        key={project.project_id}
                        to={`/project/${project.project_id}`}
                        className="rounded-lg border border-border bg-card p-5 hover:border-accent/50 hover:shadow-lg transition-all duration-300 group relative no-underline"
                        onClick={(e) => {
                            if (e.target.closest('button') || e.target.closest('[data-project-menu="true"]')) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-heading font-semibold text-lg tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-1">
                                    {project.title}
                                </h3>

                                {/* Actions Menu */}
                                <div className="relative" data-project-menu="true">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === project.project_id ? null : project.project_id);
                                        }}
                                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {activeMenu === project.project_id && (
                                        <QuickActionsMenu
                                            project={project}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onDuplicate={onDuplicate}
                                            onArchive={onArchive}
                                            onPin={onPin}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {project.description}
                            </p>

                            {/* Tech Stack */}
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {project.tech_stack?.slice(0, 3).map((tech) => (
                                    <span
                                        key={tech}
                                        className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground"
                                    >
                                        {tech}
                                    </span>
                                ))}
                                {project.tech_stack?.length > 3 && (
                                    <span className="text-xs font-mono text-muted-foreground">
                                        +{project.tech_stack.length - 3}
                                    </span>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.style}`}>
                                    {status.label}
                                </span>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatRelativeTime(project.updated_at)}
                                    </span>
                                    {project.live_url && (
                                        <a
                                            href={project.live_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 hover:text-accent transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// List View Component
function ListView({ projects, formatRelativeTime, getStatusBadge, activeMenu, setActiveMenu, onEdit, onDelete, onDuplicate, onArchive, onPin }) {
    return (
        <div className="border border-border rounded-lg">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                <div className="col-span-5">Project</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Tech</div>
                <div className="col-span-2">Updated</div>
                <div className="col-span-1"></div>
            </div>

            {/* Rows */}
            {projects.map((project, index) => {
                const status = getStatusBadge(project.status);
                return (
                    <Link
                        key={project.project_id}
                        to={`/project/${project.project_id}`}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors group no-underline text-inherit ${index !== projects.length - 1 ? 'border-b border-border' : ''
                            }`}
                        onClick={(e) => {
                            // Only prevent navigation if clicking on interactive elements
                            if (e.target.closest('button') || e.target.closest('a')) {
                                e.preventDefault();
                            }
                        }}
                    >
                        {/* Project Info */}
                        <div className="md:col-span-5">
                            <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                                {project.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {project.description}
                            </p>
                        </div>

                        {/* Status */}
                        <div className="md:col-span-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${status.style}`}>
                                {status.label}
                            </span>
                        </div>

                        {/* Tech */}
                        <div className="md:col-span-2 flex flex-wrap gap-1">
                            {project.tech_stack?.slice(0, 2).map((tech) => (
                                <span
                                    key={tech}
                                    className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground"
                                >
                                    {tech}
                                </span>
                            ))}
                            {project.tech_stack?.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                    +{project.tech_stack.length - 2}
                                </span>
                            )}
                        </div>

                        {/* Updated */}
                        <div className="md:col-span-2 text-sm text-muted-foreground">
                            {formatRelativeTime(project.updated_at)}
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-1 relative flex justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveMenu(activeMenu === project.project_id ? null : project.project_id);
                                }}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenu === project.project_id && (
                                <QuickActionsMenu
                                    project={project}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onDuplicate={onDuplicate}
                                    onArchive={onArchive}
                                    onPin={onPin}
                                />
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

// Quick Actions Dropdown Menu
function QuickActionsMenu({ project, onEdit, onDelete, onDuplicate, onArchive, onPin }) {
    const runAction = (e, action) => {
        e.preventDefault();
        e.stopPropagation();
        action();
    };

    return (
        <div
            className="absolute right-0 top-full mt-1 z-50 w-48 bg-popover border border-border rounded-md shadow-lg py-1"
            data-project-menu="true"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <button
                onClick={(e) => runAction(e, () => onEdit(project))}
                className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
            >
                <Edit2 className="w-4 h-4" />
                Edit Project
            </button>
            <button
                onClick={(e) => runAction(e, () => project.live_url && window.open(project.live_url, '_blank', 'noopener,noreferrer'))}
                disabled={!project.live_url}
                className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Eye className="w-4 h-4" />
                View Live
            </button>
            <button
                onClick={(e) => runAction(e, () => onDuplicate(project))}
                className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
            >
                <Copy className="w-4 h-4" />
                Duplicate
            </button>
            <button
                onClick={(e) => runAction(e, () => onPin(project))}
                className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
            >
                <Pin className="w-4 h-4" />
                Pin to Profile
            </button>
            <div className="border-t border-border my-1" />
            <button
                onClick={(e) => runAction(e, () => onArchive(project))}
                className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2 transition-colors"
            >
                <Archive className="w-4 h-4" />
                Archive
            </button>
            <button
                onClick={(e) => runAction(e, () => onDelete(project.project_id))}
                className="w-full px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
            >
                <Trash2 className="w-4 h-4" />
                Delete
            </button>
        </div>
    );
}

// Empty State Component
function EmptyState({ onCreateClick }) {
    return (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg bg-muted/10">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-medium text-xl text-foreground mb-2">
                    No projects yet
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Create your first project to start building your developer portfolio
                </p>
                <button
                    onClick={onCreateClick}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-all inline-flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Your First Project
                </button>
            </div>
        </div>
    );
}

// No Results State
function NoResultsState({ onClearFilters }) {
    return (
        <div className="text-center py-16 border border-border rounded-lg bg-muted/10">
            <div className="max-w-md mx-auto">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading font-medium text-lg text-foreground mb-2">
                    No matching projects
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search or filters
                </p>
                <button
                    onClick={onClearFilters}
                    className="text-sm text-accent hover:underline"
                >
                    Clear all filters
                </button>
            </div>
        </div>
    );
}

// Loading State Component
function LoadingState({ viewMode }) {
    if (viewMode === 'list') {
        return (
            <div className="border border-border rounded-lg">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-4 py-4 border-b border-border last:border-b-0">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                            </div>
                            <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                            <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5">
                    <div className="space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-full animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                        <div className="flex gap-2 pt-2">
                            <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                            <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
