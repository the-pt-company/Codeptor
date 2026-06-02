import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { FeatureCard } from '../components/FeatureCard';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Code2, Zap, Users, PenSquare, ArrowRight, Plus, Sun, Moon } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Dark-mode video URL                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */
const DARK_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_102933_4e8f73b5-775a-4179-b2fb-472f59063dcd.mp4';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Vanta CLOUDS background (light mode only)                                   */
/* ─────────────────────────────────────────────────────────────────────────── */
function VantaClouds() {
  const elRef  = useRef(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const THREE     = await import('three');
      const VantaMod  = await import('vanta/dist/vanta.clouds.min');
      const CLOUDS    = VantaMod.default || VantaMod;

      if (cancelled || !elRef.current) return;

      vantaRef.current = CLOUDS({
        el:            elRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls:  false,
        minHeight:     200,
        minWidth:      200,
        /* softer, pastel cloud palette */
        skyColor:      0xc8dff5,
        cloudColor:    0xe8f0f8,
        cloudShadowColor: 0x8aabc8,
        sunColor:      0xffd580,
        sunGlareColor: 0xffe0a0,
        sunlightColor: 0xfff8e8,
        speed:         0.8,
      });
    }

    init();

    return () => {
      cancelled = true;
      if (vantaRef.current) {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={elRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full z-0"
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Home Page                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme }    = useTheme();

  const isDark   = theme === 'dark';
  const ctaDest  = isAuthenticated ? '/dashboard' : '/register';
  const userName = user?.full_name?.split(' ')[0] || 'Developer';

  return (
    <div className="bg-background text-foreground min-h-screen overflow-x-hidden">

      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION
         ════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* ── Dark mode: fullscreen looping video ── */}
        {isDark && (
          <video
            key="dark-video"
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover z-0"
          >
            <source src={DARK_VIDEO} type="video/mp4" />
          </video>
        )}

        {/* ── Dark mode: radial vignette to pull focus to center ── */}
        {isDark && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1]"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
            }}
          />
        )}

        {/* ── Light mode: Vanta CLOUDS interactive background ── */}
        {!isDark && <VantaClouds />}

        {/* ── Light mode: gentle brightness wash over clouds ── */}
        {!isDark && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] bg-white/10"
          />
        )}

        {/* ════════════════════════════════════════════════════════════════
            NAVIGATION BAR
           ════════════════════════════════════════════════════════════════ */}
        <nav
          aria-label="Main navigation"
          className={`relative z-10 w-full transition-all duration-300 ${
            isDark
              ? ''
              : 'bg-white/25 backdrop-blur-md border-b border-white/40 shadow-sm'
          }`}
        >
          <div className="flex flex-row items-center justify-between px-8 py-6 max-w-7xl mx-auto">

            {/* Logo */}
            <Link
              to="/"
              className="text-3xl tracking-tight text-foreground no-underline hover:opacity-80 transition-opacity select-none"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              KudosDev<sup className="text-xs align-super">®</sup>
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
                  <Link to="/explore"    className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore</Link>
                  <Link to="/contribute" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contribute</Link>
                  <Link to="/login"      className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
                </>
              )}
            </div>

            {/* Right-side controls */}
            <div className="flex items-center gap-3">
              {/* Theme toggle */}
              <button
                type="button"
                id="theme-toggle"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="liquid-glass rounded-full p-2.5 text-foreground transition-transform hover:scale-[1.08] cursor-pointer flex items-center justify-center"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Primary nav CTA */}
              {isAuthenticated ? (
                <Link
                  to="/publish"
                  className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground transition-transform hover:scale-[1.03] no-underline flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Publish Project
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground transition-transform hover:scale-[1.03] no-underline"
                >
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* ════════════════════════════════════════════════════════════════
            HERO CONTENT
           ════════════════════════════════════════════════════════════════ */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-40 flex-1 justify-center">

          {/* H1 */}
          <h1
            className="text-5xl sm:text-7xl md:text-8xl font-normal leading-[0.95] max-w-7xl text-foreground animate-fade-rise"
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
              className="liquid-glass rounded-full px-14 py-5 text-base text-foreground hover:scale-[1.03] no-underline transition-transform"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Begin Journey'}
            </Link>

            {isAuthenticated && (
              <Link
                to={`/profile/${user?.username}`}
                className="liquid-glass rounded-full px-10 py-5 text-base text-foreground hover:scale-[1.03] no-underline transition-transform"
              >
                View Profile
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          BELOW-THE-FOLD SECTIONS
         ════════════════════════════════════════════════════════════════════ */}

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
                  <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
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
