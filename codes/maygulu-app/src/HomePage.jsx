import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, BarChart3, ChevronDown } from 'lucide-react';
import './pages/dashboard/home.css';
import './pages/dashboard/animations.css';
import ThemeToggle from './components/ThemeToggle';

export default function HomePage() {
  const navigate = useNavigate();
  const [showScrollButton, setShowScrollButton] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollButton(false);
      } else {
        setShowScrollButton(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollDown = () => {
    setShowScrollButton(false);
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', paddingTop: '20px' }}>
      {/* Üst bar - Sign In ve Theme Toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '12px',
        padding: '0 20px',
        marginBottom: '20px'
      }}>
        <ThemeToggle />
        <button
          className="home-login-btn"
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 24px',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          Sign In / Login
        </button>
      </div>

      {/* Intro Section - Thesis Archive System box solda, 3 dikey box sağda */}
      <section className="home-intro" style={{ padding: '20px' }}>
        <div className="welcome-container" style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'stretch',
          minHeight: '480px',
          gap: '30px'
        }} id="welcome-container">
          {/* Final International University - Solda */}
          <div style={{
            flex: '1',
            padding: '40px 40px 40px 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}>
            <img
              src="/logoftr.png"
              alt="Final International University Logo"
              style={{
                width: '180px',
                height: 'auto',
                marginBottom: '0.8rem'
              }}
            />
            <h2 style={{
              color: 'var(--text-primary)',
              fontSize: '2rem',
              marginBottom: '1.5rem',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              Final International University Thesis Repository
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              fontSize: '1.1rem',
              textAlign: 'left'
            }}>
              Discover academic excellence at Final International University's Thesis Repository. 
              Access groundbreaking research, innovative projects, and scholarly achievements from our talented students and distinguished faculty members. 
              Join our academic community and explore the future of knowledge.
            </p>
          </div>

          {/* Sağ taraf - 3 dikey box (ortadaki aşağı kaymış) */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
            gap: '15px',
            paddingTop: '20px',
            flexShrink: 0
          }}>
            {/* Sol box */}
            <div style={{
              width: '180px',
              height: '420px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              marginTop: '0px'
            }}>
              <img
                src="/homepage_foto1.jpg"
                alt="Campus 1"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            {/* Orta box - aşağı kaymış */}
            <div style={{
              width: '180px',
              height: '420px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              marginTop: '80px'
            }}>
              <img
                src="/homepage_foto2.jpg"
                alt="Campus 2"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            {/* Sağ box */}
            <div style={{
              width: '180px',
              height: '420px',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              marginTop: '0px'
            }}>
              <img
                src="/homepage_foto4.jpg"
                alt="Campus 3"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Aşağı Kaydır Butonu */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '60px',
        marginBottom: '40px',
        opacity: showScrollButton ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: showScrollButton ? 'auto' : 'none'
      }}>
        <button
          onClick={scrollDown}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'transparent',
            border: '2px solid var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            animation: 'bounce 2s infinite'
          }}
        >
          <ChevronDown size={28} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Welcome Section - Yatay, tam genişlik */}
      <section className="welcome-section" style={{
        padding: '60px 20px 40px 20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div className="welcome-section-inner" style={{
          padding: '40px'
        }}>
          <h2 className="welcome-section-title" style={{
            color: 'var(--text-primary)',
            fontSize: '1.6rem',
            marginBottom: '1.2rem',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            Welcome to the Final International University Thesis Repository
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            lineHeight: '1.8',
            fontSize: '1rem',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            The Final University Thesis Repository is a digital platform designed to store, manage, and share student theses and research projects. Our goal is to create a centralized and accessible archive where students, instructors, and researchers can easily upload, browse, and reference academic work. Through this system, students can securely submit their theses, while advisors and administrators can review, approve, and provide feedback.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <div className="feature-cards-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
        padding: '20px',
        maxWidth: 1200,
        margin: '0 auto 20px'
      }}>
        <div className="feature-card" style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 28,
          textAlign: 'center'
        }}>
          <div className="feature-icon" style={{ color: '#2563eb', marginBottom: '12px' }}>
            <BookOpen size={32} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 8 }}>Extensive Library</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            Access thousands of theses from various academic disciplines
          </p>
        </div>
        <div className="feature-card" style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 28,
          textAlign: 'center'
        }}>
          <div className="feature-icon" style={{ color: '#2563eb', marginBottom: '12px' }}>
            <Search size={32} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 8 }}>Advanced Search</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            Find exactly what you need with powerful filtering options
          </p>
        </div>
        <div className="feature-card" style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          padding: 28,
          textAlign: 'center'
        }}>
          <div className="feature-icon" style={{ color: '#2563eb', marginBottom: '12px' }}>
            <BarChart3 size={32} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 8 }}>Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
            Track views, downloads and citations for your research
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        width: '100%',
        background: '#1a1a1a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '200px'
      }}>
        <div className="footer-grid" style={{
          padding: '24px 60px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#fff' }}>
              Uluslararası Final Üniversitesi
            </h3>
            <p style={{ fontSize: '13px', color: '#a0a0a0', margin: 0, lineHeight: '1.6' }}>
              İFU Eğitim Kurumları Limited
            </p>
            <p style={{ fontSize: '13px', color: '#a0a0a0', margin: 0, lineHeight: '1.6' }}>
              Beşparmaklar Caddesi, No: 6<br />
              Çatalköy, Girne, KKTC
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#fff' }}>Telefon</h4>
            <div style={{ fontSize: '13px', color: '#a0a0a0', lineHeight: '1.8' }}>
              <div>+90 392 650 6666</div>
              <div>+90 850 811 1838</div>
              <div>+90 392 444 0838</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '-40px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#fff' }}>İletişim</h4>
            <div style={{ fontSize: '12px', color: '#a0a0a0', lineHeight: '2' }}>
              <div><span style={{ color: '#888' }}>Genel:</span> info@final.edu.tr</div>
              <div><span style={{ color: '#888' }}>Akademik:</span> akademikbasvuru@final.edu.tr</div>
              <div><span style={{ color: '#888' }}>İdari:</span> genelsekreterlik@final.edu.tr</div>
              <div><span style={{ color: '#888' }}>Öğrenci:</span> ogrenciisleri@final.edu.tr</div>
              <div><span style={{ color: '#888' }}>Uluslararası:</span> international@final.edu.tr</div>
            </div>
          </div>
        </div>
        <div style={{
          backgroundColor: '#111',
          color: '#666',
          fontSize: '12px',
          textAlign: 'center',
          padding: '14px 0'
        }}>
          2026 INTERNATIONAL FINAL UNIVERSITY. All rights reserved.
        </div>
      </footer>
    </div>
  );
}