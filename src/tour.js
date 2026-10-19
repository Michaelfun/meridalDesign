// Camera track. Positions are interpolated over scroll progress p with a smooth cubic spline
// (velocity is continuous across keys). `hold: true` brings the camera to rest at that key, so
// each room gets a calm moment. Pure data and maths, shared with scripts/check-tour.mjs.
export const P_TOUR = 0.72 // progress at which the walk-through begins
export const PMAX = 1.85 // progress at the end of the tour
export const TOUR_VH = 900 // scroll length of the tour section, in viewport heights

const K = (p, pos, look, hold = false) => ({ p, pos, look, hold })
export const KEYS = [
  K(0, [4, 3.2, 17], [-5.5, 1.2, 0], true), // hero: finished house, right of frame
  K(0.2, [-3.5, 28, 0.01], [-3.5, 0, 0], true), // top-down plan
  K(0.3, [-3.5, 28, 0.01], [-3.5, 0, 0], true),
  K(0.5, [14, 10, 17], [3, 1.2, 0]), // walls rise
  K(0.62, [-12, 8, 16], [0, 1.3, 0]), // orbit, roof lifts away
  // ---- walk-through (eye height 1.62 m). Doorways are crossed square-on, at the centre of the gap. ----
  K(0.72, [0, 2.0, 15], [0, 1.5, 5.8]), // garden, facing the door
  K(0.76, [0, 1.7, 8.6], [0, 1.5, 3.5]), // porch
  K(0.8, [0, 1.62, 5.4], [0, 1.7, 2.0]), // through the door
  K(0.84, [0, 1.62, 4.8], [-3, 1.3, 4.3], true), // lobby, turning to the drawing room
  K(0.87, [-0.9, 1.62, 4.6], [-3.5, 1.3, 3.8]),
  K(0.885, [-1.7, 1.62, 4.6], [-4, 1.2, 3.4]), // drawing room doorway
  K(0.9, [-2.4, 1.62, 3.9], [-5.0, 1.0, 2.4], true), // drawing room
  K(0.93, [-2.6, 1.62, 2.3], [-3.3, 1.0, 0.8]),
  K(0.945, [-2.5, 1.62, 3.9], [-1, 1.4, 4.6]),
  K(0.953, [-1.7, 1.62, 4.6], [1, 1.4, 4.6]),
  K(0.96, [-0.9, 1.62, 4.6], [1.6, 1.4, 4.5]),
  K(0.98, [0.5, 1.62, 4.6], [3.0, 1.3, 4.0]),
  K(0.995, [1.7, 1.62, 4.6], [4.0, 1.2, 3.6]), // dining room doorway
  K(1.01, [2.0, 1.62, 4.6], [4.3, 1.0, 3.2], true), // dining room
  K(1.04, [2.0, 1.62, 2.6], [3.3, 1.2, 0.9]),
  K(1.055, [3.3, 1.62, 1.5], [3.3, 1.3, -0.5]), // kitchen opening
  K(1.07, [3.3, 1.62, 0.3], [5.0, 1.1, -0.6], true), // kitchen
  K(1.1, [2.8, 1.62, -0.2], [0.5, 1.4, -0.3]),
  K(1.12, [1.9, 1.62, -0.2], [-1.5, 1.4, -0.5]), // kitchen door
  K(1.14, [0.8, 1.62, -0.5], [-3.5, 1.1, -0.7]),
  K(1.155, [-1.0, 1.62, -0.5], [-4, 1.0, -0.7]), // bedroom three door
  K(1.17, [-2.1, 1.62, -0.5], [-4.5, 0.8, -0.85], true), // bedroom three
  K(1.185, [-1.0, 1.62, -0.5], [0.5, 1.5, -2]),
  K(1.2, [-0.2, 1.62, -0.8], [0.5, 1.5, -3]),
  K(1.22, [0, 1.62, -2.2], [0.5, 1.5, -5]),
  K(1.24, [0.5, 1.62, -3.3], [3, 1.1, -4.2]),
  K(1.26, [1.9, 1.62, -3.3], [3.3, 0.9, -4.6]), // bedroom two door
  K(1.29, [2.0, 1.62, -3.3], [3.3, 0.7, -4.8], true), // bedroom two
  K(1.305, [1.9, 1.62, -3.3], [0, 1.4, -3.3]),
  K(1.32, [1.0, 1.62, -3.3], [-1, 1.4, -3.3]),
  K(1.34, [-0.5, 1.62, -3.3], [-3.3, 1.1, -4.3]),
  K(1.355, [-1.8, 1.62, -3.3], [-3.3, 0.9, -4.6]), // bedroom one door
  K(1.37, [-1.9, 1.62, -3.3], [-3.3, 0.7, -4.8], true), // bedroom one
  K(1.385, [-1.8, 1.62, -3.3], [0, 1.4, -3.3]),
  K(1.4, [-0.9, 1.62, -3.3], [0, 1.5, -1]),
  K(1.43, [-0.9, 1.62, -1.0], [0, 1.6, 2]),
  K(1.46, [-0.9, 1.62, 2.2], [-0.5, 1.6, 4.5]),
  K(1.49, [0, 1.62, 4.3], [0, 1.8, 1.2], true), // facing the staircase
  // ---- staircase to the roof terrace ----
  K(1.52, [0, 1.72, 3.8], [0, 2.5, 1.0]),
  K(1.55, [0, 2.33, 3.0], [0, 3.3, 0.5]),
  K(1.58, [0, 3.17, 2.2], [0, 4.2, -0.5]),
  K(1.61, [0, 4.0, 1.3], [0, 4.8, -2.5]),
  K(1.64, [0, 4.85, 0.5], [0, 4.8, -3.5]),
  K(1.67, [0, 4.95, -0.6], [-5, 4.7, -1.5]), // on the terrace, turning towards the garden
  K(1.71, [0, 4.95, -0.6], [-6, 4.2, 6]),
  K(1.76, [0, 4.95, -1.2], [0, 4.0, 14]),
  K(PMAX, [1.5, 5.0, -1.5], [6, 3.8, 12], true),
]

// Captions shown while the tour plays: active from `p` until the next one
export const STOPS = [
  { p: 0.72, stage: 'Meridian Studio', label: 'Homes built to be lived in.', text: 'Design and construction under one roof, with every detail checked before handover.' },
  { p: 0.84, stage: 'Entrance lobby', label: 'A welcome that sets the tone.', text: 'Generous proportions, warm light and honest materials from the very first step.' },
  { p: 0.9, stage: 'Drawing room', label: 'Modern living, filled with natural light.', text: 'Large glazing, quality finishes and calm, uncluttered layouts designed around how families live.' },
  { p: 0.98, stage: 'Dining room', label: 'Spaces made for gathering.', text: 'Open to the kitchen, bright through the day and warm at night, with finishes chosen to last.' },
  { p: 1.07, stage: 'Kitchen', label: 'Efficient layouts, premium finishes.', text: 'Durable worktops, quality fittings and smart storage, detailed by our designers and fitted by our own craftsmen.' },
  { p: 1.14, stage: 'Bedrooms', label: 'Quiet rooms that restore you.', text: 'Cross-ventilation, soft natural light and sound-conscious construction for better sleep.' },
  { p: 1.24, stage: 'Bedrooms', label: 'Comfort designed in, not added later.', text: 'Built-in storage, good insulation and carefully placed windows keep every room comfortable all year.' },
  { p: 1.32, stage: 'Bedrooms', label: 'Privacy and calm at the back of the house.', text: 'Thoughtful planning gives every bedroom its own light, air and outlook.' },
  { p: 1.49, stage: 'Staircase', label: 'Craftsmanship you can feel.', text: 'Solid construction, precise joinery and a clear path up to the roof terrace.' },
  { p: 1.67, stage: 'Roof terrace', label: 'More living space, with a view.', text: 'Usable outdoor space that adds lasting value, planned in from day one.' },
]

const TENSION = 0.6 // below 1 keeps the path closer to the waypoints, so it cannot swing into walls
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

// Writes the interpolated vector for field 'pos' | 'look' at progress t into out
export function sample(keys, t, field, out) {
  const last = keys.length - 1
  let i = keys.findIndex((k, n) => n < last && t <= keys[n + 1].p)
  if (i < 0) i = last - 1
  const a = keys[i], b = keys[i + 1]
  const dt = b.p - a.p, s = clamp((t - a.p) / dt)
  const s2 = s * s, s3 = s2 * s
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2
  const slope = (n, c) => (keys[n].hold || n === 0 || n === last) ? 0 : TENSION * (keys[n + 1][field][c] - keys[n - 1][field][c]) / (keys[n + 1].p - keys[n - 1].p)
  for (let c = 0; c < 3; c++) {
    out[c] = h00 * a[field][c] + h10 * dt * slope(i, c) + h01 * b[field][c] + h11 * dt * slope(i + 1, c)
  }
  return out
}
