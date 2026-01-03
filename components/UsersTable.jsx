import React, { useEffect, useState } from 'react';
import { getFaculties, getDepartmentsByFaculty } from '../api/lookups';
import { updateUser, deleteUser } from '../api/admin';

const ROLE_LABEL = { 0: 'Other', 1: 'Student', 2: 'Advisor', 3: 'Admin' };
const ROLES = [
  { value: 0, label: 'Other' },
  { value: 1, label: 'Student' },
  { value: 2, label: 'Advisor' },
  { value: 3, label: 'Admin' }, // Admin seçeneği eklendi
];

function formatDate(d) {
  try {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  } catch (_) { return String(d || ''); }
}

export default function UsersTable({ rows = [], onChanged = () => { }, currentUser = null }) {
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ full_name: '', role_id: 0, faculties_id: '', department_id: '', is_active: true });
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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
      role_id: Number(u.role_id ?? 0),
      faculties_id: u.faculties_id || '',
      department_id: u.department_id || '',
      is_active: u.is_active !== false,
    });
  };
  const cancel = () => { setEditId(null); setErr(''); };

  const handleDelete = async (user) => {
    try {
      await deleteUser(user.id, currentUser?.id);
      setDeleteConfirm(null);
      onChanged();
    } catch (e) {
      setErr(e.message || 'Delete failed');
    }
  };

  const save = async (id) => {
    try {
      setSaving(true); setErr('');
      const payload = { full_name: form.full_name, role_id: Number(form.role_id), is_active: Boolean(form.is_active), admin_user_id: currentUser?.id };
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
      {err && <div className="admin-alert" style={{ color: 'var(--text-primary)' }}>{err}</div>}
      <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <colgroup>
          <col /><col /><col style={{ width: '120px' }} /><col style={{ width: '100px' }} />
          <col /><col />
          <col style={{ width: '160px' }} />
          <col style={{ width: '180px' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Email</th>
            <th style={{ ...th, paddingLeft: '30px' }}>Role</th>
            <th style={th}>Active</th>
            <th style={th}>Faculty</th>
            <th style={th}>Department</th>
            <th style={th}>Created</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .map((u) => (
              <tr key={u.id}>
                <td style={td}>
                  {editId === u.id ? (
                    <input style={inp} value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
                  ) : (
                    u.full_name
                  )}
                </td>
                <td style={td}>
                  {u.email}
                </td>
                <td style={{ ...td, paddingLeft: '30px' }}>
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
                    <select
                      style={inp}
                      value={form.is_active ? 'true' : 'false'}
                      onChange={(e) => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 999, border: '1px solid var(--color-border)', background: u.is_active === false ? 'var(--error-bg)' : 'var(--success-bg)', color: u.is_active === false ? 'var(--error-text)' : 'var(--success-text)' }}>
                      {u.is_active === false ? 'Inactive' : 'Active'}
                    </span>
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
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontWeight: 500,
                          fontSize: '13px'
                        }}
                        onClick={() => setDeleteConfirm(u)}
                      >Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Custom Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: '600'
            }}>Delete User</h3>
            {currentUser?.id === deleteConfirm.id ? (
              <p style={{
                margin: '0 0 24px 0',
                color: '#ef4444',
                fontSize: '14px',
                lineHeight: '1.5',
                fontWeight: '500'
              }}>
                You cannot delete your own account.
              </p>
            ) : (
              <p style={{
                margin: '0 0 24px 0',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Are you sure you want to delete <strong>{deleteConfirm.full_name}</strong>? This action cannot be undone.
              </p>
            )}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {currentUser?.id === deleteConfirm.id ? 'Close' : 'Cancel'}
              </button>
              {currentUser?.id !== deleteConfirm.id && (
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th = { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--bg-secondary)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' };
const td = { padding: '10px 12px', borderBottom: '1px solid var(--color-border)', fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' };
const inp = { padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', color: 'var(--text-primary)' };