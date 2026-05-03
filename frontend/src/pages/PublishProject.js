import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { projectAPI } from '../lib/api';
import {
    StepWizard,
    StepNavigation,
    TechStackSelector,
    TagInput,
    MediaUploader,
    VideoInput,
    VersionEntry,
    VersionEntryForm,
    DocumentUploader,
    MarkdownEditor
} from '../components/publish';
import { getErrorMessage } from '../lib/utils';

// Wizard step definitions
const STEPS = [
    { id: 'core', label: 'Core Info' },
    { id: 'stack', label: 'Tech & Links' },
    { id: 'media', label: 'Media & Docs' },
    { id: 'publish', label: 'Publish' }
];

// Category options
const CATEGORIES = [
    { value: 'web_app', label: 'Web App' },
    { value: 'mobile', label: 'Mobile App' },
    { value: 'backend', label: 'Backend / API' },
    { value: 'cli', label: 'CLI Tool' },
    { value: 'library', label: 'Library / Package' },
    { value: 'ai_ml', label: 'AI / ML' },
    { value: 'devops', label: 'DevOps' },
    { value: 'other', label: 'Other' }
];

// Difficulty levels
const DIFFICULTY_LEVELS = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
];

// Initial form state
const initialFormData = {
    // Step 1: Core Info
    title: '',
    tagline: '',
    description: '',
    category: 'web_app',
    difficulty: 'intermediate',

    // Step 2: Tech & Links
    tech_stack: [],
    github_url: '',
    live_url: '',
    versions: [],

    // Step 3: Media & Docs
    thumbnail: null,
    screenshots: [],
    video_url: '',
    documentation_file: null,
    documentation_url: '',

    // Step 4: Publish Settings
    visibility: 'public',
    status: 'active',
    tags: [],
    pinToProfile: false,
    enableComments: true,
    showInExplore: true
};

export default function PublishProject() {
    const navigate = useNavigate();
    const { projectId } = useParams();
    const isEditMode = Boolean(projectId);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [showVersionForm, setShowVersionForm] = useState(false);

    useEffect(() => {
        const loadProjectForEdit = async () => {
            if (!projectId) return;

            setIsLoading(true);
            try {
                const response = await projectAPI.getById(projectId);
                const project = response.data;
                const [tagline = '', ...descriptionLines] = (project.description || '').split('\n\n');

                setFormData({
                    ...initialFormData,
                    title: project.title || '',
                    tagline,
                    description: descriptionLines.join('\n\n'),
                    category: project.category || 'web_app',
                    tech_stack: project.tech_stack || [],
                    github_url: project.github_url || '',
                    live_url: project.live_url || '',
                    thumbnail: project.thumbnail_url
                        ? {
                            id: `existing-thumb-${project.project_id}`,
                            url: project.thumbnail_url,
                            name: 'Current thumbnail'
                        }
                        : null,
                    screenshots: (project.media_urls || []).map((url, index) => ({
                        id: `existing-shot-${index}-${project.project_id}`,
                        url,
                        name: `Screenshot ${index + 1}`
                    })),
                    documentation_file: null,
                    documentation_url: project.documentation_url || '',
                    visibility: project.visibility || 'public',
                    status:
                        project.status === 'completed'
                            ? 'active'
                            : project.status === 'archived'
                                ? 'archived'
                                : 'in_progress',
                });
            } catch (error) {
                toast.error(getErrorMessage(error, 'Failed to load project for editing'));
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        loadProjectForEdit();
    }, [projectId, navigate]);

    // Update form field
    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Navigation handlers
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    // Validate current step
    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.title.trim()) {
                    toast.error('Project name is required');
                    return false;
                }
                if (!formData.tagline.trim()) {
                    toast.error('Tagline is required');
                    return false;
                }
                if (!formData.description.trim()) {
                    toast.error('Description is required');
                    return false;
                }
                return true;
            case 2:
                if (formData.tech_stack.length === 0) {
                    toast.error('Add at least one technology');
                    return false;
                }
                if (!formData.github_url.trim()) {
                    toast.error('GitHub Repository URL is mandatory for contribution');
                    return false;
                }
                return true;
            case 3:
                return true;
            case 4:
                return true;
            default:
                return true;
        }
    };

    // Save as draft
    const handleSaveDraft = async () => {
        try {
            toast.success('Draft saved successfully');
            // TODO: Implement draft saving to localStorage or backend
        } catch (error) {
            toast.error('Failed to save draft');
        }
    };

    // Publish project
    const handlePublish = async () => {
        if (!validateStep(currentStep)) return;

        setIsLoading(true);
        try {
            let finalDocUrl = formData.documentation_url;
            let thumbnailUrl = null;
            let screenshotUrls = [];

            const uploadProjectImage = async (mediaItem) => {
                if (mediaItem?.url && !mediaItem?.file) return mediaItem.url;
                if (!mediaItem?.file) return null;

                const imageData = new FormData();
                imageData.append('file', mediaItem.file);
                const uploadRes = await projectAPI.uploadImage(imageData);
                return uploadRes.data.url;
            };

            if (formData.thumbnail?.file) {
                thumbnailUrl = await uploadProjectImage(formData.thumbnail);
            }

            if (formData.screenshots.length > 0) {
                screenshotUrls = (await Promise.all(
                    formData.screenshots.map((item) => uploadProjectImage(item))
                )).filter(Boolean);
            }

            // Upload documentation if file exists
            if (formData.documentation_file) {
                const docData = new FormData();
                docData.append('file', formData.documentation_file);
                const uploadRes = await projectAPI.uploadDocument(docData);
                finalDocUrl = uploadRes.data.url;
            }

            const projectData = {
                title: formData.title,
                description: `${formData.tagline}\n\n${formData.description}`,
                tech_stack: formData.tech_stack,
                category: formData.category,
                status: formData.status === 'active' ? 'completed' :
                    formData.status === 'in_progress' ? 'in_progress' : 'archived',
                github_url: formData.github_url,
                live_url: formData.live_url || null,
                thumbnail_url: thumbnailUrl,
                media_urls: screenshotUrls,
                documentation_url: finalDocUrl,
                video_url: formData.video_url || null,
                visibility: formData.visibility
            };

            if (isEditMode) {
                await projectAPI.update(projectId, projectData);
                toast.success('Project updated successfully!');
            } else {
                await projectAPI.create(projectData);
                toast.success('Project published successfully!');
            }
            navigate('/dashboard');
        } catch (error) {
            console.error('Publish error:', error);
            toast.error(getErrorMessage(error, 'Failed to publish project'));
        } finally {
            setIsLoading(false);
        }
    };

    // Add version entry
    const addVersion = (versionData) => {
        const newVersion = {
            ...versionData,
            id: Date.now(),
            date: new Date().toISOString()
        };
        updateField('versions', [newVersion, ...formData.versions]);
        setShowVersionForm(false);
    };

    // Remove version
    const removeVersion = (id) => {
        updateField('versions', formData.versions.filter(v => v.id !== id));
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1CoreInfo formData={formData} updateField={updateField} />;
            case 2:
                return (
                    <Step2TechLinks
                        formData={formData}
                        updateField={updateField}
                        showVersionForm={showVersionForm}
                        setShowVersionForm={setShowVersionForm}
                        addVersion={addVersion}
                        removeVersion={removeVersion}
                    />
                );
            case 3:
                return <Step3Media formData={formData} updateField={updateField} />;
            case 4:
                return <Step4Publish formData={formData} updateField={updateField} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                                    Step {currentStep}/{STEPS.length}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs font-mono uppercase tracking-wider text-accent">
                                    {STEPS[currentStep - 1].label}
                                </span>
                            </div>
                            <h1 className="font-heading font-bold text-2xl tracking-tight text-foreground mt-1">
                                {isEditMode ? 'Edit Project' : 'Publish Project'}
                            </h1>
                        </div>
                    </div>
                    <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Wizard */}
                <StepWizard steps={STEPS} currentStep={currentStep}>
                    {renderStepContent()}

                    <StepNavigation
                        currentStep={currentStep}
                        totalSteps={STEPS.length}
                        onBack={handleBack}
                        onNext={handleNext}
                        onSaveDraft={handleSaveDraft}
                        onPublish={handlePublish}
                        isLoading={isLoading}
                        canProceed={true}
                    />
                </StepWizard>
            </main>
            <Footer />
        </div>
    );
}

// Step 1: Core Info
function Step1CoreInfo({ formData, updateField }) {
    return (
        <div className="space-y-6">
            {/* Project Name */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Project Name <span className="text-destructive">*</span>
                </label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., KudosDev Platform"
                    className="
                        w-full px-4 py-3 rounded-md
                        border border-input bg-background
                        text-foreground text-lg
                        placeholder:text-muted-foreground
                        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                        transition-all
                    "
                />
            </div>

            {/* Tagline */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Tagline <span className="text-destructive">*</span>
                </label>
                <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="A brief, catchy description of your project"
                    className="
                        w-full px-4 py-2.5 rounded-md
                        border border-input bg-background
                        text-foreground
                        placeholder:text-muted-foreground
                        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                        transition-all
                    "
                />
            </div>

            {/* Description (Markdown Editor) */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Description <span className="text-destructive">*</span>
                </label>
                <MarkdownEditor
                    value={formData.description}
                    onChange={(value) => updateField('description', value)}
                    placeholder="Describe your project in detail using Markdown. What problem does it solve? How does it work? Include code examples, architecture decisions, or feature highlights."
                    minHeight="240px"
                />
                <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Supports **bold**, *italic*, `code`, headings, lists, and links
                    </p>
                    <span className="text-xs text-muted-foreground">
                        {formData.description.length}/2000 characters
                    </span>
                </div>
            </div>

            {/* Category and Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Category <span className="text-destructive">*</span>
                    </label>
                    <select
                        value={formData.category}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="
                            w-full px-4 py-2.5 rounded-md
                            border border-input bg-background
                            text-foreground
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                            transition-all
                        "
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Difficulty Level
                    </label>
                    <select
                        value={formData.difficulty}
                        onChange={(e) => updateField('difficulty', e.target.value)}
                        className="
                            w-full px-4 py-2.5 rounded-md
                            border border-input bg-background
                            text-foreground
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                            transition-all
                        "
                    >
                        {DIFFICULTY_LEVELS.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

// Step 2: Tech Stack & Links
function Step2TechLinks({ formData, updateField, showVersionForm, setShowVersionForm, addVersion, removeVersion }) {
    return (
        <div className="space-y-8">
            {/* Tech Stack */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Tech Stack Used <span className="text-destructive">*</span>
                </label>
                <TechStackSelector
                    value={formData.tech_stack}
                    onChange={(value) => updateField('tech_stack', value)}
                    placeholder="Add technologies used..."
                />
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        GitHub Repository URL <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="url"
                        value={formData.github_url}
                        onChange={(e) => updateField('github_url', e.target.value)}
                        placeholder="https://github.com/..."
                        className="
                            w-full px-4 py-2.5 rounded-md
                            border border-input bg-background
                            text-foreground font-mono text-sm
                            placeholder:text-muted-foreground
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                            transition-all
                        "
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Live Demo URL
                    </label>
                    <input
                        type="url"
                        value={formData.live_url}
                        onChange={(e) => updateField('live_url', e.target.value)}
                        placeholder="https://demo.app/..."
                        className="
                            w-full px-4 py-2.5 rounded-md
                            border border-input bg-background
                            text-foreground font-mono text-sm
                            placeholder:text-muted-foreground
                            focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                            transition-all
                        "
                    />
                </div>
            </div>

            {/* Version History */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                        Version History (Changelog)
                    </label>
                </div>

                <div className="space-y-0">
                    {formData.versions.map((v, index) => (
                        <VersionEntry
                            key={v.id}
                            version={v.version}
                            description={v.description}
                            date={v.date}
                            isLatest={index === 0}
                            onEdit={() => { }}
                            onDelete={() => removeVersion(v.id)}
                        />
                    ))}

                    {showVersionForm ? (
                        <VersionEntryForm
                            onSave={addVersion}
                            onCancel={() => setShowVersionForm(false)}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowVersionForm(true)}
                            className="
                                w-full py-3 rounded-md
                                border-2 border-dashed border-border
                                text-sm text-muted-foreground
                                hover:border-accent hover:text-accent
                                transition-colors
                            "
                        >
                            + Add Version Entry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Step 3: Media & Documentation
function Step3Media({ formData, updateField }) {
    return (
        <div className="space-y-8">
            {/* Thumbnail */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Thumbnail Image
                </label>
                <MediaUploader
                    value={formData.thumbnail ? [formData.thumbnail] : []}
                    onChange={(files) => updateField('thumbnail', files[0] || null)}
                    maxFiles={1}
                />
            </div>

            {/* Screenshots */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Screenshots Gallery
                </label>
                <MediaUploader
                    value={formData.screenshots}
                    onChange={(files) => updateField('screenshots', files)}
                    maxFiles={5}
                />
            </div>

            {/* Demo Video */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Demo Video
                </label>
                <VideoInput
                    value={formData.video_url}
                    onChange={(value) => updateField('video_url', value)}
                />
            </div>

            {/* Documentation File */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Project Documentation
                </label>
                <DocumentUploader
                    value={formData.documentation_file || formData.documentation_url}
                    fileName={formData.documentation_file?.name || (formData.documentation_url ? 'Current documentation' : '')}
                    onChange={(file) => updateField('documentation_file', file)}
                    onRemove={() => {
                        updateField('documentation_file', null);
                        updateField('documentation_url', '');
                    }}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                    Upload a .pdf, .doc, or .docx file containing detailed project documentation.
                </p>
            </div>
        </div>
    );
}

// Step 4: Publish Settings
function Step4Publish({ formData, updateField }) {
    return (
        <div className="space-y-8">
            {/* Visibility */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                    Visibility
                </label>
                <div className="space-y-3">
                    {[
                        { value: 'public', label: 'Public', description: 'Anyone can discover and view this project' },
                        { value: 'private', label: 'Private', description: 'Only you can see this project' },
                        { value: 'unlisted', label: 'Unlisted', description: 'Accessible via direct link only' }
                    ].map((option) => (
                        <label
                            key={option.value}
                            className={`
                                flex items-start gap-3 p-4 rounded-md border cursor-pointer
                                transition-colors
                                ${formData.visibility === option.value
                                    ? 'border-accent bg-accent/5'
                                    : 'border-border hover:border-muted-foreground'
                                }
                            `}
                        >
                            <input
                                type="radio"
                                name="visibility"
                                value={option.value}
                                checked={formData.visibility === option.value}
                                onChange={(e) => updateField('visibility', e.target.value)}
                                className="mt-1"
                            />
                            <div>
                                <div className="font-medium text-foreground">{option.label}</div>
                                <div className="text-sm text-muted-foreground">{option.description}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Status */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                    Project Status
                </label>
                <div className="flex gap-3">
                    {[
                        { value: 'active', label: 'Active' },
                        { value: 'in_progress', label: 'In Progress' },
                        { value: 'archived', label: 'Archived' }
                    ].map((option) => (
                        <label
                            key={option.value}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer
                                transition-colors
                                ${formData.status === option.value
                                    ? 'border-accent bg-accent/10 text-accent'
                                    : 'border-border text-muted-foreground hover:text-foreground'
                                }
                            `}
                        >
                            <input
                                type="radio"
                                name="status"
                                value={option.value}
                                checked={formData.status === option.value}
                                onChange={(e) => updateField('status', e.target.value)}
                                className="sr-only"
                            />
                            <span className="text-sm font-medium">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Tags
                </label>
                <TagInput
                    value={formData.tags}
                    onChange={(value) => updateField('tags', value)}
                />
            </div>

            {/* Options */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                    Options
                </label>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.pinToProfile}
                            onChange={(e) => updateField('pinToProfile', e.target.checked)}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span className="text-sm text-foreground">Pin this project to my profile</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.enableComments}
                            onChange={(e) => updateField('enableComments', e.target.checked)}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span className="text-sm text-foreground">Enable comments and feedback</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.showInExplore}
                            onChange={(e) => updateField('showInExplore', e.target.checked)}
                            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span className="text-sm text-foreground">Show in Explore page</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
