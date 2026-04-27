import { Link } from 'react-router-dom';
import './SeriesNav.css';

export default function SeriesNav({ seriesArticles, currentId, seriesId }) {
  if (!seriesArticles || seriesArticles.length < 2) return null;

  const sorted = [...seriesArticles].sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
  const currentIdx = sorted.findIndex(a => a.id === currentId);
  const prev = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const next = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  return (
    <div className="series-nav">
      <div className="series-nav__header">
        <span className="series-nav__badge">📚 系列文章</span>
        <span className="series-nav__label">{seriesId}</span>
        <span className="series-nav__count">{currentIdx + 1} / {sorted.length}</span>
      </div>

      <div className="series-nav__list">
        {sorted.map((article, idx) => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className={`series-nav__item ${article.id === currentId ? 'series-nav__item--active' : ''}`}
          >
            <span className="series-nav__num">{idx + 1}</span>
            <span className="series-nav__title">{article.title}</span>
          </Link>
        ))}
      </div>

      <div className="series-nav__arrows">
        {prev ? (
          <Link to={`/article/${prev.id}`} className="series-nav__arrow series-nav__arrow--prev">
            ← {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/article/${next.id}`} className="series-nav__arrow series-nav__arrow--next">
            {next.title} →
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}
