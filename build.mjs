// Static site builder: wraps src/pages/*.html in the shared layout and writes dist/.
// Usage: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { icons } from './src/icons.mjs';

const SITE_URL = 'https://www.credzenta.com'; // TODO: confirm production domain before launch
const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SRC = join(ROOT, 'src', 'pages');
const OUT = join(ROOT, 'dist');

const nav = [
  { key: 'platform', href: 'platform.html', label: 'Platform' },
  { key: 'technology', href: 'technology.html', label: 'Technology' },
  { key: 'use-cases', href: 'use-cases.html', label: 'Use Cases' },
  { key: 'about', href: 'about.html', label: 'About' },
];

const icon = (name, cls = '') => {
  const body = icons[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
};

function parse(file) {
  const raw = readFileSync(join(SRC, file), 'utf8');
  const m = raw.match(/^<!--([\s\S]*?)-->/);
  const meta = {};
  if (m) for (const line of m[1].trim().split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  const body = (m ? raw.slice(m[0].length) : raw).replace(/\{\{icon:([a-z0-9-]+)(?:\s+([a-z0-9- ]+))?\}\}/g, (_, n, c) => icon(n, c || ''));
  return { meta, body };
}

const header = (active) => `
<a class="skip-link" href="#main">Skip to content</a>
<div class="scroll-progress" aria-hidden="true"></div>
<header class="site-nav" id="site-nav">
  <div class="container nav-inner">
    <a class="brand" href="index.html" aria-label="CredZenta home">
      <img class="logo-light" src="assets/img/logo-horizontal-light.png" alt="CredZenta — Faster loans. Clearer decisions." width="455" height="153">
      <img class="logo-dark" src="assets/img/logo-horizontal-dark.png" alt="" width="516" height="170" aria-hidden="true">
    </a>
    <nav class="nav-links" aria-label="Primary">
      ${nav.map(n => `<a href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n      ')}
    </nav>
    <div class="nav-actions">
      <button class="theme-toggle" type="button" aria-label="Toggle dark mode">${icon('sun', 'sun')}${icon('moon', 'moon')}</button>
      <a class="btn btn-primary btn-sm nav-cta" href="contact.html">Book a Demo</a>
      <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
    </div>
  </div>
  <div class="mobile-menu" id="mobile-menu">
    <div class="container">
      ${nav.map(n => `<a href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}${icon('arrow-right')}</a>`).join('\n      ')}
      <a class="btn btn-primary" href="contact.html">Book a Demo</a>
    </div>
  </div>
</header>`;

const footer = `
<footer class="site-footer">
  <div class="footer-glow" aria-hidden="true"></div>
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <img src="assets/img/logo-horizontal-dark.png" alt="CredZenta — Faster loans. Clearer decisions." width="516" height="170" loading="lazy">
        <p>AI-powered credit appraisal and decision support for India's lenders.</p>
        <div class="footer-social">
          <!-- TODO: confirm before launch — official LinkedIn page URL -->
          <a href="https://www.linkedin.com/company/credzenta" target="_blank" rel="noopener" aria-label="CredZenta on LinkedIn">${icon('linkedin')}</a>
          <a href="mailto:sakshamservices2025@gmail.com" aria-label="Email CredZenta">${icon('mail')}</a>
        </div>
      </div>
      <div class="footer-cols">
        <div><h3>Product</h3><a href="platform.html">Platform</a><a href="technology.html">Technology</a><a href="use-cases.html">Use Cases</a><a href="technology.html#security">Security</a></div>
        <div><h3>Company</h3><a href="about.html">About</a><a href="contact.html">Contact</a><a href="about.html#join">Careers</a></div>
        <div><h3>Legal</h3><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Use</a><a href="responsible-ai.html">Responsible AI</a></div>
      </div>
    </div>
    <p class="footer-disclaimer">CredZenta is a decision-support tool. All credit decisions remain with the lending institution.</p>
    <div class="footer-bottom">
      <span>© 2026 CredZenta. All rights reserved. · Built in India.</span>
      <a href="contact.html" class="link-arrow">Book a Demo ${icon('arrow-right')}</a>
    </div>
  </div>
</footer>`;

function layout({ meta, body }, file) {
  const url = `${SITE_URL}/${file === 'index.html' ? '' : file}`;
  const jsonLd = meta.nav === 'home' ? `
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Organization', name: 'CredZenta', url: SITE_URL,
    logo: `${SITE_URL}/assets/img/logo-circle.png`, foundingDate: '2026',
    description: 'AI-powered credit appraisal and decision-support platform for banks, NBFCs and fintech lenders.',
    email: 'sakshamservices2025@gmail.com', address: { '@type': 'PostalAddress', addressCountry: 'IN' },
  })}</script>` : '';
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#071232">
<meta property="og:type" content="website">
<meta property="og:site_name" content="CredZenta">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_URL}/assets/img/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${SITE_URL}/assets/img/og-image.png">
<link rel="icon" type="image/png" href="assets/img/favicon.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<script>try{var t=localStorage.getItem('cz-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>${jsonLd}
</head>
<body class="page-${meta.nav || 'other'}">
${header(meta.nav)}
<main id="main">
${body.trim()}
</main>
${footer}
<script src="assets/js/main.js" defer></script>
</body>
</html>
`;
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });

const pages = readdirSync(SRC).filter(f => f.endsWith('.html'));
for (const f of pages) writeFileSync(join(OUT, f), layout(parse(f), f));

const indexable = pages.filter(f => !['404.html'].includes(f));
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(f => `  <url><loc>${SITE_URL}/${f === 'index.html' ? '' : f}</loc></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages → dist/`);
