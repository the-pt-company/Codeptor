import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { FeatureCard } from '../components/FeatureCard';
import { useAuth } from '../context/AuthContext';
import { Code2, Zap, Users, PenSquare, ArrowRight, Plus } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Home Page — Cinematic hero with fullscreen video background                 */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  useNavigate();

  const ctaDest  = isAuthenticated ? '/dashboard' : '/register';
  const userName = user?.full_name?.split(' ')[0] || 'Developer';

  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION — fullscreen video + glassmorphic nav + cinematic type
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* ── Fullscreen background video ── */}
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
            type="video/mp4"
          />
        </video>

        {/* ── Navigation Bar ── */}
        <nav
          aria-label="Main navigation"
          className="relative z-10 w-full"
        >
          <div className="flex flex-row items-center justify-between px-8 py-6 max-w-7xl mx-auto">

            {/* Logo */}
            <Link
              to="/"
              className="text-3xl tracking-tight text-foreground no-underline hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              KudosDev<sup className="text-xs">®</sup>
            </Link>

            {/* Nav links — hidden on mobile */}
            <div className="hidden md:flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard"       className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Projects</Link>
                  <Link to="/dashboard/blogs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">My Blogs</Link>
                  <Link to="/explore"         className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
                  <Link to="/contribute"      className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contribute</Link>
                </>
              ) : (
                <>
                  <Link to="/explore"   className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
                  <Link to="/contribute" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contribute</Link>
                  <Link to="/login"     className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
                </>
              )}
            </div>

            {/* Right-side CTA */}
            {isAuthenticated ? (
              <Link
                to="/publish"
                className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground transition-transform hover:scale-[1.03] cursor-pointer no-underline flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Publish Project
              </Link>
            ) : (
              <Link
                to="/register"
                className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground transition-transform hover:scale-[1.03] cursor-pointer no-underline"
              >
                Sign Up
              </Link>
            )}
          </div>
        </nav>

        {/* ── Hero Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-40 flex-1 justify-center">

          {/* H1 — cinematic headline */}
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-normal leading-[0.95] max-w-7xl animate-fade-rise"
            style={{
              fontFamily: "'Instrument Serif', serif",
              letterSpacing: '-2.46px',
            }}
          >
            {isAuthenticated ? (
              <>
                Welcome back,{' '}
                <em className="not-italic text-muted-foreground">{userName}.</em>
              </>
            ) : (
              <>
                Where <em className="not-italic text-muted-foreground">dreams</em> rise{' '}
                <em className="not-italic text-muted-foreground">through the silence.</em>
              </>
            )}
          </h1>

          {/* Subtext */}
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
            {isAuthenticated
              ? `Your workspace awaits, ${userName}. Keep building, keep growing, keep shipping.`
              : "We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work."
            }
          </p>

          {/* Hero CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 animate-fade-rise-delay-2">
            <Link
              to={ctaDest}
              className="liquid-glass rounded-full px-14 py-5 text-base text-foreground hover:scale-[1.03] cursor-pointer no-underline transition-transform inline-block"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Begin Journey'}
            </Link>

            {isAuthenticated && (
              <Link
                to={`/profile/${user?.username}`}
                className="liquid-glass rounded-full px-10 py-5 text-base text-foreground hover:scale-[1.03] cursor-pointer no-underline transition-transform inline-block"
              >
                View Profile
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BELOW-THE-FOLD SECTIONS (unchanged content, updated theme)
         ══════════════════════════════════════════════════════════════════════ */}

      {/* Blog Writing Section */}
      <section className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3 block">
                Developer Blog
              </span>
              <h2
                className="font-bold text-3xl md:text-4xl tracking-tight text-foreground mb-4"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Write what's on your mind
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                A beautiful writing experience built for developers. Write dev logs, tutorials,
                and opinions with live markdown preview, syntax highlighting, and one-click publishing.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {['Live Preview', 'Syntax Highlighting', 'Auto-Save', 'Social Sharing', 'Reactions'].map((f) => (
                  <span
                    key={f}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <Link
                to={isAuthenticated ? '/blog/new' : '/register'}
                className="inline-flex items-center gap-2 text-foreground font-medium hover:underline transition-all"
              >
                {isAuthenticated ? 'Start Writing' : 'Get Started'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">blog-editor.md</span>
              </div>
              <div className="font-mono text-sm space-y-1.5 text-muted-foreground">
                <p><span className="text-foreground/60"># </span><span className="text-foreground font-medium">Building a REST API with FastAPI</span></p>
                <p className="text-muted-foreground/60">---</p>
                <p>Today I learned how to build a <span className="text-yellow-500">**blazing fast**</span> API</p>
                <p>using <span className="text-foreground/80">FastAPI</span> and <span className="text-foreground/80">Firestore</span>.</p>
                <p className="mt-2"><span className="text-green-500">```python</span></p>
                <p className="text-foreground">@app.get("/api/blogs")</p>
                <p className="text-foreground">async def get_blogs():</p>
                <p className="text-foreground">    return await db.blogs.find()</p>
                <p><span className="text-green-500">```</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="font-bold text-3xl text-center text-foreground mb-16"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Why Developers Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group"><FeatureCard icon={Code2}     title="Showcase Projects" description="Display your work with detailed project pages, tech stacks, and live demos" /></div>
            <div className="group"><FeatureCard icon={PenSquare} title="Developer Blog"    description="Write tutorials, dev logs, and opinions with markdown, reactions, and social sharing" /></div>
            <div className="group"><FeatureCard icon={Zap}       title="Track Progress"   description="Monitor your development journey and celebrate your achievements" /></div>
            <div className="group"><FeatureCard icon={Users}     title="Join Community"   description="Connect with fellow developers and grow your professional network" /></div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
