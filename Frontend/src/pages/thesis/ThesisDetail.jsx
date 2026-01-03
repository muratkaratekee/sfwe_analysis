import React, { useEffect, useState } from 'react';
import './styles.css';
import { getThesis, buildFileUrl, downloadThesisFile, getComments, addComment, deleteComment, deleteThesis, updateThesis, getThesisDailyViews, getThesisMonthlyViews, recordThesisView, citeThesis, getThesisCitationsByYear, getThesisCitationsByType, getThesisCitationImpact } from '../../api/theses';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ROLE_LABEL = { 0: 'Simple', 1: 'Student', 2: 'Advisor', 3: 'Admin' };

export default function ThesisDetail({ thesisId, user }) {
  const [thesis, setThesis] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [cLoading, setCLoading] = useState(true);
  const [cError, setCError] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', abstract: '', keywords: '', publication_year: '' });
  const [openSections, setOpenSections] = useState({ overview: true, analytics: false, citations: false });
  const [dailyViews, setDailyViews] = useState([]);
  const [monthlyViews, setMonthlyViews] = useState([]);
  const [aLoading, setALoading] = useState(false);
  const [aError, setAError] = useState('');
  const [citYearSeries, setCitYearSeries] = useState([]);
  const [citTypeSeries, setCitTypeSeries] = useState([]);
  const [impact, setImpact] = useState(null);
  const [showCitePopup, setShowCitePopup] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Sayfa açıldığında en yukarıya scroll
    window.scrollTo(0, 0);
  }, [thesisId]);

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
    const key = `thesis_viewed_${thesisId}`;
    if (!thesisId) return;
    if (!sessionStorage.getItem(key)) {
      (async () => {
        try {
          await recordThesisView(thesisId);
          sessionStorage.setItem(key, '1');
          setThesis((t) => t ? { ...t, view_count: (t.view_count ?? 0) + 1 } : t);
        } catch (_) { }
      })();
    }
  }, [thesisId]);

  // Fetch analytics when analytics section opens
  useEffect(() => {
    let alive = true;
    if (!openSections.analytics) return () => { alive = false; };
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
  }, [openSections.analytics, thesisId]);


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

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  function isVisibleComment(c) {
    const status = String(c.status || '').toLowerCase();
    const isOwner = Number(c.user_id) === Number(user?.id);
    if (status === 'approved' || status === '') return true;
    if (isOwner) return true;
    return false;
  }

  function buildCommentTree(list) {
    const items = (Array.isArray(list) ? list : []).map(c => ({
      ...c,
      parent_comment_id: Number.isInteger(Number(c.parent_comment_id)) ? Number(c.parent_comment_id) : null,
      children: [],
      text: c.comment ?? c.content ?? '',
    }));
    const byId = new Map(items.map(i => [i.id, i]));
    const roots = [];
    for (const i of items) {
      if (i.parent_comment_id && byId.has(i.parent_comment_id)) {
        byId.get(i.parent_comment_id).children.push(i);
      } else {
        roots.push(i);
      }
    }
    return roots;
  }

  function renderCommentNode(node, depth = 0) {
    if (!isVisibleComment(node)) return null;
    const status = String(node.status || '').toLowerCase();
    const isOwner = Number(node.user_id) === Number(user?.id);
    const badge = status === 'pending' ? 'Pending approval' : status === 'rejected' ? `Rejected${node.rejected_reason ? `: ${node.rejected_reason}` : ''}` : null;
    const isReply = depth > 0;

    return (
      <div key={node.id} style={{ marginTop: isReply ? 8 : 12 }}>
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderLeft: isReply ? '3px solid #9ca3af' : '1px solid #e5e7eb',
          borderRadius: isReply ? '0 8px 8px 0' : 8,
          padding: 12,
          marginLeft: isReply ? (depth * 20) : 0
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600
            }}>
              {(node.user_full_name || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ fontSize: 14, color: '#111827' }}>
                  {node.user_full_name || 'User ' + node.user_id}
                </strong>
                {typeof node.user_role_id !== 'undefined' && (
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>
                    {ROLE_LABEL?.[node.user_role_id] ?? `Role ${node.user_role_id}`}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(node.created_at).toLocaleString()}</span>
            </div>
            {(Number(user?.role_id) === 3 || (Number(user?.role_id) === 2 && Number(node.user_id) === Number(user?.id))) && (
              <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}
                onClick={async () => { try { await deleteComment(node.id); const list = await getComments(thesisId); setComments(Array.isArray(list) ? list : []); } catch (e) { } }}>Delete</button>
            )}
          </div>

          {/* Content */}
          <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, marginBottom: 8 }}>{node.text}</div>

          {/* Badge */}
          {badge && isOwner && (
            <div style={{ fontSize: 11, color: status === 'rejected' ? '#dc2626' : '#6b7280', background: status === 'rejected' ? '#fef2f2' : '#f9fafb', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>{badge}</div>
          )}

          {/* Reply button */}
          <button style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 12, padding: 0 }}
            onClick={() => { setReplyTarget(node.id); setReplyText(''); }}>Reply</button>

          {/* Reply form */}
          {replyTarget === node.id && (
            <div style={{ marginTop: 12, background: 'var(--bg-secondary)', borderRadius: 6, padding: 10 }}>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} placeholder="Write a reply..."
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--color-border)', fontSize: 13, resize: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} autoFocus />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
                <button style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                  onClick={() => { setReplyTarget(null); setReplyText(''); }}>Cancel</button>
                <button style={{ background: posting || !replyText.trim() ? '#9ca3af' : '#6366f1', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, cursor: posting || !replyText.trim() ? 'not-allowed' : 'pointer' }}
                  disabled={posting || !replyText.trim()}
                  onClick={async () => {
                    try {
                      setPosting(true);
                      await addComment(thesisId, { user_id: user.id, content: replyText.trim(), parent_comment_id: node.id });
                      setReplyText(''); setReplyTarget(null);
                      const list = await getComments(thesisId);
                      setComments(Array.isArray(list) ? list : []);
                      if (Number(user?.role_id) === 1) { alert('Your reply has been submitted and is pending approval.'); }
                    } catch (e) { setCError(e.message || 'Failed to add reply'); } finally { setPosting(false); }
                  }}>Reply</button>
              </div>
            </div>
          )}
        </div>

        {/* Nested replies - simple gray line */}
        {Array.isArray(node.children) && node.children.length > 0 && (
          <div style={{ marginLeft: 16, borderLeft: '2px solid #e5e7eb', paddingLeft: 8 }}>
            {node.children.map((child) => renderCommentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }


  const tree = buildCommentTree(comments);

  return (
    <section className="thesis-detail">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 className="thesis-detail__title" style={{ margin: 0, flex: '1 1 auto' }}>{thesis.title}</h2>
        {openSections.overview && canEdit && (
          <button
            className="home-upload"
            onClick={() => setEditing((v) => !v)}
          >{editing ? 'Cancel' : 'Edit'}</button>
        )}
        {openSections.overview && (canAdmin || canAdvisorOwner) && (
          <button
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
            onClick={async () => {
              if (!window.confirm('Delete this thesis? This cannot be undone.')) return;
              try {
                await deleteThesis(thesis.id);
                navigate('/theses');
              } catch (_) { }
            }}
          >Delete</button>
        )}
      </div>

      {/* Analytics Accordion */}
      <div className="thesis-accordion">
        <button
          className="thesis-accordion__header"
          onClick={() => toggleSection('analytics')}
        >
          <span className="thesis-accordion__title">Analytics</span>
          {openSections.analytics ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {openSections.analytics && (
          <div className="thesis-accordion__content">
            {aLoading && <div className="thesis-info">Loading analytics...</div>}
            {aError && !aLoading && <div className="thesis-alert thesis-alert--error">{aError}</div>}

            {!aLoading && !aError && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Citation Impact */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 12 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 13, color: 'var(--text-primary)' }}>Citation Impact</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#3b82f6' }}>{impact != null ? impact.toFixed(2) : '-'}</div>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '2px 4px', borderRadius: 999 }}>higher is better</span>
                  </div>
                  <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, fontSize: 10 }}>
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--color-border)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 6px' }}>Journal: <strong>3</strong></div>
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--color-border)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 6px' }}>Conference: <strong>2</strong></div>
                    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--color-border)', color: 'var(--text-primary)', borderRadius: 6, padding: '4px 6px' }}>Other: <strong>1</strong></div>
                  </div>
                </div>

                {/* Citations by Year Chart */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 10 }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-primary)' }}>Citations by Year</h3>
                  {citYearSeries.length === 0 ? (
                    <div className="thesis-info">No data</div>
                  ) : (
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={citYearSeries} margin={{ left: 0, right: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={4} fontSize={10} />
                          <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Daily Views Chart */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 10 }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-primary)' }}>Daily Views (last 30 days)</h3>
                  {dailyViews.length === 0 ? (
                    <div className="thesis-info">No data</div>
                  ) : (
                    <div style={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyViews} margin={{ left: 0, right: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            fontSize={9}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-US', { day: 'numeric' });
                            }}
                            minTickGap={10}
                          />
                          <Tooltip
                            contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} barSize={8} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Monthly Views Chart */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 10 }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-primary)' }}>Monthly Views (last 12 months)</h3>
                  {monthlyViews.length === 0 ? (
                    <div className="thesis-info">No data</div>
                  ) : (
                    <div style={{ height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyViews} margin={{ left: 0, right: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={4}
                            fontSize={10}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-US', { month: 'short' });
                            }}
                          />
                          <Tooltip
                            contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} barSize={14} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Citations by Type */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 10, gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-primary)' }}>Citations by Type</h3>
                  {citTypeSeries.length === 0 ? (
                    <div className="thesis-info">No data</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                      {citTypeSeries.map((r, i) => (
                        <div key={i} style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          background: 'var(--bg-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 12
                        }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{r.type}</span>
                          <span style={{ color: '#3b82f6', fontWeight: 700 }}>{r.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overview Accordion */}
      <div className="thesis-accordion">
        <button
          className="thesis-accordion__header"
          onClick={() => toggleSection('overview')}
        >
          <span className="thesis-accordion__title">Overview</span>
          {openSections.overview ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {openSections.overview && (
          <div className="thesis-accordion__content">
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
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                color: 'var(--text-primary)'
              }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', width: '120px', verticalAlign: 'top' }}>Author:</td>
                    <td style={{ padding: '8px 12px' }}>{thesis.author_name || '-'}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '600', width: '120px', verticalAlign: 'top' }}>Faculty:</td>
                    <td style={{ padding: '8px 12px' }}>{thesis.faculty_name || '-'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', verticalAlign: 'top' }}>Advisor:</td>
                    <td style={{ padding: '8px 12px' }}>{thesis.advisor_name || '-'}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '600', verticalAlign: 'top' }}>Department:</td>
                    <td style={{ padding: '8px 12px' }}>{thesis.department_name || '-'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', verticalAlign: 'top' }}>Year:</td>
                    <td style={{ padding: '8px 12px' }}>{thesis.publication_year || '-'}</td>
                    <td style={{ padding: '8px 12px', fontWeight: '600', verticalAlign: 'top' }}>Views:</td>
                    <td style={{ padding: '8px 12px' }}>{thesis.view_count ?? 0}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '600', verticalAlign: 'top' }}>Downloads:</td>
                    <td style={{ padding: '8px 12px' }}>{thesis.download_count ?? 0}</td>
                    {thesis.keywords ? (
                      <>
                        <td style={{ padding: '8px 12px', fontWeight: '600', verticalAlign: 'top' }}>Keywords:</td>
                        <td style={{ padding: '8px 12px' }}>{thesis.keywords}</td>
                      </>
                    ) : (
                      <td colSpan="2"></td>
                    )}
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: '600', verticalAlign: 'middle' }}>Cited by:</td>
                    <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>{thesis.bibliography_count ?? 0}</td>
                    <td colSpan="2" style={{ padding: '8px 12px', textAlign: 'right', verticalAlign: 'middle' }}>
                      <button
                        onClick={async () => {
                          setShowCitePopup(true);
                          try {
                            const result = await citeThesis(thesisId);
                            setThesis(t => t ? { ...t, bibliography_count: result.bibliography_count } : t);
                          } catch (e) { }
                        }}
                        style={{
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '13px'
                        }}
                      >Cite</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {files.find(ff => String(ff.file_type || '').includes('pdf')) && (
              <div className="thesis-preview">
                <iframe title="pdf-preview" src={buildFileUrl(files.find(ff => String(ff.file_type || '').includes('pdf')).file_path)} />
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
                        <button
                          className="btn btn-primary"
                          onClick={() => window.open(buildFileUrl(f.file_path), '_blank', 'noopener,noreferrer')}
                        >
                          Preview
                        </button>
                      )}
                      <button className="btn btn-secondary" onClick={() => downloadThesisFile(thesis.id, f.file_path)}>Download</button>
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
                tree.length === 0 ? (
                  <div className="thesis-info">No comments yet.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {tree.map(node => renderCommentNode(node, 0))}
                  </div>
                )
              )}

              {Number(user?.role_id) === 1 || Number(user?.role_id) === 2 || Number(user?.role_id) === 3 ? (
                <div style={{ marginTop: 16 }}>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    style={{ width: '100%', padding: 8, borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      className="home-upload"
                      disabled={posting || !text.trim()}
                      onClick={async () => {
                        try {
                          setPosting(true);
                          await addComment(thesisId, { user_id: user.id, content: text.trim() });
                          setText('');
                          const list = await getComments(thesisId);
                          setComments(Array.isArray(list) ? list : []);
                          if (Number(user?.role_id) === 1) {
                            alert('Your comment has been submitted and is pending approval.');
                          }
                        } catch (e) {
                          setCError(e.message || 'Failed to add comment');
                        } finally { setPosting(false); }
                      }}
                    >{posting ? 'Sending...' : 'Add Comment'}</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
      {/* Citation Popup */}
      {showCitePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }} onClick={() => setShowCitePopup(false)}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Cite This Thesis</h3>
              <button
                onClick={() => setShowCitePopup(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >×</button>
            </div>
            
            {/* BibTeX */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>BibTeX</div>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)'
              }}>
{`@mastersthesis{${(thesis.author_name || 'author').split(' ')[0].toLowerCase()}${thesis.publication_year || 'year'},
  author = {${thesis.author_name || 'Unknown Author'}},
  title = {${thesis.title || 'Untitled'}},
  school = {Final International University},
  year = {${thesis.publication_year || 'n.d.'}},
  department = {${thesis.department_name || 'Unknown Department'}}
}`}
              </div>
            </div>

            {/* EndNote */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>EndNote</div>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)'
              }}>
{`%0 Thesis
%A ${thesis.author_name || 'Unknown Author'}
%T ${thesis.title || 'Untitled'}
%I Final International University
%D ${thesis.publication_year || 'n.d.'}
%9 Master's Thesis`}
              </div>
            </div>

            {/* RefMan */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>RefMan</div>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)'
              }}>
{`TY  - THES
AU  - ${thesis.author_name || 'Unknown Author'}
TI  - ${thesis.title || 'Untitled'}
PB  - Final International University
PY  - ${thesis.publication_year || 'n.d.'}
M3  - Master's Thesis
ER  -`}
              </div>
            </div>

            {/* RefWorks */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>RefWorks</div>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)'
              }}>
{`RT Dissertation/Thesis
A1 ${thesis.author_name || 'Unknown Author'}
T1 ${thesis.title || 'Untitled'}
PB Final International University
YR ${thesis.publication_year || 'n.d.'}
VO Master's Thesis`}
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
