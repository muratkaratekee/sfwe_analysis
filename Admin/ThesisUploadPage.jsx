import React from 'react';
import './styles.css';
import '../dashboard/home.css';
import { ThesisForm } from '../../components';
import { Navbar } from '../../components';

export default function ThesisUploadPage({ user, onLogout }) {
  const isAdmin = Number(user?.role_id) === 3;

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} />

      <main
        className="admin-container"
        style={{
          marginLeft: '180px',
          width: 'calc(100% - 180px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // Genel hizalama merkez
          padding: '40px 20px',
          transition: 'all 240ms ease',
          flex: '1' // İçeriğin footer'ı aşağı itmesini sağlar
        }}
      >
        {!isAdmin ? (
          <div className="admin-alert">You are not authorized to access this page.</div>
        ) : (
          /* Formu biraz sola çekmek için margin-right ekleyerek dengesini bozuyoruz veya marginLeft ile itiyoruz */
          <div style={{ width: '100%', maxWidth: '900px', marginRight: '100px' }}>

            <div className="admin-page-header" style={{ width: '100%', textAlign: 'center', marginBottom: '30px' }}>
              <h1 className="admin-page-title" style={{ margin: '0 auto', display: 'inline-block' }}>
                Create Thesis
              </h1>
            </div>

            <ThesisForm />
          </div>
        )}
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