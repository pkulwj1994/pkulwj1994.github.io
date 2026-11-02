export const languages = ['en', 'zh'];
export const htmlLanguage = language => language === 'zh' ? 'zh-CN' : 'en';
export const pageName = (page = 'index', language = 'en') => `${page}${language === 'zh' ? '.zh' : ''}.html`;

export const messages = {
  en: {
    skip: 'Skip to content', mainNavigation: 'Main navigation', languageNavigation: 'Language',
    home: 'home', openNavigation: 'Open navigation', closeNavigation: 'Close navigation',
    socials: 'Social links', scholar: 'Google Scholar', email: 'Email', wechat: 'WeChat',
    researchEducation: 'Research and education', education: 'Education', readPaper: 'Read paper', readMore: 'Read more',
    updates: '{count} updates', people: '{count} people',
    bibliography: 'Selected publication bibliography', filterYear: 'Filter publications by year', allWork: 'All work',
    searchLabel: 'Search publications by title, author, or venue',
    emptyTitle: 'No matching publications.', emptyBody: 'Try another keyword or choose a different year.', resetFilters: 'Clear filters',
    publication: '{count} publication', publications: '{count} publications', filteredPublications: '{count} publications of {total}',
    filteredPublication: '{count} publication of {total}', exploreResearch: 'Explore the research',
    play: 'Play', pause: 'Pause', playAnimation: 'Play animation for {title}', pauseAnimation: 'Pause animation for {title}'
  },
  zh: {
    skip: '跳转到正文', mainNavigation: '主导航', languageNavigation: '语言',
    home: '首页', openNavigation: '展开导航', closeNavigation: '收起导航',
    socials: '学术与社交链接', scholar: 'Google 学术', email: '邮箱', wechat: '微信',
    researchEducation: '研究与教育经历', education: '教育经历', readPaper: '阅读论文', readMore: '了解更多',
    updates: '{count} 条动态', people: '{count} 人',
    bibliography: '论文列表', filterYear: '按发表年份筛选', allWork: '全部论文',
    searchLabel: '按中英文标题、作者或会议期刊搜索论文',
    emptyTitle: '没有找到匹配的论文', emptyBody: '试试其他关键词，或选择不同的年份。', resetFilters: '清除筛选',
    publication: '{count} 篇论文', publications: '{count} 篇论文', filteredPublications: '{count} / {total} 篇论文',
    filteredPublication: '{count} / {total} 篇论文', exploreResearch: '探索研究方向',
    play: '播放', pause: '暂停', playAnimation: '播放《{title}》的方法动图', pauseAnimation: '暂停《{title}》的方法动图'
  }
};

export function formatMessage(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

export function localize(value, language = 'en', location = 'content') {
  if (!languages.includes(language)) throw new Error(`Unsupported language: ${language}`);
  if (Array.isArray(value)) return value.map((item, index) => localize(item, language, item?._file || `${location}[${index}]`));
  if (!value || typeof value !== 'object') return value;
  if ('en' in value || 'zh' in value) {
    if (typeof value.en !== 'string' || !value.en.trim() ||
        (value.zh !== undefined && typeof value.zh !== 'string') ||
        Object.keys(value).some(key => !languages.includes(key))) {
      throw new Error(`${location}: use a nonempty English string and an optional Chinese string: {"en":"…","zh":"…"}`);
    }
    return value[language]?.trim() ? value[language] : value.en;
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, localize(child, language, `${location}.${key}`)]));
}

function allText(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(allText);
  if (value && typeof value === 'object') return Object.values(value).flatMap(allText);
  return [];
}

export function localizeContent(raw, language = 'en') {
  const data = localize(raw, language);
  data._language = language;
  data.papers.forEach((paper, index) => {
    const source = raw.papers[index];
    paper._language = language;
    paper._originalTitle = localize(source.title, 'en', `${source._file}.title`);
    paper._searchText = [source.title, source.authors, source.summary, source.status].flatMap(allText).join(' ');
  });
  return data;
}
