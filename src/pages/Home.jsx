import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';
import SearchBar from '../components/SearchBar';
import useArticles from '../hooks/useArticles';
import './Home.css';

const categories = ['All', 'Knowledge', 'Paper', 'Code'];
const TAG_LIMIT = 12; // collapse beyond this many tags

export default function Home() {
  const { articles, getGroupedByYear } = useArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAllTags, setShowAllTags] = useState(false);

  const activeTag = searchParams.get('tag') || null;

  // Tags ranked by how many articles use them (most-used first), so the
  // useful tags stay on top and the long tail collapses behind a toggle.
  const rankedTags = useMemo(() => {
    const counts = {};
    articles.forEach(a => (Array.isArray(a.tags) ? a.tags : []).forEach(t => {
      counts[t] = (counts[t] || 0) + 1;
    }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count }));
  }, [articles]);

  // Always keep the active tag visible even if it's in the collapsed tail.
  const visibleTags = useMemo(() => {
    if (showAllTags) return rankedTags;
    const top = rankedTags.slice(0, TAG_LIMIT);
    if (activeTag && !top.some(t => t.tag.toLowerCase() === activeTag.toLowerCase())) {
      const extra = rankedTags.find(t => t.tag.toLowerCase() === activeTag.toLowerCase());
      if (extra) top.push(extra);
    }
    return top;
  }, [rankedTags, showAllTags, activeTag]);

  const hiddenCount = rankedTags.length - Math.min(TAG_LIMIT, rankedTags.length);

  // Filter: category first, then tag
  let groupedArticles = getGroupedByYear(activeCategory);

  if (activeTag) {
    groupedArticles = groupedArticles
      .map(group => ({
        ...group,
        articles: group.articles.filter(a =>
          Array.isArray(a.tags) && a.tags.some(t => t.toLowerCase() === activeTag.toLowerCase())
        ),
      }))
      .filter(group => group.articles.length > 0);
  }

  const clearTag = () => {
    searchParams.delete('tag');
    setSearchParams(searchParams);
  };

  const selectTag = (tag) => {
    setSearchParams({ tag });
  };

  return (
    <div className="home">
      <Helmet>
        <title>Paris-blog — AI & LLM Deep Dives</title>
        <meta name="description" content="Notes on large language models, paper analyses, and code implementations by Paris." />
      </Helmet>

      <header className="home__header">
        <h1 className="home__title">Paris's Thoughts</h1>
        <p className="home__desc">
          Notes on large language models, paper analyses, and code.
        </p>
      </header>

      <SearchBar articles={articles} />

      <div className="home__filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`home__filter ${activeCategory === cat ? 'home__filter--active' : ''}`}
            onClick={() => { setActiveCategory(cat); clearTag(); }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tag filter chips — ranked by usage, collapsed beyond TAG_LIMIT */}
      {rankedTags.length > 0 && (
        <div className="home__tags">
          {activeTag && (
            <button className="home__tag home__tag--clear" onClick={clearTag}>
              ✕ Clear
            </button>
          )}
          {visibleTags.map(({ tag, count }) => (
            <button
              key={tag}
              className={`home__tag ${activeTag === tag ? 'home__tag--active' : ''}`}
              onClick={() => selectTag(tag)}
              title={`${count} 篇`}
            >
              #{tag}
            </button>
          ))}
          {hiddenCount > 0 && (
            <button
              className="home__tag home__tag--toggle"
              onClick={() => setShowAllTags(v => !v)}
            >
              {showAllTags ? '收起 ▲' : `+${hiddenCount} 更多 ▼`}
            </button>
          )}
        </div>
      )}

      <div className="home__articles">
        {groupedArticles.map(({ year, articles }) => (
          <section key={year} className="article-group">
            {groupedArticles.length > 1 && (
              <h2 className="article-group__year">{year}</h2>
            )}
            <div className="article-group__list">
              {articles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>
          </section>
        ))}

        {groupedArticles.length === 0 && (
          <p className="home__empty">No articles found.</p>
        )}
      </div>
    </div>
  );
}
