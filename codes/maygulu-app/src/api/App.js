// Türkçe: App artık react-router ile URL tabanlı gezinme kullanır
import React, { useState } from 'react';
import '../App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../HomePage.jsx';
import LoginRegisterPage from '../pages/LoginRegisterPage';
import DashboardPage from '../pages/dashboard/home.jsx';
import ThesisUploadPage from '../pages/Admin/ThesisUploadPage.jsx';
import ThesisPage from '../pages/thesis/ThesisPage.jsx';
import UsersPage from '../pages/Admin/UsersPage.jsx';
import CatalogPage from '../pages/Admin/faculty_departments.jsx';
import MyTheses from '../pages/mytheses/MyTheses.jsx';

function getInitialUser() {
  try {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.is_active === false) {
        localStorage.removeItem('auth_user');
        return null;
      }
      return u;
    }
  } catch (_) { }
  return null;
}

function App() {
  const [user, setUser] = useState(getInitialUser);

  const handleLoggedIn = (u) => {
    try { localStorage.setItem('auth_user', JSON.stringify(u)); } catch (_) { }
    setUser(u);
  };

  const handleLogout = () => {
    try {
      // Save email before logging out if available
      const userData = JSON.parse(localStorage.getItem('auth_user') || '{}');
      if (userData?.email) {
        const emailUser = userData.email.split('@')[0];
        localStorage.setItem('lastLoginEmail', emailUser);
      }
      localStorage.removeItem('auth_user');
    } catch (_) { }
    setUser(null);
    window.location.href = '/';
  };

  const isAdmin = Number(user?.role_id) === 3;

  return (
    <div className="app-shell">
      <BrowserRouter>
        <div className="app-content">
          <Routes>
            <Route
              path="/"
              element={user ? <DashboardPage user={user} onLogout={handleLogout} /> : <HomePage />}
            />
            <Route
              path="/login"
              element={user ? (
                (Number(user?.role_id) === 0 || Number(user?.role_id) === 1) ? <Navigate to="/theses" replace /> : <Navigate to="/home" replace />
              ) : (
                <LoginRegisterPage onLoggedIn={handleLoggedIn} />
              )}
            />
            <Route
              path="/dashboard"
              element={user ? (<DashboardPage user={user} onLogout={handleLogout} />) : (<Navigate to="/login" replace />)}
            />
            <Route
              path="/home"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/theses" element={user ? (<ThesisPage user={user} onLogout={handleLogout} />) : (<Navigate to="/login" replace />)} />
            <Route path="/theses/:id" element={user ? (<ThesisPage user={user} onLogout={handleLogout} />) : (<Navigate to="/login" replace />)} />
            <Route
              path="/admin/upload"
              element={user ? (isAdmin ? <ThesisUploadPage user={user} onLogout={handleLogout} /> : <Navigate to="/home" replace />) : (<Navigate to="/login" replace />)}
            />
            <Route
              path="/admin/users"
              element={user ? (isAdmin ? <UsersPage user={user} onLogout={handleLogout} /> : <Navigate to="/home" replace />) : (<Navigate to="/login" replace />)}
            />
            <Route
              path="/admin/catalog"
              element={user ? (isAdmin ? <CatalogPage user={user} onLogout={handleLogout} /> : <Navigate to="/home" replace />) : (<Navigate to="/login" replace />)}
            />
            <Route
              path="/advisor/my-theses"
              element={user ? (Number(user?.role_id) === 2 ? <MyTheses user={user} onLogout={handleLogout} /> : <Navigate to="/home" replace />) : (<Navigate to="/login" replace />)}
            />
            <Route
              path="/student/my-theses"
              element={user ? (Number(user?.role_id) === 1 ? <MyTheses user={user} onLogout={handleLogout} /> : <Navigate to="/home" replace />) : (<Navigate to="/login" replace />)}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
