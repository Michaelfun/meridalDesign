// Runs after `vite build`: writes sitemap.xml, robots.txt and a static HTML file per page
// with its own title, description, social tags and structured data, so crawlers and link previews see them.
import fs from 'fs'
import path from 'path'

const env = { ...process.env }
try {
  for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in env)) env[m[1]] = m[2]
  }
} catch { /* no .env */ }

const SITE = (env.VITE_SITE_URL || 'https://www.example.com').replace(/\/$/, '')
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const site = read('content/site.json')
const projects = fs.readdirSync('content/projects').filter((f) => f.endsWith('.json')).map((f) => read(`content/projects/${f}`)).sort((a, b) => a.order - b.order)
const template = fs.readFileSync('dist/index.html', 'utf8')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function render({ title, desc, url, image, type, ld, body }) {
  const tags = `<link rel="canonical" href="${url}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
  return template
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content=".*?" ?\/>/, `<meta name="description" content="${esc(desc)}" />`)
    .replace(/<meta property="og:title" content=".*?" ?\/>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta property="og:description" content=".*?" ?\/>/, `<meta property="og:description" content="${esc(desc)}" />`)
    .replace(/<meta property="og:type" content=".*?" ?\/>/, `<meta property="og:type" content="${type}" />`)
    .replace('</head>', `${tags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"></div>\n    <noscript>${body}</noscript>`)
}

const org = { '@context': 'https://schema.org', '@type': 'Organization', name: site.brand, url: SITE, email: site.email }
fs.writeFileSync('dist/index.html', render({
  title: template.match(/<title>(.*?)<\/title>/)[1], desc: template.match(/<meta name="description" content="(.*?)" ?\/>/)[1],
  url: `${SITE}/`, image: projects[0]?.img || '', type: 'website', ld: org,
  body: `<h1>${esc(site.brand)}</h1><p>Architecture, interiors and landscapes, designed and built by one team.</p>`,
}))

for (const p of projects) {
  const url = `${SITE}/projects/${p.slug}`
  const dir = `dist/projects/${p.slug}`
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), render({
    title: `${p.name} | ${site.brand}`, desc: p.blurb, url, image: p.img, type: 'article',
    ld: { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.name, description: p.blurb, image: p.img, dateCreated: String(p.year), locationCreated: p.place, url, creator: org },
    body: `<h1>${esc(p.name)}</h1><p>${esc(p.type)}, ${esc(p.place)}, ${p.year}</p>${String(p.body).split(/\n\s*\n/).map((t) => `<p>${esc(t)}</p>`).join('')}`,
  }))
}

const urls = ['/', ...projects.map((p) => `/projects/${p.slug}`)]
fs.writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`postbuild: ${urls.length} pages, sitemap and robots written for ${SITE}`)
