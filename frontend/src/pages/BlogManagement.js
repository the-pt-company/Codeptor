import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blogAPI } from '../lib/api';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import {
    Plus, Edit2, Trash2, Send, EyeOff, Eye, MoreVertical,
    FileText, CheckCircle
} from 'lucide-react';

export default function BlogManagement() {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        fetchBlogs();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setActiveMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchBlogs = async () => {
        try {
            const res = await blogAPI.getMy();
            setBlogs(res.data || []);
        } catch {
            toast.error('Failed to fetch blogs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (blogId) => {
        if (window.confirm('Are you sure you want to delete this blog?')) {
            try {
                await blogAPI.delete(blogId);
                setBlogs(blogs.filter(b => b.blog_id !== blogId));
                toast.success('Blog deleted');
            } catch (error) {
                console.error('Delete blog error:', error);
                toast.error('Failed to delete');
            }
        }
    };

    const handlePublish = async (blogId) => {
        try {
            await blogAPI.publish(blogId);
            fetchBlogs();
            toast.success('Blog published!');
        } catch {
            toast.error('Failed to publish');
        }
    };

    const handleUnpublish = async (blogId) => {
        try {
            await blogAPI.unpublish(blogId);
            fetchBlogs();
            toast.success('Blog unpublished');
        } catch {
            toast.error('Failed to unpublish');
        }
    };

    const filteredBlogs = blogs.filter(b => {
        if (activeTab === 'all') return true;
        if (activeTab === 'drafts') return b.status === 'draft';
        if (activeTab === 'published') return b.status === 'published';
        return true;
    });

    const draftCount = blogs.filter(b => b.status === 'draft').length;
    const publishedCount = blogs.filter(b => b.status === 'published').length;

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-heading font-bold text-2xl text-foreground">Blog Management</h1>
                        <p className="text-sm text-muted-foreground">{blogs.length} total posts</p>
                    </div>
                    <button
                        onClick={() => navigate('/blog/new')}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-all inline-flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" /> New Blog
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
                    {[
                        { key: 'all', label: `All (${blogs.length})` },
                        { key: 'drafts', label: `Drafts (${draftCount})` },
                        { key: 'published', label: `Published (${publishedCount})` },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                px-4 py-2 rounded-md text-sm font-medium transition-all
                                ${activeTab === tab.key
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Blog List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 bg-muted rounded w-1/2" />
                                        <div className="h-4 bg-muted rounded w-3/4" />
                                    </div>
                                    <div className="h-6 bg-muted rounded w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredBlogs.length > 0 ? (
                    <div className="border border-border rounded-lg">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
                            <div className="col-span-5">Title</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Views</div>
                            <div className="col-span-2">Date</div>
                            <div className="col-span-1"></div>
                        </div>

                        {filteredBlogs.map((blog, index) => (
                            <div
                                key={blog.blog_id}
                                className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors group ${index !== filteredBlogs.length - 1 ? 'border-b border-border' : ''
                                    }`}
                            >
                                {/* Title */}
                                <div className="md:col-span-5">
                                    <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">
                                        {blog.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                        {blog.subtitle || `${blog.word_count} words · ${blog.reading_time_minutes} min read`}
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="md:col-span-2">
                                    {blog.status === 'published' ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                                            <CheckCircle className="w-3 h-3" /> Published
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
                                            <FileText className="w-3 h-3" /> Draft
                                        </span>
                                    )}
                                </div>

                                {/* Views */}
                                <div className="md:col-span-2 text-sm text-muted-foreground flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    {blog.view_count || 0}
                                </div>

                                {/* Date */}
                                <div className="md:col-span-2 text-sm text-muted-foreground">
                                    {formatDate(blog.status === 'published' ? blog.published_at : blog.updated_at)}
                                </div>

                                {/* Actions */}
                                <div className="md:col-span-1 relative flex justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === blog.blog_id ? null : blog.blog_id);
                                        }}
                                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {activeMenu === blog.blog_id && (
                                        <div
                                            className="absolute right-0 top-full mt-1 z-50 w-44 bg-popover border border-border rounded-md shadow-lg py-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => navigate(`/blog/edit/${blog.blog_id}`)}
                                                className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit
                                            </button>
                                            {blog.status === 'draft' ? (
                                                <button
                                                    onClick={() => handlePublish(blog.blog_id)}
                                                    className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2"
                                                >
                                                    <Send className="w-4 h-4" /> Publish
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleUnpublish(blog.blog_id)}
                                                    className="w-full px-3 py-2 text-sm text-left text-foreground hover:bg-muted flex items-center gap-2"
                                                >
                                                    <EyeOff className="w-4 h-4" /> Unpublish
                                                </button>
                                            )}
                                            <div className="border-t border-border my-1" />
                                            <button
                                                onClick={() => handleDelete(blog.blog_id)}
                                                className="w-full px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10 flex items-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-border rounded-lg bg-muted/10">
                        <span className="text-4xl mb-4 block">✍️</span>
                        <h3 className="font-heading font-medium text-xl text-foreground mb-2">
                            No blog posts yet
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Start writing your first blog post
                        </p>
                        <button
                            onClick={() => navigate('/blog/new')}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-all inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Write Your First Blog
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
