import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { projectAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
    Send, MessageSquare, ArrowLeft, 
    User, Clock, Trash2, Shield 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDiscussion() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    const [project, setProject] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const scrollRef = useRef(null);

    // Fetch project and comments
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [projRes, commRes] = await Promise.all([
                    projectAPI.getById(projectId),
                    projectAPI.getComments(projectId)
                ]);
                setProject(projRes.data);
                setComments(commRes.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                toast.error('Failed to load discussion');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    // Real-time listener via SSE
    useEffect(() => {
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const eventSource = new EventSource(`${BACKEND_URL}/api/stream/events`);

        eventSource.addEventListener('project:comment:added', (e) => {
            const data = JSON.parse(e.data);
            if (data.project_id === projectId) {
                setComments(prev => [data, ...prev]);
            }
        });

        return () => eventSource.close();
    }, [projectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!isAuthenticated) {
            toast.error('Please login to join the discussion');
            return;
        }

        setSubmitting(true);
        try {
            await projectAPI.addComment(projectId, { content: newComment });
            setNewComment('');
            // The comment will be added via SSE listener, but we can also add it instantly for better UX if needed
        } catch (err) {
            console.error('Failed to post comment:', err);
            toast.error('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <div className="h-4 w-48 bg-muted rounded" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            
            <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="mb-10">
                    <button 
                        onClick={() => navigate(`/project/${projectId}`)}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Project
                    </button>
                    
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold text-accent uppercase tracking-widest mb-1 block">Discussion</span>
                            <h1 className="text-3xl font-heading font-black tracking-tight text-foreground">
                                {project?.title}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-l-2 border-accent/20 pl-4">
                            <MessageSquare className="w-4 h-4" />
                            <span>{comments.length} Comments</span>
                        </div>
                    </div>
                </div>

                {/* Comment Box */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50 group-focus-within:opacity-100 transition-opacity" />
                    <form onSubmit={handleSubmit}>
                        <div className="flex items-start gap-4">
                            <div className="hidden sm:flex w-10 h-10 rounded-full bg-accent/10 items-center justify-center text-accent font-bold">
                                {isAuthenticated ? user?.username?.[0].toUpperCase() : '?'}
                            </div>
                            <div className="flex-grow space-y-4">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={isAuthenticated ? "Share your thoughts or ask a question..." : "Login to join the discussion"}
                                    disabled={!isAuthenticated || submitting}
                                    className="w-full bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground resize-none min-h-[100px] text-lg leading-relaxed"
                                />
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <div className="text-xs text-muted-foreground">
                                        {isAuthenticated ? "Markdown supported" : "Unauthorized"}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!isAuthenticated || !newComment.trim() || submitting}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold hover:shadow-lg hover:shadow-accent/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                        {submitting ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Comments List */}
                <div className="space-y-8" ref={scrollRef}>
                    {comments.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
                            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-foreground mb-1">No comments yet</h3>
                            <p className="text-muted-foreground">Be the first to start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.comment_id} className="group relative">
                                <div className="flex gap-4 sm:gap-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 flex items-center justify-center text-accent font-black shadow-sm group-hover:scale-105 transition-transform">
                                            {comment.user_username[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-grow space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-foreground">@{comment.user_username}</h4>
                                            {comment.user_email === project.user_email && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-tighter border border-accent/20">
                                                    <Shield className="w-2.5 h-2.5" />
                                                    Author
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                                <Clock className="w-3 h-3" />
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="bg-card/50 border border-border p-4 rounded-2xl group-hover:border-accent/10 transition-colors shadow-sm">
                                            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-[15px]">
                                                {comment.content}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 pl-1">
                                            <button className="text-xs font-bold text-muted-foreground hover:text-accent transition-colors">Reply</button>
                                            <button className="text-xs font-bold text-muted-foreground hover:text-accent transition-colors">Helpful</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
