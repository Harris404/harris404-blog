import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ArticlesProvider } from './hooks/ArticlesContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Lazy-loaded pages — all heavy pages are code-split
const Home = lazy(() => import('./pages/Home'));
const Article = lazy(() => import('./pages/Article'));
const Graph = lazy(() => import('./pages/Graph'));
const Write = lazy(() => import('./pages/Write'));
const SeriesManager = lazy(() => import('./pages/SeriesManager'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ProtectedRoute({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

const LazyFallback = () => (
  <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
    Loading...
  </div>
);

function AppRoutes() {
  return (
    <Layout>
      <Helmet>
        <link rel="alternate" type="application/rss+xml" title="Paris-blog RSS Feed" href="/api/feed.xml" />
        <link rel="sitemap" type="application/xml" href="/api/sitemap.xml" />
      </Helmet>
      <ErrorBoundary>
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<Article />} />
            <Route path="/graph" element={<Graph />} />
            <Route path="/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
            <Route path="/series" element={<ProtectedRoute><SeriesManager /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ArticlesProvider>
          <AppRoutes />
        </ArticlesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
