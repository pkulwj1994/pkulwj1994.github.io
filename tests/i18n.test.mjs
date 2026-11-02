import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';
import { localize, messages } from '../src/i18n.mjs';
import { loadContent, validateContent } from '../src/content.mjs';
import { build, clientSource, projectRoot } from '../scripts/build.mjs';
import { fixture, newPaper } from './fixtures.mjs';

test('a build emits English and Chinese pages with matching navigation and SEO', () => {
  const f = fixture();
  try {
    const result = build(f.root);
    assert.deepEqual(result.pages.sort(), ['index.html', 'index.zh.html', 'publications.html', 'publications.zh.html']);
    for (const page of ['index', 'publications']) {
      const english = f.read(`dist/${page}.html`), chinese = f.read(`dist/${page}.zh.html`);
      assert.match(english, /<html lang="en">/);
      assert.match(chinese, /<html lang="zh-CN">/);
      assert.match(chinese, /href="index\.zh\.html"/);
      assert.match(chinese, /href="publications\.zh\.html"/);
      assert.match(english, /hreflang="zh-CN"/);
      assert.match(chinese, /rel="canonical" href="https:\/\/pkulwj1994\.github\.io\/(?:index|publications)\.zh\.html"/);
      assert.equal(f.read(`${page}.zh.html`), chinese);
      assert.match(chinese, /展开导航/);
      assert.match(chinese, /class="language-link" href="[^" ]+\.zh\.html" lang="zh-CN" hreflang="zh-CN" aria-current="true"/);
    }
    const publications = f.read('dist/publications.zh.html');
    assert.ok(publications.includes(`${f.counts.papers} 篇论文`));
    assert.match(publications, /全部论文/);
    assert.match(publications, /没有找到匹配的论文/);
    assert.match(publications, /利用不可微奖励强化少步扩散模型/);
    assert.match(publications, /TDM-R1: Reinforcing Few-Step Diffusion Models/);
    const home = f.read('dist/index.zh.html');
    assert.match(home, /\d{4}年\d{1,2}月\d{1,2}日/);
    const archived = Math.max(0, f.counts.news - f.baseline.home.news.latestCount);
    if (archived) assert.ok(home.includes(`${archived} 条动态`));
    assert.ok(home.includes(`${f.counts.students} 人`));
    assert.match(home, /tdm-r1-demo-zh\.gif/);
  } finally { f.clean(); }
});

test('an English-only new paper appears in both languages using the same file', () => {
  const f = fixture();
  try {
    f.write('content/papers/new-result-2027.json', newPaper());
    build(f.root);
    for (const file of ['index.html', 'index.zh.html', 'publications.html', 'publications.zh.html']) {
      assert.match(f.read('dist/' + file), /A New Generative Result/);
    }
    assert.match(f.read('dist/publications.zh.html'), /data-year-filter="2027"/);
    assert.ok(f.read('dist/publications.zh.html').includes(`${f.counts.papers + 1} 篇论文`));
  } finally { f.clean(); }
});

test('both translations validate and a Chinese-only HTML error blocks generation', () => {
  const f = fixture();
  try {
    build(f.root);
    const previous = f.read('dist/index.zh.html');
    const home = f.json('content/home.json');
    home.hero.descriptionHtml.zh = '<script>alert(1)</script>';
    f.write('content/home.json', home);
    assert.throws(() => build(f.root), /home\.json\.hero\.descriptionHtml.*unsupported HTML/);
    assert.equal(f.read('dist/index.zh.html'), previous);
    assert.throws(() => localize({ en: 5, zh: '中文' }), /English string/);
    assert.equal(localize({ en: 'English', zh: '' }, 'zh'), 'English');
  } finally { f.clean(); }
});

test('all existing text and Chinese animation assets are available in both languages', () => {
  const english = loadContent(projectRoot);
  for (const language of ['en', 'zh']) {
    const data = validateContent(loadContent(projectRoot, language), projectRoot);
    assert.deepEqual(data.papers.map(paper => paper.id), english.papers.map(paper => paper.id));
    assert.deepEqual(data.news.map(record => record.id), english.news.map(record => record.id));
    assert.deepEqual(data.people.students.map(person => person.id), english.people.students.map(person => person.id));
    if (language === 'zh') {
      assert.ok(data.news.every(record => /[\u4e00-\u9fff]/.test(record.html)));
      assert.ok(data.talks.every(record => /[\u4e00-\u9fff]/.test(record.html)));
      for (const paper of data.papers.filter(paper => paper.featured)) {
        const gif = readFileSync(path.join(projectRoot, paper.cover.image));
        assert.equal(gif.subarray(0, 6).toString(), 'GIF89a');
        assert.ok(existsSync(path.join(projectRoot, paper.cover.poster)));
        assert.match(paper.cover.caption, /方法示意/);
      }
    }
  }
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.zh).sort());
});

test('the language switch preserves the current section without a backend', () => {
  let listener;
  const anchor = { hash: '', addEventListener(name, callback) { listener = callback; } };
  const document = {
    documentElement: { lang: 'en', classList: { add() {} } }, querySelector: () => null,
    querySelectorAll: selector => selector === '.language-link' ? [anchor] : []
  };
  vm.runInNewContext(clientSource(), { document, window: { location: { hash: '#selected-work' } } });
  listener();
  assert.equal(anchor.hash, '#selected-work');
});

test('Chinese search matches English aliases and Chinese keywords, and updates counts', () => {
  const events = () => ({ listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; } });
  const entries = [
    { textContent: '利用不可微奖励强化少步扩散模型', dataset: { year: '2026', searchText: 'TDM-R1 non-differentiable reward Weijian Luo' } },
    { textContent: '让一步图像生成更好地对齐人类偏好', dataset: { year: '2024', searchText: 'Diff-Instruct++ human preferences Weijian Luo' } }
  ];
  const list = { querySelectorAll: () => entries };
  const search = { ...events(), value: '', focus() {} }, count = {}, empty = {}, tools = {}, reset = events();
  const filters = ['all', '2026', '2024'].map(year => ({ ...events(), dataset: { yearFilter: year }, setAttribute() {} }));
  const selectors = { '#publication-list': list, '#publication-search': search, '#results-count': count, '#empty-results': empty, '#reset-filters': reset, '.publication-tools': tools };
  const document = {
    documentElement: { lang: 'zh-CN', classList: { add() {} } }, querySelector: selector => selectors[selector] || null,
    querySelectorAll: selector => selector === '[data-year-filter]' ? filters : []
  };
  vm.runInNewContext(clientSource(), { document, window: {} });
  assert.equal(count.textContent, '2 篇论文');
  search.value = 'NON-DIFFERENTIABLE'; search.listeners.input();
  assert.equal(count.textContent, '1 / 2 篇论文');
  assert.equal(entries[0].hidden, false);
  search.value = '人类偏好'; search.listeners.input();
  assert.equal(entries[1].hidden, false);
  assert.equal(entries[0].hidden, true);
  filters[1].listeners.click();
  assert.equal(count.textContent, '0 / 2 篇论文');
  assert.equal(empty.hidden, false);
  reset.listeners.click();
  assert.equal(count.textContent, '2 篇论文');
  assert.equal(search.value, '');
});
