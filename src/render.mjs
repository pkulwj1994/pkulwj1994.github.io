import { readFileSync } from 'node:fs';
import path from 'node:path';
import { escapeHtml as e, visiblePapers, selectedPapers, visibleNews } from './content.mjs';
import { messages, htmlLanguage, pageName, formatMessage } from './i18n.mjs';

const icons = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M6 18 18 6M6 6h12v12"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${icons[name]}</svg>`;
const externalAttrs = url => /^https?:\/\//.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
const link = (url, label, className = '') => `<a${className ? ` class="${className}"` : ''} href="${e(url)}"${externalAttrs(url)}>${label}</a>`;

function template(root, name, fields) {
  return readFileSync(path.join(root, 'src/templates', `${name}.html`), 'utf8').replace(/{{([a-z]+)}}/g, (_, key) => {
    if (!(key in fields)) throw new Error(`src/templates/${name}.html: unknown placeholder {{${key}}}`);
    return fields[key];
  });
}

function head(site, publications = false, language = 'en') {
  const title = publications ? site.publicationTitle : site.title;
  const description = publications ? site.publicationDescription : site.description;
  const base = site.baseUrl.endsWith('/') ? site.baseUrl : site.baseUrl + '/';
  const page = publications ? 'publications' : 'index';
  const address = lang => new URL(page === 'index' && lang === 'en' ? './' : pageName(page, lang), base);
  const canonical = address(language);
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:type" content="website">
  <link rel="canonical" href="${e(canonical)}">
  <link rel="alternate" hreflang="en" href="${e(address('en'))}">
  <link rel="alternate" hreflang="zh-CN" href="${e(address('zh'))}">
  <link rel="alternate" hreflang="x-default" href="${e(address('en'))}">
  <link rel="icon" type="image/svg+xml" href="${e(site.favicon)}">
  <link rel="stylesheet" href="apple.css">
  <script src="js/site.js" defer></script>
</head>`;
}

function header(site, publications = false, language = 'en') {
  const nav = site.navigation;
  const ui = messages[language];
  const home = pageName('index', language), bibliography = pageName('publications', language);
  const prefix = publications ? home : '';
  const currentPage = publications ? 'publications' : 'index';
  return `<header class="site-header">
  <nav class="navigation container" aria-label="${e(ui.mainNavigation)}">
    <a class="wordmark" href="${home}" aria-label="${e(site.name)}, ${e(ui.home)}">${e(site.name)}<span>.</span></a>
    <button class="menu-toggle" type="button" aria-label="${e(ui.openNavigation)}" aria-controls="navigation-links" aria-expanded="false"><span class="menu-bars" aria-hidden="true"></span></button>
    <div class="nav-links" id="navigation-links">
      <a class="nav-link" href="${prefix}#about"${publications ? '' : ' aria-current="page"'}>${e(nav.about)}</a>
      <a class="nav-link" href="${prefix}#research">${e(nav.research)}</a>
      <a class="nav-link" href="${bibliography}"${publications ? ' aria-current="page"' : ''}>${e(nav.publications)}</a>
      <div class="language-switch" role="group" aria-label="${e(ui.languageNavigation)}">
        <a class="language-link" href="${pageName(currentPage, 'en')}" lang="en" hreflang="en"${language === 'en' ? ' aria-current="true"' : ''} aria-label="English">EN</a>
        <a class="language-link" href="${pageName(currentPage, 'zh')}" lang="zh-CN" hreflang="zh-CN"${language === 'zh' ? ' aria-current="true"' : ''} aria-label="中文">中文</a>
      </div>
      <a class="button nav-contact" href="mailto:${e(site.email)}">${e(nav.contact)} ${icon('external')}</a>
    </div>
  </nav>
</header>`;
}

function footer(site, language = 'en') {
  const ui = messages[language];
  return `<footer class="site-footer"><div class="container footer-inner">
  <p class="footer-name"><strong>${e(site.name)}, ${e(site.degree)}</strong> <span aria-hidden="true">&nbsp;·&nbsp;</span> ${e(site.footerTagline)}</p>
  <nav class="footer-links" aria-label="${e(ui.socials)}">
    ${link(site.scholar, e(ui.scholar) + ' ↗')}
    ${link(site.github, 'GitHub ↗')}
    ${link(`mailto:${site.email}`, e(ui.email) + ' ↗')}
  </nav>
</div></footer>`;
}

function hero(site, copy, language = 'en') {
  return `<section class="hero" aria-labelledby="hero-title"><div class="container">
  <div class="hero-grid"><div class="hero-copy">
    <p class="eyebrow">${e(copy.eyebrow)}</p>
    <h1 id="hero-title">${e(copy.heading || site.name)}</h1>
    <p class="hero-statement">${copy.statementHtml}</p>
    <p class="hero-description">${copy.descriptionHtml}</p>
    <div class="hero-actions"><a class="button" href="#research">${e(copy.primaryLabel)} ${icon('arrow')}</a>${link(site.scholar, e(copy.scholarLabel) + ' ' + icon('external'), 'text-link')}</div>
  </div><figure class="portrait-wrap">
    <img class="portrait" src="${e(site.portrait)}" width="400" height="400" alt="${e(copy.portraitAlt)}" fetchpriority="high" decoding="async">
    <figcaption class="portrait-caption"><div><strong>${e(copy.role)}</strong><span>${e(copy.affiliation)}</span></div><div class="location">${icon('pin')} ${e(copy.location)}</div></figcaption>
  </figure></div>
  <div class="affiliations" aria-label="${e(messages[language].researchEducation)}"><span class="affiliations-label">${e(copy.journeyLabel)}</span>
    ${copy.affiliations.map(item => link(item.url, e(item.label) + (item.detail ? ` <small>${e(item.detail)}</small>` : ''), 'affiliation')).join('\n')}
  </div>
</div></section>`;
}

function research(copy, root) {
  return `<section class="section section-gray" id="research" aria-labelledby="research-title"><div class="container">
  <p class="eyebrow">${e(copy.eyebrow)}</p><h2 class="section-title" id="research-title">${copy.titleHtml}</h2><p class="research-intro">${e(copy.intro)}</p>
  <div class="research-grid">${copy.topics.map(topic => `<article class="research-card research-card-${topic.tone}">
    <div class="eyebrow">${e(topic.eyebrow)}</div><h3>${topic.titleHtml}</h3>
    ${readFileSync(path.join(root, 'src/art', `${topic.id}.svg`), 'utf8')}
    <p>${e(topic.description)}</p></article>`).join('\n')}</div>
  <details class="research-detail" open><summary>${e(copy.detailLabel)}</summary><p>${copy.descriptionHtml}</p></details>
</div></section>`;
}

export function renderDemo(paper, compact = false, language = paper._language || 'en') {
  const ui = messages[language];
  const cover = paper.cover;
  if (!cover) return '';
  const animated = Boolean(cover.poster);
  const imageId = `demo-${compact ? 'publication' : 'featured'}-${paper.id}`;
  return `<figure class="paper-demo${compact ? ' publication-demo' : ''}"${animated ? ` data-paper-demo data-animation="${e(cover.image)}" data-poster="${e(cover.poster)}" data-paper-title="${e(paper.title)}"` : ''}>
    <div class="paper-demo-frame">
      ${animated ? `<picture><source media="print" srcset="${e(cover.poster)}">` : ''}<img class="paper-demo-image" id="${e(imageId)}" src="${e(cover.poster || cover.image)}" alt="${e(cover.alt)}" width="800" height="480" loading="lazy" decoding="async">${animated ? '</picture>' : ''}
      ${animated ? `<button class="demo-toggle" type="button" aria-controls="${e(imageId)}" aria-pressed="false" aria-label="${e(formatMessage(ui.playAnimation, { title: paper.title }))}" hidden>
        <svg class="demo-icon-play" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m6 3 11 7-11 7Z"/></svg>
        <svg class="demo-icon-pause" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="5" y="3" width="3" height="14" rx="1"/><rect x="12" y="3" width="3" height="14" rx="1"/></svg>
        <span data-demo-label>${e(ui.play)}</span>
      </button>` : ''}
    </div>
    ${cover.caption ? `<figcaption class="paper-demo-caption">${e(cover.caption)}</figcaption>` : ''}
  </figure>`;
}

export function renderSelected(papers, copy, language = 'en') {
  const ui = messages[language];
  const featured = selectedPapers(papers, copy);
  if (!featured.length) return '';
  return `<section class="section" id="selected-work" aria-labelledby="work-title"><div class="container">
  <div class="section-heading"><div><p class="eyebrow">${e(copy.eyebrow)}</p><h2 class="section-title" id="work-title">${e(copy.title)}</h2></div><a class="text-link" href="${pageName('publications', language)}">${e(copy.linkLabel)} ${icon('arrow')}</a></div>
  <div class="featured-list">${featured.map((paper, i) => {
    if (paper.cover) {
      return `<article class="featured-paper featured-paper-with-demo" data-paper-id="${e(paper.id)}">
        ${renderDemo(paper, false, language)}
        <div class="featured-paper-info"><span class="paper-tag${i === 0 ? ' paper-tag-blue' : ''}">${e(paper.status)}</span>
          <h3>${paper.links?.length ? link(paper.links[0].url, e(paper.title), 'featured-title-link') : e(paper.title)}</h3>
          ${language === 'zh' && paper._originalTitle !== paper.title ? `<p class="paper-original-title" lang="en">${e(paper._originalTitle)}</p>` : ''}
          ${paper.summary ? `<p>${e(paper.summary)}</p>` : ''}
          ${paper.links?.length ? link(paper.links[0].url, e(ui.readPaper) + ' ' + icon('external'), 'text-link featured-read-link') : ''}
        </div>
      </article>`;
    }
    const content = `<span class="paper-tag${i === 0 ? ' paper-tag-blue' : ''}">${e(paper.status)}</span>
      <div class="paper-copy"><h3>${e(paper.title)}</h3>${paper.summary ? `<p>${e(paper.summary)}</p>` : ''}</div>`;
    return paper.links?.length ? link(paper.links[0].url, content + `<span class="paper-arrow">${icon('external')}</span>`, 'featured-paper') : `<article class="featured-paper">${content}</article>`;
  }).join('\n')}</div>
</div></section>`;
}

function about(copy, language = 'en') {
  return `<section class="section section-gray" id="about" aria-labelledby="about-title"><div class="container">
  <div class="about-grid"><div><p class="eyebrow">${e(copy.eyebrow)}</p><h2 class="section-title" id="about-title">${copy.titleHtml}</h2></div><div class="biography"><p>${copy.biographyHtml}</p></div></div>
  <div class="education" aria-label="${e(messages[language].education)}">${copy.education.map(item => `<div><span>${e(item.degree)}</span><h3>${e(item.school)}</h3><p>${e(item.subject)}</p></div>`).join('\n')}</div>
</div></section>`;
}

function displayDate(date, language = 'en') {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: language === 'zh' ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'));
}

function newsSection(data) {
  const records = visibleNews(data), copy = data.home.news;
  const language = data._language || 'en', ui = messages[language];
  const render = news => `<li class="news-item"><time class="news-date" datetime="${e(news.date)}">${e(language === 'zh' ? displayDate(news.date, language) : news.displayDate || displayDate(news.date))}</time><div class="news-content">${news.html ?? e(news.text)}${news.url ? ' ' + link(news.url, e(ui.readMore) + ' ↗') : ''}</div></li>`;
  const older = records.slice(copy.latestCount);
  const years = [...new Set(older.map(news => news.date.slice(0, 4)))].sort();
  const period = years.length ? ` · ${years[0]}${years.length > 1 ? '–' + years.at(-1) : ''}` : '';
  return `<section class="section" id="news" aria-labelledby="news-title"><div class="container">
  <div class="section-heading"><div><p class="eyebrow">${e(copy.eyebrow)}</p><h2 class="section-title" id="news-title">${e(copy.title)}</h2></div><span class="eyebrow section-label">${e(copy.label)}</span></div>
  <ul class="news-list">${records.slice(0, copy.latestCount).map(render).join('\n')}</ul>
  ${older.length ? `<details class="archive" open><summary><span>${e(copy.archiveLabel)} <span class="archive-count">${e(formatMessage(ui.updates, { count: older.length }))}${period}</span></span></summary><ul class="news-list">${older.map(render).join('\n')}</ul></details>` : ''}
</div></section>`;
}

function talksSection(data) {
  const copy = data.home.talks;
  return `<section class="section section-gray" id="talks" aria-labelledby="talks-title"><div class="container">
  <div class="section-heading"><div><p class="eyebrow">${e(copy.eyebrow)}</p><h2 class="section-title" id="talks-title">${e(copy.title)}</h2></div></div>
  <ul class="talks-list">${data.talks.filter(item => item.visible !== false).map(item => `<li class="talk-item">${item.html ?? e(item.text)}</li>`).join('\n')}</ul>
</div></section>`;
}

function community(data) {
  const copy = data.home.community;
  const ui = messages[data._language || 'en'];
  const group = (key, label) => {
    const people = data.people[key].filter(person => person.visible !== false);
    return `<details class="archive people-group" open><summary><span>${e(label)} <span class="archive-count">${e(formatMessage(ui.people, { count: people.length }))}</span></span></summary>
      ${key === 'students' ? `<p class="service-copy">${e(copy.studentIntro)}</p>` : ''}
      <ul class="people-list">${people.map(person => `<li><strong>${person.website ? link(person.website, e(person.name)) : e(person.name)}</strong>, ${person.bioHtml}</li>`).join('\n')}</ul></details>`;
  };
  return `<section class="section" id="community" aria-labelledby="community-title"><div class="container">
  <p class="eyebrow">${e(copy.eyebrow)}</p><h2 class="section-title" id="community-title">${e(copy.title)}</h2><div class="service-copy"><p>${copy.serviceHtml}</p></div>
  ${group('collaborators', copy.collaboratorLabel)}${group('students', copy.studentLabel)}
</div></section>`;
}

function contact(site, copy, language = 'en') {
  return `<section class="contact-section" id="contact" aria-labelledby="contact-title"><div class="container">
  <div class="contact-card"><p class="eyebrow">${e(copy.eyebrow)}</p><h2 id="contact-title">${copy.titleHtml}</h2><p class="contact-description">${copy.descriptionHtml}</p>
    <div class="contact-actions"><a class="button" href="mailto:${e(site.email)}">${e(copy.buttonLabel)} ${icon('mail')}</a><a class="text-link" href="mailto:${e(site.email)}">${e(site.email)} ${icon('external')}</a>${site.wechat ? `<span class="contact-wechat"><span>${e(messages[language].wechat)}:</span> <strong dir="ltr">${e(site.wechat)}</strong></span>` : ''}</div>
  </div><blockquote class="quote">“${e(copy.quote)}”<cite>— ${e(copy.quoteAuthor)}</cite></blockquote>
</div></section>`;
}

export function renderPaper(paper, site, language = paper._language || 'en') {
  const authors = paper.authors.map(author => author.trim().replace(/\*+$/, '') === site.name ? `<b>${e(author)}</b>` : e(author)).join(', ');
  const title = paper.links?.length ? link(paper.links[0].url, e(paper.title)) : e(paper.title);
  return `<li class="publication-entry${paper.cover ? ' publication-with-cover' : ''}" data-year="${paper.year}" data-paper-id="${e(paper.id)}" data-search-text="${e(paper._searchText || '')}">
  <div class="publication-year">${paper.year}</div>
  ${paper.cover ? (paper.cover.poster ? renderDemo(paper, true, language) : `<img class="publication-cover" src="${e(paper.cover.image)}" alt="${e(paper.cover.alt)}" loading="lazy" decoding="async">`) : ''}
  <article><h2 class="publication-title">${title}</h2><p class="publication-authors">${authors}</p><p class="publication-venue">${e(paper.status)}</p>
  ${language === 'zh' && paper._originalTitle !== paper.title ? `<p class="paper-original-title" lang="en">${e(paper._originalTitle)}</p>` : ''}
  ${paper.summary ? `<p class="publication-summary">${e(paper.summary)}</p>` : ''}
  ${(paper.links || []).length > 1 ? `<div class="publication-links">${paper.links.map(item => link(item.url, e(item.label) + ' ↗')).join(' ')}</div>` : ''}
  ${paper.bibtex ? `<details class="publication-bibtex" open><summary>BibTeX</summary><pre><code>${e(paper.bibtex)}</code></pre></details>` : ''}
  </article>
</li>`;
}

export function renderPages(data, root) {
  const { site, home } = data;
  const language = data._language || 'en', ui = messages[language];
  const shared = { language: htmlLanguage(language), skip: e(ui.skip) };
  const index = template(root, 'index', {
    ...shared, head: head(site, false, language), header: header(site, false, language), footer: footer(site, language),
    announcement: `<div class="announcement">${e(home.announcement.text)} <a href="#research">${e(home.announcement.linkLabel)}&nbsp; ›</a></div>`,
    hero: hero(site, home.hero, language), research: research(home.research, root),
    selected: renderSelected(data.papers, home.selected, language), about: about(home.about, language), news: newsSection(data),
    talks: talksSection(data), community: community(data), contact: contact(site, home.contact, language)
  });
  const papers = visiblePapers(data.papers), copy = home.publications;
  const years = [...new Set(papers.map(paper => paper.year))].sort((a, b) => b - a);
  const filter = (value, label) => `<button class="filter-button" type="button" data-year-filter="${value}" aria-pressed="${value === 'all'}">${label}</button>`;
  const publications = template(root, 'publications', {
    ...shared, head: head(site, true, language), header: header(site, true, language), footer: footer(site, language),
    bibliography: e(ui.bibliography),
    empty: `<h2>${e(ui.emptyTitle)}</h2><p>${e(ui.emptyBody)}</p><button class="button" id="reset-filters" type="button">${e(ui.resetFilters)}</button>`,
    intro: `<section class="publications-hero container" aria-labelledby="publications-title"><p class="eyebrow">${e(copy.eyebrow)}</p><h1 id="publications-title">${copy.titleHtml}</h1><p class="publications-intro">${copy.introHtml}</p>${link(site.scholar, e(copy.scholarLabel) + ' ' + icon('external'), 'text-link publications-scholar')}</section>`,
    tools: `<div class="publication-tools" hidden><div class="publication-toolbar"><div class="filter-group" role="group" aria-label="${e(ui.filterYear)}">${filter('all', e(ui.allWork))}${years.map(year => filter(year, year)).join('')}</div><div class="search-field">${icon('search')}<label class="sr-only" for="publication-search">${e(ui.searchLabel)}</label><input id="publication-search" type="search" placeholder="${e(copy.searchPlaceholder)}" autocomplete="off" spellcheck="false" aria-controls="publication-list"></div></div></div>`,
    count: `<p class="results-count" id="results-count" role="status" aria-live="polite" aria-atomic="true">${e(formatMessage(papers.length === 1 ? ui.publication : ui.publications, { count: papers.length }))}</p>`,
    papers: papers.map(paper => renderPaper(paper, site, language)).join('\n'),
    note: `<p class="publication-note">${e(copy.footnote)} <a href="${pageName('index', language)}#research">${e(ui.exploreResearch)}&nbsp; ›</a></p>`
  });
  return { [pageName('index', language)]: index, [pageName('publications', language)]: publications };
}
