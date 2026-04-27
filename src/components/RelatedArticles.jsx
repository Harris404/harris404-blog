import { Link } from 'react-router-dom';
import './RelatedArticles.css';

export default function RelatedArticles({ articles }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="related-articles">
      <h3 className="related-articles__title">📎 相关文章</h3>
      <div className="related-articles__grid">
        {articles.map(article => (
          <Link
            key={article.id}
            to={`/article/${article.id}`}
            className="related-articles__card"
          >
            <span className={`related-articles__cat related-articles__cat--${article.category?.toLowerCase()}`}>
              {article.category}
            </span>
            <h4 className="related-articles__card-title">{article.title}</h4>
            <p className="related-articles__summary">
              {article.summary?.substring(0, 80)}
              {(article.summary?.length || 0) > 80 ? '…' : ''}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
