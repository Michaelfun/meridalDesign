// Pure geometry data for the house (no three.js), shared by the 3D scene and scripts/check-tour.mjs.
// Units are metres. Footprint 10.4 x 11.6, front faces +z.
export const X = 5.2, Z = 5.8, H = 3, T = 0.2

// Openings: c = position along the wall (world x or z), w = width, y0/y1 = sill/head, k = win | door | gap
const O = (c, w, y0 = 0.9, y1 = 2.2, k = 'win') => ({ c, w, y0, y1, k })
const G = (c, w = 1.0) => O(c, w, 0, 2.1, 'gap')
const HALF = () => O(2.2, 2.7, 1.0, 3.0, 'gap') // stair side: 1 m half-wall so the stairs are visible from the rooms

export const WALLS = [
  [-X, -Z, X, -Z, [O(-3.3, 1.4), O(3.3, 1.4), O(0, 0.6, 1.6, 2.3)]], // back
  [-X, -Z, -X, Z, [O(-4.2, 1.2), O(-1.0, 1.2), O(3.3, 1.8)]], // left
  [X, -Z, X, Z, [O(-4.2, 1.2), O(-0.2, 1.0), O(3.3, 1.8)]], // right
  [-X, Z, X, Z, [O(-3.3, 2.2, 0.5, 2.4), O(0, 1.1, 0, 2.3, 'door'), O(3.3, 2.2, 0.5, 2.4)]], // front
  [-1.4, -Z, -1.4, Z, [G(-3.3), G(-0.5), HALF(), G(4.6, 1)]], // corridor, left
  [1.4, -Z, 1.4, Z, [G(-3.3), G(-1.85, 0.8), G(-0.2), HALF(), G(4.6, 1.2)]], // corridor, right
  [-1.4, -4.3, 1.4, -4.3, [G(0)]], // toilet 1
  [-X, -2.5, -1.4, -2.5, []], [1.4, -2.5, X, -2.5, []], [1.4, -1.2, X, -1.2, []],
  [-X, 0.8, -1.4, 0.8, []], [1.4, 0.8, X, 0.8, [G(3.3, 1.2)]],
]

// Splits a wall into solid pieces (u = position along the wall) and opening records
export function wallParts([x1, z1, x2, z2, ops]) {
  const horiz = z1 === z2
  const a = (horiz ? x1 : z1) - T / 2, b = (horiz ? x2 : z2) + T / 2
  const parts = []; let cur = a
  for (const o of [...ops].sort((m, n) => m.c - n.c)) {
    const lo = o.c - o.w / 2, hi = o.c + o.w / 2
    if (lo > cur + 0.01) parts.push({ u0: cur, u1: lo, y0: 0, y1: H })
    cur = hi
    if (o.y0 > 0) parts.push({ u0: lo, u1: hi, y0: 0, y1: o.y0 })
    if (o.y1 < H) parts.push({ u0: lo, u1: hi, y0: o.y1, y1: H })
    parts.push({ ...o, o: true, u0: lo, u1: hi })
  }
  parts.push({ u0: cur, u1: b, y0: 0, y1: H })
  return { horiz, mid: (a + b) / 2, c: horiz ? z1 : x1, parts }
}

// Roof with an opening above the staircase, so the stairs lead up to a roof terrace
export const HOLE = { x0: -0.7, x1: 0.7, z0: -0.4, z1: 3.0 }
const RX = X + 0.3, RZ = Z + 0.3
export const ROOF_PIECES = [ // [centre x, centre z, width, depth]
  [(-RX + HOLE.x0) / 2, 0, HOLE.x0 + RX, 2 * RZ],
  [(RX + HOLE.x1) / 2, 0, RX - HOLE.x1, 2 * RZ],
  [0, (-RZ + HOLE.z0) / 2, HOLE.x1 - HOLE.x0, HOLE.z0 + RZ],
  [0, (RZ + HOLE.z1) / 2, HOLE.x1 - HOLE.x0, RZ - HOLE.z1],
]

// Staircase: 16 steps of 0.21 m rising towards the back (-z), top flush with the roof terrace
export const STEP = { n: 16, rise: 0.21, run: 0.22, z0: 3.5, w: 1.0 }
export const stairTop = (z) => { const i = Math.floor((STEP.z0 - z) / STEP.run + 0.5); return i < 0 ? 0 : (Math.min(i, STEP.n - 1) + 1) * STEP.rise }

// Furniture: [position, size, colour, roughness?, glow?]
// Bed whose head is against the north (N) or west (W) wall
const bed = (cx, cz, d) => {
  const N = d === 'N'
  const P = (dx, y, dz, sx, sy, sz, c, r, e) => [[N ? cx + dx : cx + dz, y, N ? cz + dz : cz + dx], N ? [sx, sy, sz] : [sz, sy, sx], c, r, e]
  return [P(0, 0.18, 0, 1.8, 0.35, 2, '#a67c52', 0.5), P(0, 0.48, 0.05, 1.7, 0.25, 1.9, '#f2efe9'), P(-0.45, 0.66, -0.75, 0.6, 0.14, 0.35, '#fff'), P(0.45, 0.66, -0.75, 0.6, 0.14, 0.35, '#fff'),
    P(0, 0.6, -1.05, 1.9, 0.9, 0.1, '#6d5a45', 0.6), P(0, 0.64, 0.55, 1.7, 0.05, 0.8, '#c9b79a'), P(-1.15, 0.25, -0.8, 0.45, 0.5, 0.4, '#a67c52'), P(1.15, 0.25, -0.8, 0.45, 0.5, 0.4, '#a67c52'), P(-1.15, 0.6, -0.8, 0.2, 0.25, 0.2, '#ffd9a0', 0.8, '#ffb36b')]
}
const steps = Array.from({ length: STEP.n }, (_, i) => [[0, ((i + 1) * STEP.rise) / 2, STEP.z0 - i * STEP.run], [STEP.w, (i + 1) * STEP.rise, STEP.run], '#d8d0c3', 0.7])
const chairs = [2.6, 3.3, 4.0].flatMap((x) => [2.8, 4.4].map((z) => [[x, 0.25, z], [0.45, 0.5, 0.45], '#e7e1d6']))
export const ITEMS = [
  ...bed(-3.3, -4.55, 'N'), ...bed(3.3, -4.55, 'N'), ...bed(-3.95, -0.85, 'W'),
  [[-1.8, 1, -4.95], [0.6, 2, 1.4], '#8a6a45', 0.6], [[1.8, 1, -4.95], [0.6, 2, 1.4], '#8a6a45', 0.6], [[-1.8, 1, -2.0], [0.6, 2, 0.8], '#8a6a45', 0.6],
  // drawing room
  [[-4.75, 0.3, 3.3], [0.9, 0.55, 2.4], '#cfc8bd'], [[-5.1, 0.75, 3.3], [0.2, 0.6, 2.4], '#c2baad'], [[-3.4, 0.2, 3.3], [0.9, 0.4, 1.3], '#b98f62', 0.5],
  [[-3.4, 0.03, 3.3], [2.4, 0.03, 2.6], '#8d8578'], [[-3.3, 0.25, 1.0], [2, 0.5, 0.4], '#a67c52', 0.5], [[-3.3, 1.3, 0.95], [1.4, 0.8, 0.05], '#0a0a0a', 0.2],
  [[-2.4, 0.3, 5.1], [0.8, 0.6, 0.8], '#cfc8bd'], [[-3.3, 2.3, 3.3], [0.5, 0.25, 0.5], '#ffd9a0', 0.8, '#ffb36b'],
  // dining and kitchen
  [[3.3, 0.75, 3.6], [2.2, 0.08, 1.1], '#b98f62', 0.5], ...[[-0.95, -0.45], [0.95, -0.45], [-0.95, 0.45], [0.95, 0.45]].map(([x, z]) => [[3.3 + x, 0.37, 3.6 + z], [0.07, 0.74, 0.07], '#8a6a45']), ...chairs,
  [[3.3, 2.4, 3.6], [0.5, 0.25, 0.5], '#ffd9a0', 0.8, '#ffb36b'],
  [[4.85, 0.45, -0.5], [0.6, 0.9, 1.2], '#e9e4da'], [[4.85, 0.92, -0.5], [0.66, 0.05, 1.26], '#7b7468', 0.3], [[4.8, 0.9, 0.48], [0.6, 1.8, 0.55], '#d9dcdf', 0.3],
  // toilets
  [[0, 0.22, -5.45], [0.4, 0.44, 0.55], '#f5f5f2', 0.3], [[0, 0.55, -5.65], [0.4, 0.3, 0.15], '#f5f5f2', 0.3], [[0.9, 0.8, -5.5], [0.5, 0.12, 0.4], '#f5f5f2', 0.3],
  [[4.8, 0.22, -1.85], [0.55, 0.44, 0.4], '#f5f5f2', 0.3], [[5.0, 0.55, -1.85], [0.15, 0.3, 0.4], '#f5f5f2', 0.3], [[2.2, 0.8, -1.85], [0.4, 0.12, 0.5], '#f5f5f2', 0.3],
  ...steps,
]


// Roof terrace (sits on top of the roof, top surface at y = 3.3)
export const TERRACE = [
  [[0, 3.32, -3.3], [8.6, 0.04, 4.6], '#a9805a', 0.6], // timber deck
  [[-2.4, 3.6, -3.6], [0.75, 0.3, 1.9], '#e9e2d6'], [[-2.4, 3.95, -4.45], [0.75, 0.5, 0.2], '#e9e2d6'],
  [[-1.2, 3.6, -3.6], [0.75, 0.3, 1.9], '#e9e2d6'], [[-1.2, 3.95, -4.45], [0.75, 0.5, 0.2], '#e9e2d6'],
  [[1.6, 3.6, -3.4], [1.0, 0.5, 1.0], '#2a2622', 0.7], [[1.6, 4.0, -3.4], [0.8, 0.5, 0.8], '#5b8a47', 0.9],
  [[3.6, 3.6, -3.4], [1.0, 0.5, 1.0], '#2a2622', 0.7], [[3.6, 4.0, -3.4], [0.8, 0.5, 0.8], '#4a7a3f', 0.9],
  [[0.2, 3.55, -2.0], [0.7, 0.4, 0.7], '#d8d0c3', 0.6],
]
