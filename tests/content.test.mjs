import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent, validateContent, visiblePapers, selectedPapers, visibleNews, richText } from '../src/content.mjs';
import { check } from '../scripts/check.mjs';
import { addPaper } from '../scripts/add.mjs';
import { fixture, newPaper } from './fixtures.mjs';

test('all migrated academic records validate', () => {
  const f = fixture();
  try {
    const data = validateContent(loadContent(f.root), f.root);
    assert.equal(new Set(data.papers.map(paper => paper.id)).size, data.papers.length);
    assert.equal(new Set(data.news.map(record => record.id)).size, data.news.length);
    assert.deepEqual(check(f.root), { published: f.counts.papers, drafts: f.counts.drafts });
  } finally { f.clean(); }
});

test('paper scaffolding creates a draft and cannot overwrite existing content', () => {
  const f = fixture();
  try {
    addPaper(f.root, 'my-next-paper', new Date('2028-03-04T12:00:00Z'));
    const file = 'content/papers/my-next-paper.json';
    const paper = f.json(file);
    assert.equal(paper.id, 'my-next-paper');
    assert.equal(paper.published, false);
    assert.equal(paper.year, 2028);
    assert.equal(paper.date, '2028-03-04');
    const before = f.read(file);
    assert.throws(() => addPaper(f.root, 'my-next-paper'), /already exists/);
    assert.equal(f.read(file), before);
    assert.throws(() => addPaper(f.root, '../outside'), /lowercase ID/);
  } finally { f.clean(); }
});

test('malformed JSON reports the exact source file', () => {
  const f = fixture();
  try {
    f.write('content/papers/broken.json', '{ invalid json');
    assert.throws(() => loadContent(f.root), /content\/papers\/broken\.json/);
  } finally { f.clean(); }
});

test('invalid dates and filename mismatches are actionable validation errors', () => {
  const f = fixture();
  try {
    f.write('content/papers/wrong-name.json', newPaper({ date: '2027-02-30' }));
    assert.throws(() => validateContent(loadContent(f.root), f.root), error => {
      assert.match(error.message, /wrong-name\.json/);
      assert.match(error.message, /filename must match/);
      assert.match(error.message, /real YYYY-MM-DD/);
      return true;
    });
  } finally { f.clean(); }
});

test('missing assets and unsafe URLs are rejected before generation', () => {
  const f = fixture();
  try {
    f.write('content/papers/new-result-2027.json', newPaper({
      links: [{ label: 'Paper', url: 'javascript:alert(1)' }],
      cover: { kind: 'image', image: 'assets/papers/not-present.png', alt: 'Overview' }
    }));
    assert.throws(() => validateContent(loadContent(f.root), f.root), error => {
      assert.match(error.message, /links\[0\]\.url/);
      assert.match(error.message, /missing file/);
      return true;
    });
    assert.throws(() => richText('<img src=x onerror=alert(1)>', f.root), /unsupported HTML/);
    assert.throws(() => richText('<a href="javascript:alert(1)">link</a>', f.root), /https/);
  } finally { f.clean(); }
});

test('publication ordering supports optional priority and otherwise uses year and date', () => {
  const papers = [
    newPaper({ id: 'older', year: 2026, date: '2026-06-01' }),
    newPaper({ id: 'latest', year: 2027, date: '2027-02-01' }),
    newPaper({ id: 'priority', year: 2023, date: undefined, order: 0 }),
    newPaper({ id: 'draft', year: 2030, date: undefined, published: false })
  ];
  assert.deepEqual(visiblePapers(papers).map(paper => paper.id), ['priority', 'latest', 'older']);
});

test('paper announcements respect published state and join the dated news feed', () => {
  const published = newPaper({ news: { text: 'New paper available.' } });
  const draft = newPaper({ id: 'draft', published: false, news: { text: 'Do not show this.' } });
  const records = visibleNews({ papers: [published, draft], news: [{ id: 'old', date: '2026-01-01', text: 'Older update.' }] });
  assert.deepEqual(records.map(record => record.id), ['paper-new-result-2027', 'old']);
  assert.equal(records[0].url, 'https://example.org/new-paper');
});

test('featured work uses newest-first dates independently of bibliography priority', () => {
  const papers = [
    newPaper({ id: 'recent-feature', year: 2028, date: '2028-01-01' }),
    newPaper({ id: 'original-feature', year: 2020, date: undefined, order: 0 }),
    newPaper({ id: 'later-feature', year: 2028, date: '2028-11-01' }),
    newPaper({ id: 'year-only-feature', year: 2028, date: undefined }),
    newPaper({ id: 'hidden-feature', published: false }),
    newPaper({ id: 'unfeatured-work', year: 2030, date: '2030-01-01', featured: false }),
    newPaper({ id: 'new-feature', year: 2029, date: '2029-01-01' })
  ];
  assert.deepEqual(selectedPapers(papers, { limit: null }).map(paper => paper.id), ['new-feature', 'later-feature', 'recent-feature', 'year-only-feature', 'original-feature']);
  assert.deepEqual(selectedPapers(papers, { limit: 2 }).map(paper => paper.id), ['new-feature', 'later-feature']);
  assert.equal(visiblePapers(papers)[0].id, 'original-feature');
});
