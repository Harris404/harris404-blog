import { useParams, Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import useArticles from '../hooks/useArticles';
import './Article.css';

function extractHeadings(markdown) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  }
  return headings;
}

function estimateReadingTime(content) {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function Article() {
  const { id } = useParams();
  const { getArticle } = useArticles();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getArticle(id);
      if (!cancelled) {
        setArticle(result);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, getArticle]);

  const headings = useMemo(
    () => article ? extractHeadings(article.content) : [],
    [article]
  );

  const readingTime = useMemo(
    () => article ? estimateReadingTime(article.content) : 0,
    [article]
  );

  if (loading) {
    return (
      <div className="article-page">
        <p className="article-loading">Loading...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page">
        <h2>Article not found</h2>
        <Link to="/" className="article-back">← Back</Link>
      </div>
    );
  }

  const date = new Date(article.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="article-page">
      <Link to="/" className="article-back">← Back to articles</Link>

      <div className="article-layout">
        <article className="article-content">
          <header className="article-header">
            <div className="article-meta">
              <span className={`article-category article-category--${article.category.toLowerCase()}`}>
                {article.category}
              </span>
              <span className="article-meta__sep">·</span>
              <span>{date}</span>
              <span className="article-meta__sep">·</span>
              <span>{readingTime} min read</span>
            </div>
            <h1 className="article-title">{article.title}</h1>
            {article.tags && (
              <div className="article-tags">
                {(Array.isArray(article.tags) ? article.tags : []).map(tag => (
                  <span key={tag} className="article-tag">#{tag}</span>
                ))}
              </div>
            )}
          </header>
          <MarkdownRenderer content={article.content} />
        </article>

        {headings.length > 2 && (
          <aside className="toc">
            <div className="toc__sticky">
              <h4 className="toc__title">Contents</h4>
              <nav className="toc__nav">
                {headings.map((h, i) => (
                  <a
                    key={i}
                    href={`#${h.id}`}
                    className={`toc__link toc__link--h${h.level}`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
