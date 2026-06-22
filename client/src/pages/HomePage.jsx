import { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth.js';

const ACCENT = '#4f46e5'; // indigo — readable on light backgrounds

const SLIDES = [
  {
    step: '01',
    phase: 'Setup',
    icon: 'bi-map-fill',
    title: 'Study the Metro Network',
    body: 'Before each game you see the full network: 4 colored lines, 13 stations, 7 interchange points. Memorize every connection — the lines vanish in the next phase.',
    tip: '💡 Pay attention to which stations serve multiple lines — those are your interchange points.',
  },
  {
    step: '02',
    phase: 'Planning',
    icon: 'bi-stopwatch-fill',
    title: 'Build Your Route — 90 Seconds',
    body: 'You receive a random START and DESTINATION (at least 3 stops apart). The map now shows only station dots — no lines. Use the segment list to mentally rebuild the network and select segments in order.',
    tip: '💡 Line changes are only legal at interchange stations. Plan your transfers carefully.',
  },
  {
    step: '03',
    phase: 'Execution',
    icon: 'bi-lightning-charge-fill',
    title: 'Face Random Events',
    body: 'Each segment of your valid route triggers a random event: find a bonus travel card (+4 coins), hit a signal failure (−3 coins), or glide through undisturbed (0). You start with 20 coins.',
    tip: '💡 An invalid or incomplete route skips execution entirely — you score 0.',
  },
  {
    step: '04',
    phase: 'Result',
    icon: 'bi-trophy-fill',
    title: 'Score & Ranking',
    body: 'Final score = coins remaining (minimum 0). Your personal best is recorded on the global leaderboard. Play again to beat your record — and everyone else\'s.',
    tip: '💡 Negative coins still count as 0. A shorter valid route can outscore a risky long one.',
  },
];

function HomePage() {
  const { loggedIn } = useAuth();
  const [active, setActive] = useState(0);
  const slide = SLIDES[active];

  return (
    <div className="page-bg home-bg">
      <div className="row justify-content-center pt-3">
        <div className="col-xl-10 col-lg-11">

          {/* Hero banner */}
          <div className="mb-4" style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #2d3a8c 50%, #1a3a5c 100%)',
            borderRadius: 16,
            padding: '2rem 2.5rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(30,27,75,0.28)',
          }}>
            {/* Decorative metro-line circles */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', border: '18px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, right: 80, width: 90, height: 90, borderRadius: '50%', border: '12px solid rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', right: '18%', width: 60, height: 60, borderRadius: '50%', border: '8px solid rgba(129,140,248,0.18)', pointerEvents: 'none', transform: 'translateY(-50%)' }} />

            <div className="d-flex align-items-center gap-4">
              <img src="/logo.png" height="64" alt="Last Race" style={{ borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.3)', flexShrink: 0 }} />
              <div>
                <h2 className="mb-1 fw-bold" style={{ color: '#fff', letterSpacing: '-0.5px' }}>Last Race</h2>
                <span style={{ color: 'rgba(199,210,254,0.9)', fontSize: '0.97rem' }}>
                  Metro route planning game — race to your destination with the most coins
                </span>
            
              </div>
            </div>
          </div>

          <Card className="shadow-lg" style={{ borderRadius: 16, overflow: 'hidden', border: 'none' }}>

            {/* Step tabs */}
            <div className="d-flex" style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
              {SLIDES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 0.5rem',
                    border: 'none',
                    borderBottom: i === active ? `3px solid ${ACCENT}` : '3px solid transparent',
                    background: 'transparent',
                    color: i === active ? '#1e293b' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: i === active ? 700 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    display: 'block',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: i === active ? ACCENT : '#cbd5e1',
                    lineHeight: 1,
                    marginBottom: 2,
                  }}>{s.step}</span>
                  {s.phase}
                </button>
              ))}
            </div>

            {/* Slide content */}
            <div
              style={{
                minHeight: 300,
                background: `linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)`,
                padding: '2.5rem 3rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div className="row align-items-center g-4">
                <div className="col-auto text-center" style={{ minWidth: 100 }}>
                  <div style={{
                    width: 80, height: 80,
                    borderRadius: 20,
                    background: ACCENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    boxShadow: `0 4px 24px ${ACCENT}44`,
                  }}>
                    <i className={`bi ${slide.icon}`} style={{ fontSize: '2rem', color: '#fff' }}></i>
                  </div>
                </div>
                <div className="col">
                  <h3 className="fw-bold mb-2" style={{ color: '#1e293b' }}>{slide.title}</h3>
                  <p style={{ color: '#475569', fontSize: '1.02rem', marginBottom: '1.25rem', maxWidth: 620 }}>
                    {slide.body}
                  </p>
                  <div style={{
                    background: 'rgba(79, 70, 229, 0.07)',
                    borderLeft: `3px solid ${ACCENT}`,
                    padding: '0.6rem 1rem',
                    borderRadius: '0 8px 8px 0',
                    color: '#374151',
                    fontSize: '0.88rem',
                    maxWidth: 560,
                  }}>
                    {slide.tip}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="d-flex justify-content-between align-items-center px-4 py-3"
              style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <div className="d-flex gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    style={{
                      width: i === active ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      border: 'none',
                      background: i === active ? ACCENT : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
              <div className="d-flex gap-2 align-items-center">
                <button
                  onClick={() => setActive(i => Math.max(0, i - 1))}
                  disabled={active === 0}
                  style={{ background: 'none', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: 6, padding: '4px 12px', cursor: active === 0 ? 'default' : 'pointer' }}
                >
                  ‹ Prev
                </button>
                <button
                  onClick={() => setActive(i => Math.min(SLIDES.length - 1, i + 1))}
                  disabled={active === SLIDES.length - 1}
                  style={{ background: 'none', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: 6, padding: '4px 12px', cursor: active === SLIDES.length - 1 ? 'default' : 'pointer' }}
                >
                  Next ›
                </button>
                {loggedIn ? (
                  <Button as={Link} to="/setup" variant="success" size="sm" className="ms-2">
                    <i className="bi bi-play-fill me-1"></i>Play Now
                  </Button>
                ) : (
                  <Button as={Link} to="/login" variant="primary" size="sm" className="ms-2">
                    <i className="bi bi-box-arrow-in-right me-1"></i>Login to Play
                  </Button>
                )}
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

export default HomePage;
