import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './styles.css';
import { getFaculties, getDepartmentsByFaculty, getDepartments } from '../../api/services/lookups';
import { createFaculty, createDepartment } from '../../api/services/admin';

import '../home/home.css';
import { Navbar } from '../../components';

const ROLE_LABEL = { 0: 'Simple', 1: 'Student', 2: 'Advisor', 3: 'Admin' };

export default function CatalogPage({ user, onLogout }) {
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [facultyName, setFacultyName] = useState('');
  const [depName, setDepName] = useState('');
  const [depFacultyId, setDepFacultyId] = useState('');

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
      const { faculty } = await createFaculty(facultyName.trim());
      setFaculties((prev) => [...prev, faculty].sort((a,b) => a.name.localeCompare(b.name)));
      setFacultyName('');
    } catch (err) {
      setError(err.message || 'Fakülte eklenemedi');
    }
  }

  async function handleCreateDepartment(e) {
    e.preventDefault();
    const fid = Number(depFacultyId);
    if (!depName.trim() || !Number.isInteger(fid)) return;
    try {
      const { department } = await createDepartment(depName.trim(), fid);
      setDepartments((prev) => [...prev, department].sort((a,b) => a.name.localeCompare(b.name)));
      setDepName('');
      setDepFacultyId('');
    } catch (err) {
      setError(err.message || 'Bölüm eklenemedi');
    }
  }

  const isAdmin = Number(user?.role_id) === 3;
  const roleName = ROLE_LABEL?.[user?.role_id] ?? `Role ${user?.role_id}`;

  return (
    <div className="admin-page">
      <Navbar user={user} onLogout={onLogout} />

      {loading && <div className="admin-info">Loading...</div>}
      {error && !loading && <div className="admin-alert admin-alert--error">{error}</div>}

      {!loading && !error && (
        <div className="catalog-grid">
          <section className="catalog-card">
            <h2 className="catalog-card__title">Add Faculty</h2>
            <form className="catalog-form" onSubmit={handleCreateFaculty}>
              <input
                className="catalog-input"
                type="text"
                placeholder="Faculty name"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
              />
              <button className="catalog-btn" type="submit">Add</button>
            </form>
            <div className="catalog-list">
              {faculties.length === 0 ? (
                <div className="catalog-empty">No faculties yet.</div>
              ) : (
                faculties.map((f) => (
                  <div key={f.id} className="catalog-item">{f.name}</div>
                ))
              )}
            </div>
          </section>

          <section className="catalog-card">
            <h2 className="catalog-card__title">Add Department</h2>
            <form className="catalog-form" onSubmit={handleCreateDepartment}>
              <select
                className="catalog-input"
                value={depFacultyId}
                onChange={(e) => setDepFacultyId(e.target.value)}
              >
                <option value="">Select faculty</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <input
                className="catalog-input"
                type="text"
                placeholder="Department name"
                value={depName}
                onChange={(e) => setDepName(e.target.value)}
              />
              <button className="catalog-btn" type="submit">Add</button>
            </form>
            <div className="catalog-list">
              {faculties.map((f) => (
                <div key={f.id} className="catalog-group">
                  <div className="catalog-group__title">{f.name}</div>
                  <div className="catalog-group__items">
                    {(byFaculty.get(f.id) || []).length === 0 ? (
                      <div className="catalog-empty">No departments.</div>
                    ) : (
                      (byFaculty.get(f.id) || []).map((d) => (
                        <div key={d.id} className="catalog-item">{d.name}</div>
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
  );
}
