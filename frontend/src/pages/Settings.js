import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { toast } from 'sonner';
import {
    User,
    Mail,
    Lock,
    Sun,
    Save,
    UserCircle,
    Palette,
    Camera,
    Github,
    Linkedin,
    Globe,
    Bookmark,
    BookmarkX,
    Clock,
    Eye
} from 'lucide-react';
import { blogAPI } from '../lib/api';

export default function Settings() {
    const { user, updateUser } = useAuth();

    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);


    const fileInputRef = React.useRef(null);

    // Bookmarks State
    const [bookmarkedBlogs, setBookmarkedBlogs] = useState([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url || '',
        skills: user?.skills?.join(', ') || '',
        github_url: user?.github_url || '',
        linkedin_url: user?.linkedin_url || '',
        website_url: user?.website_url || '',
        video_cv_url: user?.video_cv_url || ''
    });

    // Account State
    const [accountData, setAccountData] = useState({
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleAccountChange = (e) => {
        const { name, value } = e.target;
        setAccountData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);


        const toastId = toast.loading('Uploading avatar...');
        try {
            // Reusing blogAPI.uploadImage for simplicity if backend endpoint is general enough
            // or we could add a specific user upload endpoint.
            const res = await blogAPI.uploadImage(formData);
            const imageUrl = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}${res.data.url}`;

            setProfileData(prev => ({ ...prev, avatar_url: imageUrl }));
            toast.success('Avatar uploaded! Click Save Changes to finish.', { id: toastId });
        } catch (error) {
            toast.error('Failed to upload avatar', { id: toastId });
        } finally {

            e.target.value = ''; // Reset input
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToUpdate = {
                ...profileData,
                skills: profileData.skills.split(',').map(s => s.trim()).filter(Boolean)
            };
            await updateUser(dataToUpdate);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAccountSubmit = async (e) => {
        e.preventDefault();
        if (accountData.newPassword !== accountData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setLoading(true);
        try {
            // Only update email for now as password change might need a different endpoint
            await updateUser({ email: accountData.email });
            toast.success('Account settings updated');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update account');
        } finally {
            setLoading(false);
        }
    };

    // Fetch bookmarked blogs when the bookmarks tab is active
    useEffect(() => {
        if (activeTab === 'bookmarks') {
            fetchBookmarks();
        }
    }, [activeTab]);

    const fetchBookmarks = async () => {
        setBookmarksLoading(true);
        try {
            const res = await blogAPI.getBookmarks();
            setBookmarkedBlogs(res.data || []);
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
            toast.error('Failed to load bookmarks');
        } finally {
            setBookmarksLoading(false);
        }
    };

    const handleRemoveBookmark = async (blogId) => {
        try {
            await blogAPI.toggleBookmark(blogId);
            setBookmarkedBlogs(prev => prev.filter(b => b.blog_id !== blogId));
            toast.success('Bookmark removed');
        } catch (error) {
            toast.error('Failed to remove bookmark');
        }
    };

    const tabs = [
        { id: 'profile', label: 'Public Profile', icon: UserCircle },
        { id: 'account', label: 'Account Settings', icon: Lock },
        { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
        { id: 'appearance', label: 'Appearance', icon: Palette },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="font-heading font-bold text-3xl text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Navigation sidebar */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <nav className="flex md:flex-col gap-1 overflow-x-auto pb-4 md:pb-0">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                        ${activeTab === tab.id
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Avatar Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-4">
                                            Profile Picture
                                        </label>
                                        <div className="flex items-center gap-6">
                                            <div
                                                onClick={handleAvatarClick}
                                                className="group relative cursor-pointer"
                                            >
                                                <div className="w-24 h-24 rounded-full bg-muted overflow-hidden flex-shrink-0 border-4 border-border transition-all group-hover:border-accent group-hover:opacity-80">
                                                    {profileData.avatar_url ? (
                                                        <img src={profileData.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <User className="w-12 h-12" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-black/40 rounded-full p-2 text-white">
                                                        <Camera className="w-6 h-6" />
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleAvatarUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-foreground font-medium">Click avatar to upload</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    JPG, PNG or WebP. Max 5MB.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleAvatarClick}
                                                    className="mt-2 text-xs text-accent hover:underline font-medium"
                                                >
                                                    Change Picture
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={profileData.full_name}
                                            onChange={handleProfileChange}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="Your name"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            name="bio"
                                            value={profileData.bio}
                                            onChange={handleProfileChange}
                                            rows={4}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                            placeholder="Tell the world about yourself..."
                                        />
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Skills (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="skills"
                                            value={profileData.skills}
                                            onChange={handleProfileChange}
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="React, Python, Node.js"
                                        />
                                    </div>

                                    {/* Social Links Section */}
                                    <div className="pt-4 border-t border-border">
                                        <h3 className="text-sm font-medium text-foreground mb-4">Social Links</h3>
                                        <div className="space-y-4">
                                            {/* GitHub URL */}
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    GitHub URL
                                                </label>
                                                <div className="relative">
                                                    <Github className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="url"
                                                        name="github_url"
                                                        value={profileData.github_url}
                                                        onChange={handleProfileChange}
                                                        className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="https://github.com/username"
                                                    />
                                                </div>
                                            </div>

                                            {/* LinkedIn URL */}
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    LinkedIn URL
                                                </label>
                                                <div className="relative">
                                                    <Linkedin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="url"
                                                        name="linkedin_url"
                                                        value={profileData.linkedin_url}
                                                        onChange={handleProfileChange}
                                                        className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="https://linkedin.com/in/username"
                                                    />
                                                </div>
                                            </div>

                                            {/* Portfolio / Website URL */}
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Portfolio / Website URL
                                                </label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="url"
                                                        name="website_url"
                                                        value={profileData.website_url}
                                                        onChange={handleProfileChange}
                                                        className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="https://yourportfolio.dev"
                                                    />
                                                </div>
                                            </div>

                                            {/* Video CV URL */}
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Video CV Link (YouTube, Vimeo, etc.)
                                                </label>
                                                <div className="relative">
                                                    <Camera className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                                                    <input
                                                        type="url"
                                                        name="video_cv_url"
                                                        value={profileData.video_cv_url}
                                                        onChange={handleProfileChange}
                                                        className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="https://youtube.com/watch?v=..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'account' && (
                            <form onSubmit={handleAccountSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={accountData.email}
                                                onChange={handleAccountChange}
                                                className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-border">
                                        <h3 className="text-sm font-medium text-foreground mb-4">Change Password</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Current Password</label>
                                                <input
                                                    type="password"
                                                    name="currentPassword"
                                                    value={accountData.currentPassword}
                                                    onChange={handleAccountChange}
                                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                    disabled // Mock for now
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs text-muted-foreground mb-1">New Password</label>
                                                    <input
                                                        type="password"
                                                        name="newPassword"
                                                        value={accountData.newPassword}
                                                        onChange={handleAccountChange}
                                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        disabled // Mock for now
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-muted-foreground mb-1">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={accountData.confirmPassword}
                                                        onChange={handleAccountChange}
                                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        disabled // Mock for now
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground italic">
                                                Password updates are currently disabled in this demo.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {loading ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-foreground mb-4">Theme</h3>
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Sun className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Light Mode</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">This app uses light mode only.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'bookmarks' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Bookmarked Blogs</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Blogs you've saved for later reading.
                                    </p>
                                </div>

                                {bookmarksLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-4 p-4 rounded-lg border border-border animate-pulse">
                                                <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-muted rounded w-3/4" />
                                                    <div className="h-3 bg-muted rounded w-1/2" />
                                                    <div className="h-3 bg-muted rounded w-1/4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : bookmarkedBlogs.length > 0 ? (
                                    <div className="space-y-3">
                                        {bookmarkedBlogs.map(blog => (
                                            <div
                                                key={blog.blog_id}
                                                className="group flex items-start gap-4 p-4 rounded-lg border border-border bg-background hover:border-accent/40 transition-all"
                                            >
                                                {/* Cover image */}
                                                <Link
                                                    to={`/blog/${blog.slug}`}
                                                    className="w-20 h-20 rounded-md bg-muted overflow-hidden flex-shrink-0"
                                                >
                                                    {blog.cover_image_url ? (
                                                        <img
                                                            src={blog.cover_image_url}
                                                            alt={blog.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                            <Bookmark className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </Link>

                                                {/* Blog info */}
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        to={`/blog/${blog.slug}`}
                                                        className="font-medium text-foreground hover:text-accent transition-colors line-clamp-1"
                                                    >
                                                        {blog.title}
                                                    </Link>
                                                    {blog.subtitle && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                                            {blog.subtitle}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                        <span>by @{blog.author_username}</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {blog.reading_time_minutes} min read
                                                        </span>
                                                        {blog.view_count > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />
                                                                {blog.view_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {blog.tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {blog.tags.slice(0, 3).map(tag => (
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

                                                {/* Remove bookmark button */}
                                                <button
                                                    onClick={() => handleRemoveBookmark(blog.blog_id)}
                                                    className="flex-shrink-0 p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remove bookmark"
                                                >
                                                    <BookmarkX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                            <Bookmark className="w-7 h-7 text-muted-foreground" />
                                        </div>
                                        <h4 className="font-medium text-foreground mb-1">No bookmarks yet</h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Save blogs you want to read later by clicking the bookmark icon.
                                        </p>
                                        <Link
                                            to="/blog"
                                            className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium"
                                        >
                                            Browse Blogs →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
