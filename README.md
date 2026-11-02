# Weijian Luo — Academic Website

Apple 风格的个人学术主页。采用与
[Polyadic Research](https://github.com/pkulwj1994/polyadic-research/tree/main)
相似的文件结构：内容、模板、素材与构建产物分离，一篇论文一个 JSON 文件。

支持完整中英文版本，顶部 **EN / 中文** 切换：

- 英文首页：`index.html`；中文首页：`index.zh.html`。
- 英文论文页：`publications.html`；中文论文页：`publications.zh.html`。

正文、导航、动态、搜索提示、播放控件和方法动图均有中文版本。
中文论文保留英文原标题，方便检索与引用；两种语言均可搜索中英文关键词。

## 新增论文

复制 `examples/paper.json` 到 `content/papers/<id>.json`，或运行：

```sh
npm run add:paper -- my-paper-2026
```

填写标题、作者、年份、会议和链接，将 `published` 设为 `true`。
可选封面和 PDF 放入 `assets/papers/`。

新增文件会自动进入论文列表、数量统计、搜索和对应年份筛选；
`featured: true` 加入首页精选，填写 `news` 可同时发布首页动态。
无需再编辑 HTML 或年份按钮。

完整字段、实例与维护方法见 [内容维护指南](docs/CONTENT.md)。
文字可使用 `{"en":"English", "zh":"中文"}`；普通字符串两种语言共用，
暂缺中文时回退到英文，不增加另一份论文文件。

## 本地使用

需要 Node.js 22+；`.nvmrc` 和 GitHub Actions 使用 Node.js 24。无第三方 npm 依赖。

```sh
npm run check
npm test
npm run build
open dist/index.html
```

中文版可直接打开 `dist/index.zh.html` 或根目录的 `index.zh.html`。

构建也会更新根目录 HTML，原来的 `open index.html` 仍可直接预览。
开发时运行 `npm run dev`，打开 `http://127.0.0.1:4173/`，保存内容后自动构建、刷新。

## 目录

```text
content/
  papers/*.json       一篇论文一个文件
  site.json           个人信息、联系方式、导航
  home.json           首页文案、研究方向、教育
  news.json           动态
  talks.json          报告
  people.json         合作者和学生
assets/
  papers/             论文图片、PDF 等附件
  photos/             头像和站点图标
src/
  templates/          页面骨架
  art/                研究方向 SVG
  content.mjs         内容读取、校验和排序
  render.mjs          页面渲染
  i18n.mjs            双语文字解析、页面路径与界面文案
  styles.css          Apple 风格设计
  client.js           浏览器交互
scripts/              新增、检查、构建和开发预览
examples/paper.json   新论文模板
tests/                内容与构建测试
dist/                 可独立发布的静态网站，自动生成
```

日常维护 `content/` 和 `assets/`；调整设计时修改 `src/`。
根目录 HTML、`apple.css`、`js/site.js` 均是兼容直接预览的生成文件。

## GitHub Pages

已配置 `.github/workflows/pages.yml`。首次在仓库 **Settings → Pages → Source**
选择 **GitHub Actions**，以后提交论文 JSON 和附件到 `main` 即可自动检查、构建和部署。
PR 仅检查，不部署。无需提交 `dist/`。

本仓库的设置入口：
[GitHub Pages 设置](https://github.com/pkulwj1994/pkulwj1994.github.io/settings/pages)。
使用现有的 **Build and deploy academic website** 工作流，它会用 Node.js 24 检查内容、
运行测试、构建四个中英文页面，并将 `dist/` 发布到 Pages。

如果当前目录是下载或复制得到的、还没有 `.git`，首次在该目录运行：

```sh
cd /Users/luoweijian/Documents/htmls/pkulwj1994.github.io
git init -b main
git remote add origin https://github.com/pkulwj1994/pkulwj1994.github.io.git
git fetch origin main
git reset --mixed origin/main
```

`git reset --mixed origin/main` 会将当前分支接到远端已有的提交历史，保留工作目录中的
全部网站文件。用 `git status --short` 检查差异，其中 `D` 表示准备删除的文件；
需要保留的历史附件应先补回，再重新暂存。然后查看并提交此次更新：

```sh
git add .
git --no-pager diff --cached --stat
git commit -m "Publish bilingual academic website"
git push -u origin main
```

在 [Actions](https://github.com/pkulwj1994/pkulwj1994.github.io/actions/workflows/pages.yml)
确认 `build` 和 `deploy` 均成功后，访问：

- 英文首页：[pkulwj1994.github.io](https://pkulwj1994.github.io/)
- 中文首页：[pkulwj1994.github.io/index.zh.html](https://pkulwj1994.github.io/index.zh.html)

后续在同一目录修改内容后，运行 `git add .`、`git commit -m "Update website content"`
和 `git push` 即可自动更新线上网站。
