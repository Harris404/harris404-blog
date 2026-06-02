import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './PaperMap.css';

const READ_KEY = 'blog-read-articles';

function getReadArticles() {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
  } catch { return []; }
}

function markAsRead(id) {
  const read = getReadArticles();
  if (!read.includes(id)) {
    read.push(id);
    localStorage.setItem(READ_KEY, JSON.stringify(read));
  }
}

function estimateReadTime(summary) {
  if (!summary) return '~3 min';
  const words = summary.split(/\s+/).length;
  return `~${Math.max(1, Math.ceil(words / 50))} min`;
}

export default function PaperMap({ seriesArticles, currentId, seriesId, seriesName, seriesIcon }) {
  if (!seriesArticles || seriesArticles.length < 2) return null;

  const [readIds, setReadIds] = useState(getReadArticles);

  // Mark current article as read
  useEffect(() => {
    if (currentId) {
      markAsRead(currentId);
      setReadIds(getReadArticles());
    }
  }, [currentId]);

  const sorted = [...seriesArticles].sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
  const hub = sorted[0]; // series_order = 0 is the hub
  const chapters = sorted.slice(1);
  const completedCount = chapters.filter(a => readIds.includes(a.id)).length;
  const progress = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  return (
    <div className="paper-map">
      <div className="paper-map__header">
        <span className="paper-map__icon">{seriesIcon || '🗺️'}</span>
        <div className="paper-map__meta">
          <h3 className="paper-map__title">{seriesName || seriesId}</h3>
          <div className="paper-map__progress-wrap">
            <div className="paper-map__progress-bar">
              <div className="paper-map__progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="paper-map__progress-text">{completedCount}/{chapters.length} 篇已读</span>
          </div>
        </div>
      </div>

      <div className="paper-map__grid">
        {chapters.map((article, idx) => {
          const isRead = readIds.includes(article.id);
          const isCurrent = article.id === currentId;

          return (
            <div key={article.id} className="paper-map__item-wrap">
              {idx > 0 && (
                <div className="paper-map__connector">
                  <svg width="24" height="16" viewBox="0 0 24 16">
                    <path d="M0 8 L24 8" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4 3" />
                    <path d="M18 4 L24 8 L18 12" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
                  </svg>
                </div>
              )}
              <Link
                to={`/article/${article.id}`}
                className={`paper-map__card ${isCurrent ? 'paper-map__card--active' : ''} ${isRead ? 'paper-map__card--read' : ''}`}
              >
                <span className="paper-map__num">{idx + 1}</span>
                <div className="paper-map__card-body">
                  <h4 className="paper-map__card-title">{article.title}</h4>
                </div>
                <span className={`paper-map__status ${isRead ? 'paper-map__status--done' : ''}`}>
                  {isCurrent ? '📖' : isRead ? '✓' : '○'}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
