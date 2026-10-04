# Alisa Zhu — Personal Portfolio

A responsive Vue 3 portfolio inspired by [codewithsadee’s vCard](https://github.com/codewithsadee/vcard-personal-portfolio): charcoal panels, gold accents, a profile sidebar, and five sections. The implementation and CSS illustrations are original to this project.

## Local development

```sh
npm install
npm run dev
```

## Personalize

Edit `src/portfolio.js` for the profile, biography, areas of interest, projects, and articles. Edit `src/resume.js` for the resume summary, contact information, education, professional experience, and technical skills. The Resume tab follows the site's timeline and tag styling, with View and Download buttons at the top linking to `public/Alisa_Zhu_Resume.pdf`. Update both the resume data and PDF when revising the resume. Projects and articles are clearly marked examples; replace them with real work before publishing.

The five sections support hash links and browser back/forward. Project filters and native detail dialogs work with keyboard navigation. The email links open a mail app addressed to alisa.ayz@gmail.com. The location links to UCLA Anderson’s directions for 110 Westwood Plaza, Los Angeles, CA 90095. The phone value is empty and its row stays hidden until a number is added. GitHub links and the profile URL copy button are also available. No email form or backend is configured.

The Light / Dark switch below the profile remembers the selected theme in local storage. Dark is the default; a saved choice is applied before the page paints. The control supports keyboard input and remains visible on mobile.

Poppins loads from Google Fonts with a sans-serif fallback. Project artwork is CSS, requiring no external images.

## Production

```sh
npm run build
npm run preview
```

## Deploy to GitHub Pages

A workflow is provided in `.github/workflows/deploy.yml`. It installs dependencies, builds the site, and publishes `dist/` on each push to `main`.

1. Open https://github.com/alisaayz/ayz.github.io/settings/pages.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Commit and push the site and workflow:

   ```sh
   git add .
   git commit -m "Build portfolio and configure GitHub Pages"
   git push origin main
   ```

4. Wait for **Deploy portfolio to GitHub Pages** in the repository’s Actions tab to finish.
5. Open https://alisaayz.github.io/ayz.github.io/.

The workflow builds with `--base=/ayz.github.io/` because this repository is a project site. Local development continues to use `/`. If you rename the repository to `alisaayz.github.io` to serve at the account root, change the workflow’s build base to `/`. Update it likewise if you add a custom domain.

The workflow has been prepared locally; it must be pushed and GitHub Pages must be enabled before the site is published.
