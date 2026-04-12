import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
import { BrandLogo } from '../components/layout/BrandLogo';
import { FeatureCard } from '../components/FeatureCard';
import { useAuth } from '../context/AuthContext';
import { Code2, Zap, Users, PenSquare, ArrowRight, Plus } from 'lucide-react';

/* ─── Inline styles & constants ─────────────────────────────────────────── */

const styles = {
  /* Page wrapper — white base */
  pageRoot: {
    background: '#ffffff',
    minHeight: '100vh',
    position: 'relative',
    overflowX: 'hidden',
  },

  /* Background glow layer */
  glowWrap: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute',
    top: '-120px',
    left: '-180px',
    width: '700px',
    height: '700px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,177,255,0.35) 0%, rgba(96,177,255,0) 70%)',
    filter: 'blur(60px)',
  },
  glow2: {
    position: 'absolute',
    top: '-60px',
    left: '-80px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(49,154,255,0.25) 0%, rgba(49,154,255,0) 70%)',
    filter: 'blur(80px)',
  },

  /* z-10 content layer */
  contentLayer: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '0 32px 0 32px',
  },

  /* ── Navbar ── */
  navbarWrap: {
    position: 'sticky',
    top: '30px',
    zIndex: 100,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '30px',
    marginBottom: '0px',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.30)',
    backdropFilter: 'blur(50px)',
    WebkitBackdropFilter: 'blur(50px)',
    border: '1px solid rgba(0,0,0,0.10)',
    boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.06)',
    width: 'fit-content',
  },
  navLogo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'Fustat', sans-serif",
    fontWeight: '800',
    fontSize: '18px',
    color: '#0a0a0a',
    letterSpacing: '-0.5px',
    paddingRight: '8px',
    marginRight: '4px',
    borderRight: '1px solid rgba(0,0,0,0.1)',
    textDecoration: 'none',
  },
  navLink: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    fontSize: '14px',
    color: '#374151',
    padding: '6px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'background 0.2s, color 0.2s',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
  },
  navSignUp: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '600',
    fontSize: '14px',
    color: '#ffffff',
    background: 'rgba(0,132,255,0.85)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    border: '1px solid rgba(255,255,255,0.25)',
    boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.35)',
    padding: '7px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    marginLeft: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  navArrowCircle: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.30)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
  },

  /* ── Hero layout ── */
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    alignItems: 'center',
    gap: '0px',
    paddingTop: '40px',
    paddingBottom: '40px',
    minHeight: '640px',
  },

  /* Hero Left */
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    paddingRight: '24px',
  },

  /* Social proof badge */
  ratingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderRadius: '100px',
    background: 'rgba(255,255,255,0.55)',
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: 'inset 0px 2px 4px rgba(255,255,255,0.5)',
    backdropFilter: 'blur(12px)',
    width: 'fit-content',
  },
  ratingStars: {
    display: 'flex',
    gap: '2px',
  },
  ratingStar: {
    color: '#FF801E',
    fontSize: '16px',
    lineHeight: 1,
  },
  ratingText: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    fontSize: '13px',
    color: '#374151',
    whiteSpace: 'nowrap',
  },

  /* Headline */
  headline: {
    fontFamily: "'Fustat', sans-serif",
    fontWeight: '800',
    fontSize: 'clamp(44px, 5.5vw, 75px)',
    lineHeight: '1.05',
    letterSpacing: '-2px',
    color: '#0a0a0a',
    margin: 0,
  },

  /* Subheadline */
  subHeadline: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '400',
    fontSize: '18px',
    lineHeight: '1.65',
    letterSpacing: '-1px',
    color: '#6B7280',
    maxWidth: '480px',
    margin: 0,
  },

  /* Primary CTA */
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '600',
    fontSize: '16px',
    color: '#ffffff',
    background: 'rgba(0,132,255,0.80)',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    border: '1px solid rgba(255,255,255,0.20)',
    boxShadow: 'inset 0px 4px 4px 0px rgba(255,255,255,0.35), 0 8px 24px rgba(0,132,255,0.25)',
    padding: '14px 28px',
    borderRadius: '16px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'transform 0.22s ease, box-shadow 0.22s ease',
    width: 'fit-content',
  },
  ctaArrow: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.28)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
  },

  /* Hero Right */
  heroRight: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  orbVideo: {
    width: '100%',
    maxWidth: '600px',
    transform: 'scale(1.25)',
    mixBlendMode: 'screen',
    filter: 'hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)',
    display: 'block',
    pointerEvents: 'none',
    userSelect: 'none',
  },

  /* ── Trusted logos strip ── */
  trustedSection: {
    padding: '24px 0 60px',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    marginTop: '16px',
  },
  trustedLabel: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
    fontSize: '13px',
    color: '#9CA3AF',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: '28px',
  },
  trustedLogos: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '48px',
    opacity: 0.45,
    filter: 'grayscale(1)',
  },
};

/* ─── SVG placeholder logos ─────────────────────────────────────────────── */

/* ─── Hover helpers via React state ─────────────────────────────────────── */

/* ─── Hover helpers via React state ─────────────────────────────────────── */
function NavLinkItem({ to, children, style }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link
      to={to}
      style={{
        ...styles.navLink,
        ...(hovered ? { background: 'rgba(0,0,0,0.06)', color: '#0a0a0a' } : {}),
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}

function HoverBtn({ to, children, baseStyle }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link
      to={to}
      style={{
        ...baseStyle,
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered
          ? 'inset 0px 4px 4px 0px rgba(255,255,255,0.35), 0 12px 32px rgba(0,132,255,0.35)'
          : baseStyle.boxShadow,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function Home() {
  const { isAuthenticated, user } = useAuth();
  useNavigate();

  /* Responsive: collapse hero grid on narrow screens */
  const [isNarrow, setIsNarrow] = React.useState(window.innerWidth < 900);
  React.useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const ctaDest = isAuthenticated ? '/dashboard' : '/register';
  const ctaLabel = isAuthenticated ? `Welcome back, ${user?.full_name?.split(' ')[0] || 'Developer'}` : 'Get Started Now';

  return (
    <div style={styles.pageRoot}>

      {/* ── Background glow ── */}
      <div style={styles.glowWrap}>
        <div style={styles.glow1} />
        <div style={styles.glow2} />
      </div>

      {/* ── HERO BLOCK (navbar + hero content inside one bg context) ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1600px', margin: '0 auto', padding: '0 32px' }}>

        {/* ── Glassy Navbar ── */}
        <div style={styles.navbarWrap}>
          <nav style={styles.navbar} aria-label="Main navigation">
            {/* Logo */}
            <Link to="/" style={styles.navLogo}>
              <BrandLogo size={28} />
              <span>Codeptor</span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Authenticated nav */}
                <HoverBtn to="/publish" baseStyle={{
                  ...styles.navSignUp,
                  marginLeft: '4px',
                  marginRight: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}>
                  <Plus style={{ width: '14px', height: '14px' }} />
                  <span>Publish Project</span>
                </HoverBtn>
                <NavLinkItem to="/dashboard">My Projects</NavLinkItem>
                <NavLinkItem to="/dashboard/blogs">My Blogs</NavLinkItem>
                <NavLinkItem to="/explore">Explore</NavLinkItem>
                <NavLinkItem to="/contribute">Contribute</NavLinkItem>
              </>
            ) : (
              <>
                {/* Guest nav */}
                <NavLinkItem to="/explore">Explore</NavLinkItem>
                <NavLinkItem to="/contribute">Contribute</NavLinkItem>
                <NavLinkItem to="/login">Login</NavLinkItem>
                <HoverBtn to="/register" baseStyle={styles.navSignUp}>
                  Sign Up
                  <span style={styles.navArrowCircle}>↗</span>
                </HoverBtn>
              </>
            )}
          </nav>
        </div>

        {/* ── Hero Grid ── */}
        <div style={{
          ...styles.heroSection,
          gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr',
          paddingTop: isNarrow ? '48px' : '40px',
        }}>

          {/* Left column */}
          <div style={{
            ...styles.heroLeft,
            paddingRight: isNarrow ? '0' : '24px',
          }}>

            {/* Headline */}
            <h1 style={styles.headline}>
              {isAuthenticated
                ? <>Welcome to developers world,<br />{user?.full_name?.split(' ')[0] || 'Developer'} 👋</>
                : <>Work smarter,<br />achieve faster</>
              }
            </h1>

            {/* Subheadline */}
            <p style={styles.subHeadline}>
              Effortlessly manage your projects, collaborate with your team, and achieve
              your goals with our intuitive task management tool.
            </p>

            {/* CTA Group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <HoverBtn to={ctaDest} baseStyle={styles.ctaBtn}>
                {ctaLabel}
                <span style={styles.ctaArrow}>→</span>
              </HoverBtn>
              
              {isAuthenticated && (
                <Link 
                  to={`/profile/${user?.username}`}
                  className="px-8 py-3.5 rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  View Profile
                </Link>
              )}
            </div>
          </div>

          {/* Right column — Orb video */}
          {!isNarrow && (
            <div style={styles.heroRight}>
              <video
                autoPlay
                loop
                muted
                playsInline
                aria-hidden="true"
                style={styles.orbVideo}
              >
                <source src="https://future.co/images/homepage/glassy-orb/orb-purple.webm" type="video/webm" />
              </video>
            </div>
          )}
        </div>


      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Existing page sections below (unchanged) */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Blog Writing Section */}
      <section className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-accent mb-3 block">Developer Blog</span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl tracking-tight text-foreground mb-4">
                Write what's on your mind
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                A beautiful writing experience built for developers. Write dev logs, tutorials, and opinions with live
                markdown preview, syntax highlighting, and one-click publishing.
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                {['Live Preview', 'Syntax Highlighting', 'Auto-Save', 'Social Sharing', 'Reactions'].map(f => (
                  <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {f}
                  </span>
                ))}
              </div>
              <Link
                to={isAuthenticated ? '/blog/new' : '/register'}
                className="inline-flex items-center gap-2 text-accent font-medium hover:underline transition-all"
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
                <p><span className="text-accent"># </span><span className="text-foreground font-medium">Building a REST API with FastAPI</span></p>
                <p className="text-muted-foreground/60">---</p>
                <p>Today I learned how to build a <span className="text-yellow-500">**blazing fast**</span> API</p>
                <p>using <span className="text-accent">FastAPI</span> and <span className="text-accent">MongoDB</span>.</p>
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
          <h2 className="font-heading font-bold text-3xl text-center text-foreground mb-16">
            Why Developers Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group"><FeatureCard icon={Code2} title="Showcase Projects" description="Display your work with detailed project pages, tech stacks, and live demos" /></div>
            <div className="group"><FeatureCard icon={PenSquare} title="Developer Blog" description="Write tutorials, dev logs, and opinions with markdown, reactions, and social sharing" /></div>
            <div className="group"><FeatureCard icon={Zap} title="Track Progress" description="Monitor your development journey and celebrate your achievements" /></div>
            <div className="group"><FeatureCard icon={Users} title="Join Community" description="Connect with fellow developers and grow your professional network" /></div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
