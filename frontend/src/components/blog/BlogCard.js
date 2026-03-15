import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Eye, MessageSquare, Flame } from 'lucide-react';

export default function BlogCard({ blog }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <Link
            to={`/blog/${blog.slug}`}
            className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-accent/50 hover:shadow-xl transition-all duration-300"
        >
            {/* Cover Image */}
            {blog.cover_image_url ? (
                <div className="aspect-video overflow-hidden bg-muted">
                    <img
                        src={blog.cover_image_url}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            ) : (
                <div className="aspect-video bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center">
                    <span className="text-4xl opacity-30">✍️</span>
                </div>
            )}

            {/* Content */}
            <div className="p-5">
                {/* Category + Tags */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-accent">
                        {blog.category}
                    </span>
                    {blog.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Title */}
                <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-accent transition-colors line-clamp-2 mb-2">
                    {blog.title}
                </h3>

                {/* Subtitle / Excerpt */}
                {blog.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {blog.subtitle}
                    </p>
                )}

                {/* Author & Meta */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/profile/${blog.author_username}`;
                        }}
                    >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold">
                            {blog.author_full_name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs text-muted-foreground hover:text-accent transition-colors">{blog.author_full_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {blog.reading_time_minutes}m
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {blog.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {blog.comment_count || 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
