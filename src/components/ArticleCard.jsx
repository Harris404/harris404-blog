import { Link } from 'react-router-dom';
import { cleanSummary } from '../utils/cleanSummary';
import './ArticleCard.css';

export default function ArticleCard({ article, index }) {
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
              <span className="article-card__series">📚 Series</span>
            </>
          )}
          {readingTime && (
            <>
              <span className="article-card__sep">·</span>
              <span className="article-card__reading-time">{readingTime} min</span>
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

