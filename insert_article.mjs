import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const content = readFileSync('./article_content.md', 'utf-8');
const escaped = content.replace(/'/g, "''");

const sql = `INSERT OR REPLACE INTO articles (id, title, date, category, tags, summary, content) VALUES ('infs7450-week-3-node-measures-i', 'INFS7450 Week 3 — Node Measures (I)', '${new Date().toISOString().split('T')[0]}', 'Knowledge', '["Graph Theory","Centrality","Social Network","Eigenvector"]', '社交网络中心性度量：入度、接近、调和、特征向量和Katz中心性', '${escaped}');`;

// Write SQL to temp file to avoid shell escaping issues
import { writeFileSync } from 'fs';
writeFileSync('./insert_article.sql', sql);

try {
  const result = execSync(
    'npx wrangler d1 execute blog-articles --remote --file=./insert_article.sql',
    { cwd: '.', encoding: 'utf-8', timeout: 30000 }
  );
  console.log('Success:', result);
} catch (e) {
  console.error('Error:', e.stderr || e.message);
}
