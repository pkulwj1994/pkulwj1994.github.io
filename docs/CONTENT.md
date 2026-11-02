# 内容维护指南

日常维护只修改 `content/` 和 `assets/`。`src/` 保存模板、样式及渲染代码；
根目录 HTML、`apple.css`、`js/site.js` 和整个 `dist/` 都由构建生成。

## 中英文共用一套内容文件

构建同时生成 `index.html`、`publications.html`、`index.zh.html` 和
`publications.zh.html`。页面顶部可切换语言；切换首页语言时保留当前章节，
中文页的站内导航继续使用中文页面。所有页面均可直接双击打开，无需服务器。

需要翻译的文字使用：

```json
"title": {
  "en": "A New Generative Model",
  "zh": "一种新的生成式模型"
}
```

`summary`、`status`、动态的 `text` / `html`、人员的 `bioHtml` 及首页文案同理。
原来的普通字符串仍然有效，会在两种语言中共用。`en` 为非空英文内容，
`zh` 可省略或留空，届时中文版回退到英文。新增论文仍然只需要一个 JSON。

中文论文页显示中文标题及英文原标题。作者署名和 BibTeX 保留原始学术引用信息；
中英文关键词均能在两种语言的论文页中搜索。原有动态、报告与人员介绍均已附上中文。

`src/i18n.mjs` 管理导航辅助文字、搜索统计、空结果提示和播放按钮文案。
构建会校验两种语言，包括富文本中的链接和对应素材；任一语言出错都不会覆盖上次成品。

## 新增一篇论文

一篇论文对应 `content/papers/<id>.json`。没有集中登记表，也不需要修改 HTML、
论文数量或年份按钮。文件名须与 `id` 相同，使用小写英文、数字和短横线。

可以复制 `examples/paper.json`，或运行：

```sh
npm run add:paper -- my-paper-2026
```

命令会创建 `content/papers/my-paper-2026.json`，默认是隐藏草稿，且不会覆盖同名文件。
下面是字段示例；请将示例标题、作者、会议、日期和地址替换成真实信息：

```json
{
  "id": "my-paper-2026",
  "published": true,
  "year": 2026,
  "date": "2026-11-01",
  "title": "Your Paper Title",
  "authors": ["First Author", "Weijian Luo*", "Last Author"],
  "status": "Conference or journal name, 2026",
  "summary": "A short description of the contribution.",
  "links": [
    { "label": "Paper", "url": "https://example.org/paper" },
    { "label": "PDF", "url": "assets/papers/my-paper-2026.pdf" },
    { "label": "Code", "url": "https://github.com/YOUR_ACCOUNT/YOUR_REPO" }
  ],
  "featured": true,
  "cover": {
    "kind": "image",
    "image": "assets/papers/my-paper-2026.png",
    "alt": "Overview of the proposed method"
  },
  "bibtex": "@misc{mypaper2026,\n  title={Your Paper Title},\n  year={2026}\n}",
  "news": {
    "date": "2026-11-01",
    "text": "Our new paper is available."
  }
}
```

示例中填写了本地 PDF 和封面，因此还需要放入相应文件。不需要这些内容时，
删除对应的 PDF 链接和 `cover` 字段即可。

| 字段 | 作用 |
| --- | --- |
| `id` | 唯一标识，与 JSON 文件名一致 |
| `published` | `false` 是草稿；`true` 进入生成页面 |
| `year` | 必填数字，自动生成对应年份筛选选项 |
| `date` | 可选，真实的 `YYYY-MM-DD` 日期，年份须与 `year` 一致 |
| `title` | 论文标题，普通文字 |
| `authors` | 作者字符串数组；与网站姓名相同的作者自动加粗，保留 `*` |
| `status` | 会议、期刊或预印本状态，按填写的文字展示 |
| `summary` | 可选简介，同时用于首页精选和论文列表 |
| `links` | 可选链接数组；第一条作为标题链接，可加入 Paper、PDF、Code、Project 等 |
| `featured` | `true` 时加入首页精选，默认展示全部精选论文 |
| `featuredOrder` | 可选非负整数，只控制首页精选顺序，数字越小越靠前 |
| `cover` | 可选图片，支持 PNG、JPG、WebP、GIF、SVG |
| `bibtex` | 可选引用文本，自动生成原生展开面板 |
| `news` | 可选动态，由同一个论文文件加入首页动态；日期未填时使用论文的 `date` |
| `order` | 可选非负整数，数字越小越靠前 |

正常情况下按年份、完整日期从新到旧排列，同日或仅有年份时按 `id` 排序。
显式设置了 `order` 的论文优先排列，因此只在需要固定位置时使用。
首页精选优先按 `featuredOrder` 排列，未设置时沿用上述排序规则；此字段不影响完整论文列表。
`content/home.json` 中的 `selected.limit` 默认为 `null`，展示全部精选论文；也可改为正整数限制数量。
因此，后续只需在新论文 JSON 中设置 `featured: true`，无需调整首页数量或模板。

已有论文迁移时保留原文的信息，不补造未知日期或完整作者列表。
例如 `tdm-r1-2026.json` 来自原首页精选与动态，暂保留原文的 `Luo et al.` 缩写。

### 给论文添加动图

在同一个论文 JSON 中设置 `cover` 即可，首页精选与论文页会同步使用：

```json
"cover": {
  "kind": "image",
  "image": "assets/papers/my-paper-demo.gif",
  "poster": "assets/papers/my-paper-poster.png",
  "alt": "A description of the animated method or model output",
  "caption": "Method illustration · a short explanation"
}
```

把 GIF 和同尺寸的静态 PNG 放到对应路径。`poster` 用于暂停、打印和无 JavaScript
时的封面。页面中的动图默认在进入可视区域时播放，离开或切换到后台时暂停；
每张图可以独立播放/暂停。系统设置了“减少动态效果”时默认显示静态封面，仍可手动播放。

八篇精选论文已附带方法示意动图；图中形状用于解释流程，页面注明为方法示意。
其来源和可编辑生成脚本见 [动图说明](../assets/papers/DEMOS.md)。
普通网站构建不需要安装图像处理依赖。

动图也可以按语言选择素材，其他字段写法不变：

```json
"image": {
  "en": "assets/papers/my-paper-demo.gif",
  "zh": "assets/papers/my-paper-demo-zh.gif"
},
"poster": {
  "en": "assets/papers/my-paper-poster.png",
  "zh": "assets/papers/my-paper-poster-zh.png"
}
```

精选方法动图均已提供中文标签版本。`npm run demos` 会重新生成两种语言；
只生成中文可用 `npm run demos -- --zh`，只生成英文可用 `npm run demos -- --en`。
只生成某篇动图可用 `npm run demos -- --paper score-implicit-matching`，多个素材名称用逗号分隔。

## 预览、检查和构建

需要 Node.js 22 或更新版本，推荐与 `.nvmrc` / GitHub 构建一致的 Node.js 24。
项目没有 npm 第三方依赖，不需要运行 `npm install`。

```sh
npm run check
npm test
npm run build
open dist/index.html
```

构建同时更新根目录预览文件，因此原来的 `open index.html` 仍然可用。
中文版使用 `open index.zh.html`。GitHub Pages 的现有工作流会自动发布全部四个页面。
页面在构建时已经包含全部内容，不依赖浏览器 `fetch`、本地接口或运行中的服务器，
直接打开 HTML 时论文、搜索和年份筛选均可使用。

开发时可以使用自动构建和刷新的预览服务：

```sh
npm run dev
```

打开终端显示的 `http://127.0.0.1:4173/`。修改 `content/`、`src/` 或 `assets/`
会自动重新构建并刷新；Ctrl+C 停止。更换端口：

```sh
npm run dev -- --port 8000
```

非法 JSON、文件名和 ID 不一致、无效日期或缺少图片/PDF 都会指出具体文件及字段。
构建校验失败时保留上一次成功生成的页面。

## GitHub 上只添加文件即可发布

1. 首次在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
2. 添加 `content/papers/<id>.json` 和可选的 `assets/papers/` 附件。
3. 提交到 `main`，或合并 PR。

`.github/workflows/pages.yml` 会检查内容、运行测试、生成 `dist/` 并部署到 Pages。
PR 只运行检查和构建，不发布。无需上传手工修改的 HTML，也无需把 `dist/` 提交到 Git。
这里仅配置了工作流；仓库的 Pages 设置和首次部署须在对应 GitHub 仓库完成。

## 动态、报告和人员

- `content/news.json`：与论文无关的动态，每条含 `id`、`date`、`text` 或 `html`。
  可选 `url`、`displayDate`、`visible`；日期倒序、归档数量和年份范围自动计算。
- `content/talks.json`：报告列表，每条含 `id`、`html` 或 `text`，按数组顺序展示。
- `content/people.json`：`collaborators` 和 `students` 两组，按数组顺序展示。
  每人含 `id`、`name`、`bioHtml`，可选 `website`、`visible`；人数自动计算。
- `visible: false` 暂时隐藏动态、报告或人员。

`html` / `bioHtml` 是迁移原有学术内容时保留的有限富文本，允许 `strong`、`b`、
`em`、`br`、普通链接和 `span.gradient-text`。新增简单动态优先使用纯文字 `text`。
论文的标题、作者和简介使用普通文字，不要写 HTML。

## 个人信息与视觉样式

- `content/site.json`：姓名、站点地址、邮箱、微信、Scholar、GitHub、头像、导航和页脚。
- `content/home.json`：首页介绍、研究方向、教育、招聘说明、栏目文案和展示数量。
- `src/templates/`：首页和论文页的骨架。
- `src/render.mjs`：共享导航、页脚及各内容区块的渲染。
- `src/content.mjs`：读取、校验和排序。
- `src/i18n.mjs`：共用的双语字段解析、页面文件名和界面文案。
- `src/styles.css`：Apple 风格样式与移动端、打印布局。
- `src/client.js`：移动导航、论文搜索和筛选。
- `src/art/`：研究卡片的 SVG 图示。

历史 `_index.html`、`main.css`、`jemdoc.css` 和 `photos/` 保留供查阅；新页面使用
`assets/photos/` 中的头像和图标。它们不参与新站点构建。

目录划分与维护方式参考
[Polyadic Research](https://github.com/pkulwj1994/polyadic-research/tree/main)，
并保留当前个人主页的 Apple 风格设计。
