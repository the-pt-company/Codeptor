import React from 'react';
import { Code2, Layers, Wrench } from 'lucide-react';

/**
 * SkillsSection - Displays categorized skills with level indicators
 */
export const SkillsSection = ({ skills, isOwnProfile }) => {
    // Default skill categories if not provided
    const defaultCategories = {
        languages: [],
        frameworks: [],
        tools: []
    };

    // Parse skills into categories (basic implementation)
    const categorizeSkills = (skillList) => {
        if (!skillList || skillList.length === 0) return defaultCategories;

        const languageKeywords = ['JavaScript', 'Python', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin'];
        const frameworkKeywords = ['React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express', 'Django', 'FastAPI', 'Flask', 'Spring', 'Rails', 'Laravel'];
        const toolKeywords = ['Git', 'Docker', 'AWS', 'Azure', 'GCP', 'Kubernetes', 'Firestore', 'PostgreSQL', 'Redis', 'GraphQL', 'REST', 'CI/CD'];

        const categories = { languages: [], frameworks: [], tools: [] };

        skillList.forEach(skill => {
            if (languageKeywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()))) {
                categories.languages.push(skill);
            } else if (frameworkKeywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()))) {
                categories.frameworks.push(skill);
            } else if (toolKeywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()))) {
                categories.tools.push(skill);
            } else {
                // Default to frameworks for uncategorized
                categories.frameworks.push(skill);
            }
        });

        return categories;
    };

    const categorizedSkills = categorizeSkills(skills);

    const categoryConfig = [
        { key: 'languages', label: 'Languages', icon: Code2, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
        { key: 'frameworks', label: 'Frameworks', icon: Layers, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        { key: 'tools', label: 'Tools', icon: Wrench, color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    ];

    const hasSkills = Object.values(categorizedSkills).some(arr => arr.length > 0);

    if (!hasSkills) {
        return (
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
                    Skills & Tech Stack
                </h2>
                <p className="text-muted-foreground text-sm">
                    {isOwnProfile
                        ? 'Add skills to your profile to showcase your expertise.'
                        : 'No skills listed yet.'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
                Skills & Tech Stack
            </h2>
            <div className="space-y-4">
                {categoryConfig.map(({ key, label, icon: Icon, color }) => {
                    const categorySkills = categorizedSkills[key];
                    if (categorySkills.length === 0) return null;

                    return (
                        <div key={key}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">{label}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {categorySkills.map(skill => (
                                    <span
                                        key={skill}
                                        className={`text-xs px-3 py-1.5 rounded-full font-medium ${color}`}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SkillsSection;
