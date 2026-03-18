import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import {
    Briefcase, Users, Rocket, Search, MapPin, Clock,
    Building2, ExternalLink, Code2, Github,
    ArrowRight, Loader2, RefreshCw, Globe, Calendar
} from 'lucide-react';
import { authAPI, jobAPI } from '../lib/api';

// India-focused job platforms for "Browse More" section
const JOB_PLATFORMS = [
    {
        name: 'LinkedIn India',
        icon: '🔗',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        searchUrl: (q) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q || 'developer')}&location=India&f_TPR=r604800`,
    },
    {
        name: 'Naukri',
        icon: '💼',
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        searchUrl: (q) => `https://www.naukri.com/${encodeURIComponent((q || 'software-developer').replace(/\s+/g, '-'))}-jobs`,
    },
    {
        name: 'Indeed India',
        icon: '🏢',
        color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        searchUrl: (q) => `https://in.indeed.com/jobs?q=${encodeURIComponent(q || 'software developer')}&fromage=7`,
    },
    {
        name: 'Internshala',
        icon: '🎓',
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        searchUrl: (q) => `https://internshala.com/jobs/keywords-${encodeURIComponent(q || 'developer')}`,
    },
    {
        name: 'Instahyre',
        icon: '🚀',
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        searchUrl: (q) => `https://www.instahyre.com/search-jobs/?searchQuery=${encodeURIComponent(q || 'developer')}`,
    },
];

// Sample contributor requests
const CONTRIBUTOR_REQUESTS = [
    {
        id: 1,
        project: 'DevPortfolio',
        author: 'johndoe',
        looking_for: 'UI/UX Designer',
        tech: ['Figma', 'React'],
        description: 'Need help designing the dashboard and improving UX flow.'
    },
    {
        id: 2,
        project: 'OpenAPI Generator',
        author: 'janesmith',
        looking_for: 'Backend Developer',
        tech: ['Go', 'OpenAPI'],
        description: 'Looking for contributor to help with OpenAPI spec parsing.'
    }
];

/**
 * Format a date string into relative time (e.g. "2 days ago")
 */
const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
};

// Strictly filter for India-located jobs only
const isIndiaJob = (location) => {
    if (!location) return false;
    const loc = location.toLowerCase();
    return (
        loc.includes('india') ||
        loc.includes('bangalore') ||
        loc.includes('bengaluru') ||
        loc.includes('mumbai') ||
        loc.includes('hyderabad') ||
        loc.includes('chennai') ||
        loc.includes('pune') ||
        loc.includes('delhi') ||
        loc.includes('noida') ||
        loc.includes('gurgaon') ||
        loc.includes('gurugram') ||
        loc.includes('kolkata') ||
        loc.includes('ahmedabad') ||
        loc.includes('jaipur') ||
        loc.includes('kochi') ||
        loc.includes('thiruvananthapuram') ||
        loc.includes('coimbatore') ||
        loc.includes('lucknow') ||
        loc.includes('chandigarh') ||
        loc.includes('indore')
    );
};

// Format location to always show "India" context
const formatLocationForIndia = (location) => {
    if (!location) return 'India';
    const loc = location.toLowerCase();
    if (loc.trim() === 'india') return 'India';
    if (loc.includes('india')) return location;
    return `${location}, India`;
};

export default function Careers() {
    const { isAuthenticated } = useAuth();
    const [activeSection, setActiveSection] = useState('jobs');
    const [searchQuery, setSearchQuery] = useState('');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('software-dev');
    const [days, setDays] = useState(null); // null means "All"
    const [lastSync, setLastSync] = useState(null);

    const categories = [
        { value: 'software-dev', label: 'Software Dev' },
        { value: 'devops', label: 'DevOps / SysAdmin' },
        { value: 'design', label: 'Design' },
        { value: 'data', label: 'Data' },
        { value: 'product', label: 'Product' },
        { value: 'qa', label: 'QA' },
    ];

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                category,
                days: days || undefined,
                search: searchQuery || undefined
            };
            const res = await jobAPI.getLatest(params);
            setJobs(res.data.jobs || []);
            setLastSync(res.data.last_sync);
        } catch (err) {
            console.error('Job fetch error:', err);
            setError('Could not load jobs from backend. Please try again.');
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [category, days, searchQuery]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // We no longer need local filtering for searchQuery as the backend handles it,
    // but we'll keep it as a fallback or for instant feedback if needed.
    // For now, let's just use the jobs from the backend directly.
    // Filter for India tasks for consistency with original app
    const filteredJobs = jobs.filter(job => isIndiaJob(job.location));

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="text-center mb-10 relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <Briefcase className="w-64 h-64" />
                    </div>
                    <div className="relative">
                        <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tight text-foreground mb-3">
                            Careers & Opportunities
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto mb-2">
                            Discover the latest developer jobs available in India.
                            Apply directly on the hiring platform.
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            🇮🇳 India-focused · Jobs from Remotive, LinkedIn, Naukri & more · Dynamic Portal
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter jobs by title, company, or technology…"
                        className="
                            w-full pl-12 pr-4 py-3
                            rounded-xl border border-input bg-card
                            text-foreground placeholder:text-muted-foreground
                            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                            transition-all shadow-sm
                        "
                    />
                </div>

                {/* Section Tabs */}
                <div className="flex justify-center gap-2 mb-8">
                    <button
                        onClick={() => setActiveSection('jobs')}
                        className={`
                            inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                            text-sm font-medium transition-all
                            ${activeSection === 'jobs'
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        <Briefcase className="w-4 h-4" />
                        Job Listings
                    </button>
                    <button
                        onClick={() => setActiveSection('contributors')}
                        className={`
                            inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                            text-sm font-medium transition-all
                            ${activeSection === 'contributors'
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : 'bg-muted text-muted-foreground hover:text-foreground'}
                        `}
                    >
                        <Users className="w-4 h-4" />
                        Looking for Contributors
                    </button>
                </div>

                {/* Content */}
                {activeSection === 'jobs' ? (
                    <div className="space-y-4">
                        {/* Filters & Refresh Row */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex gap-1.5 p-1 bg-muted rounded-lg overflow-x-auto">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setCategory(cat.value)}
                                            className={`
                                                px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
                                                ${category === cat.value
                                                    ? 'bg-card text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'}
                                            `}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Recently Posted Filter */}
                                <div className="flex items-center gap-2 px-1 bg-muted rounded-lg p-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground px-2">Refine:</span>
                                    {[
                                        { label: 'All', value: null },
                                        { label: '7 Days', value: 7 },
                                        { label: '30 Days', value: 30 },
                                    ].map(f => (
                                        <button
                                            key={f.label}
                                            onClick={() => setDays(f.value)}
                                            className={`
                                                px-3 py-1 rounded-md text-xs font-medium transition-all
                                                ${days === f.value
                                                    ? 'bg-card text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'}
                                            `}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {lastSync && (
                                    <span className="text-[10px] text-muted-foreground italic">
                                        Last updated: {formatTimeAgo(lastSync)}
                                    </span>
                                )}
                                <button
                                    onClick={fetchJobs}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                                <p className="text-sm text-muted-foreground">Fetching latest jobs…</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div className="text-center py-12">
                                <p className="text-sm text-red-500 mb-3">{error}</p>
                                <button
                                    onClick={fetchJobs}
                                    className="text-sm text-accent hover:underline"
                                >
                                    Try again
                                </button>
                            </div>
                        )}

                        {/* Job Cards */}
                        {!loading && !error && filteredJobs.length > 0 && (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    Showing {filteredJobs.length} {category} roles
                                </p>
                                {filteredJobs.map(job => (
                                    <JobCard key={job.id} job={job} />
                                ))}
                            </>
                        )}

                        {/* Empty State */}
                        {!loading && !error && filteredJobs.length === 0 && (
                            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
                                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                <p className="text-foreground font-medium mb-1">
                                    No fresh jobs found matching your criteria
                                </p>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Try adjusting your filters or search keywords.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setDays(null);
                                    }}
                                    className="text-sm text-accent hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}

                        {/* Browse More footer */}
                        <div className="pt-10 mt-10 border-t border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <Globe className="w-4 h-4 text-accent" />
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                                    Explore More Job Portals
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {JOB_PLATFORMS.map(platform => (
                                    <a
                                        key={platform.name}
                                        href={platform.searchUrl(searchQuery)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${platform.color}`}
                                    >
                                        <span>{platform.icon}</span>
                                        {platform.name}
                                        <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Info Banner */}
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-accent/5 border border-accent/10 mb-8">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                                <Rocket className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-base text-foreground font-semibold">Collaborate & Build Together</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Join passion-driven projects or find partners for your next big idea. 
                                    Open-source contribution is the best way to grow your career.
                                </p>
                            </div>
                        </div>

                        {/* Contributor Request Cards */}
                        <div className="grid grid-cols-1 gap-4">
                            {CONTRIBUTOR_REQUESTS.map(req => (
                                <ContributorCard key={req.id} request={req} />
                            ))}
                        </div>

                        {/* Post Request CTA */}
                        {isAuthenticated && (
                            <div className="text-center py-10 bg-card rounded-2xl border border-border mt-8">
                                <p className="text-muted-foreground mb-4">Need help with your project?</p>
                                <Link
                                    to="/dashboard"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-all shadow-sm"
                                >
                                    Add Contributor Request
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

/* ─── Job Card Component ─── */
const JobCard = ({ job }) => {
    const typeColors = {
        'full_time': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        'contract': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        'part_time': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        'freelance': 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
        'internship': 'bg-green-500/10 text-green-600 dark:text-green-400',
        'other': 'bg-muted text-muted-foreground',
    };

    const formatType = (type) => {
        if (!type) return 'Other';
        return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border border-border bg-card p-5 hover:border-accent/50 hover:shadow-md transition-all relative overflow-hidden"
        >
            {job.is_new && (
                <div className="absolute top-0 right-0">
                    <div className="bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm">
                        New
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                    {/* Title & Company */}
                    <div className="flex items-start gap-3">
                        {job.company_logo ? (
                            <img
                                src={job.company_logo}
                                alt={job.company_name}
                                className="w-10 h-10 rounded-lg object-contain bg-muted flex-shrink-0"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                                {job.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                        {job.candidate_required_location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {formatLocationForIndia(job.candidate_required_location)}
                            </span>
                        )}
                        {job.salary && job.salary.trim() && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                                {job.salary}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTimeAgo(job.publication_date)}
                        </span>
                    </div>

                    {/* Tags */}
                    {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.tags.slice(0, 5).map(tag => (
                                <span
                                    key={tag}
                                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Type Badge & Source */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColors[job.job_type] || typeColors['other']}`}>
                        {formatType(job.job_type)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-accent font-medium">
                        Apply Now
                        <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                </div>
            </div>
        </a>
    );
};

/* ─── Contributor Request Card ─── */
const ContributorCard = ({ request }) => {
    return (
        <div className="group rounded-lg border border-border bg-card p-5 hover:border-accent/50 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                    {/* Project & Author */}
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                                {request.project}
                            </h3>
                            <p className="text-sm text-muted-foreground">by @{request.author}</p>
                        </div>
                    </div>

                    {/* Looking For */}
                    <div className="mt-3">
                        <span className="text-sm text-foreground font-medium">Looking for: </span>
                        <span className="text-sm text-accent">{request.looking_for}</span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mt-2">
                        {request.description}
                    </p>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {request.tech.map(tech => (
                            <span
                                key={tech}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
                        <Github className="w-4 h-4" />
                        Contribute
                    </button>
                </div>
            </div>
        </div>
    );
};
