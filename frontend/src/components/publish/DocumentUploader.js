import React, { useState, useRef } from 'react';
import { Upload, X, FileText, FileCheck, AlertCircle } from 'lucide-react';

/**
 * DocumentUploader - Specifically for PDF, DOC, DOCX files
 */
export const DocumentUploader = ({
    value = null, // Can be a File object or a URL string
    fileName = '',
    onChange,
    onRemove,
    maxSizeMB = 10
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragIn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOut = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = (file) => {
        setError(null);

        // Validate extension
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const fileName = file.name.toLowerCase();
        const isValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));

        if (!isValidExt) {
            setError('Only .pdf, .doc, and .docx files are allowed.');
            return;
        }

        // Validate size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File is too large. Max size is ${maxSizeMB}MB.`);
            return;
        }

        onChange(file);
    };

    return (
        <div className="space-y-3">
            {!value ? (
                <div
                    onDragEnter={handleDragIn}
                    onDragLeave={handleDragOut}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-xl
                        p-10 text-center cursor-pointer
                        transition-all duration-200
                        ${isDragging
                            ? 'border-accent bg-accent/5'
                            : error 
                                ? 'border-destructive/50 bg-destructive/5' 
                                : 'border-border hover:border-accent/50 hover:bg-accent/5'
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                            if (e.target.files?.length) {
                                handleFile(e.target.files[0]);
                            }
                        }}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-4">
                        <div className={`
                            w-14 h-14 rounded-full flex items-center justify-center
                            ${isDragging ? 'bg-accent/20' : 'bg-muted'}
                            transition-colors
                        `}>
                            <Upload className={`
                                w-7 h-7 
                                ${isDragging ? 'text-accent' : 'text-muted-foreground'}
                            `} />
                        </div>

                        <div>
                            <p className="text-foreground font-semibold">
                                {isDragging ? 'Drop document here' : 'Click or drag document to upload'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                PDF, DOC, or DOCX up to {maxSizeMB}MB
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between p-4 bg-accent/5 border border-accent/20 rounded-xl group transition-all hover:border-accent/40">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-6 h-6 text-accent" />
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="font-medium text-foreground truncate">
                                {fileName || (value instanceof File ? value.name : 'Document Uploaded')}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                {value instanceof File ? `${(value.size / 1024 / 1024).toFixed(2)} MB` : 'Documentation Ready'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all ml-4"
                        title="Remove document"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/10 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
};
