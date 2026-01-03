import React, { useEffect, useMemo, useState } from 'react';
import '../dashboard/home.css';
import '../thesis/styles.css';
import { getThesesByAdvisor, getThesesFiltered } from '../../api/theses';
import { Navbar, ThesisList } from '../../components';

export default function MyTheses({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = Number(user?.role_id);
  const isAdvisor = role === 2;
  const isStudent = role === 1;

  const authorName = useMemo(() => {
    return String(user?.full_name || '').trim();
  }, [user?.full_name]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    let fetchPromise;

    if (isAdvisor) {
      // Danışman: danışmanlık yaptığı tezleri getir
      fetchPromise = getThesesByAdvisor(user?.id);
    } else if (isStudent && authorName) {
      // Öğrenci: kendi adına kayıtlı tezleri getir
      fetchPromise = getThesesFiltered({ author_name: authorName });
    } else {
      setItems([]);
      setLoading(false);
      return () => { alive = false; };
    }

    fetchPromise
      .then((data) => {
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.message || 'Failed to load');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => { alive = false; };
  }, [isAdvisor, isStudent, user?.id, authorName]);

  const emptyMessage = isAdvisor
    ? 'You have not supervised any theses yet.'
    : `No theses found for ${authorName || 'this student'}.`;

  return (
    <div className="thesis-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} />

      <div className="page-header">
        <h1 className="page-title">My Theses</h1>
      </div>

      <main className="thesis-container">
        {loading && <div className="thesis-info">Loading...</div>}
        {error && !loading && <div className="thesis-alert thesis-alert--error">{error}</div>}

        {!loading && !error && (
          items.length === 0 ? (
            <div className="thesis-info">{emptyMessage}</div>
          ) : (
            <ThesisList items={items} />
          )
        )}
      </main>

      <div style={{ flex: '1' }}></div>

      {/* FOOTER */}
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
          ©2026 INTERNATIONAL FINAL UNIVERSITY. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
