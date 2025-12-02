import React, { useEffect, useState } from 'react';
import '../home/home.css';
import '../thesis/styles.css';
import { Link } from 'react-router-dom';
import { getThesesByAdvisor } from '../../api/services/theses';
import { Navbar, ThesisList } from '../../components';

const ROLE_LABEL = { 0: 'Simple', 1: 'Student', 2: 'Advisor', 3: 'Admin' };

export default function MyTheses({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    getThesesByAdvisor(user?.id)
      .then((data) => { if (!alive) return; setItems(Array.isArray(data) ? data : []); })
      .catch((err) => { if (alive) setError(err.message || 'Failed to load'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [user?.id]);

  const roleName = ROLE_LABEL?.[user?.role_id] ?? `Role ${user?.role_id}`;
  const isAdvisor = Number(user?.role_id) === 2;

  return (
    <div className="thesis-page">
      <Navbar user={user} onLogout={onLogout} />

      <section className="thesis-hero-wrap">
        <div className="thesis-hero">My Theses</div>
      </section>

      <main className="thesis-container">
        {loading && <div className="thesis-info">Loading...</div>}
        {error && !loading && <div className="thesis-alert thesis-alert--error">{error}</div>}
        {!loading && !error && (
          items.length === 0 ? (
            <div className="thesis-info">You have not uploaded any theses yet.</div>
          ) : (
            <ThesisList items={items} />
          )
        )}
      </main>
    </div>
  );
}
