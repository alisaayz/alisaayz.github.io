# Alisa Zhu — Personal Website

A Vue portfolio with a paper-style layout, six sections, and a folded corner that opens an interactive isometric study. The page fold and object close-ups take inspiration from [Pin Chen's site](https://pinchen.me/).

## Local development

```sh
npm ci
npm run dev
npm run build
```

## Update the portfolio

- `src/portfolio.js`: profile and About Me copy.
- `src/projects.js`: selected projects and the skills linked to each one.
- `src/resume.js`: experience, education and skills. Update `public/Alisa_Zhu_Resume.pdf` separately. Old `#resume` links open Experience.
- `src/gallery.js`: photo captions and images shared by Beyond the Resume and the study corkboard.
- `src/App.vue`: section navigation and page layout. Appearance follows the system unless a visitor saves a light or dark override.

## Update the room

- `src/study.js`: ten book slots, object hit areas, cat paths and cat landing positions. Coordinates are percentages of the square room artwork.
- `src/components/StudyRoom.vue`: object close-ups and interactions. The monitor shows the most recent public project README, with a bundled copy of the portfolio risk project when GitHub is unavailable. The turntable opens a music picker. Add public SoundCloud track or playlist URLs to `recordCollection` in `src/study.js`. Mini golf is reserved for a future update.
- `src/assets/study/`: room artwork, front-facing props, cat poses and stride sheets, and the globe texture. The globe uses public-domain [Natural Earth II shaded relief](https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/).

Pushes to `main` build and publish through `.github/workflows/deploy.yml` at [alisaayz.github.io](https://alisaayz.github.io/).

The Education tab and room pennants use the [UCLA campus seal depiction](https://commons.wikimedia.org/wiki/File:The_University_of_California_UCLA.svg) and the [Wake Forest University shield](https://brand.wfu.edu/our-brand-identity/shield-logo/).
