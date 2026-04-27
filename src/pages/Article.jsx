import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMemo, useState, useEffect } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import ErrorBoundary from '../components/ErrorBoundary';
import SeriesNav from '../components/SeriesNav';
import PaperMap from '../components/PaperMap';
import RelatedArticles from '../components/RelatedArticles';
import ReadingProgress from '../components/ReadingProgress';
import BackToTop from '../components/BackToTop';
import useArticles from '../hooks/useArticles';
import { useAuth } from '../hooks/useAuth';
import './Article.css';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\./g, '')           // strip dots (matches github-slugger)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/(^-|-$)/g, '');
}

function extractHeadings(markdown) {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    // Strip markdown formatting from heading text
    const text = match[2]
      .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
      .replace(/\*(.+?)\*/g, '$1')      // italic
      .replace(/`(.+?)`/g, '$1')        // code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // links
    headings.push({
      level: match[1].length,
      text,
      id: slugify(text),
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
  const navigate = useNavigate();
  const { getArticle, deleteArticle } = useArticles();
  const { isAdmin, token } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getArticle(id);
      if (!cancelled) {
        setArticle(result);
        if (result && result.content) {
          setHeadings(extractHeadings(result.content));
        }
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [id, getArticle]);

  const readingTime = useMemo(
    () => article ? estimateReadingTime(article.content) : 0,
    [article]
  );


  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    await deleteArticle(id, token);
    navigate('/');
  };

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

  const articleUrl = `${window.location.origin}/article/${article.id}`;

  // JSON-LD structured data for search engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary || article.content.substring(0, 160).replace(/[#*`]/g, ''),
    datePublished: article.date,
    dateModified: article.updated_at || article.date,
    author: { '@type': 'Person', name: 'Paris' },
    url: articleUrl,
    keywords: Array.isArray(article.tags) ? article.tags.join(', ') : '',
  };

  return (
    <div className="article-page">
      <ReadingProgress />
      <Helmet>
        <title>{article.title} — Paris-blog</title>
        <meta name="description" content={article.summary || article.content.substring(0, 160).replace(/[#*`]/g, '')} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary || article.content.substring(0, 160).replace(/[#*`]/g, '')} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={articleUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary || ''} />
        <meta property="article:published_time" content={article.date} />
        {Array.isArray(article.tags) && article.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Breadcrumb navigation */}
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="article-breadcrumb__sep">/</span>
        <Link to={`/?tag=${encodeURIComponent(article.category)}`}>{article.category}</Link>
        <span className="article-breadcrumb__sep">/</span>
        <span className="article-breadcrumb__current">{article.title.length > 40 ? article.title.substring(0, 40) + '…' : article.title}</span>
      </nav>

      <div className="article-topbar">
        <Link to="/" className="article-back">← Back to articles</Link>
        {isAdmin && (
          <div className="article-admin-actions">
            <button
              className="article-edit"
              onClick={() => navigate('/write', { state: { article } })}
            >
              Edit
            </button>
            <button className="article-delete" onClick={handleDelete}>Delete</button>
          </div>
        )}
      </div>

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
                  <Link key={tag} to={`/?tag=${encodeURIComponent(tag)}`} className="article-tag">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Series navigation / Paper Map */}
          {article.series_id && article.series_articles && (
            (article.series_order === 0 || article.series_order === null)
              ? <PaperMap
                  seriesArticles={article.series_articles}
                  currentId={article.id}
                  seriesId={article.series_id}
                />
              : <SeriesNav
                  seriesArticles={article.series_articles}
                  currentId={article.id}
                  seriesId={article.series_id}
                />
          )}

          <ErrorBoundary>
            <MarkdownRenderer content={article.content} />
          </ErrorBoundary>

          {/* Related articles — shows at bottom */}
          <RelatedArticles articles={article.related_articles} />
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
                    title={h.text}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>

      <BackToTop />
    </div>
  );
}
