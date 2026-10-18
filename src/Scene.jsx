import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { H, ITEMS, ROOF_PIECES, HOLE, T, TERRACE, WALLS, X, Z, wallParts } from './house'
import { KEYS, PMAX, sample } from './tour'

/* ------------------------------------------------------------------ helpers */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const seg = (p, a, b) => { const t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t) }
const dip = (q, a, b, c, d) => 1 - (seg(q, a, b) - seg(q, c, d)) // 1 built, 0 plan, back to 1
const mix = (q) => seg(q, 0.03, 0.2) - seg(q, 0.34, 0.5) // 0 = built, 1 = plan
const col = (c) => new THREE.Color(c)
const SHADOW = typeof window !== 'undefined' && window.innerWidth < 768 ? 1024 : 2048
const SUN = new THREE.Vector3(18, 13, 15)
const rnd = (a, b) => a + Math.random() * (b - a)

/* ----------------------------------------------------- procedural textures */
const tex = (size, draw, rep, srgb = true) => {
  const c = document.createElement('canvas'); c.width = c.height = size
  draw(c.getContext('2d'), size)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}
const T_WOOD = tex(512, (g, s) => {
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(30,${rnd(36, 46)}%,${rnd(44, 56)}%)`; g.fillRect(0, (i * s) / 8, s, s / 8)
    g.fillStyle = 'rgba(55,32,14,0.4)'; g.fillRect(0, (i * s) / 8, s, 2)
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(70,40,20,${rnd(0, 0.12)})`; g.fillRect(rnd(0, s), (i * s) / 8 + rnd(0, s / 8), rnd(10, 120), 1) }
  }
}, [3, 3.5])
const T_STONE = tex(256, (g, s) => {
  g.fillStyle = '#34312f'; g.fillRect(0, 0, s, s)
  for (let r = 0; r < 8; r++) { let x = -(r % 2) * 20; while (x < s) { const w = rnd(36, 70); g.fillStyle = `hsl(25,4%,${rnd(24, 36)}%)`; g.fillRect(x + 1.5, r * 32 + 1.5, w - 3, 29); x += w } }
}, [1, 5])
const T_PAVER = tex(128, (g, s) => {
  g.fillStyle = '#d6cdbf'; g.fillRect(0, 0, s, s); g.strokeStyle = '#b3a99a'; g.lineWidth = 2
  g.strokeRect(0, 0, s, s); g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke()
}, [4, 20])
const T_LAWN = tex(256, (g, s) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#6f9150' : '#7a9d58'; g.fillRect(0, (i * s) / 8, s, s / 8) }
  for (let k = 0; k < 2500; k++) { g.fillStyle = `rgba(40,70,30,${rnd(0.03, 0.12)})`; g.fillRect(rnd(0, s), rnd(0, s), 2, 2) }
}, [24, 24])
const T_PLASTER = tex(256, (g, s) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s)
  for (let k = 0; k < 6000; k++) { const v = rnd(90, 170); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd(0, s), rnd(0, s), 2, 2) }
}, [3, 2], false)

/* ---------------------------------------------------------------- materials */
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o })
const MAT = {
  wall: std('#ece5d9', { bumpMap: T_PLASTER, bumpScale: 0.35 }),
  glass: new THREE.MeshPhysicalMaterial({ color: '#cfe3ee', roughness: 0.04, transparent: true, opacity: 0.28, envMapIntensity: 1.8, clearcoat: 1, depthWrite: false }),
  frame: std('#1d1b19', { metalness: 0.6, roughness: 0.35 }), wood: std('#6b4a2f', { roughness: 0.45 }), woodDark: std('#4a3220', { roughness: 0.5 }),
  brass: std('#c9a56a', { metalness: 0.9, roughness: 0.25 }), sill: std('#d8cfbf'),
  stone: std('#ffffff', { map: T_STONE, transparent: true }), roof: std('#2a2622', { transparent: true, roughness: 0.7 }), cream: std('#e8dfd0', { transparent: true }),
  floor: std('#ffffff', { map: T_WOOD, transparent: true, roughness: 0.55 }), tile: std('#d9d4cc', { transparent: true, roughness: 0.4 }),
  lawn: std('#ffffff', { map: T_LAWN, transparent: true }), path: std('#cfc6b8'), paver: std('#ffffff', { map: T_PAVER }), bark: std('#6b5238'),
  cap: std('#5a5653'), pillar: std('#d3cabb'),
  g1: std('#5b8a47', { flatShading: true }), g2: std('#4a7a3f', { flatShading: true }), g3: std('#6f9a52', { flatShading: true }),
  glow: std('#ffd9a0', { emissive: '#ffb36b', emissiveIntensity: 1.8 }),
}
const LINE = col('#cdb899'), PLASTER = col('#ece5d9')
const SKY = { hero: [col('#86a9cc'), col('#f2dcc0')], plan: [col('#efe7d9'), col('#efe7d9')], dusk: [col('#2f3a52'), col('#d08a5a')], gold: [col('#7ea3cf'), col('#f3c28e')] }
const skyU = { top: { value: col('#86a9cc') }, bottom: { value: col('#f2dcc0') }, sunDir: { value: SUN.clone().normalize() }, sunK: { value: 1 } }
const VERT = `varying vec3 vDir;
void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const FRAG = `uniform vec3 top; uniform vec3 bottom; uniform vec3 sunDir; uniform float sunK;
varying vec3 vDir;
void main() {
  vec3 c = mix(bottom, top, smoothstep(-0.02, 0.55, vDir.y));
  float s = max(dot(normalize(vDir), sunDir), 0.0);
  c += sunK * vec3(1.0, 0.82, 0.55) * (pow(s, 900.0) * 3.0 + pow(s, 12.0) * 0.22);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`

/* ------------------------------------------------------------ camera + sky */
const camPos = [0, 0, 0], camLook = [0, 0, 0]
const ORBIT_FROM = 1.74 // after the roof terrace the camera rises out and circles the finished house

function Rig({ progress, p }) {
  const { camera, scene } = useThree()
  useFrame((state, dt) => {
    p.current = THREE.MathUtils.damp(p.current, progress.get(), 3.5, dt)
    const q = p.current, t = state.clock.elapsedTime
    sample(KEYS, q, 'pos', camPos); sample(KEYS, q, 'look', camLook)
    const w = seg(q, ORBIT_FROM, PMAX)
    if (w > 0) { // slow, continuous orbit: about two and a half minutes per revolution
      const a = 0.6 + t * 0.04, r = 22 + Math.sin(t * 0.07) * 2, h = 7.5 + Math.sin(t * 0.11)
      camPos[0] += (r * Math.sin(a) - camPos[0]) * w; camPos[1] += (h - camPos[1]) * w; camPos[2] += (r * Math.cos(a) - camPos[2]) * w
      camLook[0] *= 1 - w; camLook[1] += (1.8 - camLook[1]) * w; camLook[2] *= 1 - w
    }
    camera.position.set(camPos[0], camPos[1], camPos[2])
    camera.lookAt(camLook[0], camLook[1], camLook[2])
    camera.fov = 40 + 22 * seg(q, 0.7, 0.82) - 16 * w
    camera.updateProjectionMatrix()

    const e = dip(q, 0.03, 0.15, 0.5, 0.62)
    ;[skyU.top.value, skyU.bottom.value].forEach((c, n) =>
      c.copy(SKY.hero[n]).lerp(SKY.plan[n], seg(q, 0.03, 0.15)).lerp(SKY.hero[n], seg(q, 0.5, 0.62)).lerp(SKY.dusk[n], seg(q, 0.64, 0.8)).lerp(SKY.gold[n], w))
    skyU.sunK.value = e
    scene.fog.color.copy(skyU.bottom.value)

    MAT.wall.color.lerpColors(PLASTER, LINE, mix(q))
    MAT.floor.opacity = MAT.tile.opacity = 1 - 0.9 * mix(q)
    MAT.lawn.opacity = e
  }, -1)
  return null
}

function Sky() {
  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <sphereGeometry args={[220, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={skyU} vertexShader={VERT} fragmentShader={FRAG} />
    </mesh>
  )
}

// Soft studio reflections for glass, metal and timber (generated locally, no download)
function EnvMap() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const rt = pm.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = rt.texture; scene.environmentIntensity = 0.35
    return () => { scene.environment = null; rt.dispose(); pm.dispose() }
  }, [gl, scene])
  return null
}

function Lights({ p }) {
  const sun = useRef(), hemi = useRef()
  useFrame(() => {
    const q = p.current
    const d = seg(q, 0.64, 0.8) * (1 - 0.7 * seg(q, ORBIT_FROM, PMAX))
    sun.current.intensity = 2.4 * (1 - 0.75 * d)
    hemi.current.intensity = 0.8 * (1 - 0.45 * d)
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#fff1dc', '#6b5a48', 0.8]} />
      <directionalLight ref={sun} position={SUN.toArray()} color="#ffe0b8" castShadow shadow-mapSize={[SHADOW, SHADOW]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-radius={4} shadow-camera-left={-17} shadow-camera-right={17} shadow-camera-top={17} shadow-camera-bottom={-17} shadow-camera-near={5} shadow-camera-far={80} />
    </>
  )
}

function Lamp({ pos, p, max = 32 }) {
  const l = useRef()
  useFrame(() => { l.current.intensity = max * clamp(0.4 * (1 - seg(p.current, 0.03, 0.12)) + seg(p.current, 0.5, 0.7)) })
  return <pointLight ref={l} position={pos} color="#ffb878" distance={11} decay={2} />
}

/* ------------------------------------------------------------------- walls */
function DoorLeaf({ w, h, p }) {
  const g = useRef()
  useFrame(() => { g.current.rotation.y = -seg(p.current, 0.735, 0.775) * 1.75 })
  return (
    <group ref={g} position={[-w / 2, 0, 0]}>
      <mesh position={[w / 2, 0, 0]} material={MAT.wood} castShadow><boxGeometry args={[w - 0.04, h, 0.07]} /></mesh>
      {[0.28, 0.72].map((f) => <mesh key={f} position={[w * f, 0, 0.037]} material={MAT.woodDark}><boxGeometry args={[0.03, h * 0.82, 0.01]} /></mesh>)}
      <mesh position={[w - 0.16, 0, 0.07]} material={MAT.brass}><boxGeometry args={[0.03, 0.55, 0.04]} /></mesh>
    </group>
  )
}

function Opening({ q, mid, p }) {
  if (q.k === 'gap') return null
  const w = q.u1 - q.u0, h = q.y1 - q.y0, win = q.k === 'win'
  const ring = [[0, h / 2, w + 0.08, 0.08], [0, -h / 2, w + 0.08, 0.08], [-w / 2, 0, 0.08, h], [w / 2, 0, 0.08, h]]
  return (
    <group position={[(q.u0 + q.u1) / 2 - mid, (q.y0 + q.y1) / 2, 0]}>
      {win ? <mesh material={MAT.glass}><boxGeometry args={[w, h, 0.04]} /></mesh> : <DoorLeaf w={w} h={h} p={p} />}
      {ring.map(([x, y, sx, sy], n) => <mesh key={n} position={[x, y, 0]} material={MAT.frame}><boxGeometry args={[sx, sy, T + 0.04]} /></mesh>)}
      {win && w > 1.5 && <mesh material={MAT.frame}><boxGeometry args={[0.05, h, 0.06]} /></mesh>}
      {win && h > 1.2 && <mesh position={[0, h * 0.25, 0]} material={MAT.frame}><boxGeometry args={[w, 0.04, 0.06]} /></mesh>}
      {win && <mesh position={[0, -h / 2 - 0.05, 0]} material={MAT.sill} castShadow><boxGeometry args={[w + 0.24, 0.06, T + 0.24]} /></mesh>}
    </group>
  )
}

function Wall({ w, i, p }) {
  const g = useRef()
  const { horiz, mid, c, parts } = useMemo(() => wallParts(w), [])
  useFrame(() => {
    const q = p.current
    const s = q < 0.27 ? 1 - seg(q, 0.03, 0.2) : seg(q, 0.32 + i * 0.012, 0.52 + i * 0.012)
    g.current.scale.y = Math.max(s, 0.012)
  })
  return (
    <group ref={g} position={[horiz ? mid : c, 0, horiz ? c : mid]} rotation={[0, horiz ? 0 : -Math.PI / 2, 0]}>
      {parts.map((q, n) => q.o ? <Opening key={n} q={q} mid={mid} p={p} /> : (
        <mesh key={n} position={[(q.u0 + q.u1) / 2 - mid, (q.y0 + q.y1) / 2, 0]} material={MAT.wall} castShadow receiveShadow>
          <boxGeometry args={[q.u1 - q.u0, q.y1 - q.y0, T]} />
          <Edges color="#3b2e24" />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------- floor + roof */
const Slab = ({ pos, size, mat, shadow = true, r = 0.02 }) => (
  <RoundedBox args={size} radius={Math.min(r, Math.min(...size) / 2.2)} smoothness={2} position={pos} material={mat} castShadow={shadow} receiveShadow />
)

function Floors() {
  return (
    <>
      <Slab pos={[0, -0.1, 0]} size={[2 * X + 1, 0.2, 2 * Z + 1]} mat={MAT.path} />
      <Slab pos={[0, 0.01, 0]} size={[2 * X, 0.02, 2 * Z]} mat={MAT.floor} shadow={false} r={0} />
      {[[0, -5.05, 2.8, 1.5], [3.3, -1.85, 3.8, 1.3], [3.3, -0.2, 3.8, 2.0], [0, 4.7, 2.8, 2.2]].map(([x, z, w, d], n) => <Slab key={n} pos={[x, 0.025, z]} size={[w, 0.02, d]} mat={MAT.tile} shadow={false} r={0} />)}
    </>
  )
}

function Roof({ p }) {
  const g = useRef()
  useFrame(() => {
    const q = p.current
    // lifts away for the plan and the cut-away view, then settles back as the walk-through begins
    const up = seg(q, 0.03, 0.12) - seg(q, 0.34, 0.46) + seg(q, 0.62, 0.7) - seg(q, 0.74, 0.8)
    g.current.position.y = up * 12
    const f = 1 - clamp(up * 2)
    MAT.roof.opacity = MAT.cream.opacity = MAT.stone.opacity = f
    g.current.visible = f > 0.02
  })
  const parapets = [[0, -Z - 0.2, 2 * X + 0.6, 0.25], [0, Z + 0.2, 2 * X + 0.6, 0.25], [-X - 0.2, 0, 0.25, 2 * Z + 0.6], [X + 0.2, 0, 0.25, 2 * Z + 0.6]]
  const hw = HOLE.x1 - HOLE.x0, hd = HOLE.z1 - HOLE.z0
  const rails = [[HOLE.x0 - 0.05, (HOLE.z0 + HOLE.z1) / 2, 0.05, hd], [HOLE.x1 + 0.05, (HOLE.z0 + HOLE.z1) / 2, 0.05, hd], [0, HOLE.z0 - 0.05, hw + 0.2, 0.05]]
  return (
    <group ref={g}>
      {ROOF_PIECES.map(([x, z, w, d], n) => (
        <group key={n}>
          <Slab pos={[x, H + 0.15, z]} size={[w, 0.3, d]} mat={MAT.roof} r={0} />
          <Slab pos={[x, H - 0.025, z]} size={[w, 0.05, d]} mat={MAT.cream} shadow={false} r={0} />
        </group>
      ))}
      {rails.map(([x, z, w, d], n) => <mesh key={n} position={[x, H + 0.75, z]} material={MAT.frame}><boxGeometry args={[w, 0.9, d]} /></mesh>)}
      {parapets.map(([x, z, w, d], n) => (
        <group key={n}>
          <Slab pos={[x, H + 0.52, z]} size={[w, 0.45, d]} mat={MAT.cream} />
          <Slab pos={[x, H + 0.77, z]} size={[w + 0.08, 0.05, d + 0.08]} mat={MAT.cap} r={0.01} />
        </group>
      ))}
      <Slab pos={[0, H + 0.85, Z - 0.1]} size={[5.4, 1.1, 1.0]} mat={MAT.cream} />
      <Slab pos={[0, H + 1.43, Z - 0.1]} size={[5.5, 0.06, 1.1]} mat={MAT.cap} r={0.01} />
      <Slab pos={[0, H + 0.3, Z + 1.3]} size={[5.6, 0.3, 2.8]} mat={MAT.cream} />
      <Slab pos={[0, H + 0.05, Z + 1.3]} size={[5.6, 0.12, 2.8]} mat={MAT.roof} shadow={false} />
      {[-2.4, 2.4].map((x) => <Slab key={x} pos={[x, 1.65, Z + 2.4]} size={[0.5, 3.0, 0.5]} mat={MAT.stone} />)}
      {[-1.6, 1.6].map((x) => <Slab key={x} pos={[x, 1.5, Z + 0.12]} size={[0.5, 3.0, 0.2]} mat={MAT.stone} />)}
      {[-4.9, -1.9, 1.9, 4.9].map((x) => <mesh key={x} position={[x, 2.4, Z + 0.15]} material={MAT.glow}><boxGeometry args={[0.12, 0.3, 0.1]} /></mesh>)}
      {TERRACE.map(([pos, size, color, rough], n) => <Box key={n} pos={pos} size={size} color={color} rough={rough} />)}
    </group>
  )
}

/* ---------------------------------------------------------------- furniture */
const Box = ({ pos, size, color, rough = 0.8, glow }) => (
  <RoundedBox args={size} radius={Math.min(0.03, Math.min(...size) / 2.2)} smoothness={2} position={pos} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={rough} emissive={glow || '#000'} emissiveIntensity={glow ? 1.6 : 0} />
  </RoundedBox>
)

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
  const label = useMemo(() => {
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
      <meshBasicMaterial ref={mat} map={label} transparent opacity={0} depthWrite={false} />
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
      <mesh position={[0, 2.8, 0]} material={mats[m % 3]} castShadow><icosahedronGeometry args={[1.5, 1]} /></mesh>
      <mesh position={[0.7, 3.6, 0.2]} material={mats[(m + 1) % 3]} castShadow><icosahedronGeometry args={[1.0, 1]} /></mesh>
      <mesh position={[-0.7, 3.2, -0.3]} material={mats[(m + 2) % 3]} castShadow><icosahedronGeometry args={[0.9, 1]} /></mesh>
    </group>
  )
}

function Palm({ x, z, s = 1 }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.7, 0]} material={MAT.bark} castShadow><cylinderGeometry args={[0.1, 0.17, 3.4, 6]} /></mesh>
      {Array.from({ length: 8 }, (_, k) => (
        <group key={k} position={[0, 3.4, 0]} rotation={[0, (k * Math.PI * 2) / 8, 0]}>
          <mesh position={[0.8, -0.12, 0]} rotation={[0, 0, -0.5]} scale={[1, 0.18, 0.4]} material={MAT.g3} castShadow><sphereGeometry args={[1, 8, 6]} /></mesh>
        </group>
      ))}
    </group>
  )
}

function Shrub({ x, z, s = 1, flower }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.35, 0]} scale={[1, 0.7, 1]} material={MAT.g2} castShadow><icosahedronGeometry args={[0.55, 1]} /></mesh>
      {flower && [[0.25, 0.7, 0.1], [-0.2, 0.62, 0.25], [0.05, 0.75, -0.2]].map((f, n) => <mesh key={n} position={f}><sphereGeometry args={[0.1, 6, 6]} /><meshStandardMaterial color={flower} /></mesh>)}
    </group>
  )
}

const YARD = [[-11, -9, 1.1], [11, -8, 1.2], [-12.5, 6, 1.0], [12.5, 10, 1.1], [0, -13, 1.3], [-7, 15, 0.9], [8, 16, 1.0]]

function Boundary() {
  const L = 16, F = 22, B = -16
  const run = [[-9.2, F, 13.6, 0.3], [9.2, F, 13.6, 0.3], [0, B, 2 * L + 0.3, 0.3], [-L, 3, 0.3, F - B], [L, 3, 0.3, F - B]]
  return (
    <>
      {run.map(([x, z, w, d], n) => (
        <group key={n}>
          <Slab pos={[x, 0.5, z]} size={[w, 1.0, d]} mat={MAT.pillar} />
          <Slab pos={[x, 1.04, z]} size={[w + 0.1, 0.08, d + 0.1]} mat={MAT.cap} r={0.01} />
        </group>
      ))}
      {[-2.6, 2.6].map((x) => (
        <group key={x}>
          <Slab pos={[x, 0.85, F]} size={[0.6, 1.7, 0.6]} mat={MAT.pillar} />
          <Slab pos={[x, 1.74, F]} size={[0.72, 0.08, 0.72]} mat={MAT.cap} r={0.01} />
          <mesh position={[x, 1.9, F]} material={MAT.glow}><boxGeometry args={[0.3, 0.22, 0.3]} /></mesh>
        </group>
      ))}
    </>
  )
}

function Env({ p }) {
  const g = useRef()
  const trees = useMemo(() => {
    const r = rng(7), out = []
    for (let n = 0; n < 30; n++) {
      const a = r() * Math.PI * 2, d = 20 + r() * 26
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
        <Slab pos={[0, 0.02, 16]} size={[3.6, 0.04, 20]} mat={MAT.paver} shadow={false} r={0} />
        <Slab pos={[0, 0.15, Z + 1.4]} size={[5.4, 0.3, 2.8]} mat={MAT.path} />
        <Slab pos={[0, 0.05, Z + 3.0]} size={[3.8, 0.1, 0.5]} mat={MAT.path} />
        <Slab pos={[0, 0.1, Z + 2.7]} size={[3.8, 0.2, 0.5]} mat={MAT.path} />
        {[-1, 1].flatMap((sx) => [[1.5, 6.7], [3.0, 6.7], [4.6, 6.7], [4.4, 6.0], [6.2, 9.5], [7.5, 12]].map(([x, z], n) => <Shrub key={`${sx}${n}`} x={sx * x} z={z} s={0.9 + (n % 2) * 0.3} flower={n % 2 ? '#d9605a' : '#e8a2b4'} />))}
        <Palm x={-6.6} z={7.2} s={1.1} /><Palm x={6.6} z={7.2} s={1.0} /><Palm x={-8.5} z={2} s={1.2} /><Palm x={8.5} z={3} s={1.1} />
        {[-2.3, 2.3].flatMap((x) => [10, 14, 18].map((z) => <mesh key={`${x}${z}`} position={[x, 0.35, z]} material={MAT.glow}><cylinderGeometry args={[0.07, 0.07, 0.7, 8]} /></mesh>))}
        <Boundary />
        {YARD.map(([x, z, s], n) => <Tree key={`y${n}`} x={x} z={z} s={s} m={n} />)}
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
    <Canvas shadows="soft" dpr={[1, 1.75]} camera={{ fov: 40, near: 0.1, far: 500, position: [4, 3.2, 17] }} frameloop={active ? 'always' : 'never'}
      onCreated={({ gl }) => { gl.toneMappingExposure = 1.05 }}>
      <color attach="background" args={['#e3d3bd']} />
      <fog attach="fog" args={['#f2dcc0', 45, 150]} />
      <Rig progress={progress} p={p} />
      <Sky /><EnvMap /><Lights p={p} />
      <Lamp pos={[0, 2.6, 4.6]} p={p} /><Lamp pos={[-3.3, 2.6, 3.3]} p={p} /><Lamp pos={[3.3, 2.6, 3.6]} p={p} /><Lamp pos={[3.3, 2.6, -0.2]} p={p} />
      <Lamp pos={[0, 2.8, 7.6]} p={p} max={16} /><Lamp pos={[-3.3, 2.6, -4.2]} p={p} max={22} /><Lamp pos={[3.3, 2.6, -4.2]} p={p} max={22} /><Lamp pos={[-3.3, 2.6, -0.85]} p={p} max={22} />
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
