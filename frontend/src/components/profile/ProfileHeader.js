import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Edit2, Share2, MapPin, Calendar, ExternalLink, Code2, Users, Eye } from 'lucide-react';

/**
 * ProfileHeader - Displays user avatar, name, bio, and action buttons
 */
export const ProfileHeader = ({ user, isOwnProfile, onFollow, isFollowing, onShare, stats, onShowFollowers, onShowFollowing }) => {
    const navigate = useNavigate();

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const handleEdit = () => {
        navigate('/settings');
    };

    const handleShare = () => {
        if (onShare) {
            onShare();
        } else {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                toast.success('Profile link copied to clipboard!');
            }).catch(() => {
                toast.error('Failed to copy link');
            });
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-border"
                        />
                    ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-3xl font-bold border-4 border-border">
                            {getInitials(user?.full_name)}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:justify-between gap-8">
                        {/* Left Column: Name, Bio, Meta */}
                        <div className="flex-1 min-w-0">
                            <div>
                                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground">
                                    {user?.full_name || 'Developer'}
                                </h1>
                                <p className="text-muted-foreground">
                                    @{user?.username}
                                </p>
                            </div>

                            {/* Bio */}
                            {user?.bio && (
                                <p className="mt-3 text-foreground max-w-2xl">
                                    {user.bio}
                                </p>
                            )}

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
                                {user?.location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {user.location}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    Joined {formatDate(user?.created_at)}
                                </span>
                                {user?.website_url && (
                                    <a
                                        href={user.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-accent hover:underline"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Website
                                    </a>
                                )}
                            </div>

                            {/* Follower / Following Stats */}
                            <div className="flex items-center gap-6 mt-4">
                                <button
                                    onClick={onShowFollowers}
                                    className="flex items-center gap-1.5 hover:text-accent transition-colors group"
                                >
                                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                                    <span className="font-bold text-foreground text-sm">{stats?.followers ?? 0}</span>
                                    <span className="text-sm text-muted-foreground">Followers</span>
                                </button>
                                <button
                                    onClick={onShowFollowing}
                                    className="flex items-center gap-1.5 hover:text-accent transition-colors group"
                                >
                                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-accent" />
                                    <span className="font-bold text-foreground text-sm">{stats?.following ?? 0}</span>
                                    <span className="text-sm text-muted-foreground">Following</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Actions & Tech Stack */}
                        <div className="flex flex-col gap-6 md:items-end md:min-w-[200px] lg:min-w-[280px]">
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Share
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={onFollow}
                                            className={`
                                                inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all
                                                ${isFollowing
                                                    ? 'border border-border bg-card hover:bg-muted text-foreground'
                                                    : 'bg-accent text-accent-foreground hover:bg-accent/90'}
                                            `}
                                        >
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Tech Stack - Fills the space below buttons */}
                            {user?.skills && user.skills.length > 0 && (
                                <div className="w-full">
                                    <div className="flex items-center gap-2 mb-3 md:justify-end">
                                        <Code2 className="w-4 h-4 text-accent" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Tech Stack</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 md:justify-end">
                                        {user.skills.map(skill => (
                                            <span
                                                key={skill}
                                                className="text-[11px] px-2.5 py-1 rounded-md bg-muted border border-border/50 text-foreground font-medium hover:border-accent/50 hover:bg-accent/5 transition-all cursor-default"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;
