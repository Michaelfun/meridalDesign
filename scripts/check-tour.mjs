// Dev check for the camera tour: finds places where the camera passes through walls, furniture or the
// ceiling, and stretches where the view is filled by a wall. Run: npm run check:tour
import { WALLS, wallParts, ITEMS, ROOF_PIECES, T } from '../src/house.js'
import { KEYS, sample, P_TOUR, PMAX } from '../src/tour.js'

const R = 0.24 // camera clearance
const walls = [], other = []
for (const w of WALLS) {
  const { horiz, c, parts } = wallParts(w)
  for (const q of parts.filter((x) => !x.o)) {
    walls.push({ n: 'wall', min: horiz ? [q.u0, q.y0, c - T / 2] : [c - T / 2, q.y0, q.u0], max: horiz ? [q.u1, q.y1, c + T / 2] : [c + T / 2, q.y1, q.u1] })
  }
}
for (const [pos, size] of ITEMS) if (pos[1] + size[1] / 2 > 0.1) other.push({ n: 'item', min: pos.map((v, i) => v - size[i] / 2), max: pos.map((v, i) => v + size[i] / 2) })
for (const [x, z, w, d] of ROOF_PIECES) other.push({ n: 'roof', min: [x - w / 2, 2.95, z - d / 2], max: [x + w / 2, 3.3, z + d / 2] })

const inside = (p, b) => p.every((v, i) => v > b.min[i] - R && v < b.max[i] + R)
const rayHit = (o, d, b) => {
  let t0 = 0, t1 = 1e9
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (o[i] < b.min[i] || o[i] > b.max[i]) return Infinity; continue }
    let a = (b.min[i] - o[i]) / d[i], c = (b.max[i] - o[i]) / d[i]
    if (a > c) [a, c] = [c, a]
    t0 = Math.max(t0, a); t1 = Math.min(t1, c)
    if (t0 > t1) return Infinity
  }
  return t0
}

const pos = [0, 0, 0], look = [0, 0, 0]
const hits = [], close = []
for (let t = P_TOUR; t <= PMAX; t += 0.002) {
  sample(KEYS, t, 'pos', pos); sample(KEYS, t, 'look', look)
  const b = [...walls, ...other].find((s) => inside(pos, s))
  if (b) hits.push([t, b.n, pos.map((v) => +v.toFixed(2))])
  const d = look.map((v, i) => v - pos[i]), len = Math.hypot(...d)
  const dir = d.map((v) => v / len)
  const dist = Math.min(...walls.map((s) => rayHit(pos, dir, s)))
  if (dist < 1.0) close.push([t, +dist.toFixed(2)])
}
const spans = (arr) => { const out = []; for (const [t] of arr) { const l = out[out.length - 1]; if (l && t - l[1] < 0.0061) l[1] = t; else out.push([t, t]) } return out }
console.log(`camera inside geometry: ${hits.length} samples`)
spans(hits).forEach(([a, b]) => { const h = hits.find((x) => x[0] === a); console.log(`  p ${a.toFixed(3)}-${b.toFixed(3)} hits ${h[1]} at [${h[2]}]`) })
console.log(`view filled by a wall (<1 m): ${close.length} of ${Math.round((PMAX - P_TOUR) / 0.002)} samples`)
spans(close).forEach(([a, b]) => console.log(`  p ${a.toFixed(3)}-${b.toFixed(3)}`))
