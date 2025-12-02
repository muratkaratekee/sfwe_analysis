import React from 'react';
import { Link } from 'react-router-dom';

function formatDate(d) {
  try {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (_) { return String(d || ''); }
}

function ThesisCardInline({ item }) {
  return (
    <Link to={`/theses/${item?.id}`} className="thesis-card" style={{ textDecoration: 'none' }}>
      <h3 className="thesis-card__title" title={item?.title}>{item?.title}</h3>
      <p className="thesis-card__abstract" title={item?.abstract}>{item?.abstract}</p>
      <div className="thesis-card__meta">
        <span className="thesis-card__meta-item">Danışman: <strong>{item?.advisor_name || '-'}</strong></span>
        <span className="thesis-card__meta-item">Yazar: <strong>{item?.author_name || '-'}</strong></span>
        <span className="thesis-card__meta-item">Tarih: <strong>{formatDate(item?.created_at)}</strong></span>
        <span className="thesis-card__meta-item">Views: <strong>{item?.view_count ?? 0}</strong></span>
        <span className="thesis-card__meta-item">Downloads: <strong>{item?.download_count ?? 0}</strong></span>
        <span className="thesis-card__meta-item">Citations: <strong>{item?.bibliography_count ?? 0}</strong></span>
      </div>
    </Link>
  );
}

export default function ThesisList({ items = [] }) {
  return (
    <div className="thesis-grid">
      {items.map((item) => (
        <ThesisCardInline key={item.id} item={item} />
      ))}
    </div>
  );
}
