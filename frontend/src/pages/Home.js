import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/layout/Footer';
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
const LogoVercel = () => (
  <svg viewBox="0 0 283 64" height="24" fill="currentColor" color="#111">
    <path d="M141.68 16.25c-11.04 0-19 7.2-19 18s8.45 18 19.5 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-18.5-17.99zm-9.46 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm117.14-14.5c-11.04 0-19 7.2-19 18s8.45 18 19.5 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-18.5-17.99zm-9.45 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm-39.03 3.5c0 6 3.92 10 10 10 4.12 0 7.21-1.87 8.8-4.92l7.68 4.43c-3.18 5.3-9.14 8.49-16.48 8.49-11.05 0-19-7.2-19-18s7.96-18 19-18c7.34 0 13.29 3.19 16.48 8.49l-7.68 4.43c-1.59-3.05-4.68-4.92-8.8-4.92-6.07 0-10 4-10 10zm82.48-29v46h-9v-46h9zm-102.13 7.33c0-1.64 1.33-2.97 2.97-2.97 1.64 0 2.97 1.33 2.97 2.97s-1.33 2.97-2.97 2.97c-1.64 0-2.97-1.33-2.97-2.97zm-27.48 4.67h-7v22.68l-8.3-22.68h-6.19L82.6 52.5h-.1L73 29.5H66V51.5h9V38.04l6.95 13.46h5.89l6.96-13.46V51.5h9V29.5h-13.77zM32.72 48.5 53 16.25h-8L32 33.73l-13-17.48h-8L32.72 48.5zM2 16.25h9v35h-9v-35z" />
  </svg>
);

const LogoNotion = () => (
  <svg viewBox="0 0 100 100" height="28" fill="currentColor" color="#111">
    <path d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.937c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z" />
    <path fill="white" d="M61.35.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723.967 5.053 3.3 8.167l13.007 16.917c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.903c5.433-.387 6.99-2.917 6.99-7.193V20.64c0-2.21-.873-2.847-3.443-4.733L74.167 3.143c-4.273-3.107-6.02-3.5-12.817-2.917z" />
    <path d="M61.35.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723.967 5.053 3.3 8.167l13.007 16.917c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.903c5.433-.387 6.99-2.917 6.99-7.193V20.64c0-2.21-.873-2.847-3.443-4.733L74.167 3.143c-4.273-3.107-6.02-3.5-12.817-2.917zM25.92 19.523c-3.883.777-4.853.387-7.377-1.75L11.4 11.5c-.68-.583-.097-1.36 1.553-1.553l53.19-3.887c4.467-.387 6.797 1.167 8.547 2.527l9.123 6.61c.39.194.974.974-.193 1.167L27.087 19.72c-.39.195-.78.195-1.167-.197zM20.1 87.5V30.123c0-2.14.583-3.107 2.333-3.3l65.227-3.887c1.75-.194 2.527.777 2.527 2.917v56.99c0 2.14-.777 3.497-2.527 3.69l-65.033 3.88c-1.943.194-2.527-.583-2.527-2.913zm60.76-55.033c.194 1.166 0 2.333-1.167 2.527l-1.94.39v28.567c-1.167.583-2.333.777-3.5.777-1.943 0-2.527-.583-3.887-2.333l-12.04-18.667v18.087l3.887.777s0 2.333-3.307 2.333l-9.123.583c-.193-1.167 0-2.333.584-2.723l1.553-.583V35.577l-2.333-.193c-.194-1.167.39-2.917 2.333-3.11l9.703-.583 12.43 18.86V32.66l-3.3-.39c-.194-1.36.777-2.333 2.333-2.527zM11.4 11.5" />
  </svg>
);

const LogoLinear = () => (
  <svg viewBox="0 0 78 78" height="26" fill="none">
    <path d="M1.18 48.16L29.84 76.8a39 39 0 01-28.66-28.65zM0 38.28L39.72 78A39 39 0 010 38.28zM4.99 23.6L54.4 73.01A39.06 39.06 0 0139 78L0 39a39.05 39.05 0 014.99-15.4zM13.45 11.23L66.77 64.55A39.03 39.03 0 0154.4 73.01L4.99 23.6a39.03 39.03 0 018.46-12.37zM24.5 3.72L74.28 53.5a39.08 39.08 0 01-7.51 11.05L13.45 11.23A39.08 39.08 0 0124.5 3.72zM38.28 0L78 39.72A39 39 0 0138.28 78L0 39A39 39 0 0138.28 0zM48.16 1.18A39 39 0 0176.82 29.84L29.84 76.82A39 39 0 011.18 48.16L48.16 1.18z" fill="currentColor" color="#111"/>
  </svg>
);

const LogoFigma = () => (
  <svg viewBox="0 0 38 57" height="28" fill="none">
    <path d="M19 28.5a9.5 9.5 0 100-19 9.5 9.5 0 000 19z" fill="#1ABCFE"/>
    <path d="M9.5 47.5a9.5 9.5 0 019.5-9.5h9.5v9.5A9.5 9.5 0 1119 57a9.5 9.5 0 01-9.5-9.5z" fill="#0ACF83"/>
    <path d="M0 19a9.5 9.5 0 009.5 9.5H19V0H9.5A9.5 9.5 0 000 9.5V19z" fill="#FF7262"/>
    <path d="M19 0h9.5a9.5 9.5 0 010 19H19V0z" fill="#F24E1E"/>
    <path d="M28.5 19a9.5 9.5 0 010 19H19V19h9.5z" fill="#A259FF"/>
  </svg>
);

const LogoStripe = () => (
  <svg viewBox="0 0 60 25" height="22" fill="currentColor" color="#111">
    <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 2.99 5.96 7.07 0 .43-.04 1.04-.06 1.91zm-8.06-2.88c0 .88.073 1.87 1.61 1.87 1.473 0 1.74-1.04 1.74-1.87h-3.35zM35.3 5.71v3.52c0 .32.37.55 1.08.55a5.84 5.84 0 0 0 1.43-.18V5.3a5.82 5.82 0 0 0-2.51.41zm0 13.21h-4.7V.5l4.7-.74v6.01a8.55 8.55 0 0 1 2.52-.34c4.44 0 7.29 3.32 7.29 7.96 0 5.43-3.18 7.72-7.29 7.72a13 13 0 0 1-2.52-.19zm2.52-3.56c1.61 0 2.59-1.36 2.59-4.03 0-2.51-.98-3.93-2.59-3.93-.53 0-1.06.17-1.44.47v7.12c.38.24.92.37 1.44.37zM22.22 0l4.74-.77v3.8l-4.74.78V0zM22.22 5.3h4.74v13.6h-4.74V5.3zM15.7 14.16l.05.38c.5 2.28 2.17 3.55 4.74 3.55a6.2 6.2 0 0 0 2.95-.64v3.74a10.14 10.14 0 0 1-3.83.72c-4.4 0-7.88-2.8-7.88-7.48 0-4.13 2.9-7.52 6.87-7.52 3.7 0 6.05 2.66 6.05 6.77 0 .52-.05 1.04-.14 1.48H15.7zM20 8.73c-1.5 0-2.44 1.3-2.44 2.76h4.84c-.05-1.57-.87-2.76-2.4-2.76zM6.42 11.39c0 1.44.54 2.43 1.43 2.43.73 0 1.27-.54 1.47-1.3l.01-.3V5.3H14v7.99c0 2.56-1.41 5.62-5.97 5.62-4.24 0-6.29-2.87-6.29-6.98V5.3h4.68v6.09z"/>
  </svg>
);

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
  const navigate = useNavigate();

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
            <Link to="/" style={styles.navLogo}>KudosD</Link>

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

            {/* Social proof badge */}
            <div style={styles.ratingBadge}>
              <div style={styles.ratingStars}>
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={styles.ratingStar}>★</span>
                ))}
              </div>
              <span style={styles.ratingText}>Rated 4.9/5 by 2700+ customers</span>
            </div>

            {/* Headline */}
            <h1 style={styles.headline}>
              {isAuthenticated
                ? <>Welcome back,<br />{user?.full_name?.split(' ')[0] || 'Developer'} 👋</>
                : <>Work smarter,<br />achieve faster</>
              }
            </h1>

            {/* Subheadline */}
            <p style={styles.subHeadline}>
              Effortlessly manage your projects, collaborate with your team, and achieve
              your goals with our intuitive task management tool.
            </p>

            {/* CTA */}
            <HoverBtn to={ctaDest} baseStyle={styles.ctaBtn}>
              {ctaLabel}
              <span style={styles.ctaArrow}>→</span>
            </HoverBtn>
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

        {/* ── Trusted logos strip ── */}
        <div style={styles.trustedSection}>
          <p style={styles.trustedLabel}>Trusted by Top-tier product companies</p>
          <div style={styles.trustedLogos}>
            <LogoVercel />
            <LogoNotion />
            <LogoLinear />
            <LogoFigma />
            <LogoStripe />
          </div>
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
