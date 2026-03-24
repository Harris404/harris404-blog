import { useState, useEffect, useCallback, useRef } from 'react';
import sampleArticles from '../data/articles';

const API_BASE = '/api/articles';
const STORAGE_KEY = 'blog-articles';

/**
 * Articles hook — tries API first, falls back to localStorage + sample data.
 */
export default function useArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const useApiRef = useRef(true);
  const articleCacheRef = useRef({});

  // Load articles list
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API_BASE);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setArticles(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API not available
      }

      // Fallback: localStorage + sample articles
      useApiRef.current = false;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const userArticles = stored ? JSON.parse(stored) : [];
        const userIds = new Set(userArticles.map(a => a.id));
        const combined = [
          ...userArticles,
          ...sampleArticles.filter(a => !userIds.has(a.id))
        ];
        setArticles(combined);
      } catch {
        setArticles(sampleArticles);
      }
      setLoading(false);
    }
    load();
  }, []);

  const addArticle = useCallback(async (articleData) => {
    const newArticle = {
      ...articleData,
      id: articleData.id || articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      date: articleData.date || new Date().toISOString().split('T')[0],
    };

    if (useApiRef.current) {
      try {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newArticle),
        });
        if (res.ok) {
          const created = await res.json();
          setArticles(prev => [{ ...newArticle, ...created }, ...prev]);
          return { ...newArticle, ...created };
        }
      } catch {
        // fall through
      }
    }

    // localStorage fallback
    setArticles(prev => {
      const updated = [newArticle, ...prev];
      const sampleIds = new Set(sampleArticles.map(a => a.id));
      const userOnly = updated.filter(a => !sampleIds.has(a.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
      return updated;
    });
    return newArticle;
  }, []);

  // Get a single article — fetches full content from API if needed
  const getArticle = useCallback(async (id) => {
    // Check cache first
    if (articleCacheRef.current[id]) {
      return articleCacheRef.current[id];
    }

    // Check if we have it locally with content
    const local = articles.find(a => a.id === id);
    if (local && local.content) {
      articleCacheRef.current[id] = local;
      return local;
    }

    // Fetch from API
    if (useApiRef.current) {
      try {
        const res = await fetch(`${API_BASE}/${id}`);
        if (res.ok) {
          const article = await res.json();
          articleCacheRef.current[id] = article;
          return article;
        }
      } catch {
        // fall through
      }
    }

    // Final fallback: check sample articles
    const sample = sampleArticles.find(a => a.id === id);
    if (sample) {
      articleCacheRef.current[id] = sample;
      return sample;
    }

    return null;
  }, [articles]);

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

  return { articles, loading, addArticle, getArticle, getByCategory, getGroupedByYear };
}
