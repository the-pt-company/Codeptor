import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { blogAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import ReadingProgressBar from '../components/blog/ReadingProgressBar';
import MarkdownPreview from '../components/blog/MarkdownPreview';
import ReactionBar from '../components/blog/ReactionBar';
import CommentSection from '../components/blog/CommentSection';
import ShareButtons from '../components/blog/ShareButtons';
import { toast } from 'sonner';
import {
    Clock, Eye, Calendar, Tag, ArrowLeft, Bookmark, BookmarkCheck,
    Trash2, Edit2
} from 'lucide-react';

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookmarked, setBookmarked] = useState(false);

    useEffect(() => {
        fetchBlog();
    }, [fetchBlog]);

    const fetchBlog = useCallback(async () => {
        try {
            const res = await blogAPI.getBySlug(slug);
            setBlog(res.data);
        } catch {
            toast.error('Blog not found');
        } finally {
            setLoading(false);
        }
    }, [slug]);

    const toggleBookmark = async () => {
        if (!isAuthenticated) {
            toast.error('Please log in to bookmark');
            return;
        }
        try {
            const res = await blogAPI.toggleBookmark(blog.blog_id);
            setBookmarked(res.data.action === 'added');
            toast.success(res.data.action === 'added' ? 'Bookmarked!' : 'Bookmark removed');
        } catch {
            toast.error('Failed to bookmark');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        });
    };

    const isAuthor = user && blog && user.email === blog.author_email;

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this blog? This action cannot be undone.')) return;
        try {
            await blogAPI.delete(blog.blog_id);
            toast.success('Blog deleted successfully');
            navigate('/blogs');
        } catch {
            toast.error('Failed to delete blog');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="max-w-3xl mx-auto px-4 py-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="aspect-video bg-muted rounded-xl" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-4 bg-muted rounded" />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="max-w-3xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-2xl font-heading font-bold text-foreground mb-4">Blog not found</h1>
                    <Link to="/blogs" className="text-accent hover:underline">← Back to blogs</Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <ReadingProgressBar />
            <Header />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-8">
                    <Link to="/blogs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" /> All Blogs
                    </Link>
                    {isAuthor && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate(`/blog/edit/${blog.blog_id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-border text-foreground hover:bg-muted transition-colors"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        </div>
                    )}
                </div>

                {/* Cover Image */}
                {blog.cover_image_url && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-8 shadow-lg">
                        <img
                            src={blog.cover_image_url}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Category */}
                <span className="text-xs font-medium uppercase tracking-widest text-accent mb-3 block">
                    {blog.category}
                </span>

                {/* Title */}
                <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tight text-foreground leading-tight mb-4">
                    {blog.title}
                </h1>

                {/* Subtitle */}
                {blog.subtitle && (
                    <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                        {blog.subtitle}
                    </p>
                )}

                {/* Author & Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-border">
                    <Link to={`/profile/${blog.author_username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold">
                            {blog.author_full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <p className="font-medium text-foreground text-sm hover:text-accent transition-colors">{blog.author_full_name}</p>
                            <p className="text-xs text-muted-foreground">@{blog.author_username}</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(blog.published_at || blog.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {blog.reading_time_minutes} min read
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {blog.view_count} views
                        </span>
                    </div>
                </div>

                {/* Tags */}
                {blog.tags?.length > 0 && (
                    <div className="flex items-center gap-2 mb-8 flex-wrap">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {blog.tags.map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content */}
                <article className="mb-12">
                    <MarkdownPreview content={blog.content_markdown} />
                </article>

                {/* Engagement Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-b border-border mb-8">
                    <ReactionBar blogId={blog.blog_id} />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleBookmark}
                            className={`p-2 rounded-lg border transition-all ${bookmarked
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                            {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                        <ShareButtons title={blog.title} slug={blog.slug} />
                    </div>
                </div>

                {/* Comments */}
                <CommentSection blogId={blog.blog_id} />
            </main>

            <Footer />
        </div>
    );
}
