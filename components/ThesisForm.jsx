import React, { useEffect, useState, useMemo } from 'react';
import { createThesis } from '../api/theses';
import { getAdvisors, getDepartments, getStudents } from '../api/lookups';

export default function ThesisForm() {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [keywords, setKeywords] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [files, setFiles] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [authorSelectValue, setAuthorSelectValue] = useState('');

  const [departments, setDepartments] = useState([]);
  const [advisors, setAdvisors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => setDepartments([]));
    getAdvisors().then(setAdvisors).catch(() => setAdvisors([]));
    getStudents().then(setStudents).catch(() => setStudents([]));
  }, []);

  const handleAddAuthorFromSelect = () => {
    if (!authorSelectValue) return;
    const student = students.find((s) => String(s.id) === String(authorSelectValue));
    if (!student?.full_name) return;
    const cleaned = student.full_name.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;
    setSelectedAuthors((prev) => {
      const exists = prev.some((name) => name.toLowerCase() === cleaned.toLowerCase());
      return exists ? prev : [...prev, cleaned];
    });
    setAuthorSelectValue('');
  };

  const handleRemoveAuthor = (name) => {
    setSelectedAuthors((prev) => prev.filter((n) => n !== name));
  };

  const onFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const validate = () => {
    if (!title || !abstract || !publicationYear) return 'Please fill all required fields.';
    if (!departmentId) return 'Please select a department.';
    if (!advisorId) return 'Please select an advisor.';
    if (combinedAuthorsArray.length === 0) return 'Please add at least one author.';
    return '';
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('abstract', abstract);
    fd.append('publication_year', publicationYear);
    fd.append('keywords', keywords);
    fd.append('author_name', combinedAuthorsString);
    fd.append('department_id', departmentId);
    fd.append('advisor_id', advisorId);
    files.forEach(f => fd.append('files', f));
    return fd;
  };

  const resetForm = () => {
    setTitle('');
    setAbstract('');
    setPublicationYear('');
    setKeywords('');
    setAuthorName('');
    setDepartmentId('');
    setAdvisorId('');
    setFiles([]);
    setSelectedAuthors([]);
  };

  const handlePublish = async () => {
    setError('');
    setSuccess('');
    const v = validate();
    if (v) { setError(v); setShowReview(false); return; }
    try {
      setLoading(true);
      const fd = buildFormData();
      const resp = await createThesis(fd);
      setSuccess(`Thesis created with ID ${resp?.thesis?.id || ''}`);
      resetForm();
      setShowReview(false);
      setPreviewData(null);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedDepartment = useMemo(
    () => departments.find((d) => String(d.id) === String(departmentId)),
    [departments, departmentId]
  );

  const selectedAdvisor = useMemo(
    () => advisors.find((a) => String(a.id) === String(advisorId)),
    [advisors, advisorId]
  );

  const manualAuthorEntries = useMemo(() => {
    if (!authorName) return [];
    return authorName
      .split(/[,;\n]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }, [authorName]);

  const combinedAuthorsArray = useMemo(() => {
    const seen = new Set();
    const collected = [];
    [...selectedAuthors, ...manualAuthorEntries].forEach((name) => {
      const cleaned = name.replace(/\s+/g, ' ').trim();
      if (!cleaned) return;
      const key = cleaned.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      collected.push(cleaned);
    });
    return collected;
  }, [selectedAuthors, manualAuthorEntries]);

  const combinedAuthorsString = useMemo(
    () => combinedAuthorsArray.join(', '),
    [combinedAuthorsArray]
  );

  const handleReview = () => {
    setError('');
    setSuccess('');
    const v = validate();
    if (v) { setError(v); return; }
    setPreviewData({
      title,
      abstract,
      publicationYear,
      keywords,
      authorsDisplay: combinedAuthorsString,
      departmentId,
      departmentName: selectedDepartment?.name,
      advisorId,
      advisorName: selectedAdvisor?.full_name || selectedAdvisor?.name,
      files,
    });
    setShowReview(true);
  };

  return (
    <>
      <form className="admin-form" onSubmit={(e) => e.preventDefault()}>
        {success && <div className="admin-alert admin-alert--success">{success}</div>}
        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        <label className="admin-label">Title
          <input className="admin-input" value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <label className="admin-label">Abstract
          <textarea className="admin-input" rows={4} value={abstract} onChange={e => setAbstract(e.target.value)} />
        </label>

        <label className="admin-label">Publication year
          <input className="admin-input" type="number" value={publicationYear} onChange={e => setPublicationYear(e.target.value)} />
        </label>

        <label className="admin-label">Keywords
          <input className="admin-input" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="comma,separated,values" />
        </label>

        <label className="admin-label">Authors
          <div className="author-chip-list">
            {combinedAuthorsArray.length === 0 ? (
              <span className="author-chip author-chip--placeholder">No authors yet</span>
            ) : (
              combinedAuthorsArray.map((name) => (
                <span className="author-chip" key={name}>
                  {name}
                  <button type="button" onClick={() => handleRemoveAuthor(name)} aria-label={`Remove ${name}`}>
                    ×
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="author-select-row">
            <select
              className="author-select"
              value={authorSelectValue}
              onChange={(e) => setAuthorSelectValue(e.target.value)}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <button type="button" className="author-add-btn" onClick={handleAddAuthorFromSelect}>
              Add
            </button>
          </div>

          <textarea
            className="author-manual-input"
            rows={2}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Manual author entry (comma, semicolon or new line separated)"
          />
          <span className="author-hint">
            Add authors from the student list or type names manually. Duplicates are ignored automatically.
          </span>
        </label>

        <label className="admin-label">Department
          <select className="admin-input" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
            <option value="">Select</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>

        <label className="admin-label">Advisor
          <select className="admin-input" value={advisorId} onChange={e => setAdvisorId(e.target.value)}>
            <option value="">Select</option>
            {advisors.map(a => (
              <option key={a.id} value={a.id}>{a.full_name || a.name}</option>
            ))}
          </select>
        </label>

        <label className="admin-label">Files
          <div className="admin-file-upload">
            <label className="admin-file-trigger">
              Choose Files
              <input type="file" multiple onChange={onFileChange} style={{ display: 'none' }} />
            </label>
            <span className="admin-file-hint">
              {files.length === 0 ? 'No file chosen' : `${files.length} file(s) selected`}
            </span>
          </div>
        </label>

        <div className="admin-form__actions">
          <button
            className="admin-btn admin-btn--review"
            type="button"
            onClick={handleReview}
          >
            Review
          </button>
        </div>
      </form>

      {showReview && previewData && (
        <div className="review-overlay" onClick={() => setShowReview(false)}>
          <div className="review-panel" onClick={(e) => e.stopPropagation()}>
            <header className="review-header">
              <div>
                <p className="review-badge">Overview</p>
                <h2 className="review-title">{previewData.title}</h2>
              </div>
              <div className="review-meta">
                <span>{previewData.publicationYear || 'Year N/A'}</span>
                <span>{previewData.departmentName || 'No department selected'}</span>
                <span>{previewData.advisorName || 'No advisor selected'}</span>
              </div>
            </header>

            <section className="review-section overview-grid">
              <div>
                <p className="review-label">Authors</p>
                <p className="review-value">{previewData.authorsDisplay || 'No author provided'}</p>
              </div>
              <div>
                <p className="review-label">Department</p>
                <p className="review-value">{previewData.departmentName || 'Not selected'}</p>
              </div>
              <div>
                <p className="review-label">Advisor</p>
                <p className="review-value">{previewData.advisorName || 'Not selected'}</p>
              </div>
              <div>
                <p className="review-label">Year</p>
                <p className="review-value">{previewData.publicationYear || 'N/A'}</p>
              </div>
            </section>

            <section className="review-section">
              <h3 className="review-section__title">Abstract</h3>
              <p className="review-section__body">{previewData.abstract || 'No abstract provided.'}</p>
            </section>

            {previewData.keywords && (
              <section className="review-section">
                <h3 className="review-section__title">Keywords</h3>
                <div className="review-tags">
                  {previewData.keywords
                    .split(',')
                    .map((kw) => kw.trim())
                    .filter(Boolean)
                    .map((kw) => (
                      <span key={kw}>{kw}</span>
                    ))}
                </div>
              </section>
            )}

            {previewData.files.length > 0 && (
              <section className="review-section">
                <h3 className="review-section__title">Attached Files</h3>
                <ul className="review-files">
                  {previewData.files.map((file, idx) => (
                    <li key={`${file.name}-${idx}`}>{file.name}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="review-actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowReview(false)}>
                Back to Edit
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={handlePublish}
                disabled={loading}
              >
                {loading ? 'Publishing...' : 'Approve & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
