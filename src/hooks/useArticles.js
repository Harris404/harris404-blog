import { useState, useEffect, useCallback, useRef } from 'react';
import sampleArticles from '../data/articles';

const API_BASE = '/api/articles';
const STORAGE_KEY = 'blog-articles';

export default function useArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const useApiRef = useRef(true);
  const articleCacheRef = useRef({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API_BASE);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // API is working — use it as the source of truth
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
    }
    load();
  }, []);

  const addArticle = useCallback(async (articleData, token) => {
    const newArticle = {
      ...articleData,
      id: articleData.id || articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      date: articleData.date || new Date().toISOString().split('T')[0],
    };

    if (useApiRef.current) {
      try {
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
      } catch {
        // fall through
      }
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
    // Clear from cache
    delete articleCacheRef.current[id];
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

  const getArticle = useCallback(async (id) => {
    if (articleCacheRef.current[id]) return articleCacheRef.current[id];

    const local = articles.find(a => a.id === id);
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

    // Update local state
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, ...articleData, date: updatedDate } : a
    ));
  }, []);

  return { articles, loading, addArticle, updateArticle, deleteArticle, getArticle, getByCategory, getGroupedByYear };
}
