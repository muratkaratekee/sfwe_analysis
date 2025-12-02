import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../pages/home/home.css';
import Sidebar from './Sidebar.jsx';

export default function Navbar({ user, onLogout }) {
  const role = Number(user?.role_id);
  const isAdmin = role === 3;
  const isAdvisor = role === 2;
  const [isOpen, setIsOpen] = useState(true);
  const toggle = () => setIsOpen(o => !o);
  useEffect(() => {
    try { document.documentElement.style.setProperty('--sidebar-pad', isOpen ? '200px' : '0px'); } catch (_) {}
  }, [isOpen]);
  return (
    <header className="home-nav">
      {!isOpen && (
        <button
          onClick={toggle}
          aria-label="Open menu"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            width: 36,
            height: 36,
            marginRight: 6,
          }}
        >
          <div style={{ width: 4, height: 4, background: '#111', borderRadius: '50%' }} />
          <div style={{ width: 4, height: 4, background: '#111', borderRadius: '50%' }} />
          <div style={{ width: 4, height: 4, background: '#111', borderRadius: '50%' }} />
        </button>
      )}
      <Link
        to="/"
        className="home-brand"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <img src="/logo.jpg" alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span>Final University Thesis Program</span>
      </Link>
      <div className="home-spacer" />
      <div className="home-user" />
      <Sidebar user={user} isOpen={isOpen} onToggle={toggle} onLogout={onLogout} />
    </header>
  );
}
