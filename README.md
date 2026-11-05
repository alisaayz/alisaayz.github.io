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
- `src/resume.js`: experience, education and skills. Update `public/Alisa_Zhu_Resume.pdf` separately. Old `#resume` links open Experience.
- `src/gallery.js`: photo captions and images shared by Beyond the Resume and the study corkboard.
- `src/App.vue`: section navigation and Projects content. Appearance follows the system unless a visitor saves a light or dark override.

## Update the room

- `src/study.js`: ten book slots, object hit areas, cat paths and cat landing positions. Coordinates are percentages of the square room artwork.
- `src/components/StudyRoom.vue`: object close-ups and interactions. The monitor opens Projects. The turntable, golf bag and bookshelf can be inspected; music and mini golf are reserved for future updates.
- `src/assets/study/`: room artwork, cat poses and the globe texture. The globe's land outlines are from [Natural Earth](https://www.naturalearthdata.com/), public domain.

Pushes to `main` build and publish through `.github/workflows/deploy.yml` at [alisaayz.github.io](https://alisaayz.github.io/).
