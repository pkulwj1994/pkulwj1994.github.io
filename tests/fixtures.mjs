import { cpSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { projectRoot } from '../scripts/build.mjs';
import { loadContent, visiblePapers, visibleNews } from '../src/content.mjs';

export function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'weijian-site-test-'));
  for (const folder of ['content', 'src', 'assets', 'examples']) {
    cpSync(path.join(projectRoot, folder), path.join(root, folder), { recursive: true });
  }
  const baseline = loadContent(root);
  return {
    root,
    baseline,
    counts: {
      papers: visiblePapers(baseline.papers).length,
      news: visibleNews(baseline).length,
      drafts: baseline.papers.filter(paper => paper.published === false).length,
      students: baseline.people.students.filter(person => person.visible !== false).length
    },
    read: name => readFileSync(path.join(root, name), 'utf8'),
    json: name => JSON.parse(readFileSync(path.join(root, name), 'utf8')),
    write(name, value) { writeFileSync(path.join(root, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); },
    clean() { rmSync(root, { recursive: true, force: true }); }
  };
}

export function newPaper(overrides = {}) {
  return {
    id: 'new-result-2027', published: true, year: 2027, date: '2027-01-15',
    title: 'A New Generative Result', authors: ['First Author', 'Weijian Luo'],
    status: 'Example Conference 2027', summary: 'A test-only research contribution.',
    links: [{ label: 'Paper', url: 'https://example.org/new-paper' }], featured: true,
    ...overrides
  };
}
