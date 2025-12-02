// Türkçe: App artık react-router ile URL tabanlı gezinme kullanır
import React, { useEffect, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginRegisterPage from './pages/LoginRegisterPage';
import HomePage from './pages/home/home.jsx';
import ThesisUploadPage from './pages/Admin/ThesisUploadPage.jsx';
import ThesisPage from './pages/thesis/ThesisPage.jsx';
import UsersPage from './pages/Admin/UsersPage.jsx';
import CatalogPage from './pages/Admin/CatalogPage.jsx';
import MyTheses from './pages/advisor/MyTheses.jsx';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) setUser(JSON.parse(raw));
    } catch (_) {
      // no-op
    }
  }, []);

  const handleLoggedIn = (u) => {
    try { localStorage.setItem('auth_user', JSON.stringify(u)); } catch (_) {}
    setUser(u);
  };

  const handleLogout = () => {
    try { localStorage.removeItem('auth_user'); } catch (_) {}
    setUser(null);
  };

  const isAdmin = Number(user?.role_id) === 3;

  return (
    <div className="app-shell">
      <BrowserRouter>
        <div className="app-content">
          <Routes>
            <Route
              path="/"
              element={user ? (<HomePage user={user} onLogout={handleLogout} />) : (<LoginRegisterPage onLoggedIn={handleLoggedIn} />)}
            />
            <Route path="/theses" element={user ? (<ThesisPage user={user} onLogout={handleLogout} />) : (<Navigate to="/" replace />)} />
            <Route path="/theses/:id" element={user ? (<ThesisPage user={user} onLogout={handleLogout} />) : (<Navigate to="/" replace />)} />
            <Route
              path="/admin/upload"
              element={user ? (isAdmin ? <ThesisUploadPage user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />) : (<Navigate to="/" replace />)}
            />
            <Route
              path="/admin/users"
              element={user ? (isAdmin ? <UsersPage user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />) : (<Navigate to="/" replace />)}
            />
            <Route
              path="/admin/catalog"
              element={user ? (isAdmin ? <CatalogPage user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />) : (<Navigate to="/" replace />)}
            />
            <Route
              path="/advisor/my-theses"
              element={user ? (Number(user?.role_id) === 2 ? <MyTheses user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />) : (<Navigate to="/" replace />)}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
      <footer className="site-footer">All rights reserved Maygülü</footer>
    </div>
  );
}

export default App;
