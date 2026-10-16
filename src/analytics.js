const PLAUSIBLE = import.meta.env.VITE_PLAUSIBLE_DOMAIN
export const GA_ID = import.meta.env.VITE_GA_ID

const add = (src, attrs = {}) => {
  const s = document.createElement('script')
  s.async = true; s.src = src
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v))
  document.head.appendChild(s)
}

let started = false
export function initAnalytics() {
  if (started || !import.meta.env.PROD) return // no tracking during development
  started = true
  if (PLAUSIBLE) add('https://plausible.io/js/script.js', { 'data-domain': PLAUSIBLE, defer: '' }) // tracks route changes itself
}

let gaLoaded = false
export function loadGA() {
  if (!GA_ID || gaLoaded || !import.meta.env.PROD) return
  gaLoaded = true
  window.dataLayer = window.dataLayer || []
  window.gtag = function () { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID, { send_page_view: false })
  add(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`)
  pageview(location.pathname + location.hash)
}

export const pageview = (path) => window.gtag?.('event', 'page_view', { page_path: path })
export const track = (name, props = {}) => { window.plausible?.(name, { props }); window.gtag?.('event', name, props) }
