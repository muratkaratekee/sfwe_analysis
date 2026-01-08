import React, { useEffect, useState, useCallback } from 'react';
import './styles.css';
import '../dashboard/home.css';
import { getUsers } from '../../api/admin';
import { UsersTable } from '../../components';
import { Navbar } from '../../components';

export default function UsersPage({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError('');
    getUsers()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} />

      <main
        className="admin-container admin-container--wide"
        style={{
          marginLeft: '180px',
          width: 'calc(100% - 180px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 20px',
          transition: 'all 240ms ease',
          flex: '1'
        }}
      >
        <div style={{ width: '100%', maxWidth: '1100px' }}>
          <h1 className="admin-title" style={{ marginBottom: 20, textAlign: 'left', marginLeft: '425px' }}>Users</h1>

          {loading && <div className="admin-alert">Loading...</div>}
          {error && !loading && <div className="admin-alert">{error}</div>}

          {!loading && !error && (
            <div style={{ width: '100%' }}>
              {items.length === 0 ? (
                <div className="admin-alert">No users found.</div>
              ) : (
                <UsersTable rows={items} onChanged={fetchUsers} currentUser={user} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER BAŞLANGICI */}
      <footer style={{
        width: '100%',
        background: '#1a1a1a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '200px'
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
          2026 INTERNATIONAL FINAL UNIVERSITY. All rights reserved.
        </div>
      </footer>
    </div>
  );
}