import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { build } from '../scripts/build.mjs';
import { resolveRequest } from '../scripts/dev.mjs';
import { fixture, newPaper } from './fixtures.mjs';

test('one new JSON updates bibliography, year filters, featured work, and news', () => {
  const f = fixture();
  try {
    f.write('content/papers/new-result-2027.json', newPaper({ news: { text: 'Our new result is available.' } }));
    const result = build(f.root);
    const index = f.read('dist/index.html'), papers = f.read('dist/publications.html');
    assert.equal(result.papers, f.counts.papers + 1);
    assert.equal(result.news, f.counts.news + 1);
    assert.match(papers, /data-year-filter="2027"/);
    assert.ok(papers.includes(`${f.counts.papers + 1} publications`));
    assert.match(papers, /A New Generative Result/);
    assert.match(index, /A New Generative Result/);
    assert.match(index, /Our new result is available/);
    assert.equal(f.read('index.html'), index);
    assert.equal(f.read('publications.html'), papers);
    assert.ok(existsSync(path.join(f.root, 'dist/assets/photos/head.jpg')));
    assert.ok(existsSync(path.join(f.root, 'dist/js/site.js')));
  } finally { f.clean(); }
});

test('draft papers and their announcements stay out of both static pages', () => {
  const f = fixture();
  try {
    f.write('content/papers/new-result-2027.json', newPaper({ published: false, news: { text: 'Draft announcement.' } }));
    const result = build(f.root);
    assert.equal(result.papers, f.counts.papers);
    assert.equal(result.news, f.counts.news);
    for (const name of ['index.html', 'publications.html']) {
      const html = f.read('dist/' + name);
      assert.doesNotMatch(html, /A New Generative Result|Draft announcement/);
      assert.doesNotMatch(html, /data-year-filter="2027"/);
    }
  } finally { f.clean(); }
});

test('invalid content preserves the previous successful output', () => {
  const f = fixture();
  try {
    build(f.root);
    const original = f.read('dist/index.html'), rootPreview = f.read('index.html');
    f.write('content/papers/broken.json', '{');
    assert.throws(() => build(f.root), /broken\.json/);
    assert.equal(f.read('dist/index.html'), original);
    assert.equal(f.read('index.html'), rootPreview);
  } finally { f.clean(); }
});

test('removed source assets do not remain in the release', () => {
  const f = fixture();
  try {
    f.write('assets/papers/unused.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>');
    build(f.root, { syncRoot: false });
    assert.ok(existsSync(path.join(f.root, 'dist/assets/papers/unused.svg')));
    unlinkSync(path.join(f.root, 'assets/papers/unused.svg'));
    build(f.root, { syncRoot: false });
    assert.equal(existsSync(path.join(f.root, 'dist/assets/papers/unused.svg')), false);
    assert.equal(existsSync(path.join(f.root, 'index.html')), false);
  } finally { f.clean(); }
});

test('optional cover, local PDF, code, and BibTeX render without HTML injection', () => {
  const f = fixture();
  try {
    f.write('assets/papers/overview.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>');
    f.write('assets/papers/paper.pdf', '%PDF-1.4\n');
    f.write('content/papers/new-result-2027.json', newPaper({
      title: 'A result & <em>literal markup</em>',
      links: [{ label: 'PDF', url: 'assets/papers/paper.pdf' }, { label: 'Code', url: 'https://example.org/code?a=1&b=2' }],
      cover: { kind: 'image', image: 'assets/papers/overview.svg', alt: 'Method overview' },
      bibtex: '@misc{result, title={<script>literal</script>}}'
    }));
    build(f.root);
    const html = f.read('dist/publications.html');
    assert.match(html, /publication-with-cover/);
    assert.match(html, /alt="Method overview"/);
    assert.match(html, /href="assets\/papers\/paper\.pdf"/);
    assert.match(html, /code\?a=1&amp;b=2/);
    assert.match(html, /&lt;em&gt;literal markup&lt;\/em&gt;/);
    assert.match(html, /&lt;script&gt;literal&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>literal/);
    assert.ok(existsSync(path.join(f.root, 'dist/assets/papers/paper.pdf')));
  } finally { f.clean(); }
});

test('the site can render with no papers or news', () => {
  const f = fixture();
  try {
    for (const file of readdirSync(path.join(f.root, 'content/papers'))) unlinkSync(path.join(f.root, 'content/papers', file));
    f.write('content/news.json', []);
    const result = build(f.root);
    assert.equal(result.papers, 0);
    assert.equal(result.news, 0);
    assert.match(f.read('dist/publications.html'), /0 publications/);
    assert.doesNotMatch(f.read('dist/index.html'), /id="selected-work"/);
  } finally { f.clean(); }
});

test('preview routing resolves pages and assets and keeps source files outside the web root', () => {
  const f = fixture();
  try {
    build(f.root);
    const dist = path.join(f.root, 'dist');
    assert.equal(resolveRequest(dist, '/').status, 200);
    assert.equal(resolveRequest(dist, '/publications.html?q=test').status, 200);
    assert.equal(resolveRequest(dist, '/assets/photos/head.jpg').status, 200);
    assert.equal(resolveRequest(dist, '/assets').status, 308);
    assert.equal(resolveRequest(dist, '/assets').location, '/assets/');
    assert.equal(resolveRequest(dist, '/missing').status, 404);
    assert.equal(resolveRequest(dist, '/%2e%2e%2fcontent/site.json').status, 404);
    assert.equal(resolveRequest(dist, '/content/site.json').status, 404);
  } finally { f.clean(); }
});
