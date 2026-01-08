import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, SlidersHorizontal } from 'lucide-react';
import '../pages/dashboard/home.css';
import EnhancedSidebar from './EnhancedSidebar';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ user, onLogout, onFilterToggle, showFilterButton = false }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);
  const isOpen = true;
  const role = Number(user?.role_id);
  const isStudent = role === 1;

  // Get page title based on current route for mobile
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'Dashboard';
    if (path === '/theses' || path.startsWith('/theses')) return 'Theses';
    if (path === '/admin/upload') return 'Upload Thesis';
    if (path === '/admin/users') return 'Users';
    if (path === '/admin/catalog') return 'Faculty & Dept';
    if (path === '/advisor/my-theses') return 'My Theses';
    if (path === '/student/my-theses') return 'My Theses';
    if (path === '/profile') return 'Profile';
    return 'Dashboard';
  };

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 500;
      const wasMobile = isMobile;
      setIsMobile(mobile);
      
      // When switching from mobile to desktop, close mobile menu
      if (wasMobile && !mobile) {
        setMobileMenuOpen(false);
      }
      // When switching from desktop to mobile, reset collapsed state
      if (!wasMobile && mobile) {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      document.documentElement.style.setProperty('--app-sidebar-offset', '0px');
    } else {
      const next = collapsed ? '80px' : '240px';
      document.documentElement.style.setProperty('--app-sidebar-offset', next);
    }
    return () => {
      document.documentElement.style.setProperty('--app-sidebar-offset', '0px');
    };
  }, [collapsed, isMobile]);

  const toggle = () => {
    if (isMobile) {
      setMobileMenuOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  const brandContent = isMobile ? (
    <span style={{ fontSize: '15px' }}>{getPageTitle()}</span>
  ) : (
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
            position: isMobile ? 'static' : 'absolute',
            left: isMobile ? 'auto' : '50%',
            transform: isMobile ? 'none' : 'translateX(-50%)',
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
            position: isMobile ? 'static' : 'absolute',
            left: isMobile ? 'auto' : '50%',
            transform: isMobile ? 'none' : 'translateX(-50%)',
          }}
        >
          {brandContent}
        </Link>
      )}
      <div className="home-spacer" />
      {/* User name - hide on mobile, show in sidebar instead */}
      {!isMobile && (
        <div style={{
          marginRight: '16px',
          fontWeight: 600,
          fontSize: '14px',
          color: 'var(--text-primary)'
        }}>
          {user?.full_name?.split(' ')[0]}
        </div>
      )}
      
      {/* Right side buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
        <ThemeToggle />
        {/* Filter button - only show on thesis pages */}
        {(showFilterButton || location.pathname === '/theses' || location.pathname.startsWith('/theses')) && !location.pathname.match(/\/theses\/\d+/) && (
          <button
            onClick={onFilterToggle}
            className="navbar-filter-btn"
            title="Filters"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)'
            }}
          >
            <SlidersHorizontal size={18} />
          </button>
        )}
      </div>
      
      <EnhancedSidebar 
        user={user} 
        isOpen={isMobile ? mobileMenuOpen : isOpen} 
        collapsed={isMobile ? false : collapsed} 
        onToggle={toggle} 
        onLogout={onLogout}
        isMobile={isMobile}
        onClose={() => setMobileMenuOpen(false)}
      />
      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}
    </header>
  );
}
