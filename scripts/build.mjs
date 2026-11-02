import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, validateContent, visiblePapers, visibleNews } from '../src/content.mjs';
import { renderPages } from '../src/render.mjs';
import { languages, messages } from '../src/i18n.mjs';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function clientSource(root = projectRoot) {
  return '/* Generated from src/client.js and src/i18n.mjs. Run npm run build. */\n' +
    `const SITE_MESSAGES = ${JSON.stringify(messages).replaceAll('<', '\\u003c')};\n` +
    readFileSync(path.join(root, 'src/client.js'), 'utf8');
}

function writeAtomic(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file + '.tmp', value);
  renameSync(file + '.tmp', file);
}

export function build(root = projectRoot, { syncRoot = true } = {}) {
  // Validate and render before touching a previous successful build.
  const data = validateContent(loadContent(root), root);
  const pages = {};
  for (const language of languages) {
    const translated = language === 'en' ? data : validateContent(loadContent(root, language), root);
    Object.assign(pages, renderPages(translated, root));
  }
  const styles = '/* Generated from src/styles.css. Run npm run build. */\n' + readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  const client = clientSource(root);
  const staging = mkdtempSync(path.join(root, '.site-build-'));
  const dist = path.join(root, 'dist');
  try {
    cpSync(path.join(root, 'assets'), path.join(staging, 'assets'), { recursive: true });
    mkdirSync(path.join(staging, 'js'));
    for (const [name, html] of Object.entries(pages)) writeFileSync(path.join(staging, name), html);
    writeFileSync(path.join(staging, 'apple.css'), styles);
    writeFileSync(path.join(staging, 'js/site.js'), client);
    writeFileSync(path.join(staging, '.nojekyll'), '');
    // dist/ contains generated files only; replacing it also removes stale assets.
    rmSync(dist, { recursive: true, force: true });
    renameSync(staging, dist);
    if (syncRoot) {
      for (const [name, html] of Object.entries(pages)) writeAtomic(path.join(root, name), html);
      writeAtomic(path.join(root, 'apple.css'), styles);
      writeAtomic(path.join(root, 'js/site.js'), client);
    }
  } finally {
    if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
  }
  return { papers: visiblePapers(data.papers).length, news: visibleNews(data).length, pages: Object.keys(pages), output: dist };
}

if (typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = build();
    console.log(`Built ${result.pages.length} English/Chinese pages in dist/ and root previews — ${result.papers} papers, ${result.news} updates.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
