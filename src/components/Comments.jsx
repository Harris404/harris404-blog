import { useEffect, useRef } from 'react';
import './Comments.css';

// giscus config (GitHub Discussions-backed comments)
const GISCUS = {
  repo: 'Harris404/harris404-blog',
  repoId: 'R_kgDORu_nAg',
  category: 'Announcements',
  categoryId: 'DIC_kwDORu_nAs4C-VZe',
};
const GISCUS_ORIGIN = 'https://giscus.app';

function siteTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/**
 * GitHub Discussions comments via giscus. Each article (mapped by pathname)
 * gets its own discussion thread. The widget theme follows the site's
 * light/dark toggle. Remount per article by passing a `key`.
 */
export default function Comments() {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    const attrs = {
      'data-repo': GISCUS.repo,
      'data-repo-id': GISCUS.repoId,
      'data-category': GISCUS.category,
      'data-category-id': GISCUS.categoryId,
      'data-mapping': 'pathname',
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': siteTheme(),
      'data-lang': 'zh-CN',
      'data-loading': 'lazy',
    };
    Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
    el.appendChild(script);

    // Keep the giscus iframe theme in sync with the site's theme toggle.
    const observer = new MutationObserver(() => {
      const frame = document.querySelector('iframe.giscus-frame');
      frame?.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: siteTheme() } } },
        GISCUS_ORIGIN
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      observer.disconnect();
      el.innerHTML = '';
    };
  }, []);

  return (
    <section className="comments">
      <h2 className="comments__title">Comments</h2>
      <div ref={containerRef} />
    </section>
  );
}
