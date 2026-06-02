import { Link } from 'react-router-dom';
import { cleanSummary } from '../utils/cleanSummary';
import useArticles from '../hooks/useArticles';
import './ArticleCard.css';

function formatViews(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(v);
}

export default function ArticleCard({ article, index }) {
  const { seriesMeta } = useArticles();
  const seriesInfo = article.series_id ? (seriesMeta?.[article.series_id] || {}) : null;
  const date = new Date(article.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const readingTime = article.content
    ? Math.max(1, Math.ceil(article.content.split(/\s+/).length / 200))
    : null;

  const tags = Array.isArray(article.tags)
    ? article.tags
    : (typeof article.tags === 'string' ? JSON.parse(article.tags || '[]') : []);

  const displaySummary = cleanSummary(article.summary);

  return (
    <Link
      to={`/article/${article.id}`}
      className="article-card"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="article-card__content">
        <div className="article-card__meta">
          <span className={`article-card__tag article-card__tag--${article.category.toLowerCase()}`}>
            {article.category}
          </span>
          <span className="article-card__sep">·</span>
          <span className="article-card__date">{formattedDate}</span>
          {article.series_id && (
            <>
              <span className="article-card__sep">·</span>
              <span className="article-card__series">
                {seriesInfo?.icon || '📚'} {seriesInfo?.name || 'Series'}
              </span>
            </>
          )}
          {readingTime && (
            <>
              <span className="article-card__sep">·</span>
              <span className="article-card__reading-time">{readingTime} min</span>
            </>
          )}
          {article.views !== undefined && (
            <>
              <span className="article-card__sep">·</span>
              <span className="article-card__views" title="浏览量">
                <svg className="article-card__eye" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {formatViews(article.views)}
              </span>
            </>
          )}
          {article.is_public === false && (
            <>
              <span className="article-card__sep">·</span>
              <span className="article-card__private">🔒 私密</span>
            </>
          )}
        </div>
        <h3 className="article-card__title">{article.title}</h3>
        {displaySummary && (
          <p className="article-card__summary">{displaySummary}</p>
        )}
        {tags.length > 0 && (
          <div className="article-card__tags">
            {tags.slice(0, 4).map(tag => (
              <span key={tag} className="article-card__tag-pill">
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="article-card__tag-pill article-card__tag-pill--more">
                +{tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

