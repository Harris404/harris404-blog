import { Link } from 'react-router-dom';
import './ArticleCard.css';

export default function ArticleCard({ article, index }) {
  const date = new Date(article.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      to={`/article/${article.id}`}
      className="article-card"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="article-card__content">
        <h3 className="article-card__title">{article.title}</h3>
        <div className="article-card__meta">
          <span className="article-card__author">Harris</span>
          <span className="article-card__sep">·</span>
          <span className="article-card__date">{formattedDate}</span>
          <span className="article-card__sep">·</span>
          <span className={`article-card__tag article-card__tag--${article.category.toLowerCase()}`}>
            {article.category}
          </span>
        </div>
        {article.summary && (
          <p className="article-card__summary">{article.summary}</p>
        )}
      </div>
    </Link>
  );
}
