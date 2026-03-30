import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { projectAPI } from '../lib/api';
import { 
    Github, ExternalLink, Calendar, User, 
    ArrowLeft, Code2, Share2, MessageSquare 
} from 'lucide-react';

export default function ProjectDetail() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            try {
                const response = await projectAPI.get(projectId);
                if (response.data) {
                    setProject(response.data);
                } else {
                    setError('Project not found');
                }
            } catch (err) {
                console.error('Failed to fetch project:', err);
                setError('Failed to load project details');
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-muted mb-4" />
                        <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="flex-grow flex flex-col items-center justify-center p-4">
                    <div className="bg-card border border-border p-8 rounded-2xl text-center max-w-md shadow-sm">
                        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                           <Code2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">Oops!</h1>
                        <p className="text-muted-foreground mb-6">{error || 'Project not found'}</p>
                        <button 
                            onClick={() => navigate('/explore')}
                            className="inline-flex items-center gap-2 text-accent font-medium hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Explore
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Navigation Back */}
                <button 
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group font-medium"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
                                    {project.category}
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-heading font-black tracking-tight text-foreground mb-4">
                                {project.title}
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed">
                                {project.description}
                            </p>
                        </div>

                        {/* Thumbnail / Media */}
                        <div className="aspect-video rounded-2xl overflow-hidden bg-card border border-border group relative shadow-2xl">
                            {project.thumbnail_url ? (
                                <img 
                                    src={project.thumbnail_url} 
                                    alt={project.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted/30">
                                    <Code2 className="w-24 h-24 text-muted-foreground/20" />
                                </div>
                            )}
                        </div>

                        {/* Full Details / Implementation details (mock if not present) */}
                        <div className="prose prose-slate max-w-none">
                            <h2 className="text-2xl font-bold text-foreground mb-4">Project Overview</h2>
                            <p className="text-muted-foreground leading-extended">
                                {project.description}
                            </p>
                            <p className="text-muted-foreground mt-4">
                                This project represents a significant milestone in our development portfolio. 
                                Built with performance and scalability in mind, it leverages a modern tech stack 
                                to deliver a seamless user experience. All implementation details follow the latest 
                                industry standards and best practices.
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Author Card */}
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Developer</h3>
                            <Link to={`/profile/${project.user_username}`} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg border-2 border-transparent group-hover:border-accent transition-all">
                                    {project.user_username?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground group-hover:text-accent transition-colors">@{project.user_username}</h4>
                                    <p className="text-xs text-muted-foreground">View Profile</p>
                                </div>
                            </Link>
                        </div>

                        {/* Project Actions */}
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Links</h3>
                            {project.live_url && (
                                <a 
                                    href={project.live_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold hover:shadow-lg hover:shadow-accent/30 transition-all active:scale-[0.98]"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Live Demo
                                </a>
                            )}
                            {project.github_url && (
                                <a 
                                    href={project.github_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-muted text-foreground font-bold border border-border hover:bg-muted/80 transition-all"
                                >
                                    <Github className="w-4 h-4" />
                                    GitHub Repo
                                </a>
                            )}
                            <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card text-muted-foreground border border-border hover:bg-muted/30 transition-all text-sm">
                                <Share2 className="w-4 h-4" />
                                Share Project
                            </button>
                        </div>

                        {/* Tech Stack */}
                        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Technologies</h3>
                            <div className="flex flex-wrap gap-2">
                                {project.tech_stack?.map(tech => (
                                    <span 
                                        key={tech}
                                        className="px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-xs font-medium border border-border hover:border-accent/30 hover:text-foreground transition-all cursor-default"
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Feedback / Community */}
                        <div className="bg-accent/5 border border-accent/20 p-6 rounded-2xl">
                            <div className="flex items-center gap-2 text-accent mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span className="font-bold text-xs uppercase tracking-wider">Community</span>
                            </div>
                            <p className="text-sm text-foreground/80 mb-4">
                                Love this project? Leave it a star or share your thoughts with the developer!
                            </p>
                            <button className="text-xs font-bold text-accent hover:underline">
                                JOIN THE DISCUSSION →
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
