import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, User, Eye, Download, Quote, GraduationCap, Cpu, Stethoscope, Scale, Building2, Leaf, FlaskConical, Palette, BriefcaseBusiness } from 'lucide-react';
import { getFavorites, addFavorite, removeFavorite } from '../api/favorites';

function truncateText(v, maxLen) {
  const s = String(v ?? '');
  if (!maxLen || maxLen <= 0) return s;
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen).trimEnd()}...`;
}

function getFacultyIconAndTheme(facultyName) {
  const name = String(facultyName || '').toLowerCase();

  if (name.includes('engineering') || name.includes('mühendis') || name.includes('teknoloji') || name.includes('technology')) {
    return { Icon: Cpu, theme: 'blue' };
  }
  if (name.includes('medicine') || name.includes('tıp') || name.includes('medical') || name.includes('health') || name.includes('sağlık')) {
    return { Icon: Stethoscope, theme: 'red' };
  }
  if (name.includes('law') || name.includes('hukuk')) {
    return { Icon: Scale, theme: 'violet' };
  }
  if (name.includes('business') || name.includes('econom') || name.includes('işletme') || name.includes('iktisat')) {
    return { Icon: BriefcaseBusiness, theme: 'amber' };
  }
  if (name.includes('art') || name.includes('design') || name.includes('sanat') || name.includes('tasarım')) {
    return { Icon: Palette, theme: 'pink' };
  }
  if (name.includes('science') || name.includes('fen') || name.includes('chem') || name.includes('bio') || name.includes('physics') || name.includes('fizik') || name.includes('kimya') || name.includes('biyoloji')) {
    return { Icon: FlaskConical, theme: 'green' };
  }
  if (name.includes('agri') || name.includes('ziraat') || name.includes('tarım') || name.includes('environment') || name.includes('çevre')) {
    return { Icon: Leaf, theme: 'emerald' };
  }
  if (name.includes('architecture') || name.includes('mimarl')) {
    return { Icon: Building2, theme: 'slate' };
  }
  return { Icon: GraduationCap, theme: 'indigo' };
}

function ThesisCardInline({ item, isFavorited, onToggleFavorite }) {
  return (
    <Link to={`/theses/${item?.id}`} className="thesis-card" style={{ textDecoration: 'none' }}>
      <button
        type="button"
        className={`thesis-card__favorite${isFavorited ? ' is-favorited' : ''}`}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorited ? 'Favorited' : 'Favorite'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(item?.id);
        }}
      >
        <Star
          size={20}
          className="thesis-card__favorite-icon"
          fill={isFavorited ? 'currentColor' : 'none'}
        />
      </button>
      <h3 className="thesis-card__title" title={item?.title}>{truncateText(item?.title, 100)}</h3>
      <p className="thesis-card__abstract" title={item?.abstract}>{item?.abstract}</p>
      <div className="thesis-card__meta">
        <div className="thesis-card__meta-left">
          <span className="thesis-card__meta-item" title="Author" aria-label={`Author: ${item?.author_name || '-'}`}>
            <User size={14} className="thesis-card__meta-icon" />
            <strong>{item?.author_name || '-'}</strong>
          </span>
          <span className="thesis-card__meta-item" title="Advisor" aria-label={`Advisor: ${item?.advisor_name || '-'}`}>
            <Users size={14} className="thesis-card__meta-icon" />
            <strong>{item?.advisor_name || '-'}</strong>
          </span>
        </div>
        <div className="thesis-card__meta-right">
          <span className="thesis-card__meta-item" title="Views" aria-label={`Views: ${item?.view_count ?? 0}`}>
            <Eye size={14} className="thesis-card__meta-icon" />
            <strong>{item?.view_count ?? 0}</strong>
          </span>
          <span className="thesis-card__meta-item" title="Downloads" aria-label={`Downloads: ${item?.download_count ?? 0}`}>
            <Download size={14} className="thesis-card__meta-icon" />
            <strong>{item?.download_count ?? 0}</strong>
          </span>
          <span className="thesis-card__meta-item" title="Citations" aria-label={`Citations: ${item?.bibliography_count ?? 0}`}>
            <Quote size={14} className="thesis-card__meta-icon" />
            <strong>{item?.bibliography_count ?? 0}</strong>
          </span>
        </div>
      </div>
    </Link>
  );
}

function ThesisCardGrid({ item, isFavorited, onToggleFavorite }) {
  const { Icon: FacultyIcon, theme } = getFacultyIconAndTheme(item?.faculty_name);
  return (
    <Link to={`/theses/${item?.id}`} className="thesis-card thesis-card--grid" style={{ textDecoration: 'none' }}>
      <button
        type="button"
        className={`thesis-card__favorite${isFavorited ? ' is-favorited' : ''}`}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorited ? 'Favorited' : 'Favorite'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(item?.id);
        }}
      >
        <Star
          size={20}
          className="thesis-card__favorite-icon"
          fill={isFavorited ? 'currentColor' : 'none'}
        />
      </button>
      <div
        className={`thesis-card__faculty-hero thesis-card__faculty-hero--${theme}`}
        title={item?.faculty_name || ''}
      >
        <div className="thesis-card__faculty-badge">
          <FacultyIcon size={48} className="thesis-card__faculty-icon" />
        </div>
        <div className="thesis-card__faculty-label">{item?.faculty_name || 'Faculty'}</div>
      </div>
      <h3 className="thesis-card__title" title={item?.title}>{truncateText(item?.title, 100)}</h3>
      <p className="thesis-card__abstract" title={item?.abstract}>{item?.abstract}</p>
      <div className="thesis-card__meta thesis-card__meta--grid">
        <span className="thesis-card__meta-item" title="Author" aria-label={`Author: ${item?.author_name || '-'}`}>
          <User size={14} className="thesis-card__meta-icon" />
          <strong>{item?.author_name || '-'}</strong>
        </span>
      </div>
    </Link>
  );
}

export default function ThesisList({ items = [], viewMode = 'list', user }) {
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  // Kullanıcının favorilerini API'den yükle
  useEffect(() => {
    if (!userId) {
      setFavorites(new Set());
      return;
    }

    const loadFavorites = async () => {
      try {
        const data = await getFavorites(userId);
        const ids = new Set(data.map((f) => String(f.thesis_id)));
        setFavorites(ids);
      } catch (err) {
        console.error('Favoriler yüklenemedi:', err);
        setFavorites(new Set());
      }
    };

    loadFavorites();

    // Diğer componentlerden gelen favori değişikliklerini dinle
    const handleFavoriteChange = () => loadFavorites();
    window.addEventListener('favorite_theses_changed', handleFavoriteChange);
    return () => window.removeEventListener('favorite_theses_changed', handleFavoriteChange);
  }, [userId]);

  const isFavorited = (id) => favorites.has(String(id));

  const toggleFavorite = async (id) => {
    if (!userId) {
      alert('Favorilere eklemek için giriş yapmalısınız.');
      return;
    }

    const key = String(id ?? '');
    if (!key || loading) return;

    setLoading(true);
    try {
      if (favorites.has(key)) {
        await removeFavorite(userId, id);
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        await addFavorite(userId, id);
        setFavorites((prev) => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
      window.dispatchEvent(new Event('favorite_theses_changed'));
    } catch (err) {
      console.error('Favori işlemi başarısız:', err);
    } finally {
      setLoading(false);
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="thesis-grid">
        {items.map((item) => (
          <ThesisCardGrid
            key={item?.id}
            item={item}
            isFavorited={isFavorited(item?.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="thesis-list">
      {items.map((item) => (
        <ThesisCardInline
          key={item?.id}
          item={item}
          isFavorited={isFavorited(item?.id)}
          onToggleFavorite={toggleFavorite}
        />
      ))}
    </div>
  );
}
