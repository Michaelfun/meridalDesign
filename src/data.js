// Content lives in /content (edited through the CMS at /admin). Images below are static site assets.
import site from '../content/site.json'

const files = import.meta.glob('../content/projects/*.json', { eager: true, import: 'default' })
const u = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`

export const BRAND = site.brand
export const EMAIL = site.email
export const PROJECTS = Object.values(files).sort((a, b) => a.order - b.order)
export const STATS = site.stats.map((s) => [s.value, s.label])
export const SERVICES = site.services.map((s) => [s.name, s.text])
export const PROCESS = site.process.map((s) => [s.name, s.text])
export const TESTIMONIALS = site.testimonials.map((t) => [t.quote, t.name, t.role, t.photo])
export const TEAM = site.team
export const FAQ = site.faq.map((f) => [f.q, f.a])

export const IMG = {
  services: u('1503387762-592deb58ef4e'), process: u('1531834685032-c34bf0d84c77', 1800), team: u('1487958449943-2429e8be8625', 1800),
  quotes: u('1600607687939-ce8a6c25118c'), faq: u('1493809842364-78817add7ffb'), contact: u('1480074568708-e7b720bb3f09'), footer: u('1431576901776-e539bd916ba2', 1800),
  mountains: u('1464822759023-fed622ff2c3b', 1800),
  about: u('1600585154340-be6161a56a0c'),
  cta: u('1518780664697-55e3ad937233', 400),
}
