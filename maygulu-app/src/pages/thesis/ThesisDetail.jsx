import React, { useEffect, useState } from 'react';
import './styles.css';
import { getThesis, buildFileUrl, downloadThesisFile, getComments, addComment, deleteComment, deleteThesis, updateThesis, getThesisDailyViews, getThesisMonthlyViews, recordThesisView, getCitations, addCitation, getThesisCitationsByYear, getThesisCitationsByType, updateCitation, deleteCitation, getThesisCitationImpact } from '../../api/services/theses';
import { useNavigate } from 'react-router-dom';

const ROLE_LABEL = { 0: 'Simple', 1: 'Student', 2: 'Advisor', 3: 'Admin' };

export default function ThesisDetail({ thesisId, user }) {
  const [thesis, setThesis] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [cLoading, setCLoading] = useState(true);
  const [cError, setCError] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', abstract: '', keywords: '', publication_year: '' });
  const [tab, setTab] = useState('overview');
  const [dailyViews, setDailyViews] = useState([]);
  const [monthlyViews, setMonthlyViews] = useState([]);
  const [aLoading, setALoading] = useState(false);
  const [aError, setAError] = useState('');
  const [citYearSeries, setCitYearSeries] = useState([]);
  const [citTypeSeries, setCitTypeSeries] = useState([]);
  const [citations, setCitations] = useState([]);
  const [citLoading, setCitLoading] = useState(false);
  const [citError, setCitError] = useState('');
  const [citForm, setCitForm] = useState({ authors: '', publication_type: '', year_published: '', citation_context: '' });
  const [showCitForm, setShowCitForm] = useState(false);
  const [editingCitationId, setEditingCitationId] = useState(null);
  const [editCitForm, setEditCitForm] = useState({ authors: '', publication_type: '', year_published: '', citation_context: '' });
  const [exportFormat, setExportFormat] = useState('bibtex');
  const [impact, setImpact] = useState(null);

  function toBibTeXType(t) {
    const s = String(t || '').toLowerCase();
    if (s.includes('journal') || s.includes('dergi')) return 'article';
    if (s.includes('conference') || s.includes('konferans')) return 'inproceedings';
    if (s.includes('thesis') || s.includes('tez')) return 'phdthesis';
    return 'misc';
  }

  function buildBibTeX(c, idx) {
    const key = `cit${idx + 1}-${(c.year_published || 'noy')}`;
    const type = toBibTeXType(c.publication_type);
    const fields = [];
    if (c.authors) fields.push(`  author = {${c.authors}}`);
    if (c.year_published) fields.push(`  year = {${c.year_published}}`);
    if (c.publication_type) fields.push(`  note = {${c.publication_type}}`);
    if (c.citation_context) fields.push(`  howpublished = {${c.citation_context}}`);
    return `@${type}{${key},\n${fields.join(',\n')}\n}`;
  }

  function buildAPA(c) {
    const a = c.authors ? `${c.authors}.` : '';
    const y = c.year_published ? ` (${c.year_published}).` : '';
    const t = c.publication_type ? ` ${c.publication_type}.` : '';
    const ctx = c.citation_context ? ` ${c.citation_context}.` : '';
    return `${a}${y}${t}${ctx}`.trim();
  }

  function buildMLA(c) {
    const a = c.authors ? `${c.authors}.` : '';
    const t = c.publication_type ? ` ${c.publication_type},` : '';
    const y = c.year_published ? ` ${c.year_published}.` : '';
    const ctx = c.citation_context ? ` ${c.citation_context}.` : '';
    return `${a}${t}${y}${ctx}`.trim();
  }

  function buildChicago(c) {
    const a = c.authors ? `${c.authors}.` : '';
    const y = c.year_published ? ` ${c.year_published}.` : '';
    const t = c.publication_type ? ` ${c.publication_type}.` : '';
    const ctx = c.citation_context ? ` ${c.citation_context}.` : '';
    return `${a}${t}${y}${ctx}`.trim();
  }

  function buildHarvard(c) {
    const a = c.authors ? `${c.authors}` : '';
    const y = c.year_published ? ` (${c.year_published})` : '';
    const t = c.publication_type ? ` ${c.publication_type}.` : '';
    const ctx = c.citation_context ? ` ${c.citation_context}.` : '';
    return `${a}${y}.${t}${ctx}`.trim();
  }

  function buildExport(format, list) {
    if (!Array.isArray(list) || list.length === 0) return '';
    switch (format) {
      case 'bibtex':
        return list.map((c, i) => buildBibTeX(c, i)).join('\n\n');
      case 'apa':
        return list.map(buildAPA).join('\n');
      case 'mla':
        return list.map(buildMLA).join('\n');
      case 'chicago':
        return list.map(buildChicago).join('\n');
      case 'harvard':
        return list.map(buildHarvard).join('\n');
      default:
        return list.map(buildAPA).join('\n');
    }
  }

  function downloadText(filename, text) {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (_) {}
  }
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    if (!thesisId) { setError('Invalid thesis'); setLoading(false); return; }
    setLoading(true);
    setError('');
    getThesis(thesisId)
      .then((data) => { if (!alive) return; setThesis(data.thesis || null); setFiles(Array.isArray(data.files) ? data.files : []); if (data?.thesis) { setForm({ title: data.thesis.title || '', abstract: data.thesis.abstract || '', keywords: data.thesis.keywords || '', publication_year: data.thesis.publication_year || '' }); } })
      .catch((err) => { if (alive) setError(err.message || 'Failed to load thesis'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [thesisId]);

  useEffect(() => {
    let alive = true;
    const key = `thesis_viewed_${thesisId}`;
    if (!thesisId) return () => { alive = false; };
    if (!sessionStorage.getItem(key)) {
      (async () => {
        try {
          await recordThesisView(thesisId);
          sessionStorage.setItem(key, '1');
          setThesis((t) => t ? { ...t, view_count: (t.view_count ?? 0) + 1 } : t);
        } catch (_) {}
      })();
    }
    return () => { alive = false; };
  }, [thesisId]);

  // Fetch analytics when tab switches to analytics
  useEffect(() => {
    let alive = true;
    if (tab !== 'analytics') return () => { alive = false; };
    (async () => {
      try {
        setALoading(true);
        setAError('');
        const [d, m, cy, ct, imp] = await Promise.all([
          getThesisDailyViews(thesisId, 30),
          getThesisMonthlyViews(thesisId, 12),
          getThesisCitationsByYear(thesisId),
          getThesisCitationsByType(thesisId),
          getThesisCitationImpact(thesisId),
        ]);
        if (!alive) return;
        setDailyViews(Array.isArray(d) ? d : []);
        setMonthlyViews(Array.isArray(m) ? m : []);
        setCitYearSeries(Array.isArray(cy) ? cy : []);
        setCitTypeSeries(Array.isArray(ct) ? ct : []);
        setImpact(typeof imp?.impact === 'number' ? imp.impact : 0);
      } catch (e) {
        if (alive) setAError(e.message || 'Failed to load analytics');
      } finally {
        if (alive) setALoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tab, thesisId]);

  // Load citations when tab is citations
  useEffect(() => {
    let alive = true;
    if (tab !== 'citations') return () => { alive = false; };
    (async () => {
      try {
        setCitLoading(true); setCitError('');
        const list = await getCitations(thesisId);
        if (!alive) return;
        setCitations(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setCitError(e.message || 'Failed to load citations');
      } finally {
        if (alive) setCitLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tab, thesisId]);

  useEffect(() => {
    let alive = true;
    setCLoading(true);
    setCError('');
    getComments(thesisId)
      .then((data) => { if (!alive) return; setComments(Array.isArray(data) ? data : []); })
      .catch((err) => { if (alive) setCError(err.message || 'Failed to load comments'); })
      .finally(() => { if (alive) setCLoading(false); });
    return () => { alive = false; };
  }, [thesisId]);

  if (loading) return <div className="thesis-info">Loading...</div>;
  if (error) return <div className="thesis-alert thesis-alert--error">{error}</div>;
  if (!thesis) return <div className="thesis-info">Thesis not found.</div>;

  const canAdmin = Number(user?.role_id) === 3;
  const canAdvisorOwner = Number(user?.role_id) === 2 && Number(thesis?.advisor_id) === Number(user?.id);
  const canEdit = canAdmin || canAdvisorOwner;

  return (
    <section className="thesis-detail">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          className={tab === 'overview' ? 'btn btn-primary' : 'btn btn-link'}
          onClick={() => setTab('overview')}
        >Overview</button>
        <button
          className={tab === 'analytics' ? 'btn btn-primary' : 'btn btn-link'}
          onClick={() => setTab('analytics')}
        >Analytics</button>
        <button
          className={tab === 'citations' ? 'btn btn-primary' : 'btn btn-link'}
          onClick={() => setTab('citations')}
        >Citations</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 className="thesis-detail__title" style={{ margin: 0, flex: '1 1 auto' }}>{thesis.title}</h2>
        {canEdit && (
          <button
            className="home-upload"
            onClick={() => setEditing((v) => !v)}
          >{editing ? 'Cancel' : 'Edit'}</button>
        )}
        {(canAdmin || canAdvisorOwner) && (
          <button
            className="home-logout"
            onClick={async () => {
              if (!window.confirm('Delete this thesis? This cannot be undone.')) return;
              try {
                await deleteThesis(thesis.id);
                navigate('/theses');
              } catch (_) {}
            }}
          >Delete</button>
        )}
      </div>
      {tab === 'overview' ? (
        <>
          {!editing ? (
            <p className="thesis-detail__abstract">{thesis.abstract}</p>
          ) : (
            <div className="admin-form" style={{ marginTop: 12 }}>
              <label className="admin-label">
                Title
                <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="admin-label">
                Abstract
                <textarea className="admin-input" rows={5} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} />
              </label>
              <label className="admin-label">
                Keywords
                <input className="admin-input" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
              </label>
              <label className="admin-label">
                Year
                <input className="admin-input" type="number" value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="home-logout" onClick={() => setEditing(false)}>Cancel</button>
                <button
                  className="home-upload"
                  onClick={async () => {
                    try {
                      const payload = {
                        title: form.title,
                        abstract: form.abstract,
                        keywords: form.keywords,
                        publication_year: form.publication_year ? Number(form.publication_year) : undefined,
                      };
                      await updateThesis(thesis.id, payload);
                      const data = await getThesis(thesisId);
                      setThesis(data.thesis || null);
                      setEditing(false);
                    } catch (e) {
                      alert(e.message || 'Failed to update');
                    }
                  }}
                >Save</button>
              </div>
            </div>
          )}

          <div className="thesis-detail__meta--plain">
            <div><strong>Author:</strong> {thesis.author_name || '-'}</div>
            <div><strong>Advisor:</strong> {thesis.advisor_name || '-'}</div>
            {thesis.faculty_name && <div><strong>Faculty:</strong> {thesis.faculty_name}</div>}
            {thesis.department_name && <div><strong>Department:</strong> {thesis.department_name}</div>}
            <div><strong>Year:</strong> {thesis.publication_year || '-'}</div>
            <div><strong>Views:</strong> {thesis.view_count ?? 0}</div>
            <div><strong>Downloads:</strong> {thesis.download_count ?? 0}</div>
            {thesis.keywords && <div><strong>Keywords:</strong> {thesis.keywords}</div>}
          </div>

          {files.find(ff => String(ff.file_type||'').includes('pdf')) && (
            <div className="thesis-preview">
              <iframe title="pdf-preview" src={buildFileUrl(files.find(ff => String(ff.file_type||'').includes('pdf')).file_path)} />
            </div>
          )}

          <div className="thesis-files">
            {files.length === 0 ? (
              <div className="thesis-info">No files for this thesis.</div>
            ) : (
              files.map((f) => (
                <div className="file-item" key={f.file_path}>
                  <div className="file-item__info">
                    <div className="file-item__name" title={f.file_name}>{f.file_name}</div>
                    <div className="file-item__type">{f.file_type}</div>
                  </div>
                  <div className="file-item__actions">
                    {String(f.file_type || '').includes('pdf') && (
                      <a className="btn btn-link" href={buildFileUrl(f.file_path)} target="_blank" rel="noreferrer noopener">Preview</a>
                    )}
                    <button className="btn btn-primary" onClick={() => downloadThesisFile(thesis.id, f.file_path)}>Download</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="thesis-comments" style={{ marginTop: 24 }}>
            <h3 style={{ margin: '12px 0' }}>Comments</h3>
            {cLoading && <div className="thesis-info">Loading comments...</div>}
            {cError && !cLoading && <div className="thesis-alert thesis-alert--error">{cError}</div>}
            {!cLoading && !cError && (
              comments.length === 0 ? (
                <div className="thesis-info">No comments yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <strong>{c.user_full_name || 'User ' + c.user_id}</strong>
                        <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                          {ROLE_LABEL?.[c.user_role_id] ?? `Role ${c.user_role_id}`}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{new Date(c.created_at).toLocaleString()}</span>
                        {(Number(user?.role_id) === 3 || (Number(user?.role_id) === 2 && Number(c.user_id) === Number(user?.id))) && (
                          <button className="home-logout" onClick={async () => { try { await deleteComment(c.id); const list = await getComments(thesisId); setComments(Array.isArray(list) ? list : []); } catch (e) {} }}>Delete</button>
                        )}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{c.comment}</div>
                    </div>
                  ))}
                </div>
              )
            )}

            {Number(user?.role_id) === 2 && (
              <div style={{ marginTop: 16 }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  placeholder="Write a comment..."
                  style={{ width: '100%', padding: 8, borderRadius: 10, border: '1px solid #e5e7eb' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    className="home-upload"
                    disabled={posting || !text.trim()}
                    onClick={async () => {
                      try {
                        setPosting(true);
                        await addComment(thesisId, { user_id: user.id, comment: text.trim() });
                        setText('');
                        const list = await getComments(thesisId);
                        setComments(Array.isArray(list) ? list : []);
                      } catch (e) {
                        setCError(e.message || 'Failed to add comment');
                      } finally { setPosting(false); }
                    }}
                  >{posting ? 'Sending...' : 'Add Comment'}</button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : tab === 'analytics' ? (
        <>
          <div className="thesis-detail__meta--plain">
            <div><strong>Total Views:</strong> {thesis.view_count ?? 0}</div>
            <div><strong>Total Downloads:</strong> {thesis.download_count ?? 0}</div>
            {typeof thesis.bibliography_count !== 'undefined' && (
              <div><strong>Total Citations:</strong> {thesis.bibliography_count}</div>
            )}
          </div>

          {aLoading && <div className="thesis-info">Loading analytics...</div>}
          {aError && !aLoading && <div className="thesis-alert thesis-alert--error">{aError}</div>}

          {!aLoading && !aError && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'linear-gradient(180deg,#ffffff,#f8fbff)', border: '1px solid #dbeafe', borderRadius: 14, padding: 14, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e3a8a' }}>Citation Impact</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 34, lineHeight: '36px', fontWeight: 900, color: '#1d4ed8' }}>{impact != null ? impact.toFixed(2) : '-'}</div>
                  <span style={{ fontSize: 12, color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 6px', borderRadius: 999 }}>higher is better</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                  Impact = Σ(weight(type) × 0.9^(currentYear − year))
                </div>
                <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 6, fontSize: 12 }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', borderRadius: 8, padding: '6px 8px' }}>Journal: <strong>3</strong></div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', borderRadius: 8, padding: '6px 8px' }}>Conference: <strong>2</strong></div>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', borderRadius: 8, padding: '6px 8px' }}>Thesis/Other: <strong>1</strong></div>
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <h3 style={{ margin: '4px 0 8px 0' }}>Citations by Year</h3>
                {citYearSeries.length === 0 ? (
                  <div className="thesis-info">No data</div>
                ) : (
                  (() => {
                    const max = Math.max(...citYearSeries.map(x => x.count || 0), 1);
                    const w = Math.max(260, citYearSeries.length * 36);
                    const h = 190; // extra space for labels
                    const bottomPad = 22;
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 220 }}>
                        {citYearSeries.map((r, i) => {
                          const barW = 20; const gap = 16; const x = i * (barW + gap);
                          const bh = Math.round(((r.count || 0) / max) * (h - bottomPad - 30));
                          const y = h - bottomPad - bh;
                          return (
                            <g key={i}>
                              <rect x={x} y={y} width={barW} height={bh} fill="#3b82f6" rx="3" />
                              <text x={x + barW/2} y={h - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#1f2937">{r.year}</text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()
                )}
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <h3 style={{ margin: '4px 0 8px 0' }}>Daily Views (last 30 days)</h3>
                {dailyViews.length === 0 ? (
                  <div className="thesis-info">No data</div>
                ) : (
                  (() => {
                    const max = Math.max(...dailyViews.map(x => x.count || 0), 1);
                    const w = Math.max(200, dailyViews.length * 18);
                    const h = 140;
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 180 }}>
                        {dailyViews.map((r, i) => {
                          const barW = 12; const gap = 6; const x = i * (barW + gap);
                          const bh = Math.round(((r.count || 0) / max) * (h - 20));
                          const y = h - bh;
                          return (
                            <g key={i}>
                              <rect x={x} y={y} width={barW} height={bh} fill="#3b82f6" rx="3" />
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()
                )}
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                <h3 style={{ margin: '4px 0 8px 0' }}>Monthly Views (last 12 months)</h3>
                {monthlyViews.length === 0 ? (
                  <div className="thesis-info">No data</div>
                ) : (
                  (() => {
                    const max = Math.max(...monthlyViews.map(x => x.count || 0), 1);
                    const w = Math.max(200, monthlyViews.length * 22);
                    const h = 140;
                    return (
                      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 180 }}>
                        {monthlyViews.map((r, i) => {
                          const barW = 14; const gap = 8; const x = i * (barW + gap);
                          const bh = Math.round(((r.count || 0) / max) * (h - 20));
                          const y = h - bh;
                          return (
                            <g key={i}>
                              <rect x={x} y={y} width={barW} height={bh} fill="#3b82f6" rx="3" />
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()
                )}
              </div>
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, gridColumn: '1 / -1' }}>
                <h3 style={{ margin: '4px 0 8px 0' }}>Citations by Type</h3>
                {citTypeSeries.length === 0 ? (
                  <div className="thesis-info">No data</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
                    {citTypeSeries.map((r, i) => (
                      <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 12px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#111827', fontWeight: 600, textTransform: 'capitalize' }}>{r.type}</span>
                        <span style={{ color: '#2563eb', fontWeight: 700 }}>{r.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="thesis-detail__meta--plain">
            <div><strong>Total Citations:</strong> {thesis.bibliography_count ?? '-'}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 12px 0' }}>
            <button className="home-upload" onClick={() => setShowCitForm(v => !v)}>{showCitForm ? 'Close' : 'Add Citation'}</button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="admin-input" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                <option value="bibtex">BibTeX</option>
                <option value="apa">APA</option>
                <option value="mla">MLA</option>
                <option value="chicago">Chicago</option>
                <option value="harvard">Harvard</option>
              </select>
              <button
                className="home-upload"
                onClick={() => {
                  const txt = buildExport(exportFormat, citations);
                  if (!txt) { alert('No citations to export'); return; }
                  const ext = exportFormat === 'bibtex' ? 'bib' : 'txt';
                  downloadText(`citations_${thesisId}.${ext}`, txt);
                }}
              >Export</button>
            </div>
          </div>

          {showCitForm && (
            <div className="admin-form" style={{ marginBottom: 16 }}>
              <label className="admin-label">
                Authors
                <input className="admin-input" value={citForm.authors} onChange={(e) => setCitForm({ ...citForm, authors: e.target.value })} />
              </label>
              <label className="admin-label">
                Publication Type
                <input className="admin-input" placeholder="conference, journal, thesis, ..." value={citForm.publication_type} onChange={(e) => setCitForm({ ...citForm, publication_type: e.target.value })} />
              </label>
              <label className="admin-label">
                Year Published
                <input className="admin-input" type="number" value={citForm.year_published} onChange={(e) => setCitForm({ ...citForm, year_published: e.target.value })} />
              </label>
              <label className="admin-label">
                Context
                <textarea className="admin-input" rows={4} value={citForm.citation_context} onChange={(e) => setCitForm({ ...citForm, citation_context: e.target.value })} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="home-upload"
                  onClick={async () => {
                    try {
                      const payload = {
                        user_id: Number(user?.id) || null,
                        authors: citForm.authors.trim(),
                        publication_type: citForm.publication_type.trim(),
                        year_published: citForm.year_published ? Number(citForm.year_published) : undefined,
                        citation_context: citForm.citation_context.trim() || undefined,
                      };
                      if (!payload.authors || !payload.publication_type) { alert('Authors and publication type are required'); return; }
                      const created = await addCitation(thesisId, payload);
                      setCitations((prev) => [{ ...created, user_full_name: user?.full_name || created.user_full_name }, ...(Array.isArray(prev) ? prev : [])]);
                      setCitForm({ authors: '', publication_type: '', year_published: '', citation_context: '' });
                      setThesis((t) => t ? { ...t, bibliography_count: (t.bibliography_count ?? 0) + 1 } : t);
                      setShowCitForm(false);
                    } catch (e) {
                      alert(e.message || 'Failed to add citation');
                    }
                  }}
                >Add</button>
              </div>
            </div>
          )}

          {citLoading && <div className="thesis-info">Loading citations...</div>}
          {citError && !citLoading && <div className="thesis-alert thesis-alert--error">{citError}</div>}

          {!citLoading && !citError && (
            citations.length === 0 ? (
              <div className="thesis-info">No citations yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {citations.map((c) => (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                    {editingCitationId === c.id ? (
                      <div className="admin-form" style={{ marginBottom: 8 }}>
                        <label className="admin-label">
                          Authors
                          <input className="admin-input" value={editCitForm.authors} onChange={(e) => setEditCitForm({ ...editCitForm, authors: e.target.value })} />
                        </label>
                        <label className="admin-label">
                          Publication Type
                          <input className="admin-input" value={editCitForm.publication_type} onChange={(e) => setEditCitForm({ ...editCitForm, publication_type: e.target.value })} />
                        </label>
                        <label className="admin-label">
                          Year Published
                          <input className="admin-input" type="number" value={editCitForm.year_published} onChange={(e) => setEditCitForm({ ...editCitForm, year_published: e.target.value })} />
                        </label>
                        <label className="admin-label">
                          Context
                          <textarea className="admin-input" rows={3} value={editCitForm.citation_context} onChange={(e) => setEditCitForm({ ...editCitForm, citation_context: e.target.value })} />
                        </label>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="home-logout" onClick={() => { setEditingCitationId(null); }}>Cancel</button>
                          <button className="home-upload" onClick={async () => {
                            try {
                              const payload = {
                                authors: editCitForm.authors.trim(),
                                publication_type: editCitForm.publication_type.trim(),
                                year_published: editCitForm.year_published ? Number(editCitForm.year_published) : null,
                                citation_context: editCitForm.citation_context.trim() || null,
                              };
                              const updated = await updateCitation(c.id, payload);
                              setCitations(prev => prev.map(x => x.id === c.id ? { ...updated } : x));
                              setEditingCitationId(null);
                            } catch (e) { alert(e.message || 'Failed to update citation'); }
                          }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <strong>{c.authors}</strong>
                          <span style={{ fontSize: 12, color: '#6b7280' }}>• {c.publication_type}</span>
                          {c.year_published && <span style={{ fontSize: 12, color: '#6b7280' }}>• {c.year_published}</span>}
                          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        {c.citation_context && <div style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{c.citation_context}</div>}
                        {c.user_full_name && (
                          <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>Added by: {c.user_full_name}</div>
                        )}
                        {Number(user?.role_id) === 3 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                            <button className="home-logout" onClick={async () => {
                              if (!window.confirm('Delete this citation?')) return;
                              try {
                                await deleteCitation(c.id);
                                setCitations(prev => prev.filter(x => x.id !== c.id));
                                setThesis(t => t ? { ...t, bibliography_count: Math.max((t.bibliography_count ?? 1) - 1, 0) } : t);
                              } catch (e) { alert(e.message || 'Failed to delete'); }
                            }}>Delete</button>
                            <button className="home-upload" onClick={() => { setEditingCitationId(c.id); setEditCitForm({ authors: c.authors || '', publication_type: c.publication_type || '', year_published: c.year_published || '', citation_context: c.citation_context || '' }); }}>Edit</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          
        </>
      )}
    </section>
  );
}
