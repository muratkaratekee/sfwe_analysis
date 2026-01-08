import React, { useEffect, useState, useRef } from 'react';
import './styles.css';
import '../dashboard/home.css';
import { useParams, useSearchParams } from 'react-router-dom';
import { getThesesFiltered } from '../../api/theses';
import { getAdvisors, getFaculties, getDepartmentsByFaculty } from '../../api/lookups';
import { getFavorites } from '../../api/favorites';
import ThesisDetail from './ThesisDetail.jsx';
import { Navbar, ThesisList } from '../../components';
import { Grid, List, X } from 'lucide-react';

export default function ThesisPage({ user, onLogout }) {
  const params = useParams();
  const thesisId = params?.id ? Number(params.id) : null;

  const [searchParams, setSearchParams] = useSearchParams();

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    try {
      const saved = localStorage.getItem('thesis_items_per_page');
      const value = saved ? Number(saved) : 10;
      return [10, 20, 30, 50].includes(value) ? value : 10;
    } catch (_) {
      return 10;
    }
  });

  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const footerRef = useRef(null);
  const filterRef = useRef(null);
  const [filterBottom, setFilterBottom] = useState(20);

  // Filter panel scroll handling - stop at footer
  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current || !filterRef.current) return;
      const footerRect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // If footer is visible, adjust filter panel bottom
      if (footerRect.top < windowHeight) {
        const newBottom = windowHeight - footerRect.top + 20;
        setFilterBottom(newBottom);
      } else {
        setFilterBottom(20);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const q = searchParams.get('favorites');
    setFavoritesOnly(q === '1' || q === 'true');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Favorileri API'den yükle
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.id) {
        setFavoriteIds(new Set());
        return;
      }
      try {
        const data = await getFavorites(user.id);
        const ids = new Set(data.map((f) => String(f.thesis_id)));
        setFavoriteIds(ids);
      } catch (err) {
        console.error('Favoriler yüklenemedi:', err);
        setFavoriteIds(new Set());
      }
    };

    loadFavorites();
    window.addEventListener('favorite_theses_changed', loadFavorites);
    return () => {
      window.removeEventListener('favorite_theses_changed', loadFavorites);
    };
  }, [user?.id]);

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
        } catch (_) { }
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
    setCurrentPage(1); // Reset to first page on filter change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdvisor, selectedFaculty, selectedDepartment, yearFrom, yearTo, search, sortBy]);

  // Pagination calculations
  const filteredItems = favoritesOnly
    ? items.filter((it) => favoriteIds.has(String(it?.id)))
    : items;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);
  const shownCount = Math.min(currentPage * itemsPerPage, filteredItems.length);

  return (
    <div className="thesis-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} onLogout={onLogout} onFilterToggle={() => setFilterPanelOpen(v => !v)} showFilterButton={!thesisId} />

      <div style={{ flex: '1', minHeight: 'calc(100vh - 56px)' }}>
        {!thesisId && (
          <div className="page-header">
            <h1 className="page-title">{favoritesOnly ? 'Favorite Theses' : 'Theses'}</h1>
          </div>
        )}

        {!thesisId && (
          <div className="thesis-layout">
            <main className="thesis-main">
              {loading && <div className="thesis-info">Loading...</div>}
              {error && !loading && <div className="thesis-alert thesis-alert--error">{error}</div>}

              {!loading && !error && (
                items.length === 0 ? (
                  <div className="thesis-info">No theses yet.</div>
                ) : (
                  <>
                    <div className="view-toggle-container">
                      <div className="view-toggle">
                        <button
                          className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setViewMode('list')}
                          title="List view"
                        >
                          <List size={18} />
                          <span className="view-toggle-label">List</span>
                        </button>
                        <button
                          className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                          onClick={() => setViewMode('grid')}
                          title="Grid view"
                        >
                          <Grid size={18} />
                          <span className="view-toggle-label">Grid</span>
                        </button>
                      </div>
                    </div>
                    <ThesisList items={paginatedItems} viewMode={viewMode} user={user} />
                    <div className="pagination-bar">
                      <div className="pagination">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <div className="pagination-controls">
                        <label className="pagination-per-page-label">
                          Items per page:
                          <select
                            className="pagination-per-page-select"
                            value={itemsPerPage}
                            onChange={(e) => {
                              const newValue = Number(e.target.value);
                              setItemsPerPage(newValue);
                              setCurrentPage(1);
                              try {
                                localStorage.setItem('thesis_items_per_page', String(newValue));
                              } catch (_) { }
                            }}
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                          </select>
                        </label>
                        <div className="pagination-count">{shownCount} / {filteredItems.length}</div>
                      </div>
                    </div>
                  </>
                )
              )}
            </main>

            {/* Filter panel overlay */}
            {filterPanelOpen && (
              <div 
                className="filter-panel-overlay"
                onClick={() => setFilterPanelOpen(false)}
              />
            )}

            <aside 
              ref={filterRef}
              className={`thesis-sidebar-filters slide-panel ${filterPanelOpen ? 'open' : ''}`}
              style={{ bottom: `${filterBottom}px` }}
            >
              {/* Close button */}
              <button
                className="filter-panel-close"
                onClick={() => setFilterPanelOpen(false)}
              >
                <X size={24} />
              </button>
              <div className="filter-card">
                <h3 className="filter-title">Filters</h3>

                <label className="filter-label">
                  Search
                  <input
                    className="admin-input search-input"
                    placeholder="Search title, abstract, keywords"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>

                <div className="filter-checkbox-row">
                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={favoritesOnly}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFavoritesOnly(checked);
                        setCurrentPage(1);
                        const next = new URLSearchParams(searchParams);
                        if (checked) next.set('favorites', '1');
                        else next.delete('favorites');
                        setSearchParams(next, { replace: true });
                      }}
                    />
                    Favorites only
                  </label>
                </div>

                <label className="filter-label">
                  Sort
                  <select className="admin-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="">Default</option>
                    <option value="views">Most Viewed</option>
                    <option value="citations">Most Cited</option>
                  </select>
                </label>

                <label className="filter-label">
                  Advisor
                  <select className="admin-input" value={selectedAdvisor} onChange={(e) => setSelectedAdvisor(e.target.value)}>
                    <option value="">All</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.full_name}</option>
                    ))}
                  </select>
                </label>

                <label className="filter-label">
                  Faculty
                  <select className="admin-input" value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)}>
                    <option value="">All</option>
                    {faculties.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </label>

                <label className="filter-label">
                  Department
                  <select className="admin-input" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} disabled={!selectedFaculty}>
                    <option value="">{selectedFaculty ? 'All' : 'Select faculty first'}</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>

                <label className="filter-label">
                  Year From
                  <input className="admin-input" type="number" placeholder="e.g. 2015" value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} />
                </label>

                <label className="filter-label">
                  Year To
                  <input className="admin-input" type="number" placeholder="e.g. 2020" value={yearTo} onChange={(e) => setYearTo(e.target.value)} />
                </label>

                <button
                  type="button"
                  className="filter-clear-btn"
                  onClick={() => {
                    setSelectedAdvisor('');
                    setSelectedFaculty('');
                    setSelectedDepartment('');
                    setYearFrom('');
                    setYearTo('');
                    setDepartments([]);
                    setSortBy('');
                    setSearch('');
                    setFavoritesOnly(false);
                    setCurrentPage(1);

                    const next = new URLSearchParams(searchParams);
                    next.delete('favorites');
                    setSearchParams(next, { replace: true });
                    setFilterPanelOpen(false);
                  }}
                >
                  Clear filters
                </button>
                <button
                  type="button"
                  className="filter-apply-btn"
                  onClick={() => setFilterPanelOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="thesis-container" style={{ display: thesisId ? 'block' : 'none' }}>
          {loading && <div className="thesis-info">Loading...</div>}
          {error && !loading && <div className="thesis-alert thesis-alert--error">{error}</div>}

          {!loading && !error && thesisId && (
            <ThesisDetail thesisId={thesisId} user={user} />
          )}
        </main>
      </div>

      {/* FOOTER BAŞLANGICI */}
      <footer ref={footerRef} style={{
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
          {/* Sol - Üniversite Bilgisi */}
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

          {/* Orta - Telefon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#fff' }}>Telefon</h4>
            <div style={{ fontSize: '13px', color: '#a0a0a0', lineHeight: '1.8' }}>
              <div>+90 392 650 6666</div>
              <div>+90 850 811 1838</div>
              <div>+90 392 444 0838</div>
            </div>
          </div>

          {/* Sağ - İletişim E-postaları */}
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
          2026 INTERNATIONAL FINAL UNIVERSITY. All rights reserved.
        </div>
      </footer>
    </div>
  );
}