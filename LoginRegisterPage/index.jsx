// Türkçe: Login ve Register formlarını içeren sayfa (fakülte-bölüm zincirli seçim ile)
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { API_BASE, getJson, postJson } from '../../api/client';
import './styles.css';
import '../dashboard/home.css';

export default function LoginRegisterPage({ onLoggedIn = () => { } }) {
  // Türkçe: Sayfa modu (login / register)
  const [mode, setMode] = useState('login');

  // Türkçe: Login formu
  const [loginEmailUser, setLoginEmailUser] = useState(localStorage.getItem('lastLoginEmail') || '');
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
  const [isStudent, setIsStudent] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});

  // Türkçe: Görsel e-posta önizleme (yalnızca bilgi amaçlı)
  const emailPreviewLogin = useMemo(() => (loginEmailUser ? `${loginEmailUser}@final.edu.tr` : ''), [loginEmailUser]);
  const emailPreviewReg = useMemo(() => (regEmailUser ? `${regEmailUser}@final.edu.tr` : ''), [regEmailUser]);

  // Türkçe: Fakülteleri ilk yüklemede getir
  useEffect(() => {
    getJson(`${API_BASE}/faculties`)
      .then(data => setFaculties(Array.isArray(data) ? data.filter(f => f.name && f.name.trim() !== '' && f.name.trim().toLowerCase() !== 'empty') : []))
      .catch(() => setFaculties([]));
  }, []);

  // Türkçe: Fakülte seçimi değişince bölümleri getir
  useEffect(() => {
    if (!selectedFaculty) { setDepartments([]); setSelectedDepartment(''); return; }
    getJson(`${API_BASE}/departments?faculty_id=${selectedFaculty}`)
      .then(data => setDepartments(Array.isArray(data) ? data.filter(d => d.name && d.name.trim() !== '' && d.name.trim().toLowerCase() !== 'empty') : []))
      .catch(() => setDepartments([]));
  }, [selectedFaculty]);

  // Türkçe: Giriş gönder
  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSuccessMsg('');
    try {
      setLoginLoading(true);
      // Save email for next time
      localStorage.setItem('lastLoginEmail', loginEmailUser);

      const resp = await postJson(`${API_BASE}/auth/login`, {
        emailUser: loginEmailUser,
        password: loginPassword,
      });
      setSuccessMsg(`Welcome, ${resp.user.full_name}`);
      if (resp?.user?.is_active === false) {
        setLoginError('Your account is inactive. Please contact administrator.');
        return;
      }
      onLoggedIn(resp.user);
    } catch (err) {
      if (err?.status === 403) {
        setLoginError(err.message || 'Your account is inactive. Please contact administrator.');
      } else {
        setLoginError(err.message);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Türkçe: Kayıt gönder
  const submitRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setSuccessMsg('');
    setValidationErrors({});

    // Validation
    const errors = {};
    if (!fullName.trim()) errors.fullName = true;
    if (!regEmailUser.trim()) errors.regEmailUser = true;
    if (!regPassword) errors.regPassword = true;
    if (isStudent) {
      if (!selectedFaculty) errors.selectedFaculty = true;
      if (!selectedDepartment) errors.selectedDepartment = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setRegError('Please fill in all required fields.');
      return;
    }

    try {
      setRegLoading(true);
      const resp = await postJson(`${API_BASE}/auth/register`, {
        full_name: fullName,
        emailUser: regEmailUser,
        password: regPassword,
        faculties_id: isStudent && selectedFaculty ? Number(selectedFaculty) : '',
        department_id: isStudent && selectedDepartment ? Number(selectedDepartment) : '',
        role_id: isStudent ? 1 : 0,
      });
      setSuccessMsg(`Registration successful: ${resp.user.email}`);
      // Türkçe: Formu sıfırla
      setFullName(''); setRegEmailUser(''); setRegPassword(''); setSelectedFaculty(''); setSelectedDepartment('');
      setValidationErrors({});
      // Türkçe: Başarılı kayıt sonrası giriş ekranına dön
      setMode('login');
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ 
      minHeight: '100vh', 
      padding: '0', 
      margin: '0', 
      display: 'flex', 
      flexDirection: 'row'
    }}>
      {/* Sol üst köşe - Homepage'e dön butonu */}
      <Link
        to="/"
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#333',
          borderRadius: '50%',
          textDecoration: 'none',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease'
        }}
        title="Back to Home"
      >
        <ArrowLeft size={20} />
      </Link>

      {/* Sol taraf - Fotoğraf (sabit) */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'calc(100% - 500px)',
        height: '100vh'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("/final_gece.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom'
        }} />
        {/* Dark mode overlay */}
        <div className="login-dark-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }} />
      </div>
      
      {/* Sol taraf için boşluk */}
      <div style={{ flex: 1 }} />
      
      {/* Sağ taraf - Login formu */}
      <div style={{
        width: '500px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        minHeight: '100vh',
        overflowY: 'auto'
      }}>
        <main className="page-container" style={{ flex: 1 }}>
          <h2 className="page-title" style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ opacity: mode === 'login' ? 1 : 0.4 }}>Login</span>
            <span> / </span>
            <span style={{ opacity: mode === 'register' ? 1 : 0.4 }}>Register</span>
          </h2>

        {successMsg && <div className="alert-success">{successMsg}</div>}

        {mode === 'login' ? (
          <form onSubmit={submitLogin} className="card card--login">
            {/* Email (username + fixed domain preview) */}
            <label className="form-label">
              Email
              <div className="email-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                <input
                  className="input"
                  style={{ width: '100%', paddingRight: '120px' }}
                  value={loginEmailUser}
                  onChange={e => setLoginEmailUser(e.target.value)}
                  placeholder="you"
                />
                <span style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  opacity: 0.6,
                  pointerEvents: 'none',
                  fontSize: '14px'
                }}>@final.edu.tr</span>
              </div>
            </label>
            <div className="hint">Full email: {emailPreviewLogin || '(enter)'}</div>

            {/* Password */}
            <label className="form-label">
              Password
              <input 
                className="input" 
                type="password" 
                value={loginPassword} 
                onChange={e => setLoginPassword(e.target.value)} 
                placeholder="••••••••"
                onKeyDown={e => { if (e.key === 'Enter') e.target.form.requestSubmit(); }}
              />
            </label>

            {loginError && <div className="alert-error">{loginError}</div>}
            <button className="btn btn-primary" type="submit" disabled={loginLoading}>{loginLoading ? 'Submitting...' : 'Sign in'}</button>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="card card--register">
            {/* Full name */}
            <label className="form-label">
              Full name
              <input
                className="input"
                value={fullName}
                onChange={e => { setFullName(e.target.value); setValidationErrors(prev => ({ ...prev, fullName: false })); }}
                placeholder="John Doe"
                style={validationErrors.fullName ? { border: '2px solid #ef4444' } : {}}
              />
            </label>

            {/* Email (username + fixed domain preview) */}
            <label className="form-label">
              Email
              <div className="email-input-wrapper" style={{ position: 'relative', width: '100%' }}>
                <input
                  className="input"
                  style={{ width: '100%', paddingRight: '120px', ...(validationErrors.regEmailUser ? { border: '2px solid #ef4444' } : {}) }}
                  value={regEmailUser}
                  onChange={e => { setRegEmailUser(e.target.value); setValidationErrors(prev => ({ ...prev, regEmailUser: false })); }}
                  placeholder="you"
                />
                <span style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  opacity: 0.6,
                  pointerEvents: 'none',
                  fontSize: '14px'
                }}>@final.edu.tr</span>
              </div>
            </label>
            <div className="hint">Full email: {emailPreviewReg || '(enter)'}
            </div>

            {/* Password */}
            <label className="form-label">
              Password
              <input
                className="input"
                type="password"
                value={regPassword}
                onChange={e => { setRegPassword(e.target.value); setValidationErrors(prev => ({ ...prev, regPassword: false })); }}
                placeholder="••••••••"
                style={validationErrors.regPassword ? { border: '2px solid #ef4444' } : {}}
              />
            </label>

            {/* I am a student checkbox */}
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span>I am a student</span>
              <input
                type="checkbox"
                checked={isStudent}
                onChange={e => {
                  setIsStudent(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedFaculty('');
                    setSelectedDepartment('');
                  }
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#2563eb'
                }}
              />
            </label>

            {/* Faculty - sadece öğrenci ise göster */}
            {isStudent && (
              <label className="form-label">
                Faculty
                <select
                  className="input"
                  value={selectedFaculty}
                  onChange={e => { setSelectedFaculty(e.target.value); setValidationErrors(prev => ({ ...prev, selectedFaculty: false })); }}
                  style={validationErrors.selectedFaculty ? { border: '2px solid #ef4444' } : {}}
                >
                  <option value="">Empty</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
            )}

            {/* Department - sadece öğrenci ise göster */}
            {isStudent && (
              <label className="form-label">
                Department
                <select
                  className="input"
                  value={selectedDepartment}
                  onChange={e => { setSelectedDepartment(e.target.value); setValidationErrors(prev => ({ ...prev, selectedDepartment: false })); }}
                  disabled={!selectedFaculty}
                  style={validationErrors.selectedDepartment ? { border: '2px solid #ef4444' } : {}}
                >
                  <option value="">Empty</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
            )}

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
      </div>
    </div>
  );
}
