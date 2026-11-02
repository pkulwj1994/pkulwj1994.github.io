import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent, validateContent, visiblePapers } from '../src/content.mjs';
import { renderPages } from '../src/render.mjs';
import { projectRoot } from './build.mjs';
import { languages } from '../src/i18n.mjs';

export function check(root = projectRoot) {
  const data = validateContent(loadContent(root), root);
  for (const language of languages) {
    renderPages(language === 'en' ? data : validateContent(loadContent(root, language), root), root);
  }
  return { published: visiblePapers(data.papers).length, drafts: data.papers.filter(paper => paper.published === false).length };
}

if (typeof process !== 'undefined' && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = check();
    console.log(`English and Chinese content valid — ${result.published} published papers, ${result.drafts} drafts. Templates and assets are ready.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
