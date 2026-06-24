import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import { projectAPI, blogAPI, userAPI, analyticsAPI, resolveMediaUrl } from '../lib/api';
import ShareCardModal from '../components/share/ShareCardModal';
import ShareModal from '../components/share/ShareModal';
import { useTilt } from '../hooks/useTilt';
import { toast } from 'sonner';
import {
    ProfileHeader,
    AnalyticsCard,
    ActivityTimeline,
    AboutMeSection,
    VideoCVPlayer
} from '../components/profile';
import { ProjectQualityBadge } from '../components/project/ProjectQuality';
import {
    LayoutGrid, List, Github, Eye, Star,
    Code2, MessageSquare, Users
} from 'lucide-react';

export default function Profile() {
    const { username } = useParams();
    const { user: currentUser, isAuthenticated } = useAuth();

    const [profileUser, setProfileUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [profileVisits, setProfileVisits] = useState(0);
    const [showShareCard, setShowShareCard] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showUserList, setShowUserList] = useState(null); // 'followers' | 'following' | null

    const tiltAnalytics = useTilt(4);

    // Determine if viewing own profile
    const isOwnProfile = isAuthenticated && currentUser?.username === username;

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch user profile from real API
            if (isOwnProfile) {
                setProfileUser(currentUser);
            } else {
                try {
                    const userRes = await userAPI.getByUsername(username);
                    setProfileUser(userRes.data);
                } catch {
                    setProfileUser({
                        username: username,
                        full_name: username.charAt(0).toUpperCase() + username.slice(1),
                        bio: '',
                        skills: [],
                        created_at: new Date().toISOString()
                    });
                }
            }

            // Fetch projects with backend visibility rules applied
            const projectsRes = await projectAPI.getByUsername(username);
            setProjects(projectsRes.data || []);

            // Fetch blog data
            try {
                if (isOwnProfile) {
                    const blogRes = await blogAPI.getMy();
                    setBlogs(blogRes.data || []);
                } else {
                    // Pass author_username to the backend so Firestore filters server-side.
                    // Previously fetched all blogs and filtered client-side, which missed
                    // users whose blogs weren't in the first page of results.
                    const blogRes = await blogAPI.getAll({ author_username: username, limit: 100 });
                    setBlogs(blogRes.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch blogs:', error);
            }

            // Track this profile visit & get analytics
            try {
                await analyticsAPI.track(`/profile/${username}`);
                const analyticsRes = await analyticsAPI.getPageStats(`/profile/${username}`);
                setProfileVisits(analyticsRes.data?.data?.uniqueVisitors || 0);
            } catch {
                // Analytics is non-critical
            }

            // Fetch followers & following
            try {
                const [followersRes, followingRes] = await Promise.all([
                    userAPI.getFollowers(username),
                    userAPI.getFollowing(username),
                ]);
                setFollowers(followersRes.data || []);
                setFollowing(followingRes.data || []);
            } catch {
                // Non-critical
            }

            // Check if current user follows this profile
            if (isAuthenticated && !isOwnProfile) {
                try {
                    const res = await userAPI.isFollowing(username);
                    setIsFollowing(res.data?.is_following || false);
                } catch {
                    // Non-critical
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    }, [isOwnProfile, currentUser, username, isAuthenticated]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await userAPI.unfollow(username);
                setIsFollowing(false);
                setFollowers(prev => prev.filter(f => f.email !== currentUser?.email));
                toast.success(`Unfollowed @${username}`);
            } else {
                await userAPI.follow(username);
                setIsFollowing(true);
                setFollowers(prev => [...prev, currentUser]);
                toast.success(`Following @${username}`);
            }
        } catch (error) {
            toast.error('Failed to update follow status');
        }
    };

    // Real stats — computed from actual data
    const stats = {
        projects: projects.length,
        blogPosts: blogs.length,
        blogViews: blogs.reduce((sum, b) => sum + (b.view_count || 0), 0),
        blogReactions: blogs.reduce((sum, b) => sum + (b.reaction_count || 0), 0),
        views: 0,
        stars: 0,
        followers: followers.length,
        following: following.length,
        profileVisits: profileVisits,
    };

    // Filter projects (show all since we removed featured/archived tabs)
    const filteredProjects = projects;

    // Build real activity list from projects and blogs
    const buildActivities = () => {
        const activities = [];

        projects.forEach(p => {
            activities.push({
                type: 'published',
                title: 'Published a project',
                project: p.title,
                time: p.created_at,
            });
        });

        blogs.forEach(b => {
            activities.push({
                type: 'updated',
                title: 'Published a blog post',
                project: b.title,
                time: b.published_at || b.created_at,
            });
        });

        // Sort by most recent first
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Format times as relative
        return activities.slice(0, 10).map(a => ({
            ...a,
            time: formatTimeAgo(a.time),
        }));
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Loading skeleton */}
                    <div className="animate-pulse">
                        <div className="h-40 bg-muted rounded-xl mb-6" />
                        <div className="h-24 bg-muted rounded-xl mb-6" />
                        <div className="h-32 bg-muted rounded-xl" />
                    </div>
                </main>
            </div>
        );
    }

    const realActivities = buildActivities();

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Header */}
                <ProfileHeader
                    user={profileUser}
                    isOwnProfile={isOwnProfile}
                    onFollow={handleFollow}
                    isFollowing={isFollowing}
                    onShare={() => setShowShareModal(true)}
                    stats={stats}
                    onShowFollowers={() => setShowUserList('followers')}
                    onShowFollowing={() => setShowUserList('following')}
                />

                {/* ── About Me (bio + tech stack + socials) ── */}
                <AboutMeSection user={profileUser} isOwnProfile={isOwnProfile} />

                {/* ── Analytics ── */}
                <div {...tiltAnalytics}>
                    <AnalyticsCard
                        stats={stats}
                        isOwnProfile={isOwnProfile}
                        followerList={followers}
                        followingList={following}
                    />
                </div>

                {/* Projects Section */}
                <div className="bg-card border border-border rounded-xl p-6">
                    {/* Projects Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="font-heading font-semibold text-lg text-foreground">
                            {isOwnProfile ? 'My Projects' : 'Projects'}
                        </h2>

                        <div className="flex items-center gap-3">

                            {/* View Toggle */}
                            <div className="flex border border-border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 ${viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 ${viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Projects Grid/List */}
                    {filteredProjects.length > 0 ? (
                        <div className={viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                            : 'space-y-3'
                        }>
                            {filteredProjects.map(project => (
                                <ProjectCard
                                    key={project.project_id}
                                    project={project}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Code2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">
                                {isOwnProfile
                                    ? 'No projects yet. Start building!'
                                    : 'No published projects.'}
                            </p>
                            {isOwnProfile && (
                                <Link
                                    to="/publish"
                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
                                >
                                    Publish Your First Project
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Blogs Section */}
                {blogs.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-6 mt-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-heading font-semibold text-lg text-foreground">
                                {isOwnProfile ? 'My Blogs' : 'Recent Blogs'}
                            </h2>
                            <Link to="/blogs" className="text-sm text-accent hover:underline">
                                View all blogs
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {blogs.slice(0, 3).map(blog => (
                                <Link
                                    key={blog.blog_id}
                                    to={`/blog/${blog.slug}`}
                                    className="block p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/50 transition-all"
                                >
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-accent px-1.5 py-0.5 rounded bg-accent/10">
                                                    {blog.category}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(blog.published_at || blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-foreground truncate group-hover:text-accent transition-colors">
                                                {blog.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate mt-1">
                                                {blog.subtitle}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 text-sm text-muted-foreground whitespace-nowrap">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {blog.view_count || 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-4 h-4" />
                                                {blog.comments_count || 0}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Recent Activity (bottom of page) ── */}
                <div className="mt-6">
                    <ActivityTimeline activities={realActivities} isOwnProfile={isOwnProfile} />
                </div>

            </main>
            <Footer />

            {/* Profile Card Modal (download as PNG) */}
            {showShareCard && (
                <ShareCardModal
                    isOpen={showShareCard}
                    onClose={() => setShowShareCard(false)}
                    user={profileUser}
                    stats={stats}
                    type="profile"
                />
            )}

            {/* Share Link Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                url={`${window.location.origin}/profile/${username}`}
                title={`${profileUser?.full_name || username}'s Developer Profile on KudosDev`}
                description={profileUser?.bio || 'Check out this developer on KudosDev!'}
                type="profile"
                onGenerateCard={() => setShowShareCard(true)}
            />

            {/* Follower / Following List Modal */}
            {showUserList && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUserList(null)}>
                    <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <h3 className="font-heading font-bold text-lg text-foreground">
                                {showUserList === 'followers' ? 'Followers' : 'Following'}
                            </h3>
                            <button onClick={() => setShowUserList(null)} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {(showUserList === 'followers' ? followers : following).length > 0 ? (
                                (showUserList === 'followers' ? followers : following).map((u, idx) => (
                                    <a
                                        key={u.username || idx}
                                        href={`/profile/${u.username}`}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-sm">
                                            {u.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                                                {u.full_name || u.username}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                                        </div>
                                    </a>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Users className="w-10 h-10 mb-2 opacity-40" />
                                    <p className="text-sm">No {showUserList} yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video CV Player */}
            {profileUser?.video_cv_url && (
                <VideoCVPlayer
                    url={profileUser.video_cv_url}
                    userName={profileUser.full_name}
                />
            )}
        </div>
    );
}

/* Project Card Component */
const ProjectCard = ({ project, viewMode }) => {
    if (viewMode === 'list') {
        return (
            <Link
                to={`/project/${project.project_id}`}
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/50 transition-all group"
            >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                    {project.thumbnail_url ? (
                        <img src={resolveMediaUrl(project.thumbnail_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Code2 className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate group-hover:text-accent transition-colors">{project.title}</h3>
                        <ProjectQualityBadge project={project} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{project.description}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {project.views || 0}
                    </span>
                    <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {project.stars || 0}
                    </span>
                </div>
            </Link>
        );
    }

    return (
        <Link
            to={`/project/${project.project_id}`}
            className="group rounded-lg border border-border overflow-hidden hover:border-accent/50 hover:shadow-lg transition-all"
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-muted relative overflow-hidden">
                {project.thumbnail_url ? (
                    <img
                        src={resolveMediaUrl(project.thumbnail_url)}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Code2 className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                )}
                {/* Status Badge */}
                <span className={`
                    absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium
                    ${project.status === 'published'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'}
                `}>
                    {project.status}
                </span>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {project.title}
                    </h3>
                    <ProjectQualityBadge project={project} className="flex-shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1 mt-3">
                    {project.tech_stack?.slice(0, 3).map(tech => (
                        <span key={tech} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {tech}
                        </span>
                    ))}
                    {project.tech_stack?.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            +{project.tech_stack.length - 3}
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {project.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {project.stars || 0}
                        </span>
                    </div>
                    {project.github_url && <Github className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>
        </Link>
    );
};
