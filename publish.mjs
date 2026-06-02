#!/usr/bin/env node
// Usage: pbpaste | node publish.mjs
// Or:   node publish.mjs < article.md
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { normalizeMarkdown } from './functions/api/_normalize.js';

let content = '';
const chunks = [];
process.stdin.setEncoding('utf-8');
process.stdin.on('data', d => chunks.push(d));
process.stdin.on('end', () => {
  content = chunks.join('');
  if (!content.trim()) { console.error('No content provided'); process.exit(1); }

  content = normalizeMarkdown(content); // auto-fix the </div>$$ + multi-line $$ pitfalls
  const escaped = content.replace(/'/g, "''");
  const id = 'infs7450-week-3-node-measures-i';
  const title = 'INFS7450 Week 3 — Node Measures (I)';
  const date = new Date().toISOString().split('T')[0];
  const tags = '["Graph Theory","Centrality","Social Network","Eigenvector"]';
  const summary = '社交网络中心性度量：入度、接近、调和、特征向量和Katz中心性';
  
  const sql = `INSERT OR REPLACE INTO articles (id, title, date, category, tags, summary, content) VALUES ('${id}', '${title}', '${date}', 'Knowledge', '${tags}', '${summary}', '${escaped}');`;
  
  writeFileSync('./_tmp_insert.sql', sql);
  console.log(`Content length: ${content.length} chars`);
  console.log('Inserting into D1...');
  
  try {
    const out = execSync('npx wrangler d1 execute blog-articles --remote --file=./_tmp_insert.sql', {
      encoding: 'utf-8', timeout: 60000, cwd: '.'
    });
    console.log('✅ Success!', out);
  } catch (e) {
    console.error('❌ Error:', e.stderr || e.message);
  } finally {
    try { unlinkSync('./_tmp_insert.sql'); } catch {}
  }
});
