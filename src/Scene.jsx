import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------ helpers */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const seg = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t) }
const dip = (q, a, b, c, d) => 1 - (seg(q, a, b) - seg(q, c, d)) // 1 built, 0 plan, back to 1
const mix = (q) => seg(q, 0.03, 0.2) - seg(q, 0.34, 0.5) // 0 = built, 1 = plan
const col = (c) => new THREE.Color(c)
const SHADOW = typeof window !== 'undefined' && window.innerWidth < 768 ? 1024 : 2048

// House footprint (metres): 10.4 wide x 11.6 deep, front faces +z
const X = 5.2, Z = 5.8, H = 3, T = 0.2

/* ---------------------------------------------------------------- materials */
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o })
const MAT = {
  wall: std('#ece5d9'), glass: std('#bcd2dd', { transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false }),
  frame: std('#1d1b19'), wood: std('#6b4a2f', { roughness: 0.5 }),
  stone: std('#4a4745', { transparent: true }), roof: std('#2a2622', { transparent: true }), cream: std('#e8dfd0', { transparent: true }),
  floor: std('#b98f62', { transparent: true, roughness: 0.6 }), tile: std('#d9d4cc', { transparent: true }),
  lawn: std('#6f9150', { transparent: true }), path: std('#cfc6b8'), bark: std('#6b5238'),
  g1: std('#5b8a47', { flatShading: true }), g2: std('#4a7a3f', { flatShading: true }), g3: std('#6f9a52', { flatShading: true }),
  glow: std('#ffd9a0', { emissive: '#ffb36b', emissiveIntensity: 1.8 }),
}
const LINE = col('#cdb899'), PLASTER = col('#ece5d9')
const SKY = { hero: [col('#86a9cc'), col('#f2dcc0')], plan: [col('#efe7d9'), col('#efe7d9')], dusk: [col('#2f3a52'), col('#d08a5a')] }
const FRAG = `uniform vec3 top;
uniform vec3 bottom;
varying float h;
void main() {
  gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.02, 0.55, h)), 1.0);
  #include <colorspace_fragment>
}`
const skyU = { top: { value: col('#86a9cc') }, bottom: { value: col('#f2dcc0') } }

/* ------------------------------------------------------------ camera + sky */
const KEYS = [
  { p: 0, pos: [4, 3.2, 17], look: [-5.5, 1.2, 0] }, // hero: finished house, right of frame
  { p: 0.2, pos: [-3.5, 28, 0.01], look: [-3.5, 0, 0] }, // top-down plan
  { p: 0.3, pos: [-3.5, 28, 0.01], look: [-3.5, 0, 0] },
  { p: 0.5, pos: [14, 10, 17], look: [3, 1.2, 0] }, // walls rise
  { p: 0.62, pos: [-12, 8, 16], look: [0, 1.3, 0] }, // orbit, roof lifts
  { p: 0.72, pos: [0, 2.2, 16], look: [0, 1.5, 0] }, // front door
  { p: 0.8, pos: [0, 1.7, 8.5], look: [0, 1.5, 3] }, // porch
  { p: 0.86, pos: [0, 1.65, 4.6], look: [-3, 1.4, 4.4] }, // lobby
  { p: 0.92, pos: [-2.8, 1.65, 4.7], look: [-5, 1.1, 2.2] }, // drawing room
  { p: 0.97, pos: [0, 1.65, 4.7], look: [3, 1.2, 4] },
  { p: 1, pos: [2.2, 1.7, 4.9], look: [5, 1.1, 2.6] }, // dining
]

function Rig({ progress, p }) {
  const { camera, scene } = useThree()
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const curves = useMemo(() => ({
    pos: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.pos))),
    look: new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k.look))),
  }), [])
  useFrame((_, dt) => {
    p.current = THREE.MathUtils.damp(p.current, progress.get(), 3, dt)
    const q = p.current
    let i = KEYS.findIndex((k, n) => n < KEYS.length - 1 && q <= KEYS[n + 1].p)
    if (i < 0) i = KEYS.length - 2
    const a = KEYS[i], b = KEYS[i + 1]
    const u = (i + clamp((q - a.p) / (b.p - a.p))) / (KEYS.length - 1)
    curves.pos.getPoint(u, camera.position)
    curves.look.getPoint(u, tmp)
    camera.lookAt(tmp)
    camera.fov = 40 + 22 * seg(q, 0.7, 0.82)
    camera.updateProjectionMatrix()

    ;[skyU.top.value, skyU.bottom.value].forEach((c, n) =>
      c.copy(SKY.hero[n]).lerp(SKY.plan[n], seg(q, 0.03, 0.15)).lerp(SKY.hero[n], seg(q, 0.5, 0.62)).lerp(SKY.dusk[n], seg(q, 0.64, 0.8)))
    scene.fog.color.copy(skyU.bottom.value)

    MAT.wall.color.lerpColors(PLASTER, LINE, mix(q))
    MAT.floor.opacity = MAT.tile.opacity = 1 - 0.9 * mix(q)
    MAT.lawn.opacity = dip(q, 0.03, 0.15, 0.5, 0.62)
  }, -1)
  return null
}

function Sky() {
  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[220, 24, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={skyU}
        vertexShader="varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        fragmentShader={FRAG} />
    </mesh>
  )
}

function Lights({ p }) {
  const sun = useRef(), hemi = useRef()
  useFrame(() => {
    const d = seg(p.current, 0.64, 0.8)
    sun.current.intensity = 2.2 * (1 - 0.75 * d)
    hemi.current.intensity = 0.8 * (1 - 0.45 * d)
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#fff1dc', '#6b5a48', 0.8]} />
      <directionalLight ref={sun} position={[14, 20, 18]} color="#ffe2bd" castShadow shadow-mapSize={[SHADOW, SHADOW]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} shadow-camera-near={5} shadow-camera-far={70} />
    </>
  )
}

function Lamp({ pos, p, max = 28 }) {
  const l = useRef()
  useFrame(() => { l.current.intensity = max * clamp(0.4 * (1 - seg(p.current, 0.03, 0.12)) + seg(p.current, 0.5, 0.7)) })
  return <pointLight ref={l} position={pos} color="#ffb878" distance={11} decay={2} />
}

/* ------------------------------------------------------------------- walls */
// Openings: c = position along the wall (world x or z), w = width, y0/y1 = sill/head, k = win | door | gap
const O = (c, w, y0 = 0.9, y1 = 2.2, k = 'win') => ({ c, w, y0, y1, k })
const G = (c, w = 0.9) => O(c, w, 0, 2.1, 'gap')
const WALLS = [
  [-X, -Z, X, -Z, [O(-3.3, 1.4), O(3.3, 1.4), O(0, 0.6, 1.6, 2.3)]], // back
  [-X, -Z, -X, Z, [O(-4.2, 1.2), O(-1.0, 1.2), O(3.3, 1.8)]], // left
  [X, -Z, X, Z, [O(-4.2, 1.2), O(-0.2, 1.0), O(3.3, 1.8)]], // right
  [-X, Z, X, Z, [O(-3.3, 2.2, 0.5, 2.4), O(0, 1.1, 0, 2.3, 'door'), O(3.3, 2.2, 0.5, 2.4)]], // front
  [-1.4, -Z, -1.4, Z, [G(-3.9), G(-0.5), G(4.6, 1)]], // corridor, left
  [1.4, -Z, 1.4, Z, [G(-3.9), G(-1.85, 0.8), G(-0.2), G(4.6, 1.2)]], // corridor, right
  [-1.4, -4.3, 1.4, -4.3, [G(0)]], // toilet 1
  [-X, -2.5, -1.4, -2.5, []], [1.4, -2.5, X, -2.5, []], [1.4, -1.2, X, -1.2, []],
  [-X, 0.8, -1.4, 0.8, []], [1.4, 0.8, X, 0.8, [G(3.3, 1.2)]],
]

function Opening({ q, mid }) {
  if (q.k === 'gap') return null
  const w = q.u1 - q.u0, h = q.y1 - q.y0
  const ring = [[0, h / 2, w + 0.08, 0.08], [0, -h / 2, w + 0.08, 0.08], [-w / 2, 0, 0.08, h], [w / 2, 0, 0.08, h]]
  return (
    <group position={[(q.u0 + q.u1) / 2 - mid, (q.y0 + q.y1) / 2, 0]}>
      {q.k === 'win' ? <mesh material={MAT.glass}><boxGeometry args={[w, h, 0.04]} /></mesh>
        : <mesh material={MAT.wood} castShadow><boxGeometry args={[w - 0.04, h, 0.07]} /></mesh>}
      {ring.map(([x, y, sx, sy], n) => <mesh key={n} position={[x, y, 0]} material={MAT.frame}><boxGeometry args={[sx, sy, T + 0.04]} /></mesh>)}
      {q.k === 'win' && w > 1.5 && <mesh material={MAT.frame}><boxGeometry args={[0.05, h, 0.06]} /></mesh>}
    </group>
  )
}

function Wall({ w, i, p }) {
  const [x1, z1, x2, z2, ops] = w
  const horiz = z1 === z2
  const a = (horiz ? x1 : z1) - T / 2, b = (horiz ? x2 : z2) + T / 2, mid = (a + b) / 2
  const g = useRef()
  const parts = useMemo(() => {
    const out = []; let cur = a
    for (const o of [...ops].sort((m, n) => m.c - n.c)) {
      const lo = o.c - o.w / 2, hi = o.c + o.w / 2
      if (lo > cur + 0.01) out.push({ u0: cur, u1: lo, y0: 0, y1: H })
      cur = hi
      if (o.y0 > 0) out.push({ u0: lo, u1: hi, y0: 0, y1: o.y0 })
      if (o.y1 < H) out.push({ u0: lo, u1: hi, y0: o.y1, y1: H })
      out.push({ ...o, o: true, u0: lo, u1: hi, y0: o.y0, y1: o.y1 })
    }
    out.push({ u0: cur, u1: b, y0: 0, y1: H })
    return out
  }, [])
  useFrame(() => {
    const q = p.current
    const s = q < 0.27 ? 1 - seg(q, 0.03, 0.2) : seg(q, 0.32 + i * 0.012, 0.52 + i * 0.012)
    g.current.scale.y = Math.max(s, 0.012)
  })
  return (
    <group ref={g} position={[horiz ? mid : x1, 0, horiz ? z1 : mid]} rotation={[0, horiz ? 0 : -Math.PI / 2, 0]}>
      {parts.map((q, n) => q.o ? <Opening key={n} q={q} mid={mid} /> : (
        <mesh key={n} position={[(q.u0 + q.u1) / 2 - mid, (q.y0 + q.y1) / 2, 0]} material={MAT.wall} castShadow receiveShadow>
          <boxGeometry args={[q.u1 - q.u0, q.y1 - q.y0, T]} />
          <Edges color="#3b2e24" />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------- floor + roof */
const Slab = ({ pos, size, mat, shadow = true }) => (
  <mesh position={pos} material={mat} castShadow={shadow} receiveShadow><boxGeometry args={size} /></mesh>
)

function Floors() {
  return (
    <>
      <Slab pos={[0, -0.1, 0]} size={[2 * X + 1, 0.2, 2 * Z + 1]} mat={MAT.path} />
      <Slab pos={[0, 0.01, 0]} size={[2 * X, 0.02, 2 * Z]} mat={MAT.floor} shadow={false} />
      {[[0, -5.05, 2.8, 1.5], [3.3, -1.85, 3.8, 1.3], [3.3, -0.2, 3.8, 2.0], [0, 4.7, 2.8, 2.2]].map(([x, z, w, d], n) => <Slab key={n} pos={[x, 0.025, z]} size={[w, 0.02, d]} mat={MAT.tile} shadow={false} />)}
    </>
  )
}

function Roof({ p }) {
  const g = useRef()
  useFrame(() => {
    const q = p.current
    const up = seg(q, 0.03, 0.12) - seg(q, 0.34, 0.46) + seg(q, 0.62, 0.7)
    g.current.position.y = up * 12
    const f = 1 - clamp(up * 2)
    MAT.roof.opacity = MAT.cream.opacity = MAT.stone.opacity = f
    g.current.visible = f > 0.02
  })
  const parapets = [[0, -Z - 0.2, 2 * X + 0.6, 0.25], [0, Z + 0.2, 2 * X + 0.6, 0.25], [-X - 0.2, 0, 0.25, 2 * Z + 0.6], [X + 0.2, 0, 0.25, 2 * Z + 0.6]]
  return (
    <group ref={g}>
      <mesh position={[0, H + 0.15, 0]} material={MAT.roof} castShadow receiveShadow><boxGeometry args={[2 * X + 0.6, 0.3, 2 * Z + 0.6]} /><Edges color="#8a7a68" /></mesh>
      {parapets.map(([x, z, w, d], n) => <Slab key={n} pos={[x, H + 0.52, z]} size={[w, 0.45, d]} mat={MAT.cream} />)}
      <Slab pos={[0, H + 0.85, Z - 0.1]} size={[5.4, 1.1, 1.0]} mat={MAT.cream} />
      <Slab pos={[0, H + 0.3, Z + 1.3]} size={[5.6, 0.3, 2.8]} mat={MAT.cream} />
      <Slab pos={[0, H + 0.05, Z + 1.3]} size={[5.6, 0.12, 2.8]} mat={MAT.roof} shadow={false} />
      {[-2.4, 2.4].map((x) => <Slab key={x} pos={[x, 1.65, Z + 2.4]} size={[0.5, 3.0, 0.5]} mat={MAT.stone} />)}
      {[-1.6, 1.6].map((x) => <Slab key={x} pos={[x, 1.5, Z + 0.12]} size={[0.5, 3.0, 0.2]} mat={MAT.stone} />)}
      {[-4.9, -1.9, 1.9, 4.9].map((x) => <mesh key={x} position={[x, 2.4, Z + 0.15]} material={MAT.glow}><boxGeometry args={[0.12, 0.3, 0.1]} /></mesh>)}
    </group>
  )
}

/* ---------------------------------------------------------------- furniture */
const Box = ({ pos, size, color, rough = 0.8, glow }) => (
  <mesh position={pos} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={rough} emissive={glow || '#000'} emissiveIntensity={glow ? 1.6 : 0} />
  </mesh>
)

// Bed whose head is against the north (N) or west (W) wall
const bed = (cx, cz, d) => {
  const N = d === 'N'
  const P = (dx, y, dz, sx, sy, sz, c, r, e) => [[N ? cx + dx : cx + dz, y, N ? cz + dz : cz + dx], N ? [sx, sy, sz] : [sz, sy, sx], c, r, e]
  return [P(0, 0.18, 0, 1.8, 0.35, 2, '#a67c52', 0.5), P(0, 0.48, 0.05, 1.7, 0.25, 1.9, '#f2efe9'), P(-0.45, 0.66, -0.75, 0.6, 0.14, 0.35, '#fff'), P(0.45, 0.66, -0.75, 0.6, 0.14, 0.35, '#fff'),
    P(0, 0.6, -1.05, 1.9, 0.9, 0.1, '#6d5a45', 0.6), P(0, 0.64, 0.55, 1.7, 0.05, 0.8, '#c9b79a'), P(-1.15, 0.25, -0.8, 0.45, 0.5, 0.4, '#a67c52'), P(1.15, 0.25, -0.8, 0.45, 0.5, 0.4, '#a67c52'), P(-1.15, 0.6, -0.8, 0.2, 0.25, 0.2, '#ffd9a0', 0.8, '#ffb36b')]
}
const steps = Array.from({ length: 12 }, (_, i) => [[0, ((i + 1) * 0.2) / 2, 3.5 - i * 0.22], [1.2, (i + 1) * 0.2, 0.22], '#d8d0c3', 0.7])
const chairs = [2.6, 3.3, 4.0].flatMap((x) => [2.8, 4.4].map((z) => [[x, 0.25, z], [0.45, 0.5, 0.45], '#e7e1d6']))
const ITEMS = [
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

function Furniture({ p }) {
  const g = useRef()
  useFrame(() => {
    const s = dip(p.current, 0.03, 0.12, 0.5, 0.64)
    g.current.scale.set(1, Math.max(s, 0.001), 1)
    g.current.visible = s > 0.01
  })
  return <group ref={g}>{ITEMS.map(([pos, size, color, rough, glow], n) => <Box key={n} pos={pos} size={size} color={color} rough={rough} glow={glow} />)}</group>
}

/* ------------------------------------------------- room labels (plan phase) */
const ROOMS = [[-3.3, -4.15, 'Bedroom', "12'6\" x 11'0\""], [3.3, -4.15, 'Bedroom', "12'6\" x 11'1\""], [-3.3, -0.85, 'Bedroom', "12'6\" x 11'0\""],
  [0, -5.05, 'Toilet', "8'0\" x 4'6\""], [3.3, -1.85, 'Toilet', "7'6\" x 4'1\""], [3.3, -0.2, 'Kitchen', "7'4\" x 11'5\""],
  [-3.3, 3.3, 'Drawing', "13'1\" x 11'0\""], [3.3, 3.3, 'Dining', "13'10\" x 9'6\""], [0, 2.2, 'Stairs', '']]

function Label({ r, p }) {
  const mat = useRef()
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256
    const x = c.getContext('2d'); x.textAlign = 'center'; x.fillStyle = '#3b2e24'
    x.font = '600 50px "DM Sans", sans-serif'; if ('letterSpacing' in x) x.letterSpacing = '5px'
    x.fillText(r[2].toUpperCase(), 256, 125)
    x.font = '400 38px "DM Sans", sans-serif'; x.fillStyle = '#6b5a48'; if ('letterSpacing' in x) x.letterSpacing = '1px'
    x.fillText(r[3], 256, 182)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
    return t
  }, [r])
  useFrame(() => { mat.current.opacity = clamp((mix(p.current) - 0.6) * 2.5) })
  return (
    <mesh position={[r[0], 0.06, r[1]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.6, 1.3]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/* ---------------------------------------------------------------- environment */
const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

function Tree({ x, z, s, m }) {
  const mats = [MAT.g1, MAT.g2, MAT.g3]
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1, 0]} material={MAT.bark} castShadow><cylinderGeometry args={[0.14, 0.22, 2, 6]} /></mesh>
      <mesh position={[0, 2.8, 0]} material={mats[m % 3]} castShadow><icosahedronGeometry args={[1.5, 0]} /></mesh>
      <mesh position={[0.6, 3.7, 0.2]} material={mats[(m + 1) % 3]} castShadow><icosahedronGeometry args={[1.0, 0]} /></mesh>
    </group>
  )
}

function Palm({ x, z, s = 1 }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.7, 0]} material={MAT.bark} castShadow><cylinderGeometry args={[0.1, 0.17, 3.4, 6]} /></mesh>
      {Array.from({ length: 7 }, (_, k) => (
        <group key={k} position={[0, 3.4, 0]} rotation={[0, (k * Math.PI * 2) / 7, 0]}>
          <mesh position={[0.75, -0.1, 0]} rotation={[0, 0, -0.45]} material={MAT.g3} castShadow><sphereGeometry args={[1, 6, 4]} /></mesh>
        </group>
      ))}
    </group>
  )
}

function Shrub({ x, z, s = 1, flower }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.35, 0]} scale={[1, 0.7, 1]} material={MAT.g2} castShadow><icosahedronGeometry args={[0.55, 0]} /></mesh>
      {flower && [[0.25, 0.7, 0.1], [-0.2, 0.62, 0.25], [0.05, 0.75, -0.2]].map((f, n) => <mesh key={n} position={f}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={flower} /></mesh>)}
    </group>
  )
}

function Env({ p }) {
  const g = useRef()
  const trees = useMemo(() => {
    const r = rng(7), out = []
    for (let n = 0; n < 26; n++) {
      const a = r() * Math.PI * 2, d = 15 + r() * 28
      let x = Math.cos(a) * d, z = Math.sin(a) * d
      if (z > 0 && Math.abs(x) < 7) z = -z
      out.push({ x, z, s: 0.8 + r() * 0.9, m: Math.floor(r() * 3) })
    }
    return out
  }, [])
  useFrame(() => { g.current.scale.y = Math.max(dip(p.current, 0.03, 0.15, 0.5, 0.62), 0.001) })
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={MAT.lawn} receiveShadow><planeGeometry args={[240, 240]} /></mesh>
      <group ref={g}>
        <Slab pos={[0, 0.02, 16]} size={[3.6, 0.04, 20]} mat={MAT.path} shadow={false} />
        <Slab pos={[0, 0.15, Z + 1.4]} size={[5.4, 0.3, 2.8]} mat={MAT.path} />
        <Slab pos={[0, 0.05, Z + 3.0]} size={[3.8, 0.1, 0.5]} mat={MAT.path} />
        <Slab pos={[0, 0.1, Z + 2.7]} size={[3.8, 0.2, 0.5]} mat={MAT.path} />
        {[-1, 1].flatMap((sx) => [[1.5, 6.7], [3.0, 6.7], [4.6, 6.7], [4.4, 6.0]].map(([x, z], n) => <Shrub key={`${sx}${n}`} x={sx * x} z={z} s={0.9 + (n % 2) * 0.3} flower={n % 2 ? '#d9605a' : '#e8a2b4'} />))}
        <Palm x={-6.6} z={7.2} s={1.1} /><Palm x={6.6} z={7.2} s={1.0} /><Palm x={-8.5} z={2} s={1.2} /><Palm x={8.5} z={3} s={1.1} />
        {[-2.3, 2.3].flatMap((x) => [10, 14, 18].map((z) => <mesh key={`${x}${z}`} position={[x, 0.35, z]} material={MAT.glow}><cylinderGeometry args={[0.07, 0.07, 0.7, 8]} /></mesh>))}
        {trees.map((t, n) => <Tree key={n} {...t} />)}
      </group>
    </>
  )
}

function Grid({ p }) {
  const ref = useRef()
  useFrame(() => { ref.current.material.opacity = 0.9 * mix(p.current) })
  return <gridHelper ref={ref} args={[90, 90, '#b9a58e', '#d8c9b3']} position={[0, -0.03, 0]} material-transparent />
}

export default function Scene({ progress, active = true }) {
  const p = useRef(0)
  return (
    <Canvas shadows="soft" dpr={[1, 1.75]} camera={{ fov: 40, near: 0.1, far: 500, position: [4, 3.2, 17] }} frameloop={active ? 'always' : 'never'}>
      <color attach="background" args={['#e3d3bd']} />
      <fog attach="fog" args={['#f2dcc0', 40, 130]} />
      <Rig progress={progress} p={p} />
      <Sky />
      <Lights p={p} />
      <Lamp pos={[0, 2.6, 4.6]} p={p} /><Lamp pos={[-3.3, 2.6, 3.3]} p={p} /><Lamp pos={[3.3, 2.6, 3.6]} p={p} /><Lamp pos={[3.3, 2.6, -0.2]} p={p} /><Lamp pos={[0, 2.8, 7.6]} p={p} max={16} />
      <Grid p={p} />
      <Env p={p} />
      <Floors />
      {WALLS.map((w, i) => <Wall key={i} w={w} i={i} p={p} />)}
      <Furniture p={p} />
      {ROOMS.map((r, i) => <Label key={i} r={r} p={p} />)}
      <Roof p={p} />
    </Canvas>
  )
}
