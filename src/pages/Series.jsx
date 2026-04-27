import { Link } from 'react-router-dom';
import useArticles from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import './Series.css';

export default function Series() {
  const { articles, loading } = useArticles();
  const { isAdmin, token } = useAuth();
  const [newSeriesName, setNewSeriesName] = useState('');
  const [creating, setCreating] = useState(false);

  // Build series map from articles
  const seriesMap = {};
  if (!loading) {
    articles.forEach(a => {
      if (a.series_id) {
        if (!seriesMap[a.series_id]) seriesMap[a.series_id] = [];
        seriesMap[a.series_id].push(a);
      }
    });
    Object.keys(seriesMap).forEach(k => {
      seriesMap[k].sort((a, b) => (a.series_order ?? 999) - (b.series_order ?? 999));
    });
  }

  const seriesKeys = Object.keys(seriesMap);

  const handleCreateSeries = () => {
    const name = newSeriesName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');
    // Just navigate to the new series detail page — it'll be empty
    setNewSeriesName('');
    window.location.href = `/series/${id}`;
  };

  if (loading) {
    return (
      <div className="series-page">
        <p className="series-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="series-page">
      <header className="series-header">
        <h1 className="series-header__title">Series</h1>
        <p className="series-header__desc">
          Curated collections of notes on specific topics, organized for structured learning.
        </p>
      </header>

      {/* Admin: create new series */}
      {isAdmin && (
        <div className="series-create">
          <input
            className="series-create__input"
            type="text"
            placeholder="New series name..."
            value={newSeriesName}
            onChange={(e) => setNewSeriesName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
          />
          <button
            className="series-create__btn"
            onClick={handleCreateSeries}
            disabled={!newSeriesName.trim()}
          >
            + Create
          </button>
        </div>
      )}

      {seriesKeys.length === 0 ? (
        <p className="series-empty">No series yet.</p>
      ) : (
        <div className="series-grid">
          {seriesKeys.map(key => {
            const items = seriesMap[key];
            const firstSummary = items[0]?.summary || items[0]?.title || '';
            return (
              <Link key={key} to={`/series/${key}`} className="series-card">
                <div className="series-card__icon">📚</div>
                <div className="series-card__body">
                  <h3 className="series-card__title">{key}</h3>
                  <p className="series-card__count">{items.length} {items.length === 1 ? 'note' : 'notes'}</p>
                  {firstSummary && (
                    <p className="series-card__summary">
                      {firstSummary.length > 80 ? firstSummary.substring(0, 80) + '…' : firstSummary}
                    </p>
                  )}
                </div>
                <span className="series-card__arrow">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
