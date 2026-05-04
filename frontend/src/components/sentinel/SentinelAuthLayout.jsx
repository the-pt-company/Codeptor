import React from 'react';
import SentinelBackground from './SentinelBackground';

const NAV_LINKS = [
    { name: "Services", href: "#services" },
    { name: "About Us", href: "#about" },
    { name: "Projects", href: "#projects" },
    { name: "Team", href: "#team" },
    { name: "Contacts", href: "#contacts" }
];

const Navbar = () => {
    return (
        <nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-6 lg:px-12 py-6 bg-transparent">
            {/* Logo */}
            <div className="text-foreground text-xl font-bold tracking-tight uppercase font-sora">
                SENTINEL
            </div>

            {/* Links */}
            <div className="hidden xl:flex gap-8">
                {NAV_LINKS.map(link => (
                    <a 
                        key={link.name}
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest font-semibold font-sora"
                    >
                        {link.name}
                    </a>
                ))}
            </div>

            {/* CTA */}
            <button className="hidden xl:inline-flex items-center justify-center rounded-lg bg-nav-button hover:bg-nav-button/80 active:scale-[0.97] transition-all text-foreground text-xs font-bold uppercase tracking-widest px-6 py-3 font-sora">
                Get Quote
            </button>
        </nav>
    );
};

const HeroSection = () => {
    return (
        <section className="absolute inset-0 w-full h-full flex items-end overflow-hidden font-sora">
            <SentinelBackground />

            {/* Content container */}
            <div className="relative z-10 pointer-events-none w-full px-6 md:px-12 pb-12 lg:pb-20 pt-32">
                
                {/* Heading */}
                <h1 
                    className="opacity-0 animate-fade-up text-[clamp(3rem,8vw,6rem)] font-bold leading-[1.05] tracking-[-0.05em] text-foreground mb-2 md:mb-4 uppercase"
                    style={{ animationDelay: "0.2s" }}
                >
                    SENTINEL <span className="text-primary">AI</span>
                </h1>

                {/* Subheading */}
                <p 
                    className="opacity-0 animate-fade-up text-foreground/80 text-[clamp(1.125rem,2.5vw,1.875rem)] font-light mb-3 md:mb-6"
                    style={{ animationDelay: "0.4s" }}
                >
                    We implement security correctly.
                </p>

                {/* Description */}
                <p 
                    className="opacity-0 animate-fade-up text-muted-foreground text-[clamp(0.875rem,1.2vw,1.25rem)] font-light max-w-xl mb-6 md:mb-8"
                    style={{ animationDelay: "0.55s" }}
                >
                    Enterprise security systems built in days. AI-powered surveillance deployed with zero-trust architecture. Smart access control set up for your entire facility. All of it done right, not just fast.
                </p>

                {/* CTA Buttons */}
                <div 
                    className="opacity-0 animate-fade-up flex flex-wrap gap-3 font-bold mb-6 md:mb-10"
                    style={{ animationDelay: "0.7s" }}
                >
                    <button className="pointer-events-auto bg-primary text-primary-foreground px-6 py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-110 transition-all active:scale-[0.97]">
                        Book a Call
                    </button>
                    <button className="pointer-events-auto bg-white text-background px-6 py-3 md:px-8 md:py-4 text-sm rounded-sm cursor-pointer hover:brightness-90 transition-all active:scale-[0.97]">
                        Our Work
                    </button>
                </div>

                {/* Trust Line */}
                <p 
                    className="opacity-0 animate-fade-up text-muted-foreground/60 text-xs font-light"
                    style={{ animationDelay: "0.85s" }}
                >
                    Trusted security partner. Columbus, OH. 12 systems deployed.
                </p>
            </div>
        </section>
    );
};

export const SentinelAuthLayout = ({ children }) => {
    return (
        <div className="sentinel-theme min-h-screen flex flex-col lg:flex-row selection:bg-primary selection:text-primary-foreground overflow-x-hidden bg-background">
            {/* Left Side - Landing */}
            <div className="w-full lg:w-1/2 relative min-h-[90svh] lg:min-h-screen flex flex-col shrink-0">
                <Navbar />
                <HeroSection />
            </div>

            {/* Right Side - Auth */}
            <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 py-12 lg:p-12 bg-background border-t lg:border-t-0 lg:border-l border-border/30">
                {children}
            </div>
        </div>
    );
};
