import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import '../pages/dashboard/home.css';
import EnhancedSidebar from './EnhancedSidebar';

export default function Navbar({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const isOpen = true;
  const role = Number(user?.role_id);
  const isStudent = role === 1;

  useEffect(() => {
    const next = collapsed ? '80px' : '240px';
    document.documentElement.style.setProperty('--app-sidebar-offset', next);
    return () => {
      document.documentElement.style.setProperty('--app-sidebar-offset', '0px');
    };
  }, [collapsed]);

  const toggle = () => setCollapsed((v) => !v);

  const brandContent = (
    <span>Final International University</span>
  );

  return (
    <header className="home-nav">
      <button
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
        <Menu size={22} color="var(--text-primary)" />
      </button>
      {isStudent ? (
        <span
          className="home-brand"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'default',
          }}
        >
          {brandContent}
        </span>
      ) : (
        <Link
          to="/dashboard"
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
          {brandContent}
        </Link>
      )}
      <div className="home-spacer" />
      <div style={{
        marginRight: '16px',
        fontWeight: 600,
        fontSize: '14px',
        color: 'var(--text-primary)'
      }}>
        {user?.full_name?.split(' ')[0]}
      </div>
      <EnhancedSidebar user={user} isOpen={isOpen} collapsed={collapsed} onToggle={toggle} onLogout={onLogout} />
    </header>
  );
}
