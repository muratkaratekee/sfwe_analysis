import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar({ user, isOpen, onToggle, onLogout }) {
  const role = Number(user?.role_id);
  const isAdmin = role === 3;
  const isAdvisor = role === 2;

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isOpen ? 200 : 0,
        overflow: 'hidden',
        background: '#ffffff',
        color: '#111827',
        transition: 'width 200ms ease',
        boxShadow: isOpen ? '2px 0 8px rgba(0,0,0,0.12)' : 'none',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
        <span style={{ flex: 1 }}>Menu</span>
        <button
          onClick={onToggle}
          aria-label="Close menu"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            width: 28,
            height: 28,
          }}
        >
          <div style={{ width: 4, height: 4, background: '#111827', borderRadius: '50%' }} />
          <div style={{ width: 4, height: 4, background: '#111827', borderRadius: '50%' }} />
          <div style={{ width: 4, height: 4, background: '#111827', borderRadius: '50%' }} />
        </button>
      </div>

      <nav style={{ padding: 12, display: 'grid', gap: 8 }}>
        {isAdvisor && (
          <Link to="/advisor/my-theses" style={linkStyle} onClick={isOpen ? undefined : onToggle}>My Thesis</Link>
        )}
        {isAdmin && (
          <>
            <Link to="/admin/upload" style={linkStyle}>Upload Thesis</Link>
            <Link to="/admin/users" style={linkStyle}>Users</Link>
            <Link to="/admin/catalog" style={linkStyle}>Catalog</Link>
            <Link to="/theses" style={linkStyle}>Theses</Link>
          </>
        )}
      </nav>

      <div style={{ marginTop: 'auto', padding: 12, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{role === 3 ? 'Admin' : role === 2 ? 'Advisor' : role === 1 ? 'Student' : 'Simple'}</div>
        <div style={{ fontWeight: 600, marginBottom: 8, wordBreak: 'break-word' }}>{user?.full_name}</div>
        <button onClick={onLogout} style={{
          width: '100%',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '8px 10px',
          cursor: 'pointer',
        }}>Logout</button>
      </div>
    </aside>
  );
}

const linkStyle = {
  color: '#111827',
  textDecoration: 'none',
  padding: '8px 10px',
  borderRadius: 6,
  display: 'block',
  background: '#f3f4f6',
  border: '1px solid #e5e7eb'
};
