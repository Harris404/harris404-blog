import { Link } from 'react-router-dom';
import useArticles from '../hooks/useArticles';
import './Series.css';

/**
 * Auto-generate a series description from its articles' titles.
 * e.g. "Covers: AI agent面试架构题, AI agent 主流框架问题"
 */
function generateSeriesDesc(items) {
  if (!items || items.length === 0) return '';
  const titles = items.map(a => a.title);
  if (titles.length <= 3) {
    return `Covers: ${titles.join(', ')}`;
  }
  return `Covers: ${titles.slice(0, 3).join(', ')} and ${titles.length - 3} more`;
}

export default function Series() {
  const { articles, loading, seriesMeta } = useArticles();

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

      {seriesKeys.length === 0 ? (
        <p className="series-empty">No series yet.</p>
      ) : (
        <div className="series-grid">
          {seriesKeys.map(key => {
            const items = seriesMap[key];
            const desc = generateSeriesDesc(items);
            const meta = seriesMeta[key] || {};
            return (
              <Link key={key} to={`/series/${key}`} className="series-card">
                <div className="series-card__icon">{meta.icon || '📚'}</div>
                <div className="series-card__body">
                  <h3 className="series-card__title">{meta.name || key}</h3>
                  <p className="series-card__count">{items.length} {items.length === 1 ? 'note' : 'notes'}</p>
                  {desc && (
                    <p className="series-card__summary">{desc}</p>
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
