// Türkçe: Login ve Register formlarını içeren sayfa (fakülte-bölüm zincirli seçim ile)
import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE, getJson, postJson } from '../../api/client';
import './styles.css';

export default function LoginRegisterPage({ onLoggedIn = () => {} }) {
  // Türkçe: Sayfa modu (login / register)
  const [mode, setMode] = useState('login');

  // Türkçe: Login formu
  const [loginEmailUser, setLoginEmailUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Türkçe: Register formu
  const [fullName, setFullName] = useState('');
  const [regEmailUser, setRegEmailUser] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Türkçe: Görsel e-posta önizleme (yalnızca bilgi amaçlı)
  const emailPreviewLogin = useMemo(() => (loginEmailUser ? `${loginEmailUser}@final.edu.tr` : ''), [loginEmailUser]);
  const emailPreviewReg = useMemo(() => (regEmailUser ? `${regEmailUser}@final.edu.tr` : ''), [regEmailUser]);

  // Türkçe: Fakülteleri ilk yüklemede getir
  useEffect(() => {
    getJson(`${API_BASE}/faculties`).then(setFaculties).catch(() => setFaculties([]));
  }, []);

  // Türkçe: Fakülte seçimi değişince bölümleri getir
  useEffect(() => {
    if (!selectedFaculty) { setDepartments([]); setSelectedDepartment(''); return; }
    getJson(`${API_BASE}/departments?faculty_id=${selectedFaculty}`)
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [selectedFaculty]);

  // Türkçe: Giriş gönder
  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSuccessMsg('');
    try {
      setLoginLoading(true);
      const resp = await postJson(`${API_BASE}/auth/login`, {
        emailUser: loginEmailUser,
        password: loginPassword,
      });
      setSuccessMsg(`Welcome, ${resp.user.full_name}`);
      onLoggedIn(resp.user);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // Türkçe: Kayıt gönder
  const submitRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setSuccessMsg('');
    try {
      setRegLoading(true);
      const resp = await postJson(`${API_BASE}/auth/register`, {
        full_name: fullName,
        emailUser: regEmailUser,
        password: regPassword,
        faculties_id: selectedFaculty ? Number(selectedFaculty) : '',
        department_id: selectedDepartment ? Number(selectedDepartment) : '',
      });
      setSuccessMsg(`Registration successful: ${resp.user.email}`);
      // Türkçe: Formu sıfırla
      setFullName(''); setRegEmailUser(''); setRegPassword(''); setSelectedFaculty(''); setSelectedDepartment('');
      // Türkçe: Başarılı kayıt sonrası giriş ekranına dön
      setMode('login');
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="page">
      {/* Top navigation - brand on right */}
      <header className="nav">
        <div className="nav-right">Maygülü</div>
      </header>

      {/* Page content */}
      <main className="page-container">
        <h2 className="page-title">Login / Register</h2>

        {/* Mode switch */}
        <div className="mode-switch">
          <button className="btn btn-secondary" onClick={() => setMode('login')} disabled={mode === 'login'}>Sign in</button>
          <button className="btn btn-secondary" onClick={() => setMode('register')} disabled={mode === 'register'}>Create account</button>
        </div>

        {successMsg && <div className="alert-success">{successMsg}</div>}

        {mode === 'login' ? (
          <form onSubmit={submitLogin} className="card card--login">
            {/* Email (username + fixed domain preview) */}
            <label className="form-label">
              Email
              <div className="email-input">
                <input
                  className="input"
                  value={loginEmailUser}
                  onChange={e => setLoginEmailUser(e.target.value)}
                  placeholder="you"
                />
                <span className="email-domain">@final.edu.tr</span>
              </div>
            </label>
            <div className="hint">Full email: {emailPreviewLogin || '(enter)'}</div>

            {/* Password */}
            <label className="form-label">
              Password
              <input className="input" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" />
            </label>

            {loginError && <div className="alert-error">{loginError}</div>}
            <button className="btn btn-primary" type="submit" disabled={loginLoading}>{loginLoading ? 'Submitting...' : 'Sign in'}</button>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="card card--register">
            {/* Full name */}
            <label className="form-label">
              Full name
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" />
            </label>

            {/* Email (username + fixed domain preview) */}
            <label className="form-label">
              Email
              <div className="email-input">
                <input
                  className="input"
                  value={regEmailUser}
                  onChange={e => setRegEmailUser(e.target.value)}
                  placeholder="you"
                />
                <span className="email-domain">@final.edu.tr</span>
              </div>
            </label>
            <div className="hint">Full email: {emailPreviewReg || '(enter)'}
            </div>

            {/* Password */}
            <label className="form-label">
              Password
              <input className="input" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" />
            </label>

            {/* Faculty */}
            <label className="form-label">
              Faculty
              <select className="input" value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
                <option value="">Empty</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </label>

            {/* Department (depends on selected faculty) */}
            <div className="hint">If you are a staff member or an alumnus, choose Empty.</div>
            <label className="form-label">
              Department
              <select className="input" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} disabled={!selectedFaculty}>
                <option value="">Empty</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>

            {regError && <div className="alert-error">{regError}</div>}
            <button className="btn btn-primary" type="submit" disabled={regLoading}>{regLoading ? 'Submitting...' : 'Create account'}</button>
          </form>
        )}

        {/* Alt link */}
        <div className="alt-link">
          {mode === 'login' ? (
            <button className="btn btn-link" onClick={() => setMode('register')}>Create account</button>
          ) : (
            <button className="btn btn-link" onClick={() => setMode('login')}>Already have an account? Sign in</button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">Maygülü — All rights reserved.</footer>
    </div>
  );
}
