# Selected-paper method animations

These original schematic illustrations explain the methods. They contain toy
shapes and distributions, rather than actual model-generated images or measured
benchmark results. Each GIF has 48 frames at 100 ms per frame, an infinite loop,
and an 800 × 480 static PNG poster.

Every demo now also has a Chinese-label version: `*-demo-zh.gif`,
`*-poster-zh.png`, and `*-poster-zh.svg`. Localized `cover` fields select the
correct artwork for each language without duplicating paper metadata.

- `tdm-r1-demo.gif`: deterministic few-step generation, non-differentiable reward,
  surrogate reward learning, and generator updates.
  [Paper](https://arxiv.org/html/2603.07700v1).
- `diff-instruct-plus-plus-demo.gif`: a one-step generator, human preference
  reward feedback, and a reference diffusion constraint.
  [Paper](https://arxiv.org/html/2410.18881v1).
- `diff-instruct-demo.gif`: a one-step generator guided by teacher and student
  scores at different noise levels.
  [Paper](https://proceedings.neurips.cc/paper_files/paper/2023/hash/f115f619b62833aadc5acb058975b0e6-Abstract-Conference.html).
- `score-implicit-matching-demo.gif`: data-free one-step distillation using an
  implicit score-divergence objective and its gradient feedback.
  [Paper](https://arxiv.org/abs/2410.16794).
- `didi-instruct-demo.gif`: discrete diffusion distillation through integral KL
  matching, a discriminator, and grouped reward updates.
  [Paper](https://proceedings.iclr.cc/paper_files/paper/2026/file/323880c576dc7cdcb1fcc7432447a3df-Paper-Conference.pdf).
- `consistency-models-demo.gif`: warm-start a consistency generator from a
  diffusion model and refine it through Easy Consistency Tuning.
  [Paper](https://proceedings.iclr.cc/paper_files/paper/2025/hash/bb166dd4de5dba363bf1023eb956a826-Abstract-Conference.html).
- `variational-schrodinger-demo.gif`: adaptive transport between data and a
  Gaussian reference using variational diffusion scores.
  [Paper](https://proceedings.mlr.press/v235/deng24c.html).
- `diffusion-distillation-survey-demo.gif`: a conceptual map of neural vector
  fields, implicit generators, and training-free accelerated samplers.
  [Paper](https://arxiv.org/abs/2304.04262).
- `langdit-demo.gif`: continuous language denoising with normalization, noise
  conditioning, a calibrated likelihood shortcut, and gated self-conditioning.
  [Paper](https://arxiv.org/abs/2610.22330).
- `generative-gap-demo.gif`: Markov and recurrent drafting heads compared with
  LangFlow under matched training budgets and shared metrics, without target-model
  verification. The diagram illustrates dependencies and refinement, without
  plotting experimental scores.
  [Paper](https://arxiv.org/abs/2610.40847).

The editable drawing source is `scripts/create-paper-demos.mjs`. Corresponding
`*-poster.svg` files retain vector versions of the poster frame.

To regenerate artwork only:

```sh
npm install --no-save --package-lock=false sharp@0.35.5
npm run demos
npm run build
```

The generator creates both languages by default. Use `npm run demos -- --zh`
or `npm run demos -- --en` to regenerate a single language.
Use `npm run demos -- --paper score-implicit-matching,didi-instruct` to regenerate
only the named artwork; this option can be combined with a language option.

Normal builds and GitHub Pages use the checked-in assets and do not need sharp.
