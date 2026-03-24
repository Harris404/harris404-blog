import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';
import useArticles from '../hooks/useArticles';
import './Home.css';

const categories = ['All', 'Knowledge', 'Paper', 'Code'];

export default function Home() {
  const { articles, getGroupedByYear } = useArticles();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('All');

  const activeTag = searchParams.get('tag') || null;

  // Get all unique tags from articles
  const allTags = [...new Set(
    articles.flatMap(a => Array.isArray(a.tags) ? a.tags : [])
  )].sort();

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
      <header className="home__header">
        <h1 className="home__title">Paris's Thoughts</h1>
        <p className="home__desc">
          Notes on large language models, paper analyses, and code.
        </p>
      </header>

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

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="home__tags">
          {activeTag && (
            <button className="home__tag home__tag--clear" onClick={clearTag}>
              ✕ Clear
            </button>
          )}
          {allTags.map(tag => (
            <button
              key={tag}
              className={`home__tag ${activeTag === tag ? 'home__tag--active' : ''}`}
              onClick={() => selectTag(tag)}
            >
              #{tag}
            </button>
          ))}
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
