/**
 * Original, deterministic method illustrations; these are not model samples.
 * Optional authoring tool: npm install --no-save --package-lock=false sharp@0.35.5
 * The website builds from checked-in GIF/PNG files and needs no image libraries.
 * Sources:
 * https://arxiv.org/html/2603.07700v1
 * https://arxiv.org/html/2410.18881v1
 * https://proceedings.neurips.cc/paper_files/paper/2023/hash/f115f619b62833aadc5acb058975b0e6-Abstract-Conference.html
 * https://arxiv.org/abs/2410.16794
 * https://proceedings.iclr.cc/paper_files/paper/2026/file/323880c576dc7cdcb1fcc7432447a3df-Paper-Conference.pdf
 * https://proceedings.iclr.cc/paper_files/paper/2025/hash/bb166dd4de5dba363bf1023eb956a826-Abstract-Conference.html
 * https://proceedings.mlr.press/v235/deng24c.html
 * https://arxiv.org/abs/2304.04262
 */
import { mkdirSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const WIDTH = 800, HEIGHT = 480, FRAMES = 48, DELAY = 100;
let language = 'en';
const chinese = {
  'METHOD ILLUSTRATION': '方法示意', 'LOOP / 04.8s': '循环 / 4.8 秒',
  'Learning from non-differentiable rewards.': '利用不可微奖励，改进少步生成模型。',
  'NOISE': '噪声', 'DETERMINISTIC FEW-STEP TRAJECTORY': '确定性少步生成轨迹', 'SAMPLE': '生成样本',
  'Discrete reward': '离散奖励', 'e.g. object count': '例如：物体数量',
  'Surrogate reward': '代理奖励', 'learn a smooth signal': '学习可微的奖励信号',
  'Generator update': '更新生成器', 'reinforce the model': '强化生成模型',
  'Generate → score → learn a surrogate → update.': '生成 → 评价 → 学习代理奖励 → 更新模型。',
  'One-step generation, aligned with human preferences.': '将一步生成，与人类偏好对齐。',
  'Reference diffusion': '参考扩散模型', 'integral KL constraint': '积分 KL 约束',
  'One-step model': '一步生成模型', 'one forward pass': '一次前向计算',
  'Reward model': '奖励模型', 'human preference': '人类偏好',
  'PREFERENCE FEEDBACK': '偏好反馈',
  'Reward guidance + a reference diffusion constraint.': '结合偏好奖励指导与参考扩散约束。',
  'Transfer diffusion knowledge into a one-step generator.': '将扩散模型的知识，迁移到一步生成器。',
  'Generator': '生成器', 'one-step sample': '一步生成样本', 'SAMPLES': '生成样本',
  'Add noise at t': '在时刻 t 加噪', 'multiple noise levels': '多个噪声水平',
  'Teacher score': '教师得分', 'pre-trained · frozen': '预训练 · 参数冻结',
  'Student score': '学生得分', 'learned on samples': '从生成样本学习',
  'Score difference': '得分之差', 'guide the generator': '指导生成器训练',
  'Distribution matching, without training images.': '通过分布匹配迁移知识，无需训练图像。',
  'Score Implicit Matching': '得分隐式匹配',
  'Distill a diffusion model without training images.': '无需训练图像，将扩散模型蒸馏为一步生成器。',
  'Diffusion teacher': '扩散教师模型', 'reference score': '参考得分',
  'One-step generator': '一步生成器', 'direct generation': '直接生成',
  'Implicit objective': '隐式匹配目标', 'score divergence': '得分散度',
  'IMPLICIT SCORE GRADIENT': '隐式得分梯度',
  'Optimize score divergences through tractable gradients.': '通过可计算的梯度，优化得分散度。',
  'DiDi-Instruct': 'DiDi-Instruct', 'Distill discrete diffusion for few-step language generation.': '蒸馏离散扩散模型，实现少步语言生成。',
  'discrete language model': '离散语言模型', 'MASKED SEQUENCE': '掩码序列', 'GENERATED TOKENS': '生成词元',
  'Few-step student': '少步学生模型', 'integral KL matching': '积分 KL 匹配',
  'Discriminator': '分布判别器', 'teacher / student samples': '教师与学生样本',
  'Student update': '更新学生模型', 'grouped reward signal': '分组归一化奖励',
  'Integral KL distillation with a learned reward signal.': '利用学习到的奖励信号，进行积分 KL 蒸馏。',
  'Consistency Models Made Easy': '简易一致性模型',
  'Fine-tune diffusion models into fast consistency generators.': '通过微调，将扩散模型转化为高效一致性生成器。',
  'Diffusion model': '扩散模型', 'warm-start initialization': '预训练初始化',
  'ECT tuning': 'ECT 微调', 'progressive consistency': '逐步增强一致性',
  'Consistency': '一致性模型', 'few-step sampler': '少步采样',
  'DIFFERENT NOISE LEVELS, THE SAME CLEAN ENDPOINT': '不同噪声水平，映射到相同的干净终点',
  'Easy Consistency Tuning reuses a pre-trained model.': '复用预训练模型，实现简易一致性微调。',
  'Variational Schrödinger Models': '变分薛定谔扩散模型',
  'Learn adaptive diffusion transport with variational scores.': '通过变分得分，学习自适应的扩散传输。',
  'DATA DISTRIBUTION': '数据分布', 'GAUSSIAN REFERENCE': '高斯参考分布',
  'Efficient transport': '高效分布传输', 'Variational scores': '变分得分',
  'adaptive multivariate diffusion': '自适应多变量扩散',
  'Adaptive transport and simulation-free score training.': '自适应传输与无需轨迹模拟的得分训练。',
  'Diffusion Distillation Survey': '扩散模型蒸馏综述',
  'A map of methods for transferring diffusion knowledge.': '梳理迁移扩散模型知识的方法。',
  'knowledge to transfer': '待迁移的知识', 'Neural vector fields': '神经向量场',
  'distill the dynamics': '蒸馏动态过程', 'Implicit generators': '隐式生成器',
  'stochastic / deterministic': '随机或确定性生成', 'Fast samplers': '快速采样器',
  'training-free acceleration': '无需训练的加速',
  'A conceptual taxonomy, rather than an experimental result.': '方法分类示意。'
};
const translate = value => language === 'zh' ? (chinese[value] ?? value) : value;
const ink = '#253247', muted = '#748296', line = '#cbd6e4';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const text = (x, y, label, { size = 20, color = ink, weight = 500, anchor = 'start', spacing = 0 } = {}) =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${spacing}">${escape(translate(label))}</text>`;
const rect = (x, y, width, height, fill = '#ffffff', stroke = line, radius = 16) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const circle = (x, y, radius, fill, opacity = 1) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" opacity="${opacity}"/>`;
const pathLine = (d, color = line, width = 2, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const random = n => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
const wave = (t, offset = 0) => .5 + .5 * Math.sin((t - offset) * Math.PI * 2);

function arrow(x1, y1, x2, y2, color = line) {
  const angle = Math.atan2(y2 - y1, x2 - x1), length = 7;
  return pathLine(`M${x1} ${y1}L${x2} ${y2}`, color) +
    pathLine(`M${x2 - length * Math.cos(angle - .55)} ${y2 - length * Math.sin(angle - .55)}L${x2} ${y2}L${x2 - length * Math.cos(angle + .55)} ${y2 - length * Math.sin(angle + .55)}`, color);
}

function signal(x1, y1, x2, y2, t, color, offset = 0) {
  const p = ((t + offset) % 1 + 1) % 1;
  const x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p;
  return circle(x, y, 10, color, .08) + circle(x, y, 4, color, .9);
}

function noise(x, y, width, height, color, t = 0, amount = 60) {
  return Array.from({ length: amount }, (_, i) => {
    const px = x + random(i + 3) * width, py = y + random(i + 191) * height;
    return circle(px, py, 1.5 + random(i + 24) * 2, color, .17 + .5 * wave(t, i / amount));
  }).join('');
}

function labelBox(x, y, width, title, subtitle, color, strength = 0) {
  return rect(x, y, width, 76, '#ffffff', strength > .65 ? color : line) +
    text(x + width / 2, y + 30, title, { size: 20, weight: 600, anchor: 'middle', color }) +
    text(x + width / 2, y + 54, subtitle, { size: 15, anchor: 'middle', color: muted });
}

function scene(x, y, width, height, color, t, kind = 'spheres') {
  let drawing = rect(x, y, width, height, '#ffffff', color, 17);
  drawing += `<ellipse cx="${x + width / 2}" cy="${y + height * .77}" rx="${width * .33}" ry="${height * .06}" fill="${color}" opacity=".1"/>`;
  if (kind === 'spheres') {
    for (let i = 0; i < 3; i++) {
      const px = x + width * (.28 + .22 * i), py = y + height * .51 + Math.sin(t * Math.PI * 2 + i * .8) * 3;
      drawing += circle(px, py, width * .105, color, .58 + .17 * i) + circle(px - 3, py - 4, width * .032, '#ffffff', .7);
    }
  } else {
    drawing += circle(x + width * .73, y + height * .29, height * .10, '#d4b0f0', .95);
    drawing += `<path d="M${x + 12} ${y + height * .74}L${x + width * .42} ${y + height * .32}L${x + width * .76} ${y + height * .74}Z" fill="${color}" opacity=".65"/>`;
    drawing += `<path d="M${x + width * .30} ${y + height * .74}L${x + width * .67} ${y + height * .43}L${x + width - 12} ${y + height * .74}Z" fill="${color}" opacity=".35"/>`;
  }
  return drawing;
}

function base(title, subtitle, background, accent, body, footer, t) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="800" height="480" fill="${background}"/>
  <g font-family="${language === 'zh' ? 'PingFang SC, Heiti SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif' : 'Helvetica Neue, Arial, sans-serif'}">
  ${text(34, 40, 'METHOD ILLUSTRATION', { size: 12, color: muted, weight: 600, spacing: 1.8 })}
  ${text(34, 84, title, { size: 34, weight: 650 })}
  ${text(34, 112, subtitle, { size: 17, color: muted })}
  ${circle(755, 38, 5, accent, .35 + .5 * wave(t))}
  ${body}
  ${pathLine('M34 426H766', line, 1)}
  ${text(34, 455, footer, { size: 15, color: muted })}
  ${text(766, 455, 'LOOP / 04.8s', { size: 12, color: muted, anchor: 'end', spacing: 1 })}
  </g></svg>`;
}

function tdm(t) {
  const blue = '#287ce1';
  let body = text(36, 158, 'NOISE', { size: 13, color: muted, spacing: 1 }) +
    rect(36, 180, 104, 111, '#ffffff', line) + noise(49, 194, 78, 80, blue, t);
  const positions = [210, 301, 392, 483];
  body += text(210, 158, 'DETERMINISTIC FEW-STEP TRAJECTORY', { size: 13, color: muted, spacing: 1 });
  body += arrow(148, 235, 198, 235) + signal(149, 235, 197, 235, t, blue);
  for (let i = 0; i < positions.length; i++) {
    const x = positions[i], active = wave(t, i * .14);
    body += rect(x, 207, 61, 57, active > .65 ? '#d8e9ff' : '#ffffff', active > .65 ? blue : line, 14) +
      text(x + 30, 243, String(i + 1), { size: 24, color: blue, anchor: 'middle', weight: 600 });
    if (i < 3) body += arrow(x + 66, 235, x + 83, 235) + signal(x + 65, 235, x + 84, 235, t, blue, -i * .2);
  }
  body += arrow(551, 235, 591, 235) + signal(552, 235, 590, 235, t, blue, .25);
  body += scene(606, 180, 154, 111, blue, t) + text(683, 158, 'SAMPLE', { size: 13, color: muted, anchor: 'middle', spacing: 1 });
  body += labelBox(570, 325, 190, 'Discrete reward', 'e.g. object count', blue, wave(t, .45));
  body += labelBox(296, 325, 216, 'Surrogate reward', 'learn a smooth signal', blue, wave(t, .65));
  body += labelBox(36, 325, 202, 'Generator update', 'reinforce the model', blue, wave(t, .85));
  body += arrow(683, 295, 683, 317) + signal(683, 295, 683, 317, t, blue, .4);
  body += arrow(561, 363, 521, 363) + signal(561, 363, 521, 363, t, blue, .6);
  body += arrow(287, 363, 247, 363) + signal(287, 363, 247, 363, t, blue, .8);
  body += pathLine('M136 317V306Q136 302 144 302H240V273', blue, 1.7, 'stroke-dasharray="4 5"');
  return base('TDM-R1', 'Learning from non-differentiable rewards.', '#edf4ff', blue, body, 'Generate → score → learn a surrogate → update.', t);
}

function preference(t) {
  const purple = '#885cc3';
  let body = labelBox(276, 145, 248, 'Reference diffusion', 'integral KL constraint', purple, wave(t, .3));
  body += rect(36, 259, 103, 98, '#ffffff', line) + noise(49, 273, 77, 70, purple, t);
  body += text(87, 247, 'NOISE', { size: 13, color: muted, anchor: 'middle', spacing: 1 });
  body += labelBox(201, 270, 186, 'One-step model', 'one forward pass', purple, wave(t));
  body += arrow(145, 309, 190, 309) + signal(145, 309, 190, 309, t, purple);
  body += scene(442, 257, 128, 102, purple, t, 'landscape');
  body += arrow(394, 309, 432, 309) + signal(394, 309, 432, 309, t, purple, .16);
  body += labelBox(620, 270, 145, 'Reward model', 'human preference', purple, wave(t, .5));
  body += arrow(579, 309, 610, 309) + signal(579, 309, 610, 309, t, purple, .36);
  body += pathLine('M690 354V385H295V354', purple, 1.8);
  body += arrow(295, 373, 295, 354, purple) + signal(679, 385, 306, 385, t, purple, .55);
  body += text(489, 409, 'PREFERENCE FEEDBACK', { size: 12, color: purple, anchor: 'middle', spacing: 1.6 });
  // The reference constraint also supervises the generator; it is not another sampling step.
  body += pathLine('M276 183H244Q230 183 230 197V257', purple, 1.5, 'stroke-dasharray="4 5"');
  body += text(506, 244, 'SAMPLE', { size: 13, color: muted, anchor: 'middle', spacing: 1 });
  return base('Diff-Instruct++', 'One-step generation, aligned with human preferences.', '#f3eff9', purple, body, 'Reward guidance + a reference diffusion constraint.', t);
}

function distillation(t) {
  const teal = '#208e88';
  let body = rect(35, 214, 100, 106, '#ffffff', line) + noise(48, 228, 74, 78, teal, t);
  body += text(85, 201, 'NOISE', { size: 13, color: muted, anchor: 'middle', spacing: 1 });
  body += labelBox(187, 229, 172, 'Generator', 'one-step sample', teal, wave(t));
  body += arrow(143, 266, 176, 266) + signal(143, 266, 176, 266, t, teal);
  body += rect(410, 212, 125, 108, '#ffffff', line);
  // A toy distribution, not a reproduced experiment or a generated model image.
  for (let i = 0; i < 32; i++) {
    const angle = random(i + 77) * Math.PI * 2, radius = Math.sqrt(random(i + 131)) * 35;
    body += circle(472 + Math.cos(angle) * radius, 266 + Math.sin(angle) * radius * .75, 2.7, teal, .35 + .45 * wave(t, i / 32));
  }
  body += text(472, 200, 'SAMPLES', { size: 13, color: muted, anchor: 'middle', spacing: 1 });
  body += arrow(367, 266, 399, 266) + signal(367, 266, 399, 266, t, teal, .16);
  body += rect(587, 232, 169, 68, '#ffffff', line, 14) +
    text(671, 260, 'Add noise at t', { size: 19, color: teal, anchor: 'middle', weight: 600 }) +
    text(671, 283, 'multiple noise levels', { size: 14, color: muted, anchor: 'middle' });
  body += arrow(543, 266, 576, 266) + signal(543, 266, 576, 266, t, teal, .32);
  body += labelBox(561, 128, 214, 'Teacher score', 'pre-trained · frozen', teal, wave(t, .4));
  body += labelBox(561, 333, 214, 'Student score', 'learned on samples', teal, wave(t, .6));
  body += arrow(672, 224, 672, 210, teal) + arrow(672, 307, 672, 326, teal);
  body += pathLine('M552 165H548V323H439V326', teal, 1.5, 'stroke-dasharray="4 5"') + arrow(439, 326, 439, 332, teal);
  body += arrow(552, 371, 513, 371, teal) + signal(551, 371, 512, 371, t, teal, .55);
  body += labelBox(365, 333, 148, 'Score difference', 'guide the generator', teal, wave(t, .75));
  body += pathLine('M358 371H271V312', teal, 1.8) + arrow(271, 327, 271, 312, teal);
  body += signal(350, 371, 279, 371, t, teal, .75);
  return base('Diff-Instruct', 'Transfer diffusion knowledge into a one-step generator.', '#edf6f4', teal, body, 'Distribution matching, without training images.', t);
}

function implicitMatching(t) {
  const color = '#6274c2';
  let body = labelBox(285, 132, 250, 'Diffusion teacher', 'reference score', color, wave(t, .3));
  body += text(82, 224, 'NOISE', { size: 13, color: muted, anchor: 'middle', spacing: 1 });
  body += rect(36, 238, 92, 102) + noise(47, 251, 70, 76, color, t);
  body += labelBox(180, 251, 194, 'One-step generator', 'direct generation', color, wave(t));
  body += scene(422, 239, 116, 102, color, t, 'landscape');
  body += text(480, 224, 'SAMPLE', { size: 13, color: muted, anchor: 'middle', spacing: 1 });
  body += labelBox(590, 251, 176, 'Implicit objective', 'score divergence', color, wave(t, .5));
  for (const [a, b, phase] of [[137, 170, 0], [383, 412, .2], [547, 580, .4]]) {
    body += arrow(a, 290, b, 290) + signal(a, 290, b, 290, t, color, phase);
  }
  body += pathLine('M543 170H678V242', color, 1.6, 'stroke-dasharray="4 5"') + arrow(678, 231, 678, 243, color);
  body += pathLine('M678 335V380H278V335', color, 1.7) + arrow(278, 350, 278, 335, color);
  body += signal(666, 380, 290, 380, t, color, .6);
  body += text(480, 408, 'IMPLICIT SCORE GRADIENT', { size: 12, color, anchor: 'middle', spacing: 1.2 });
  return base('Score Implicit Matching', 'Distill a diffusion model without training images.', '#f0f2fb', color, body, 'Optimize score divergences through tractable gradients.', t);
}

function discreteLanguage(t) {
  const color = '#b67e36';
  let body = labelBox(275, 141, 250, 'Diffusion teacher', 'discrete language model', color, wave(t, .3));
  body += text(36, 244, 'MASKED SEQUENCE', { size: 12, color: muted, spacing: 1 });
  body += text(536, 244, 'GENERATED TOKENS', { size: 12, color: muted, spacing: 1 });
  for (let i = 0; i < 5; i++) {
    const x = 36 + i * 36;
    body += rect(x, 267, 30, 38, '#ffffff', line, 8) + text(x + 15, 291, 'M', { size: 14, anchor: 'middle', color: muted });
  }
  body += labelBox(264, 253, 220, 'Few-step student', 'integral KL matching', color, wave(t));
  const words = ['the', 'model', 'writes', 'in', 'steps'];
  for (let i = 0; i < words.length; i++) {
    const x = 535 + i * 46;
    body += rect(x, 267, 41, 38, wave(t, .2) > .6 ? '#fae2b9' : '#ffffff', color, 8) + text(x + 20, 291, words[i], { size: 12, anchor: 'middle', color });
  }
  body += arrow(218, 288, 254, 288) + signal(219, 288, 253, 288, t, color);
  body += arrow(493, 288, 525, 288) + signal(494, 288, 524, 288, t, color, .2);
  body += arrow(374, 225, 374, 245, color) + signal(374, 225, 374, 245, t, color, .2);
  body += labelBox(526, 337, 240, 'Discriminator', 'teacher / student samples', color, wave(t, .5));
  body += labelBox(36, 337, 244, 'Student update', 'grouped reward signal', color, wave(t, .75));
  body += arrow(647, 311, 647, 329, color);
  body += arrow(517, 375, 289, 375, color) + signal(515, 375, 291, 375, t, color, .5);
  body += pathLine('M157 337V318H254', color, 1.6, 'stroke-dasharray="4 5"') + arrow(254, 318, 264, 318, color);
  return base('DiDi-Instruct', 'Distill discrete diffusion for few-step language generation.', '#fbf5eb', color, body, 'Integral KL distillation with a learned reward signal.', t);
}

function consistency(t) {
  const color = '#bc7569';
  let body = labelBox(36, 151, 230, 'Diffusion model', 'warm-start initialization', color, wave(t));
  body += labelBox(328, 151, 218, 'ECT tuning', 'progressive consistency', color, wave(t, .25));
  body += labelBox(608, 151, 158, 'Consistency', 'few-step sampler', color, wave(t, .5));
  body += arrow(276, 189, 318, 189) + signal(277, 189, 317, 189, t, color);
  body += arrow(556, 189, 598, 189) + signal(557, 189, 597, 189, t, color, .25);
  body += text(36, 269, 'DIFFERENT NOISE LEVELS, THE SAME CLEAN ENDPOINT', { size: 12, color: muted, spacing: .7 });
  for (const [i, x] of [94, 279, 464].entries()) {
    body += circle(x, 335, 20, color, .13) + circle(x, 335, 6, color, .6 + .3 * wave(t, i * .2));
    body += text(x, 383, `t${i + 1}`, { size: 18, color, anchor: 'middle' });
  }
  body += pathLine('M115 320Q390 260 683 318', color, 1.5);
  body += pathLine('M301 335H681', color, 1.5);
  body += pathLine('M486 350Q594 400 684 351', color, 1.5);
  const upperProgress = t % 1, lowerProgress = (t + .4) % 1;
  const quadratic = (start, control, end, p) => (1 - p) ** 2 * start + 2 * (1 - p) * p * control + p ** 2 * end;
  body += circle(quadratic(115, 390, 683, upperProgress), quadratic(320, 260, 318, upperProgress), 3, color, .9);
  body += signal(315, 335, 667, 335, t, color, .2);
  body += circle(quadratic(486, 594, 684, lowerProgress), quadratic(350, 400, 351, lowerProgress), 3, color, .9);
  body += circle(718, 335, 31, '#ffffff') + `<circle cx="718" cy="335" r="31" fill="none" stroke="${color}"/>`;
  body += text(718, 342, 'x₀', { size: 25, color, anchor: 'middle', weight: 600 });
  return base('Consistency Models Made Easy', 'Fine-tune diffusion models into fast consistency generators.', '#fbf1ee', color, body, 'Easy Consistency Tuning reuses a pre-trained model.', t);
}

function schrodinger(t) {
  const color = '#318b95';
  let body = text(36, 158, 'DATA DISTRIBUTION', { size: 12, color: muted, spacing: .7 });
  body += text(620, 158, 'GAUSSIAN REFERENCE', { size: 11, color: muted, spacing: .5 });
  body += rect(36, 179, 142, 158) + rect(623, 179, 142, 158);
  for (let i = 0; i < 35; i++) {
    const angle = random(i + 41) * Math.PI * 2, r = Math.sqrt(random(i + 101));
    body += circle(107 + Math.cos(angle) * r * 25 + Math.sin(angle) * r * 14, 258 + Math.sin(angle) * r * 56, 2.3, color, .5);
    body += circle(694 + Math.cos(angle) * r * 46, 258 + Math.sin(angle) * r * 46, 2.3, color, .5);
  }
  for (let i = 0; i < 12; i++) {
    const left = 213 + i * 8, right = 216 + i * 7.5;
    body += pathLine(`M187 ${left}C320 ${left - 25} 480 ${right + 25} 614 ${right}`, color, 1, 'opacity=".2"');
    const p = (t + i / 12) % 1, q = 1 - p;
    const x = q ** 3 * 187 + 3 * q ** 2 * p * 320 + 3 * q * p ** 2 * 480 + p ** 3 * 614;
    const y = q ** 3 * left + 3 * q ** 2 * p * (left - 25) + 3 * q * p ** 2 * (right + 25) + p ** 3 * right;
    body += circle(x, y, 3, color, .65);
  }
  body += text(400, 183, 'Efficient transport', { size: 18, color, anchor: 'middle', weight: 600 });
  body += labelBox(250, 336, 300, 'Variational scores', 'adaptive multivariate diffusion', color, wave(t, .3));
  return base('Variational Schrödinger Models', 'Learn adaptive diffusion transport with variational scores.', '#edf7f7', color, body, 'Adaptive transport and simulation-free score training.', t);
}

function survey(t) {
  const color = '#64748c';
  let body = labelBox(36, 238, 205, 'Diffusion model', 'knowledge to transfer', color, wave(t));
  const branches = [
    [143, 'Neural vector fields', 'distill the dynamics'],
    [241, 'Implicit generators', 'stochastic / deterministic'],
    [339, 'Fast samplers', 'training-free acceleration']
  ];
  for (let i = 0; i < branches.length; i++) {
    const [y, title, subtitle] = branches[i];
    body += labelBox(367, y, 398, title, subtitle, color, wave(t, i / 3));
    body += pathLine(`M250 276H306V${y + 38}H355`, color, 1.5);
    body += arrow(345, y + 38, 357, y + 38, color) + signal(314, y + 38, 354, y + 38, t, color, i / 3);
  }
  return base('Diffusion Distillation Survey', 'A map of methods for transferring diffusion knowledge.', '#f1f3f7', color, body, 'A conceptual taxonomy, rather than an experimental result.', t);
}

const demos = [
  { id: 'tdm-r1', draw: tdm },
  { id: 'diff-instruct-plus-plus', draw: preference },
  { id: 'diff-instruct', draw: distillation },
  { id: 'score-implicit-matching', draw: implicitMatching },
  { id: 'didi-instruct', draw: discreteLanguage },
  { id: 'consistency-models', draw: consistency },
  { id: 'variational-schrodinger', draw: schrodinger },
  { id: 'diffusion-distillation-survey', draw: survey }
];

async function main() {
  let sharp;
  try { sharp = (await import(process.env.PAPER_DEMO_SHARP_MODULE || 'sharp')).default; }
  catch { throw new Error('Only artwork regeneration needs sharp. Install it with: npm install --no-save --package-lock=false sharp@0.35.5'); }
  sharp.concurrency(2);
  const out = path.join(root, 'assets/papers'); mkdirSync(out, { recursive: true });
  const selectedLanguages = process.argv.includes('--zh') ? ['zh'] : process.argv.includes('--en') ? ['en'] : ['en', 'zh'];
  const filterIndex = process.argv.indexOf('--paper');
  const requested = filterIndex < 0 ? null : (process.argv[filterIndex + 1] || '').split(',');
  if (requested?.some(id => !demos.some(demo => demo.id === id))) throw new Error('Unknown demo ID after --paper. Use one or more comma-separated demo IDs.');
  const selectedDemos = requested ? demos.filter(demo => requested.includes(demo.id)) : demos;
  for (const selectedLanguage of selectedLanguages) {
    language = selectedLanguage;
    const suffix = language === 'zh' ? '-zh' : '';
    for (const demo of selectedDemos) {
    const frames = [];
    for (let i = 0; i < FRAMES; i++) {
      frames.push(await sharp(Buffer.from(demo.draw(i / FRAMES))).ensureAlpha().raw().toBuffer());
    }
    const target = path.join(out, `${demo.id}-demo${suffix}.gif`);
    await sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * FRAMES, channels: 4, pageHeight: HEIGHT } })
      .gif({ loop: 0, delay: Array(FRAMES).fill(DELAY), colours: 128, dither: 0, effort: 7 }).toFile(target);
    const poster = demo.draw(.32);
    await sharp(Buffer.from(poster)).png().toFile(path.join(out, `${demo.id}-poster${suffix}.png`));
    writeFileSync(path.join(out, `${demo.id}-poster${suffix}.svg`), poster + '\n');
    const metadata = await sharp(target, { animated: true }).metadata();
    if (metadata.pages !== FRAMES || metadata.loop !== 0 || metadata.delay?.length !== FRAMES || !metadata.delay.every(delay => delay === DELAY)) {
      throw new Error(`${demo.id}: invalid animation timing or frame metadata`);
    }
    console.log(`${demo.id}${suffix}: ${metadata.pages} frames, ${(FRAMES * DELAY / 1000).toFixed(1)}s loop, ${Math.round(statSync(target).size / 1024)} KiB`);
    }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
