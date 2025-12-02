import React, { useEffect, useState } from 'react';
import { createThesis } from '../api/services/theses';
import { getAdvisors, getDepartments } from '../api/services/lookups';

export default function ThesisForm() {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [keywords, setKeywords] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [files, setFiles] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [advisors, setAdvisors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => setDepartments([]));
    getAdvisors().then(setAdvisors).catch(() => setAdvisors([]));
  }, []);

  const onFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const validate = () => {
    if (!title || !abstract || !publicationYear || !authorName) return 'Please fill all required fields.';
    if (!departmentId) return 'Please select a department.';
    if (!advisorId) return 'Please select an advisor.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('title', title);
      fd.append('abstract', abstract);
      fd.append('publication_year', publicationYear);
      fd.append('keywords', keywords);
      fd.append('author_name', authorName);
      fd.append('department_id', departmentId);
      fd.append('advisor_id', advisorId);
      files.forEach(f => fd.append('files', f));
      const resp = await createThesis(fd);
      setSuccess(`Thesis created with ID ${resp?.thesis?.id || ''}`);
      // reset
      setTitle(''); setAbstract(''); setPublicationYear(''); setKeywords(''); setAuthorName(''); setDepartmentId(''); setAdvisorId(''); setFiles([]);
      if (e.target && e.target.reset) e.target.reset();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <h2 className="admin-form__title">Create Thesis</h2>

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

      <label className="admin-label">Author name
        <input className="admin-input" value={authorName} onChange={e => setAuthorName(e.target.value)} />
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
        <input className="admin-input" type="file" multiple onChange={onFileChange} />
      </label>

      <button className="admin-btn admin-btn--primary" type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Create'}</button>
    </form>
  );
}
