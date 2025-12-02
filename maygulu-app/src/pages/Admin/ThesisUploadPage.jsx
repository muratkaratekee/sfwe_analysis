import React from 'react';
import './styles.css';
import '../home/home.css';
import { Link } from 'react-router-dom';
import { ThesisForm } from '../../components';
import { Navbar } from '../../components';

const ROLE_LABEL = { 0: 'Simple', 1: 'Student', 2: 'Advisor', 3: 'Admin' };

export default function ThesisUploadPage({ user, onLogout }) {
  const isAdmin = Number(user?.role_id) === 3;
  const roleName = ROLE_LABEL?.[user?.role_id] ?? `Role ${user?.role_id}`;
  return (
    <div className="admin-page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="admin-container">
        {!isAdmin ? (
          <div className="admin-alert">You are not authorized to access this page.</div>
        ) : (
          <ThesisForm />
        )}
      </main>
    </div>
  );
}
