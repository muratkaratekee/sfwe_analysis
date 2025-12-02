import React, { useEffect, useState } from 'react';
import './styles.css';
import '../home/home.css';
import { useParams, Link } from 'react-router-dom';
import { getThesesFiltered } from '../../api/services/theses';
import { getAdvisors, getFaculties, getDepartmentsByFaculty } from '../../api/services/lookups';
import ThesisDetail from './ThesisDetail.jsx';
import { Navbar, ThesisList } from '../../components';

const ROLE_LABEL = {
  0: 'Simple',
  1: 'Student',
  2: 'Advisor',
  3: 'Admin',
};

export default function ThesisPage({ user, onLogout }) {
  const params = useParams();
  const thesisId = params?.id ? Number(params.id) : null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [advisors, setAdvisors] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');

  // Load dropdown data
  useEffect(() => {
    getAdvisors().then((d) => setAdvisors(Array.isArray(d) ? d : [])).catch(() => setAdvisors([]));
    getFaculties().then((d) => setFaculties(Array.isArray(d) ? d : [])).catch(() => setFaculties([]));
  }, []);

  useEffect(() => {
    if (!selectedFaculty) { setDepartments([]); setSelectedDepartment(''); return; }
    getDepartmentsByFaculty(selectedFaculty)
      .then((d) => setDepartments(Array.isArray(d) ? d : []))
      .catch(() => setDepartments([]));
  }, [selectedFaculty]);

  async function fetchList() {
    setLoading(true);
    setError('');
    try {
      let yFrom = yearFrom !== '' ? Number(yearFrom) : undefined;
      let yTo = yearTo !== '' ? Number(yearTo) : undefined;
      if (yFrom !== undefined && yTo !== undefined && yFrom > yTo) {
        const tmp = yFrom; yFrom = yTo; yTo = tmp; // swap
      }
      const data = await getThesesFiltered({
        advisor_id: selectedAdvisor ? Number(selectedAdvisor) : undefined,
        faculty_id: selectedFaculty ? Number(selectedFaculty) : undefined,
        department_id: selectedDepartment ? Number(selectedDepartment) : undefined,
        year_from: yFrom,
        year_to: yTo,
        q: search && search.trim() !== '' ? search.trim() : undefined,
        sort: sortBy && sortBy.trim() !== '' ? sortBy : undefined,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch for list page
  useEffect(() => {
    let alive = true;
    if (!thesisId) {
      (async () => {
        try {
          await fetchList();
        } catch (_) {}
        if (alive) setLoading(false);
      })();
    } else {
      setLoading(false);
    }
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thesisId]);

  // Auto-fetch on filter changes (only on list view)
  useEffect(() => {
    if (thesisId) return;
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdvisor, selectedFaculty, selectedDepartment, yearFrom, yearTo, search, sortBy]);

  const roleName = ROLE_LABEL?.[user?.role_id] ?? `Role ${user?.role_id}`;
  return (
    <div className="thesis-page">
      <Navbar user={user} onLogout={onLogout} />

      {!thesisId && (
        <section className="thesis-hero-wrap">
          <div className="thesis-hero">Theses</div>
        </section>
      )}

      {!thesisId && (
        <section className="thesis-container" style={{ marginTop: 12 }}>
          <div className="admin-form thesis-search" style={{ marginBottom: 12 }}>
            <div className="thesis-filters__grid" style={{ flexWrap: 'wrap' }}>
              <label className="admin-label" style={{ minWidth: 320, flex: '1 1 320px' }}>
                Search
                <input className="admin-input search-input" placeholder="Search title, abstract, keywords" value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="thesis-filters admin-form" style={{ marginBottom: 12 }}>
            <div className="thesis-filters__grid">
              <label className="admin-label">
                Sort
                <select className="admin-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="">Default</option>
                  <option value="views">Most Viewed</option>
                  <option value="citations">Most Cited</option>
                </select>
              </label>
              <label className="admin-label">
                Advisor
                <select className="admin-input" value={selectedAdvisor} onChange={(e) => setSelectedAdvisor(e.target.value)}>
                  <option value="">All</option>
                  {advisors.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </label>
              <label className="admin-label">
                Faculty
                <select className="admin-input" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
                  <option value="">All</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </label>
              <label className="admin-label">
                Department
                <select className="admin-input" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} disabled={!selectedFaculty}>
                  <option value="">{selectedFaculty ? 'All' : 'Select faculty first'}</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label className="admin-label">
                Year From
                <input className="admin-input" type="number" placeholder="e.g. 2015" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} />
              </label>
              <label className="admin-label">
                Year To
                <input className="admin-input" type="number" placeholder="e.g. 2020" value={yearTo} onChange={(e) => setYearTo(e.target.value)} />
              </label>
              <div className="thesis-filters__actions">
                <button className="btn btn-link" onClick={() => { setSelectedAdvisor(''); setSelectedFaculty(''); setSelectedDepartment(''); setYearFrom(''); setYearTo(''); setDepartments([]); setSortBy(''); }}>Clear filters</button>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="thesis-container">
        {loading && <div className="thesis-info">Loading...</div>}
        {error && !loading && <div className="thesis-alert thesis-alert--error">{error}</div>}

        {!loading && !error && !thesisId && (
          items.length === 0 ? (
            <div className="thesis-info">No theses yet.</div>
          ) : (
            <ThesisList items={items} />
          )
        )}

        {!loading && !error && thesisId && (
          <ThesisDetail thesisId={thesisId} user={user} />
        )}
      </main>
    </div>
  );
}
