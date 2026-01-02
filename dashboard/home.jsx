import React, { useEffect, useState } from 'react';
import './home.css';
import { Navbar } from '../../components';
import { getJson } from '../../api/client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

function DashboardPieTooltip({ active, payload, uiColors }) {
  if (!active || !payload || payload.length === 0) return null;
  const p0 = payload[0] || {};
  const name = p0?.name ?? '';
  const value = p0?.value ?? '';
  const color = p0?.color || '#2563eb';

  return (
    <div
      style={{
        background: uiColors.bgPrimary,
        border: `1px solid ${uiColors.border}`,
        borderRadius: 10,
        padding: '10px 12px',
        color: uiColors.textPrimary,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: color, display: 'inline-block' }} />
        <span style={{ fontWeight: 700, color: uiColors.textPrimary }}>{String(name)}</span>
      </div>
      <div style={{ marginTop: 6, color: uiColors.textSecondary }}>
        Count: <span style={{ fontWeight: 700, color: uiColors.textPrimary }}>{String(value)}</span>
      </div>
    </div>
  );
}

export default function DashboardPage({ user, onLogout }) {
  const isAdmin = Number(user?.role_id) === 3;
  const isAdvisor = Number(user?.role_id) === 2;
  const [stats, setStats] = useState({ theses: 0, advisors: 0, users: 0 });
  const [advisorStats, setAdvisorStats] = useState({ thesis_count: 0, total_citations: 0 });
  const [analytics, setAnalytics] = useState({
    uploads_trend: [],
    theses_by_faculty: [],
    engagement_by_department: [],
  });

  const [analyticsError, setAnalyticsError] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [uiColors, setUiColors] = useState({
    bgPrimary: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
  });

  useEffect(() => {
    const readVars = () => {
      try {
        const cs = getComputedStyle(document.documentElement);
        const pick = (name, fallback) => {
          const v = String(cs.getPropertyValue(name) || '').trim();
          return v || fallback;
        };
        setUiColors({
          bgPrimary: pick('--bg-primary', '#ffffff'),
          textPrimary: pick('--text-primary', '#111827'),
          textSecondary: pick('--text-secondary', '#6b7280'),
          border: pick('--color-border', '#e5e7eb'),
        });
      } catch (_) { }
    };

    readVars();
    const obs = new MutationObserver(readVars);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    getJson('/stats')
      .then(d => setStats({ theses: d.theses || 0, advisors: d.advisors || 0, users: d.users || 0 }))
      .catch(() => setStats({ theses: 0, advisors: 0, users: 0 }));
  }, []);

  useEffect(() => {
    if (!isAdvisor || !user?.id) return;
    // Tez listesini çekip sayısını hesapla
    getJson(`/theses?advisor_id=${user.id}`)
      .then(theses => {
        const thesesArray = Array.isArray(theses) ? theses : [];
        const thesisCount = thesesArray.length;
        const totalCitations = thesesArray.reduce((sum, t) => sum + (t.bibliography_count || 0), 0);
        setAdvisorStats({ thesis_count: thesisCount, total_citations: totalCitations });
      })
      .catch(() => setAdvisorStats({ thesis_count: 0, total_citations: 0 }));
  }, [isAdvisor, user?.id]);

  useEffect(() => {
    if (!isAdmin) {
      setAnalytics({ uploads_trend: [], theses_by_faculty: [], engagement_by_department: [] });
      setAnalyticsError('');
      setAnalyticsLoading(false);
      return;
    }
    let alive = true;
    setAnalyticsError('');
    setAnalyticsLoading(true);
    getJson('/dashboard/analytics?months=12')
      .then((d) => {
        if (!alive) return;
        setAnalytics({
          uploads_trend: Array.isArray(d?.uploads_trend) ? d.uploads_trend : [],
          theses_by_faculty: Array.isArray(d?.theses_by_faculty) ? d.theses_by_faculty : [],
          engagement_by_department: Array.isArray(d?.engagement_by_department) ? d.engagement_by_department : [],
        });
        setAnalyticsLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setAnalytics({ uploads_trend: [], theses_by_faculty: [], engagement_by_department: [] });
        const msg = err?.message || 'Request failed';
        setAnalyticsError(`${msg}. If this is your first time after changes, restart the backend so /dashboard/analytics becomes available.`);
        setAnalyticsLoading(false);
      });
    return () => { alive = false; };
  }, [isAdmin]);

  const deptColors = ['#2563eb', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#06b6d4', '#a855f7', '#ef4444', '#84cc16', '#eab308', '#14b8a6', '#fb7185'];

  return (
    <div className="home-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} />

      <div style={{ flex: '1' }}>
        {isAdmin ? (
          <>
            <section
              className="home-hero-wrap"
              style={{
                paddingTop: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '30px',
                  width: '100%',
                  maxWidth: '900px',
                  marginBottom: '30px'
                }}
              >
                <div className="stat-card" style={{ margin: 0 }}>
                  <div className="stat-card__title">Total Theses</div>
                  <div className="stat-card__value">{stats.theses}</div>
                </div>
                <div className="stat-card" style={{ margin: 0 }}>
                  <div className="stat-card__title">Advisors</div>
                  <div className="stat-card__value">{stats.advisors}</div>
                </div>
                <div className="stat-card" style={{ margin: 0 }}>
                  <div className="stat-card__title">Users</div>
                  <div className="stat-card__value">{stats.users}</div>
                </div>
              </div>

              <div className="home-hero">
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="dashboard-card dashboard-card--wide">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__title">Thesis Upload Trends</div>
                </div>
                <div className="dashboard-chart">
                  {analyticsLoading ? (
                    <div style={{ color: uiColors.textSecondary, padding: 12 }}>Loading...</div>
                  ) : analytics.uploads_trend.length === 0 ? (
                    <div style={{ color: uiColors.textSecondary, padding: 12 }}>No data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.uploads_trend} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="uploadsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={uiColors.border} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fill: uiColors.textSecondary }} axisLine={{ stroke: uiColors.border }} />
                        <YAxis tick={{ fill: uiColors.textSecondary }} axisLine={{ stroke: uiColors.border }} />
                        <Tooltip
                          contentStyle={{
                            background: uiColors.bgPrimary,
                            border: `1px solid ${uiColors.border}`,
                            borderRadius: 10,
                            color: uiColors.textPrimary
                          }}
                          labelStyle={{ color: uiColors.textPrimary }}
                        />
                        <Area
                          type="monotone"
                          dataKey="uploads"
                          stroke="#2563eb"
                          fill="url(#uploadsGradient)"
                          isAnimationActive
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__title">Theses by Faculty</div>
                </div>
                <div className="dashboard-chart">
                  {analyticsLoading ? (
                    <div style={{ color: uiColors.textSecondary, padding: 12 }}>Loading...</div>
                  ) : analytics.theses_by_faculty.length === 0 ? (
                    <div style={{ color: uiColors.textSecondary, padding: 12 }}>No data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={(props) => <DashboardPieTooltip {...props} uiColors={uiColors} />} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: uiColors.textSecondary }} />
                        <Pie
                          data={analytics.theses_by_faculty}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                          isAnimationActive
                        >
                          {analytics.theses_by_faculty.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={deptColors[idx % deptColors.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__title">Engagement by Department</div>
                </div>
                <div className="dashboard-chart">
                  {analyticsLoading ? (
                    <div style={{ color: uiColors.textSecondary, padding: 12 }}>Loading...</div>
                  ) : analytics.engagement_by_department.length === 0 ? (
                    <div style={{ color: uiColors.textSecondary, padding: 12 }}>No data available.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.engagement_by_department} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                        <CartesianGrid stroke={uiColors.border} strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: uiColors.textSecondary }} axisLine={{ stroke: uiColors.border }} />
                        <YAxis tick={{ fill: uiColors.textSecondary }} axisLine={{ stroke: uiColors.border }} />
                        <Tooltip
                          contentStyle={{
                            background: uiColors.bgPrimary,
                            border: `1px solid ${uiColors.border}`,
                            borderRadius: 10,
                            color: uiColors.textPrimary
                          }}
                          labelStyle={{ color: uiColors.textPrimary }}
                        />
                        <Legend wrapperStyle={{ color: uiColors.textSecondary }} />
                        <Bar dataKey="views" name="Views" fill="#2563eb" isAnimationActive />
                        <Bar dataKey="downloads" name="Downloads" fill="#7c3aed" isAnimationActive />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </section>

            {analyticsError && (
              <div style={{ width: 'min(1100px, 100%)', margin: '0 auto', padding: '0 16px 24px', color: 'var(--text-secondary)' }}>
                {analyticsError}
              </div>
            )}
          </>
        ) : isAdvisor ? (
          <>
            <section
              style={{
                paddingTop: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <h2 style={{
                color: 'var(--text-primary)',
                fontSize: '1.8rem',
                fontWeight: 700,
                marginBottom: '40px'
              }}>
                Advisor Dashboard
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '40px',
                  width: '100%',
                  maxWidth: '600px'
                }}
              >
                <div className="stat-card" style={{ margin: 0, padding: '30px', textAlign: 'center' }}>
                  <div className="stat-card__title" style={{ fontSize: '16px', marginBottom: '12px' }}>My Theses</div>
                  <div className="stat-card__value" style={{ fontSize: '48px' }}>{advisorStats.thesis_count}</div>
                </div>
                <div className="stat-card" style={{ margin: 0, padding: '30px', textAlign: 'center' }}>
                  <div className="stat-card__title" style={{ fontSize: '16px', marginBottom: '12px' }}>Total Citations</div>
                  <div className="stat-card__value" style={{ fontSize: '48px' }}>{advisorStats.total_citations}</div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="home-intro" style={{ padding: '20px' }}>
              <div className="welcome-container" style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                alignItems: 'stretch'
              }}>
                <div className="home-intro__content">
                  <h2 className="home-intro__title">Welcome to the Final University Thesis Repository</h2>
                  <p>
                    The Final University Thesis Repository is a digital platform designed to store, manage, and share student theses and research projects. Our goal is to create a centralized and accessible archive where students, instructors, and researchers can easily upload, browse, and reference academic work.
                  </p>
                  <p>
                    Through this system, students can securely submit their theses, while advisors and administrators can review, approve, and provide feedback. The repository also supports project-based submissions, ensuring that practical works and supplementary files can be stored alongside written theses.
                  </p>
                  <p>
                    By promoting open access and academic collaboration, Final University aims to support learning, innovation, and research excellence within our academic community.
                  </p>
                </div>
                <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                  <img
                    src="/fnl.jpg"
                    alt="Final University"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <footer style={{
        width: '100%',
        background: '#1a1a1a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '500px'
      }}>
        <div style={{
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
          &copy;2026 INTERNATIONAL FINAL UNIVERSITY. All rights reserved.
        </div>
      </footer>
    </div>
  );
}