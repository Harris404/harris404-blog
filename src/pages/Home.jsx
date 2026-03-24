import { useState } from 'react';
import ArticleCard from '../components/ArticleCard';
import useArticles from '../hooks/useArticles';
import './Home.css';

const categories = ['All', 'Knowledge', 'Paper', 'Code'];

export default function Home() {
  const { getGroupedByYear } = useArticles();
  const [activeCategory, setActiveCategory] = useState('All');

  const groupedArticles = getGroupedByYear(activeCategory);

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
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

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
