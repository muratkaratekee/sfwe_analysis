import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './home.css';
import { Navbar } from '../../components';
import { getJson } from '../../api/client';

const ROLE_LABEL = {
  0: 'Simple',
  1: 'Student',
  2: 'Advisor',
  3: 'Admin',
};

export default function HomePage({ user, onLogout }) {
  const roleName = ROLE_LABEL?.[user?.role_id] ?? `Role ${user?.role_id}`;
  const [stats, setStats] = useState({ theses: 0, advisors: 0, users: 0 });
  useEffect(() => {
    getJson('/stats')
      .then(d => setStats({ theses: d.theses || 0, advisors: d.advisors || 0, users: d.users || 0 }))
      .catch(() => setStats({ theses: 0, advisors: 0, users: 0 }));
  }, []);

  return (
    <div className="home-page">
      <Navbar user={user} onLogout={onLogout} />

      <section className="home-hero-wrap">
        <div className="home-hero">
          <h1 className="home-hero__title">Thesis Upload Platform</h1>
        </div>
      </section>

      <section className="home-stats">
        <div className="stat-card">
          <div className="stat-card__title">Total Theses</div>
          <div className="stat-card__value">{stats.theses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__title">Advisors</div>
          <div className="stat-card__value">{stats.advisors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__title">Users</div>
          <div className="stat-card__value">{stats.users}</div>
        </div>
        <Link className="stat-card stat-card--cta" to="/theses">
          <div className="stat-card__cta">See the Theses</div>
        </Link>
      </section>

      <section className="home-intro">
        <img className="home-intro__logo" src="/logo.jpg" alt="Final University Logo" />
        <div className="home-intro__content">
          <h2 className="home-intro__title">Welcome to the Final University Thesis Repository</h2>
          <p>
            The Final University Thesis Repository is a digital platform designed to store, manage, and share student theses and research projects. Our goal is to create a centralized and accessible archive where students, instructors, and researchers can easily upload, browse, and reference academic work.
          </p>
          <p>
            Through this system, students can securely submit their theses, while advisors and administrators can review, approve, and provide feedback. The repository also supports project-based submissions, ensuring that practical works and supplementary files can be stored alongside written theses.
          </p>
          <p>
            By promoting open access and academic collaboration, Final University aims to support learning, innovation, and research excellence within our academic community.
          </p>
        </div>
      </section>

      <main className="home-container">
      </main>
    </div>
  );
}
