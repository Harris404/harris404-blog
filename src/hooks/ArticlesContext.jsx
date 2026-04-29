import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import sampleArticles from '../data/articles';

const ArticlesContext = createContext(null);

const API_BASE = '/api/articles';
const STORAGE_KEY = 'blog-articles';

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const useApiRef = useRef(true);
  const articleCacheRef = useRef({});

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          useApiRef.current = true;
          setArticles(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // API not available
    }

    useApiRef.current = false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const userArticles = stored ? JSON.parse(stored) : [];
      const userIds = new Set(userArticles.map(a => a.id));
      const combined = [...userArticles, ...sampleArticles.filter(a => !userIds.has(a.id))];
      setArticles(combined);
    } catch {
      setArticles(sampleArticles);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Expose a refresh function so consumers can re-fetch after mutations
  const refreshArticles = useCallback(() => {
    articleCacheRef.current = {};
    fetchArticles();
  }, [fetchArticles]);

  const addArticle = useCallback(async (articleData, token) => {
    const newArticle = {
      ...articleData,
      id: articleData.id || articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      date: articleData.date || new Date().toISOString().split('T')[0],
    };

    if (useApiRef.current) {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newArticle),
      });
      if (res.ok) {
        const created = await res.json();
        setArticles(prev => [{ ...newArticle, ...created }, ...prev]);
        return { ...newArticle, ...created };
      }
      // Surface server errors instead of silently falling through
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server error (${res.status})`);
    }

    setArticles(prev => {
      const updated = [newArticle, ...prev];
      const sampleIds = new Set(sampleArticles.map(a => a.id));
      const userOnly = updated.filter(a => !sampleIds.has(a.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
      return updated;
    });
    return newArticle;
  }, []);

  const deleteArticle = useCallback(async (id, token) => {
    if (useApiRef.current) {
      try {
        const res = await fetch(`${API_BASE}/${id}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          console.error('Delete failed:', await res.text());
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
    setArticles(prev => prev.filter(a => a.id !== id));
    // Also remove from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userArticles = JSON.parse(stored).filter(a => a.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userArticles));
      }
    } catch { /* ignore */ }
  }, []);

  // Keep a ref to current articles so getArticle stays stable
  const articlesRef = useRef(articles);
  useEffect(() => { articlesRef.current = articles; }, [articles]);

  const getArticle = useCallback(async (id) => {
    if (articleCacheRef.current[id]) return articleCacheRef.current[id];

    const local = articlesRef.current.find(a => a.id === id);
    if (local && local.content) {
      articleCacheRef.current[id] = local;
      return local;
    }

    if (useApiRef.current) {
      try {
        const res = await fetch(`${API_BASE}/${id}`);
        if (res.ok) {
          const article = await res.json();
          articleCacheRef.current[id] = article;
          return article;
        }
      } catch { /* fall through */ }
    }

    const sample = sampleArticles.find(a => a.id === id);
    if (sample) { articleCacheRef.current[id] = sample; return sample; }
    return null;
  }, []); // stable — no dependencies, uses refs internally

  const getByCategory = useCallback((category) => {
    if (!category || category === 'All') return articles;
    return articles.filter(a => a.category === category);
  }, [articles]);

  const getGroupedByYear = useCallback((category) => {
    const filtered = getByCategory(category);
    const grouped = {};
    filtered.forEach(article => {
      const year = new Date(article.date).getFullYear();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(article);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, arts]) => ({
        year: Number(year),
        articles: arts.sort((a, b) => new Date(b.date) - new Date(a.date))
      }));
  }, [getByCategory]);

  const updateArticle = useCallback(async (id, articleData, token) => {
    const updatedDate = articleData.date || new Date().toISOString().split('T')[0];

    if (useApiRef.current) {
      try {
        await fetch(`${API_BASE}/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ...articleData, date: updatedDate }),
        });
      } catch {
        // fall through
      }
    }

    // Clear cache so next fetch gets fresh data
    delete articleCacheRef.current[id];

    // Update local state and re-sort by date DESC
    setArticles(prev => {
      const updated = prev.map(a =>
        a.id === id ? { ...a, ...articleData, date: updatedDate } : a
      );
      return [...updated].sort((a, b) => new Date(b.date) - new Date(a.date));
    });
  }, []);

  const value = {
    articles, loading, addArticle, updateArticle,
    deleteArticle, getArticle, getByCategory, getGroupedByYear,
    refreshArticles,
  };

  return (
    <ArticlesContext.Provider value={value}>
      {children}
    </ArticlesContext.Provider>
  );
}

export default function useArticles() {
  const context = useContext(ArticlesContext);
  if (!context) throw new Error('useArticles must be used within ArticlesProvider');
  return context;
}
