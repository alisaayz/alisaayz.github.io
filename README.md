# Alisa Zhu — Personal Website

A responsive Vue 3 website based on the supplied visual reference: a white canvas, blue accents, serif headline, numbered sidebar navigation, and an arch-shaped UCLA image.

## Local development

```sh
npm install
npm run dev
```

## Personalize

Edit `src/portfolio.js` for the name, profile tag, email, LinkedIn, GitHub, and paragraph beneath the About Me slogan. The sidebar keeps email and LinkedIn visible below the navigation.

Edit `src/resume.js` for the education, experience, and technical skills. Experience displays education and professional history. Skills displays the technical skill groups. View Resume opens `public/Alisa_Zhu_Resume.pdf`; Download PDF downloads that same file. Update both the PDF and resume data when revising the resume. Legacy `#resume` links open Experience.

Projects displays Coming... until real projects are available. The site has no Contact tab or hero call-to-action buttons.

The campus image is displayed from the supplied `src/assets/template-reference.png` using a CSS crop. Text and navigation are native HTML. Inter and Cormorant Garamond load from Google Fonts with local fallback fonts.

The palette follows the visitor's system light/dark setting, including changes made while the site is open. Email and LinkedIn remain in the sidebar; GitHub and the sidebar education line are omitted. Navigation supports hash links and browser back/forward, with responsive layouts and keyboard focus indicators.

## Production and hosting

```sh
npm run build
npm run preview
```

GitHub repository: https://github.com/alisaayz/alisaayz.github.io

Live site: https://alisaayz.github.io/

GitHub Pages uses the GitHub Actions source. The workflow in `.github/workflows/deploy.yml` builds with `--base=/` and publishes `dist/` on pushes to `main`.

Education logos are stored locally in `src/assets/logos/`. UCLA's white wordmark comes from https://www.ucla.edu/img/logo-ucla.svg and is displayed on a blue tile. Wake Forest's WF image comes from https://prod.wp.cdn.aws.wfu.edu/sites/544/2026/03/Brand_WF.webp (linked from its brand guide).
