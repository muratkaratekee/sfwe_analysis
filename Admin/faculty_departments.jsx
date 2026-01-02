import React, { useEffect, useMemo, useState } from 'react';
import './styles.css';
import { getFaculties, getDepartments } from '../../api/lookups';
import { createFaculty, updateFaculty, createDepartment, updateDepartment } from '../../api/admin';

import '../dashboard/home.css';
import { Navbar } from '../../components';

export default function CatalogPage({ user, onLogout }) {
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [facultyName, setFacultyName] = useState('');
  const [depName, setDepName] = useState('');
  const [depFacultyId, setDepFacultyId] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [deanName, setDeanName] = useState('');
  const [depDescription, setDepDescription] = useState('');
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  const byFaculty = useMemo(() => {
    const map = new Map();
    for (const f of faculties) map.set(f.id, []);
    for (const d of departments) {
      const arr = map.get(d.faculty_id) || [];
      arr.push(d);
      map.set(d.faculty_id, arr);
    }
    return map;
  }, [faculties, departments]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [fs, ds] = await Promise.all([getFaculties(), getDepartments()]);
        if (!alive) return;
        setFaculties(Array.isArray(fs) ? fs : []);
        setDepartments(Array.isArray(ds) ? ds : []);
      } catch (err) {
        if (alive) setError(err.message || 'Yüklenemedi');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  async function handleCreateFaculty(e) {
    e.preventDefault();
    if (!facultyName.trim()) return;
    try {
      const payload = {
        name: facultyName.trim(),
        short_code: facultyCode.trim() || undefined,
        dean_name: deanName.trim() || undefined,
      };
      let faculty;
      if (editingFaculty) {
        const updated = await updateFaculty(editingFaculty.id, payload);
        faculty = updated.faculty || updated;
        setFaculties((prev) =>
          prev
            .map((item) => (item.id === faculty.id ? { ...item, ...faculty } : item))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        const created = await createFaculty(payload);
        faculty = created.faculty || created;
        setFaculties((prev) => [...prev, faculty].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setFacultyName(''); setFacultyCode(''); setDeanName('');
      setEditingFaculty(null);
      setShowFacultyModal(false);
    } catch (err) {
      setError(err.message || 'Fakülte eklenemedi');
    }
  }

  async function handleCreateDepartment(e) {
    e.preventDefault();
    const fid = Number(depFacultyId);
    if (!depName.trim() || !Number.isInteger(fid)) return;
    try {
      const payload = {
        name: depName.trim(),
        faculty_id: fid,
        description: depDescription.trim() || undefined,
      };

      let department;
      if (editingDepartment) {
        const updated = await updateDepartment(editingDepartment.id, payload);
        department = updated.department || updated;
        setDepartments((prev) =>
          prev
            .map((item) => (item.id === department.id ? { ...item, ...department } : item))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        const created = await createDepartment(payload);
        department = created.department || created;
        setDepartments((prev) => [...prev, department].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setDepName(''); setDepDescription(''); setDepFacultyId('');
      setEditingDepartment(null);
      setShowDepartmentModal(false);
    } catch (err) {
      setError(err.message || 'Bölüm eklenemedi');
    }
  }


  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} />

      <div style={{ flex: '1' }}>
        {loading && <div className="admin-info">Loading...</div>}
        {error && !loading && <div className="admin-alert admin-alert--error">{error}</div>}

        {!loading && !error && (
          <div className="catalog-grid">
            <section className="catalog-card">
              <div className="catalog-card__header">
                <h2 className="catalog-card__title">Faculties</h2>
                <button
                  type="button"
                  className="catalog-btn catalog-btn--ghost"
                  onClick={() => setShowFacultyModal(true)}
                >
                  + Add Faculty
                </button>
              </div>
              <p className="catalog-card__hint">View all faculties and add new ones via the popup.</p>
              <div className="catalog-list">
                {faculties.length === 0 ? (
                  <div className="catalog-empty">No faculties yet.</div>
                ) : (
                  faculties.map((f) => (
                    <div key={f.id} className="catalog-item">
                      <div className="catalog-item__title">{f.name}</div>
                      <div className="catalog-item__meta catalog-item__meta--between">
                        <span className="catalog-chip">Code: {f.short_code || '—'}</span>
                        <span className="catalog-chip">Dean: {f.dean_name || '—'}</span>
                        {f.created_at && (
                          <span>Added {new Date(f.created_at).toLocaleDateString()}</span>
                        )}
                        <button
                          type="button"
                          className="catalog-edit-btn"
                          onClick={() => {
                            setEditingFaculty(f);
                            setFacultyName(f.name || '');
                            setFacultyCode(f.short_code || '');
                            setDeanName(f.dean_name || '');
                            setShowFacultyModal(true);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="catalog-card">
              <div className="catalog-card__header">
                <h2 className="catalog-card__title">Departments</h2>
                <button
                  type="button"
                  className="catalog-btn catalog-btn--ghost"
                  onClick={() => setShowDepartmentModal(true)}
                  disabled={faculties.length === 0}
                  title={faculties.length === 0 ? 'Add a faculty first' : undefined}
                >
                  + Add Department
                </button>
              </div>
              <p className="catalog-card__hint">Departments are grouped under their faculties.</p>
              <div className="catalog-list">
                {faculties.map((f) => (
                  <div key={f.id} className="catalog-group">
                    <div className="catalog-group__title">{f.name}</div>
                    <div className="catalog-group__items">
                      {(byFaculty.get(f.id) || []).length === 0 ? (
                        <div className="catalog-empty">No departments.</div>
                      ) : (
                        (byFaculty.get(f.id) || []).map((d) => (
                          <div key={d.id} className="catalog-item">
                            <div className="catalog-item__title">{d.name}</div>
                            <div className="catalog-item__meta catalog-item__meta--between">
                              <span>{d.description || 'No description yet.'}</span>
                              <button
                                type="button"
                                className="catalog-edit-btn"
                                onClick={() => {
                                  setEditingDepartment(d);
                                  setDepFacultyId(String(d.faculty_id));
                                  setDepName(d.name || '');
                                  setDepDescription(d.description || '');
                                  setShowDepartmentModal(true);
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {showFacultyModal && (
        <div className="admin-modal" onClick={() => setShowFacultyModal(false)}>
          <div className="admin-modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <p className="admin-modal__eyebrow">Faculty</p>
                <h2 className="admin-modal__title">{editingFaculty ? 'Edit Faculty' : 'Add Faculty'}</h2>
              </div>
              <button className="admin-modal__close" type="button" onClick={() => setShowFacultyModal(false)}>×</button>
            </div>
            <form className="catalog-form catalog-form--stacked" onSubmit={handleCreateFaculty}>
              <input
                className="catalog-input"
                type="text"
                placeholder="Faculty name"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
              />
              <input
                className="catalog-input"
                type="text"
                placeholder="Short Code (e.g., ENG)"
                value={facultyCode}
                onChange={(e) => setFacultyCode(e.target.value)}
              />
              <input
                className="catalog-input"
                type="text"
                placeholder="Dean Name"
                value={deanName}
                onChange={(e) => setDeanName(e.target.value)}
              />
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowFacultyModal(false)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn--primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDepartmentModal && (
        <div className="admin-modal" onClick={() => setShowDepartmentModal(false)}>
          <div className="admin-modal__panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div>
                <p className="admin-modal__eyebrow">Department</p>
                <h2 className="admin-modal__title">
                  {editingDepartment ? 'Edit Department' : 'Add Department'}
                </h2>
              </div>
              <button className="admin-modal__close" type="button" onClick={() => setShowDepartmentModal(false)}>×</button>
            </div>
            <form className="catalog-form catalog-form--stacked" onSubmit={handleCreateDepartment}>
              <select
                className="catalog-input"
                value={depFacultyId}
                onChange={(e) => setDepFacultyId(e.target.value)}
              >
                <option value="">Select faculty</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}{f.short_code ? ` (${f.short_code})` : ''}</option>
                ))}
              </select>
              <input
                className="catalog-input"
                type="text"
                placeholder="Department name"
                value={depName}
                onChange={(e) => setDepName(e.target.value)}
              />
              <textarea
                className="catalog-input"
                rows={3}
                placeholder="Department Description (optional)"
                value={depDescription}
                onChange={(e) => setDepDescription(e.target.value)}
              />
              <div className="admin-modal__actions">
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowDepartmentModal(false)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn--primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          ©2026 INTERNATIONAL FINAL UNIVERSITY. All rights reserved.
        </div>
      </footer>
    </div>
  );
}