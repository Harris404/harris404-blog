import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <div style={{
      padding: '80px 40px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <Helmet>
        <title>404 — Page Not Found</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <h1 style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '4rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        marginBottom: '8px',
        lineHeight: 1,
      }}>
        404
      </h1>
      <p style={{
        fontSize: '1.1rem',
        color: 'var(--text-tertiary)',
        marginBottom: '32px',
        lineHeight: 1.6,
      }}>
        This page doesn't exist — it may have been moved or deleted.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-block',
          padding: '10px 24px',
          fontSize: '0.88rem',
          fontWeight: 600,
          color: 'white',
          background: 'var(--accent)',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => e.target.style.opacity = '0.85'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
