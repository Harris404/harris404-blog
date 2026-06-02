import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import useArticles from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import { cleanSummary } from '../utils/cleanSummary';
import EmojiPicker from '../components/EmojiPicker';
import './Series.css';

const API_BASE = '/api/articles';

export default function SeriesDetail() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const { articles, loading, refreshArticles, seriesMeta, updateSeries } = useArticles();
  const { isAdmin, token } = useAuth();
  const meta = seriesMeta[seriesId] || {};
  const [saving, setSaving] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📚');
  const [metaSaved, setMetaSaved] = useState(false);

  // Seed edit fields from the series metadata once it loads.
  useEffect(() => {
    setEditName(meta.name || seriesId);
    setEditIcon(meta.icon || '📚');
  }, [meta.name, meta.icon, seriesId]);

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await updateSeries(seriesId, { name: editName.trim() || seriesId, icon: editIcon || '📚' }, token);
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save series meta:', err);
      alert('保存失败：' + (err.message || ''));
    }
    setSaving(false);
  };

  // Articles in this series
  const seriesArticles = articles
    .filter(a => a.series_id === seriesId)
    .sort((a, b) => (a.series_order ?? 999) - (b.series_order ?? 999));

  // Articles NOT in this series (for adding)
  const availableArticles = articles.filter(a => a.series_id !== seriesId);

  // Remove article from series (doesn't delete the article)
  const removeFromSeries = useCallback(async (articleId) => {
    if (!confirm('Remove this note from the series? (The note itself will not be deleted)')) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ series_id: null, series_order: null }),
      });
      if (refreshArticles) refreshArticles();
    } catch (err) {
      console.error('Failed to remove from series:', err);
    }
    setSaving(false);
  }, [token, refreshArticles]);

  // Add article to series
  const addToSeries = useCallback(async (articleId) => {
    const order = seriesArticles.length;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ series_id: seriesId, series_order: order }),
      });
      if (refreshArticles) refreshArticles();
    } catch (err) {
      console.error('Failed to add to series:', err);
    }
    setSaving(false);
  }, [seriesId, seriesArticles.length, token, refreshArticles]);

  // Delete entire series (removes series_id from all articles, doesn't delete them)
  const deleteSeries = useCallback(async () => {
    if (!confirm(`Delete series "${seriesId}"? Notes will NOT be deleted, only removed from this series.`)) return;
    setSaving(true);
    try {
      await Promise.all(seriesArticles.map(a =>
        fetch(`${API_BASE}/${a.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ series_id: null, series_order: null }),
        })
      ));
      if (refreshArticles) refreshArticles();
      navigate('/series');
    } catch (err) {
      console.error('Failed to delete series:', err);
    }
    setSaving(false);
  }, [seriesId, seriesArticles, token, navigate, refreshArticles]);

  if (loading) {
    return (
      <div className="series-page">
        <p className="series-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="series-page">
      {/* Breadcrumb */}
      <nav className="series-breadcrumb">
        <Link to="/series">Series</Link>
        <span className="series-breadcrumb__sep">/</span>
        <span className="series-breadcrumb__current">{meta.name || seriesId}</span>
      </nav>

      <header className="series-detail-header">
        <div className="series-detail-header__info">
          <h1 className="series-detail-header__title">{meta.icon || '📚'} {meta.name || seriesId}</h1>
          <p className="series-detail-header__count">
            {seriesArticles.length} {seriesArticles.length === 1 ? 'note' : 'notes'}
            {saving && <span className="series-saving"> · Saving...</span>}
          </p>
        </div>
        {isAdmin && (
          <div className="series-detail-header__actions">
            <button
              className="series-btn series-btn--secondary"
              onClick={() => { setShowEditPanel(v => !v); setShowAddPanel(false); }}
            >
              {showEditPanel ? 'Close' : '✏️ Edit'}
            </button>
            <button
              className="series-btn series-btn--secondary"
              onClick={() => { setShowAddPanel(!showAddPanel); setShowEditPanel(false); }}
            >
              {showAddPanel ? 'Close' : '+ Add Notes'}
            </button>
            <button className="series-btn series-btn--danger" onClick={deleteSeries}>
              Delete Series
            </button>
          </div>
        )}
      </header>

      {/* Admin: edit name + icon */}
      {isAdmin && showEditPanel && (
        <div className="series-add-panel">
          <h3 className="series-add-panel__title">Edit name &amp; icon</h3>
          <div className="series-edit-row">
            <input
              className="series-edit-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Series name"
            />
            <button className="series-btn series-btn--primary" onClick={handleSaveMeta} disabled={saving}>
              {metaSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          <EmojiPicker value={editIcon} onChange={setEditIcon} />
        </div>
      )}

      {/* Admin: Add articles panel */}
      {isAdmin && showAddPanel && (
        <div className="series-add-panel">
          <h3 className="series-add-panel__title">Add notes to this series</h3>
          {availableArticles.length === 0 ? (
            <p className="series-empty">All notes are already in this series.</p>
          ) : (
            <div className="series-add-list">
              {availableArticles.map(article => (
                <div key={article.id} className="series-add-item">
                  <div className="series-add-item__info">
                    <span className={`series-add-item__cat series-add-item__cat--${article.category?.toLowerCase()}`}>
                      {article.category}
                    </span>
                    <span className="series-add-item__title">{article.title}</span>
                  </div>
                  <button
                    className="series-btn series-btn--small"
                    onClick={() => addToSeries(article.id)}
                    disabled={saving}
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes list */}
      {seriesArticles.length === 0 ? (
        <div className="series-empty-detail">
          <p>This series has no notes yet.</p>
          {isAdmin && <p>Use the "+ Add Notes" button to add articles to this series.</p>}
        </div>
      ) : (
        <div className="series-notes-list">
          {seriesArticles.map((article, idx) => (
            <div key={article.id} className="series-note">
              <span className="series-note__num">{idx + 1}</span>
              <Link to={`/article/${article.id}`} className="series-note__link">
                <h3 className="series-note__title">{article.title}</h3>
                {article.summary && (() => {
                  const cleaned = cleanSummary(article.summary);
                  return cleaned ? (
                    <p className="series-note__summary">
                      {cleaned.length > 120 ? cleaned.substring(0, 120) + '…' : cleaned}
                    </p>
                  ) : null;
                })()}
                <div className="series-note__meta">
                  <span className={`series-note__cat series-note__cat--${article.category?.toLowerCase()}`}>
                    {article.category}
                  </span>
                  <span>{article.date}</span>
                </div>
              </Link>
              {isAdmin && (
                <button
                  className="series-note__remove"
                  onClick={() => removeFromSeries(article.id)}
                  title="Remove from series"
                  disabled={saving}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
