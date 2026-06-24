import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { blogAPI } from '../lib/api';
import { toast } from 'sonner';
import { Header } from '../components/layout/Header';
import EditorToolbar from '../components/blog/EditorToolbar';
import MarkdownPreview from '../components/blog/MarkdownPreview';
import TextareaAutosize from 'react-textarea-autosize';
import {
    Eye, EyeOff, Save, Send, ArrowLeft, Clock, Hash, X, Tag
} from 'lucide-react';

export default function BlogEditor() {
    const navigate = useNavigate();
    const { blogId } = useParams();
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const isEditing = Boolean(blogId);

    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [category, setCategory] = useState('devlog');
    const [showPreview, setShowPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [existingBlogId, setExistingBlogId] = useState(null);

    // Load existing blog if editing
    useEffect(() => {
        if (blogId) {
            loadBlog();
        }
    }, [blogId]);

    const loadBlog = async () => {
        try {
            // We need to fetch by blog_id. Use getMy and find it.
            const res = await blogAPI.getMy();
            const blog = (res.data || []).find(b => b.blog_id === blogId);
            if (blog) {
                setTitle(blog.title);
                setSubtitle(blog.subtitle || '');
                setContent(blog.content_markdown || '');
                setCoverImageUrl(blog.cover_image_url || '');
                setTags(blog.tags || []);
                setCategory(blog.category || 'devlog');
                setExistingBlogId(blog.blog_id);
            }
        } catch {
            toast.error('Failed to load blog');
        }
    };

    // Word count & reading time
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.round(wordCount / 238));

    // Auto-save every 30 seconds
    const autoSave = useCallback(async () => {
        if (!title.trim() || !existingBlogId) return;
        try {
            await blogAPI.update(existingBlogId, {
                title, subtitle, content_markdown: content,
                cover_image_url: coverImageUrl || null,
                tags, category,
            });
            setLastSaved(new Date());
        } catch { }
    }, [title, subtitle, content, coverImageUrl, tags, category, existingBlogId]);

    useEffect(() => {
        const interval = setInterval(autoSave, 30000);
        return () => clearInterval(interval);
    }, [autoSave]);

    // Tag management
    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !tags.includes(tag) && tags.length < 5) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    // Save as draft
    const handleSaveDraft = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        setSaving(true);
        try {
            if (existingBlogId) {
                await blogAPI.update(existingBlogId, {
                    title, subtitle, content_markdown: content,
                    cover_image_url: coverImageUrl || null,
                    tags, category,
                });
            } else {
                const res = await blogAPI.create({
                    title, subtitle, content_markdown: content,
                    cover_image_url: coverImageUrl || null,
                    tags, category, status: 'draft',
                });
                setExistingBlogId(res.data.blog_id);
            }
            setLastSaved(new Date());
            toast.success('Draft saved!');
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    // Publish
    const handlePublish = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Please add a title and content before publishing');
            return;
        }
        setPublishing(true);
        try {
            if (existingBlogId) {
                await blogAPI.update(existingBlogId, {
                    title, subtitle, content_markdown: content,
                    cover_image_url: coverImageUrl || null,
                    tags, category,
                });
                await blogAPI.publish(existingBlogId);
            } else {
                await blogAPI.create({
                    title, subtitle, content_markdown: content,
                    cover_image_url: coverImageUrl || null,
                    tags, category, status: 'published',
                });
            }
            toast.success('Blog published! 🎉');
            navigate('/dashboard/blogs');
        } catch {
            toast.error('Failed to publish');
        } finally {
            setPublishing(false);
        }
    };

    const handleImageUploadTrigger = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const id = toast.loading('Uploading image...');
        try {
            const res = await blogAPI.uploadImage(formData);
            // res.data.url is already an absolute Firebase Storage URL — use it directly.
            const imageUrl = res.data.url;

            // Insert into markdown
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const markdown = `![${file.name}](${imageUrl})`;

            const newContent = text.slice(0, start) + markdown + text.slice(end);
            setContent(newContent);

            toast.success('Image uploaded!', { id });

            // Set focus and cursor after insertion
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + markdown.length, start + markdown.length);
            }, 0);
        } catch {
            toast.error('Failed to upload image', { id });
        } finally {
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Top Bar */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="flex items-center gap-3">
                        {lastSaved && (
                            <span className="text-xs text-muted-foreground">
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg border border-input text-sm font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={publishing}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {publishing ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Editor Panel */}
                    <div className="space-y-4">
                        {/* Cover Image */}
                        <div>
                            <input
                                type="text"
                                value={coverImageUrl}
                                onChange={(e) => setCoverImageUrl(e.target.value)}
                                placeholder="Cover image URL (optional)"
                                className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Title */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Blog title..."
                            className="w-full text-3xl font-heading font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/50"
                        />

                        {/* Subtitle */}
                        <input
                            type="text"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Subtitle (optional)"
                            className="w-full text-lg bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/40"
                        />

                        {/* Category */}
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="devlog">Dev Log</option>
                            <option value="tutorial">Tutorial</option>
                            <option value="opinion">Opinion</option>
                            <option value="showcase">Showcase</option>
                        </select>

                        {/* Tags */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tag className="w-4 h-4 text-muted-foreground" />
                            {tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {tags.length < 5 && (
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                    placeholder="Add tag..."
                                    className="text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground w-20"
                                />
                            )}
                        </div>

                        {/* Toolbar */}
                        <div className="border border-border rounded-lg overflow-hidden">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <EditorToolbar
                                textareaRef={textareaRef}
                                onImageUpload={handleImageUploadTrigger}
                            />
                            <TextareaAutosize
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your blog in Markdown..."
                                minRows={20}
                                className="w-full px-4 py-4 bg-background text-foreground font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/40"
                            />
                        </div>

                        {/* Footer Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" /> {wordCount} words
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {readingTime} min read
                            </span>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div className="border border-border rounded-lg p-6 bg-card overflow-y-auto max-h-[calc(100vh-200px)] sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Preview
                            </h3>
                            <button
                                onClick={() => setShowPreview(!showPreview)}
                                className="text-muted-foreground hover:text-foreground transition-colors lg:hidden"
                            >
                                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {coverImageUrl && (
                            <img src={coverImageUrl} alt="Cover" className="w-full rounded-lg mb-6 aspect-video object-cover" />
                        )}

                        {title && (
                            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">{title}</h1>
                        )}
                        {subtitle && (
                            <p className="text-lg text-muted-foreground mb-6">{subtitle}</p>
                        )}

                        <MarkdownPreview content={content} />
                    </div>
                </div>
            </main>
        </div>
    );
}
