import React, { useEffect, useState, useCallback } from 'react';
import './styles.css';
import '../home/home.css';
import { Link } from 'react-router-dom';
import { getUsers } from '../../api/services/admin';
import { UsersTable } from '../../components';
import { Navbar } from '../../components';

const ROLE_LABEL = {
  0: 'Simple',
  1: 'Student',
  2: 'Advisor',
  3: 'Admin',
};

export default function UsersPage({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError('');
    getUsers()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const roleName = ROLE_LABEL?.[user?.role_id] ?? `Role ${user?.role_id}`;

  return (
    <div className="admin-page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="admin-container">
        <h1 className="admin-title" style={{ marginBottom: 12 }}>Users</h1>
        {loading && <div className="admin-alert">Loading...</div>}
        {error && !loading && <div className="admin-alert">{error}</div>}
        {!loading && !error && (
          items.length === 0 ? (
            <div className="admin-alert">No users found.</div>
          ) : (
            <UsersTable rows={items} onChanged={fetchUsers} />
          )
        )}
      </main>
    </div>
  );
}
