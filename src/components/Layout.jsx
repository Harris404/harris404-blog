import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin, logout } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/', label: 'Articles' },
    { path: '/graph', label: 'Graph' },
    { path: '/series', label: 'Series' },
    ...(isAdmin ? [
      { path: '/write', label: 'Write' },
    ] : []),
    { path: '/about', label: 'About' },
  ];

  return (
    <div className="layout">
      <header className="mobile-header">
        <button className="mobile-header__menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {sidebarOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <Link to="/" className="mobile-header__logo">Paris-blog</Link>
        <ThemeToggle />
      </header>

      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__inner">
          <div className="sidebar__profile">
            <div
              className={`sidebar__avatar ${!isAdmin ? 'sidebar__avatar--clickable' : ''}`}
              onClick={() => { if (!isAdmin) navigate('/login'); }}
              title={!isAdmin ? 'Admin login' : ''}
            >
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Quill pen */}
                <path d="M8 24l3-3 2 2-3 3-2.5.5.5-2.5z" fill="#fff" opacity=".95"/>
                <path d="M11 21l8-8c1.5-1.5 3.5-3 5.5-3.5-.5 2-2 4-3.5 5.5l-8 8-2-2z" fill="#fff" opacity=".9"/>
                <path d="M13.5 19.5l5-5" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity=".3"/>
                {/* Code brackets */}
                <text x="7" y="13" fontFamily="monospace" fontSize="7" fontWeight="700" fill="#fff" opacity=".85">&lt;/&gt;</text>
              </svg>
            </div>
            <h2 className="sidebar__name">Paris</h2>
            <p className="sidebar__bio">
              Exploring deep learning, paper analysis, and code. Learning by writing.
            </p>
            <div className="sidebar__social">
              <a href="https://github.com/Harris404" target="_blank" rel="noopener noreferrer" title="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="/api/feed.xml" target="_blank" rel="noopener noreferrer" title="RSS Feed">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.37 20 6.18 20C5 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/></svg>
              </a>
            </div>
          </div>

          <nav className="sidebar__nav">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`sidebar__link ${location.pathname === link.path ? 'sidebar__link--active' : ''}`}
                {...(location.pathname === link.path ? { 'aria-current': 'page' } : {})}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="sidebar__footer">
            {isAdmin && (
              <button className="sidebar__logout" onClick={() => { logout(); navigate('/'); }}>
                Logout
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="main-content">
        {children}
        <footer className="footer">
          <p>© 2026 Paris · Built with passion for AI</p>
        </footer>
      </main>
    </div>
  );
}
