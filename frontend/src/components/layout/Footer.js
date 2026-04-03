import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { BrandLogo } from './BrandLogo';

export const Footer = () => {
    const [newsletterEmail, setNewsletterEmail] = useState('');

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNewsletterJoin = () => {
        const email = newsletterEmail.trim();
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }

        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!isValidEmail) {
            toast.error('Please enter a valid email address');
            return;
        }

        window.location.href = `mailto:kudosdev7@gmail.com?subject=${encodeURIComponent('Newsletter Subscription Request')}&body=${encodeURIComponent(`Please add ${email} to the KudosDev newsletter list.`)}`;
        setNewsletterEmail('');
        toast.success('Opening your mail app to complete subscription');
    };

    return (
        <footer className="bg-card border-t border-border pt-16 pb-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-white rounded-lg border border-border flex items-center justify-center group-hover:rotate-6 transition-transform">
                                <BrandLogo size={28} color="#111111" />
                            </div>
                            <span className="font-heading font-bold text-2xl text-foreground tracking-tight">
                                KudosDev
                            </span>
                        </Link>
                        <p className="text-muted-foreground leading-relaxed max-w-xs">
                            The premier platform for developers to showcase their work, build public credibility, and connect with technical opportunities.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground" aria-label="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground" aria-label="X (formerly Twitter)">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all text-muted-foreground" aria-label="LinkedIn">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h4 className="font-heading font-bold text-lg mb-6 text-foreground">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link to="/explore" className="text-muted-foreground hover:text-foreground transition-colors">Explore Projects</Link></li>
                            <li><Link to="/contribute" className="text-muted-foreground hover:text-foreground transition-colors">Contribute</Link></li>
                            <li><Link to="/publish" className="text-muted-foreground hover:text-foreground transition-colors">Publish Project</Link></li>
                            <li><Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dev Dashboard</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-heading font-bold text-lg mb-6 text-foreground">Resources</h4>
                        <ul className="space-y-4">
                            <li><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Documentation</span></li>
                            <li><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Blog & Updates</span></li>
                            <li><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">API Reference</span></li>
                            <li><span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Community Forum</span></li>
                        </ul>
                    </div>

                    {/* Newsletter / Newsletter */}
                    <div className="space-y-6">
                        <h4 className="font-heading font-bold text-lg text-foreground">Stay Updated</h4>
                        <p className="text-sm text-muted-foreground">
                            Join our newsletter for the latest projects and developer insights.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={newsletterEmail}
                                onChange={(e) => setNewsletterEmail(e.target.value)}
                                placeholder="Email address"
                                className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                                type="button"
                                onClick={handleNewsletterJoin}
                                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-all"
                            >
                                Join
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            <a
                                href="mailto:kudosdev7@gmail.com"
                                className="hover:text-foreground transition-colors"
                            >
                                kudosdev7@gmail.com
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>© 2026 KudosDev Inc.</span>
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                    </div>
                    <button
                        onClick={scrollToTop}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all group"
                    >
                        <span>Back to top</span>
                        <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                            <ArrowUp className="w-4 h-4" />
                        </div>
                    </button>
                </div>
            </div>
        </footer>
    );
};
