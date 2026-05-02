import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

// Common tech stacks for autocomplete suggestions
const POPULAR_TECH = [
    'React', 'Vue.js', 'Angular', 'Next.js', 'Svelte',
    'Node.js', 'Express', 'FastAPI', 'Django', 'Flask',
    'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java',
    'Firestore', 'PostgreSQL', 'MySQL', 'Redis', 'Supabase',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Vercel', 'Netlify',
    'TailwindCSS', 'GraphQL', 'REST API', 'WebSocket',
    'Firebase', 'Prisma', 'SQLite', 'Electron', 'React Native'
];

/**
 * TechStackSelector - Auto-complete chip input for selecting technologies
 */
export const TechStackSelector = ({
    value = [],
    onChange,
    placeholder = 'Add technology...',
    maxTags = 10
}) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Filter suggestions based on input
    useEffect(() => {
        if (inputValue.trim()) {
            const filtered = POPULAR_TECH.filter(
                tech =>
                    tech.toLowerCase().includes(inputValue.toLowerCase()) &&
                    !value.includes(tech)
            ).slice(0, 8);
            setSuggestions(filtered);
            setHighlightedIndex(0);
        } else {
            setSuggestions([]);
        }
    }, [inputValue, value]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
            onChange([...value, trimmedTag]);
            setInputValue('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0 && showSuggestions) {
                addTag(suggestions[highlightedIndex]);
            } else if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1]);
        } else if (e.key === 'ArrowDown' && showSuggestions) {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp' && showSuggestions) {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev > 0 ? prev - 1 : suggestions.length - 1
            );
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <div
                className={`
                    flex flex-wrap gap-2 p-3 
                    rounded-md border border-input bg-background
                    focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
                    transition-all
                `}
                onClick={() => inputRef.current?.focus()}
            >
                {/* Tags */}
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="
                            inline-flex items-center gap-1 
                            px-2.5 py-1 rounded-md
                            bg-muted text-foreground
                            text-sm font-mono
                            group
                        "
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                            className="
                                text-muted-foreground hover:text-destructive
                                transition-colors p-0.5 rounded
                                hover:bg-destructive/10
                            "
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {/* Input */}
                {value.length < maxTags && (
                    <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={handleKeyDown}
                            placeholder={value.length === 0 ? placeholder : 'Add more...'}
                            className="
                                flex-1 bg-transparent outline-none
                                text-sm text-foreground
                                placeholder:text-muted-foreground
                            "
                        />
                    </div>
                )}
            </div>

            {/* Counter */}
            <div className="mt-1 text-xs text-muted-foreground text-right">
                {value.length}/{maxTags} technologies
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    className="
                        absolute z-50 w-full mt-1
                        bg-popover border border-border rounded-md shadow-lg
                        max-h-48 overflow-y-auto
                    "
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addTag(suggestion)}
                            className={`
                                w-full px-3 py-2 text-left text-sm
                                transition-colors
                                ${index === highlightedIndex
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-foreground hover:bg-muted'
                                }
                            `}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
