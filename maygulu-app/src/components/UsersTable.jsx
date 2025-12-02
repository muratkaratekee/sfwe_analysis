import React, { useEffect, useState } from 'react';
import { getFaculties, getDepartmentsByFaculty } from '../api/services/lookups';
import { updateUser, deleteUser } from '../api/services/admin';

const ROLE_LABEL = { 0: 'Simple', 1: 'Student', 2: 'Advisor', 3: 'Admin' };
const ROLES = [
  { value: 0, label: 'Simple' },
  { value: 1, label: 'Student' },
  { value: 2, label: 'Advisor' },
  { value: 3, label: 'Admin' },
];

function formatDate(d) {
  try {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  } catch (_) { return String(d || ''); }
}

export default function UsersTable({ rows = [], onChanged = () => {} }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', role_id: 0, faculties_id: '', department_id: '' });
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { getFaculties().then(setFaculties).catch(() => setFaculties([])); }, []);
  useEffect(() => {
    if (form.faculties_id) {
      getDepartmentsByFaculty(form.faculties_id).then(setDepartments).catch(() => setDepartments([]));
    } else { setDepartments([]); setForm(f => ({ ...f, department_id: '' })); }
  }, [form.faculties_id]);

  const startEdit = (u) => {
    setErr('');
    setEditId(u.id);
    setForm({
      full_name: u.full_name || '',
      email: u.email || '',
      role_id: Number(u.role_id ?? 0),
      faculties_id: u.faculties_id || '',
      department_id: u.department_id || '',
    });
  };
  const cancel = () => { setEditId(null); setErr(''); };

  const save = async (id) => {
    try {
      setSaving(true); setErr('');
      const payload = { full_name: form.full_name, role_id: Number(form.role_id) };
      if (typeof form.email === 'string' && form.email.trim() !== '') payload.email = form.email.trim();
      if (form.faculties_id !== '') payload.faculties_id = Number(form.faculties_id);
      if (form.department_id !== '') payload.department_id = Number(form.department_id);
      await updateUser(id, payload);
      setEditId(null);
      onChanged();
    } catch (e) { setErr(e.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {err && <div className="admin-alert">{err}</div>}
      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col /><col /><col style={{ width: '120px' }} />
          <col /><col />
          <col style={{ width: '160px' }} />
          <col style={{ width: '180px' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Email</th>
            <th style={th}>Role</th>
            <th style={th}>Faculty</th>
            <th style={th}>Department</th>
            <th style={th}>Created</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td style={td}>
                {editId === u.id ? (
                  <input style={inp} value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
                ) : (
                  u.full_name
                )}
              </td>
              <td style={td}>
                {editId === u.id ? (
                  <input style={inp} type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                ) : (
                  u.email
                )}
              </td>
              <td style={td}>
                {editId === u.id ? (
                  <select style={inp} value={form.role_id} onChange={(e) => setForm(f => ({ ...f, role_id: Number(e.target.value) }))}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                ) : (
                  ROLE_LABEL?.[u.role_id] ?? u.role_id
                )}
              </td>
              <td style={td}>
                {editId === u.id ? (
                  <select style={inp} value={form.faculties_id} onChange={(e) => setForm(f => ({ ...f, faculties_id: e.target.value }))}>
                    <option value="">(unchanged)</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                ) : (
                  u.faculty_name || '-'
                )}
              </td>
              <td style={td}>
                {editId === u.id ? (
                  <select style={inp} value={form.department_id} onChange={(e) => setForm(f => ({ ...f, department_id: e.target.value }))}>
                    <option value="">(unchanged)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : (
                  u.department_name || '-'
                )}
              </td>
              <td style={td}>{formatDate(u.created_at)}</td>
              <td style={td}>
                {editId === u.id ? (
                  <>
                    <button className="home-upload" style={{ marginRight: 6 }} disabled={saving} onClick={() => save(u.id)}>Save</button>
                    <button className="home-logout" onClick={cancel} disabled={saving}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="home-upload" style={{ marginRight: 6 }} onClick={() => startEdit(u)}>Edit</button>
                    <button
                      className="home-logout"
                      onClick={async () => {
                        if (!window.confirm(`Delete user ${u.full_name}?`)) return;
                        try { await deleteUser(u.id); onChanged(); }
                        catch (e) { setErr(e.message || 'Delete failed'); }
                      }}
                    >Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontWeight: 700, fontSize: 13, color: '#111827' };
const td = { padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13, color: '#374151', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' };
const inp = { padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
