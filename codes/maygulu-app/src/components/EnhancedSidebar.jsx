import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FileText, Upload, Users, Building2, LogOut, Star, LayoutDashboard, X } from 'lucide-react';

const EnhancedSidebar = ({ user, isOpen, collapsed = false, onToggle, onLogout, isMobile = false, onClose }) => {
  const location = useLocation();
  const role = Number(user?.role_id);
  const isAdmin = role === 3;
  const isAdvisor = role === 2;
  const isStudent = role === 1;

  // Kullanıcının en son hangi listede (All veya Favorites) olduğunu tarayıcı hafızasına kaydet
  useEffect(() => {
    if (location.pathname === '/theses') {
      if (location.search.includes('favorites=1')) {
        sessionStorage.setItem('lastThesisMenu', 'favorites');
      } else {
        sessionStorage.setItem('lastThesisMenu', 'all');
      }
    }
  }, [location]);

  if (!isOpen) return null;


  // Aktif linki belirle
  const isActiveLink = (path) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const lastMenu = sessionStorage.getItem('lastThesisMenu');

    if (path === '/dashboard') return currentPath === '/dashboard';

    // Favorites aktiflik kontrolü
    if (path === '/theses?favorites=1') {
      return currentSearch.includes('favorites=1') ||
        (currentPath.startsWith('/theses/') && lastMenu === 'favorites');
    }

    // All Theses aktiflik kontrolü
    if (path === '/theses') {
      return (currentPath === '/theses' && !currentSearch.includes('favorites=1')) ||
        (currentPath.startsWith('/theses/') && lastMenu !== 'favorites');
    }

    return currentPath === path;
  };

  const showDashboard = isAdmin || isAdvisor;

  const collapsedLinks = [
    ...(showDashboard ? [{ to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }] : []),
    { to: '/theses', label: 'All Theses', Icon: BookOpen },
    { to: '/theses?favorites=1', label: 'Favorites', Icon: Star },
    ...(isAdvisor ? [{ to: '/advisor/my-theses', label: 'My Theses', Icon: FileText }] : []),
    ...(isStudent ? [{ to: '/student/my-theses', label: 'My Theses', Icon: FileText }] : []),
    ...(isAdmin ? [{ to: '/admin/upload', label: 'Upload Thesis', Icon: Upload }] : []),
    ...(isAdmin ? [{ to: '/admin/users', label: 'User Management', Icon: Users }] : []),
    ...(isAdmin ? [{ to: '/admin/catalog', label: 'Faculty/Department', Icon: Building2 }] : []),
  ];


  return (
    <aside
      className={`enhanced-sidebar${collapsed ? ' enhanced-sidebar--collapsed' : ''}${isMobile ? ' enhanced-sidebar--mobile' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? (isOpen ? 0 : '-280px') : 0,
        height: '100vh',
        width: isMobile ? '280px' : (collapsed ? '80px' : '240px'),
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        boxShadow: '2px 0 8px rgba(0,0,0,0.12)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        transition: isMobile ? 'left 300ms ease' : 'width 240ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Mobile close button */}
      {isMobile && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <X size={24} color="var(--text-primary)" />
        </button>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '150px',
        padding: '12px 10px',
        borderBottom: '1px solid var(--border-color)',
        transition: 'all 240ms ease'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <img
            src="/logo-final.PNG"
            alt="Logo"
            style={{
              width: collapsed ? '64px' : '110px',
              height: collapsed ? '64px' : '110px',
              objectFit: 'contain',
              borderRadius: '8px',
              transition: 'all 240ms ease'
            }}
          />
          <div
            style={{
              textAlign: 'center',
              lineHeight: 1.0,
              fontFamily: "Myriad Pro, 'Myriad Pro Bold Italic', Arial, sans-serif",
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 12,
              letterSpacing: 0.3,
              opacity: collapsed ? 0 : 1,
              maxHeight: collapsed ? 0 : '30px',
              overflow: 'hidden',
              transition: 'all 240ms ease'
            }}
          >
            <div>FINAL INTERNATIONAL</div>
            <div>UNIVERSITY</div>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {collapsedLinks.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            title={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '12px 0' : '12px 14px',
              margin: collapsed ? '0' : '0 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 10,
              textDecoration: 'none',
              color: isActiveLink(to) ? '#ffffff' : 'var(--text-primary)',
              background: isActiveLink(to) ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'transparent',
              cursor: 'pointer',
              boxShadow: isActiveLink(to) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s ease',
              fontWeight: 600,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isActiveLink(to)) {
                e.currentTarget.style.background = 'var(--bg-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActiveLink(to)) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <Icon size={20} style={{ flexShrink: 0 }} color={isActiveLink(to) ? '#ffffff' : 'var(--text-primary)'} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          {!collapsed && (
            <>
              {/* User name - show on mobile */}
              {isMobile && user?.full_name && (
                <div style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '4px'
                }}>
                  {user.full_name}
                </div>
              )}
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                marginBottom: '12px'
              }}>
                {role === 3 ? 'Admin' : role === 2 ? 'Supervisor' : role === 1 ? 'Student' : 'Other'}
              </div>
            </>
          )}
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: collapsed ? '10px 10px' : '8px 10px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            title="Logout"
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(0.85)';
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.background = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#ef4444';
            }}
          >
            {collapsed ? <LogOut size={18} /> : 'Logout'}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default EnhancedSidebar;