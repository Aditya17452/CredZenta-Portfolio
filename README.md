# CredZenta — Marketing Website

Static, fast, SEO-friendly website for CredZenta (AI credit appraisal for banks, NBFCs & fintech lenders).
No framework, no dependencies — just HTML, CSS and vanilla JS, assembled by a tiny Node build script.

## Structure

```
src/pages/*.html     Page content (edit copy here). Header comment holds title/description/nav.
src/icons.mjs        Line icons, used in pages as {{icon:name}}
assets/css/style.css Design tokens (logo colours), layout, animations, light/dark theme
assets/js/main.js    Interactions: AI credit-memo animation, neural canvas, tabs, FAQ, demo form
assets/img/          Logo variants (light/dark horizontal, mark, circle emblem, mono, app icon, OG image)
build.mjs            Wraps every page in the shared header/footer + SEO meta → dist/
dist/                Generated site (deploy this folder)
```

## Build & preview

```bash
node build.mjs
```

```bash
python -m http.server 5173 -d dist
```

Then open http://localhost:5173. Re-run `node build.mjs` after every edit.

## Demo form → email

The "Book a Demo" form posts to [FormSubmit](https://formsubmit.co) and every request is emailed to
**sakshamservices2025@gmail.com** as a formatted table (name, work email, phone, institution, type, role,
volume, lending focus, message). The reply-to is set to the requester's email, so you can just hit Reply.

**One-time activation:** the very first submission from the live site triggers an "Activate Form" email
to sakshamservices2025@gmail.com. Click the link once; after that every request arrives automatically.
Until activation, the form shows an error with a direct mailto fallback.

Spam protection: hidden honeypot field, client-side validation, and a 30-second resubmit cooldown.

## Deploy

Any static host works. Netlify (`netlify.toml` included): connect the repo — it runs `node build.mjs`
and publishes `dist/`. Or drag the `dist/` folder into Netlify Drop / upload it to any host.

Before launch, go through `TODO-LAUNCH.md`.
