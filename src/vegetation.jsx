// Tropical planting: areca and coconut-style palms, broadleaf canopy trees, banana plants, flowering shrubs and grass.
// Everything is generated in code and drawn with instancing (a handful of draw calls), with a light breeze in the shader.
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { LOW } from './quality'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const windU = { value: 0 }
const rad = (d) => (d * Math.PI) / 180
const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

const sway = (mat, amp) => {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = windU
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;
#else
  float ph = 0.0;
#endif
  transformed.x += sin(uTime * 1.4 + ph + position.y) * ${amp.toFixed(3)} * uv.y;
  transformed.z += cos(uTime * 1.1 + ph) * ${(amp * 0.6).toFixed(3)} * uv.y;`)
  }
  mat.customProgramCacheKey = () => `sway${amp}`
  return mat
}

const canvasTex = (w, h, draw) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

/* --------------------------------------------------------------- geometry */
function strip(rows, pos, col, uv, idx) {
  const base = pos.length / 3
  rows.forEach((r) => { pos.push(r.a.x, r.a.y, r.a.z, r.b.x, r.b.y, r.b.z); col.push(r.c.r, r.c.g, r.c.b, r.c.r, r.c.g, r.c.b); uv.push(0, r.t, 1, r.t) })
  for (let i = 0; i < rows.length - 1; i++) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2) }
}
const finish = (pos, col, uv, idx) => {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx); g.computeVertexNormals()
  return g
}

// One pinnate palm frond: an arching rachis with paired, drooping leaflets
function buildFrond(rand) {
  const L = 3.0, rise = 1.0, droop = 1.9, n = 32
  const pos = [], col = [], uv = [], idx = []
  const P = (t) => new THREE.Vector3(L * t, rise * t - droop * t * t, 0)
  const cBase = new THREE.Color('#2c5a28'), cTip = new THREE.Color('#6aa83f'), cRib = new THREE.Color('#5d7240'), Z = new THREE.Vector3(0, 0, 1)
  const rr = []
  for (let i = 0; i <= 16; i++) { const t = i / 16, p = P(t), w = 0.022 * (1 - 0.7 * t); rr.push({ a: p.clone().addScaledVector(Z, -w), b: p.clone().addScaledVector(Z, w), c: cRib, t }) }
  strip(rr, pos, col, uv, idx)
  for (let i = 0; i < n; i++) {
    const t = 0.13 + (0.87 * i) / (n - 1), p = P(t), T = P(t + 0.002).sub(P(t - 0.002)).normalize(), U = new THREE.Vector3(-T.y, T.x, 0)
    for (const side of [-1, 1]) {
      const d = new THREE.Vector3().addScaledVector(T, 0.5).addScaledVector(Z, side * 0.86).addScaledVector(U, -0.28).normalize()
      const len = (0.25 + 0.78 * Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * t)), 0.9)) * (0.92 + rand() * 0.16), w = 0.085 * (0.8 + rand() * 0.4)
      const rows = []
      for (let s = 0; s <= 3; s++) {
        const f = s / 3, c = p.clone().addScaledVector(d, len * f).addScaledVector(U, -len * 0.22 * f * f)
        const hw = T.clone().multiplyScalar(w * [1, 0.95, 0.7, 0.12][s])
        rows.push({ a: c.clone().sub(hw), b: c.clone().add(hw), c: cBase.clone().lerp(cTip, Math.min(1, t * 0.6 + f * 0.4 + rand() * 0.1)), t })
      }
      strip(rows, pos, col, uv, idx)
    }
  }
  return finish(pos, col, uv, idx)
}

// Banana leaf: a long arching blade with a lighter midrib
function buildBanana() {
  const L = 2.6, rise = 1.1, droop = 1.4
  const pos = [], col = [], uv = [], idx = []
  const Z = new THREE.Vector3(0, 0, 1), edge = new THREE.Color('#2f6a2a'), mid = new THREE.Color('#74b04c'), tip = new THREE.Color('#5aa03a')
  const left = [], right = []
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, c = new THREE.Vector3(L * t, rise * t - droop * t * t, 0), w = 0.42 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.15 * t) + 0.015
    const ce = edge.clone().lerp(tip, t * 0.6), cm = mid.clone().lerp(tip, t * 0.4)
    const m = c.clone().add(new THREE.Vector3(0, 0.05, 0))
    left.push({ a: c.clone().addScaledVector(Z, -w).add(new THREE.Vector3(0, -w * 0.25, 0)), b: m, c: ce, t })
    right.push({ a: m.clone(), b: c.clone().addScaledVector(Z, w).add(new THREE.Vector3(0, -w * 0.25, 0)), c: cm, t })
  }
  strip(left, pos, col, uv, idx); strip(right, pos, col, uv, idx)
  return finish(pos, col, uv, idx)
}

const trunkGeo = (rt, rb) => {
  const g = new THREE.CylinderGeometry(rt, rb, 1, 8, 10, true); g.translate(0, 0.5, 0)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + 0.05 * Math.sin(Math.PI * p.getY(i) * 0.9))
  g.computeVertexNormals()
  return g
}

/* --------------------------------------------------------- placement plan */
const PAL = ['#3f7a35', '#4f8a3c', '#2f6a30', '#5f9a44', '#6fa84e', '#7aa83a']
function build() {
  const r = rng(11)
  const M = (x, y, z, rx, ry, rz, sx, sy = sx, sz = sx, order = 'XYZ') =>
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, order)), new THREE.Vector3(sx, sy, sz))
  const o = { areca: { t: [], f: [] }, coco: { t: [], f: [] }, bark: [], core: [], leaves: [], leafC: [], stem: [], banana: [], flowers: [], flowerC: [], grass: [], grassC: [] }

  const palm = (kind, x, z, h, fr, fs) => {
    const lean = (r() - 0.5) * 0.22, ry = r() * 6.28, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, lean, 'YZX'))
    o[kind].t.push(M(x, 0, z, 0, ry, lean, 1, h, 1, 'YZX'))
    const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(new THREE.Vector3(x, 0, z))
    for (let i = 0; i < fr; i++) {
      const yaw = i * 2.4 + r() * 0.25, tilt = rad(62 - 66 * Math.pow(i / (fr - 1), 0.85) + (r() - 0.5) * 10), s = fs * (0.82 + 0.3 * (i / fr)) * (0.92 + r() * 0.16)
      o[kind].f.push(M(top.x, top.y, top.z, 0, yaw, tilt, s, s, s, 'YZX'))
    }
  }
  const leafBall = (cx, cy, cz, rx, ry, count, size, flat) => {
    for (let i = 0; i < count; i++) {
      const v = r() * 2 - 1, a = r() * 6.283, rr = Math.pow(r(), 0.4), k = Math.sqrt(1 - v * v)
      const py = v * rr
      if (py < flat) continue
      const sc = size * (0.85 + r() * 0.7)
      o.leaves.push(M(cx + k * Math.cos(a) * rr * rx, cy + py * ry, cz + k * Math.sin(a) * rr * rx, (r() - 0.5) * 2.4, r() * 6.28, (r() - 0.5) * 2.4, sc))
      o.leafC.push(new THREE.Color(PAL[(r() * PAL.length) | 0]).offsetHSL(0, 0, (r() - 0.5) * 0.06))
    }
  }
  const tree = (x, z, s) => {
    const th = 2.8 * s, cy = th + 1.9 * s, rx = 1.9 * s, ry = 2.3 * s
    o.bark.push(M(x, 0, z, 0, r() * 6, 0, 0.8 * s, th, 0.8 * s))
    o.core.push(M(x, cy, z, 0, 0, 0, rx * 0.78, ry * 0.78, rx * 0.78))
    leafBall(x, cy, z, rx, ry, LOW ? 110 : 220, s, -0.55)
  }
  const shrub = (x, z, s, flower) => {
    leafBall(x, 0.45 * s, z, 0.65 * s, 0.5 * s, LOW ? 34 : 64, s * 0.8, -0.2)
    if (flower) for (let j = 0; j < 4; j++) { o.flowers.push(M(x + (r() - 0.5) * 0.7 * s, 0.85 * s + r() * 0.1, z + (r() - 0.5) * 0.7 * s, 0, 0, 0, 0.09)); o.flowerC.push(new THREE.Color(flower)) }
  }
  const banana = (x, z, s) => {
    o.stem.push(M(x, 0, z, 0, 0, 0, 2.2 * s, 1.5 * s, 2.2 * s))
    const n = 6 + ((r() * 3) | 0)
    for (let i = 0; i < n; i++) { const sc = s * (0.85 + r() * 0.35); o.banana.push(M(x, 1.4 * s, z, 0, i * 2.4 + r() * 0.5, rad(38 + r() * 35), sc, sc, sc, 'YZX')) }
  }

  // A lighter planting, kept to the sides and back so the front of the house and the approach stay open.
  // Slim areca palms (like the reference plant) frame the house, a few slender coconut-style palms and canopy trees stand behind it.
  ;[[-9.2, 6.8], [9.2, 6.8], [-9.8, -1], [10, 1], [-8, -8.5], [8.4, -9]].forEach(([x, z]) =>
    [[0, 0, 5.0], [0.7, 0.5, 3.8]].forEach(([dx, dz, h]) => palm('areca', x + dx, z + dz, h * (0.9 + r() * 0.2), 9, 0.85)))
  ;[[-12.8, 5, 8], [13, 3, 8.5], [-11.5, -12, 9], [11.8, -13, 8], [0, -15, 8.5]].forEach(([x, z, h]) => palm('coco', x, z, h, 11, 1.1))
  ;[[-3.5, -13.8, 1.0], [4.5, -13.5, 1.0]].forEach(([x, z, s]) => tree(x, z, s))
  ;[[-10.2, -4.2, 1], [10.6, -3.6, 1], [-5.2, -12, 1], [7.2, -11.6, 1.1]].forEach(([x, z, s]) => banana(x, z, s))
  for (let i = 0; i < (LOW ? 14 : 30); i++) { // the wider landscape, behind the house only
    const a = r() * 6.283, d = 30 + r() * 18, x = Math.cos(a) * d, z = Math.sin(a) * d
    if (z > 0) continue
    if (r() < 0.6) palm('coco', x, z, 7 + r() * 4, 11, 1.1 + r() * 0.2); else tree(x, z, 1.1 + r() * 0.5)
  }
  for (let z = 9; z <= 20; z += 1.7) [-1, 1].forEach((sx) => shrub(sx * 2.75, z, 0.9 + r() * 0.3, r() < 0.5 ? '#d83a4a' : '#f06a8a')) // hedge along the drive
  ;[[3.6, 7.0], [4.8, 6.4], [5.4, 8.6], [4.2, 9.6]].forEach(([x, z]) => [-1, 1].forEach((sx) => shrub(sx * x, z, 1.0 + r() * 0.3, r() < 0.5 ? '#f2a33a' : '#d83a4a')))

  let n = 0, tries = 0 // lawn grass tufts, kept clear of the house, porch and drive
  while (n < (LOW ? 700 : 3200) && tries < 30000) {
    tries++
    const x = (r() - 0.5) * 34, z = -16 + r() * 38
    if ((Math.abs(x) < 6.2 && z > -6.4 && z < 6.6) || (Math.abs(x) < 2.3 && z > 5) || (z > 5 && z < 9 && Math.abs(x) < 3.2)) continue
    o.grass.push(M(x, 0, z, 0, r() * 6.28, 0, 1 + r() * 0.6, 0.22 + r() * 0.28, 1 + r() * 0.6)); o.grassC.push(new THREE.Color().setScalar(0.8 + r() * 0.4)); n++
  }
  return o
}

/* ------------------------------------------------------------ components */
function Instances({ geo, mat, matrices, colors, shadow = true }) {
  const ref = { current: null }
  const setRef = (m) => { ref.current = m }
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    matrices.forEach((mt, i) => m.setMatrixAt(i, mt))
    if (colors) { colors.forEach((c, i) => m.setColorAt(i, c)); if (m.instanceColor) m.instanceColor.needsUpdate = true }
    m.instanceMatrix.needsUpdate = true
  }, [matrices, colors])
  if (!matrices.length) return null
  return <instancedMesh ref={setRef} args={[geo, mat, matrices.length]} castShadow={shadow} frustumCulled={false} />
}

export default function Vegetation() {
  const { d, g, m } = useMemo(() => {
    const ring = canvasTex(32, 128, (c, w, h) => {
      c.fillStyle = '#b9b9a2'; c.fillRect(0, 0, w, h)
      for (let y = 0; y < h; y += 12) { c.fillStyle = 'rgba(70,70,50,.55)'; c.fillRect(0, y, w, 2.5) }
      for (let k = 0; k < 150; k++) { c.fillStyle = `rgba(60,60,40,${Math.random() * 0.12})`; c.fillRect(Math.random() * w, Math.random() * h, 1, 8) }
    })
    ring.wrapS = ring.wrapT = THREE.RepeatWrapping; ring.repeat.set(1, 6)
    const leaf = canvasTex(128, 128, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3d7a32'); gr.addColorStop(1, '#2a5a26'); c.fillStyle = gr
      c.beginPath(); c.moveTo(w * 0.5, h * 0.04); c.bezierCurveTo(w * 0.95, h * 0.3, w * 0.9, h * 0.75, w * 0.5, h * 0.97); c.bezierCurveTo(w * 0.1, h * 0.75, w * 0.05, h * 0.3, w * 0.5, h * 0.04); c.fill()
      c.strokeStyle = 'rgba(190,220,140,.7)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(w * 0.5, h * 0.06); c.lineTo(w * 0.5, h * 0.95); c.stroke()
      c.lineWidth = 1; c.strokeStyle = 'rgba(190,220,140,.35)'
      for (let i = 1; i < 6; i++) { const y = h * (0.15 + i * 0.13); c.beginPath(); c.moveTo(w * 0.5, y); c.lineTo(w * 0.18, y - h * 0.1); c.moveTo(w * 0.5, y); c.lineTo(w * 0.82, y - h * 0.1); c.stroke() }
    })
    const grass = canvasTex(64, 128, (c, w, h) => {
      for (let i = 0; i < 7; i++) {
        const x = ((i + 0.5) * w) / 7, lean = (Math.random() - 0.5) * 14, ht = h * (0.6 + Math.random() * 0.4)
        const gr = c.createLinearGradient(0, h, 0, h - ht); gr.addColorStop(0, '#2f5a22'); gr.addColorStop(1, '#8fc25a'); c.fillStyle = gr
        c.beginPath(); c.moveTo(x - 4, h); c.quadraticCurveTo(x - 1 + lean * 0.4, h - ht * 0.6, x + lean, h - ht); c.quadraticCurveTo(x + 1 + lean * 0.4, h - ht * 0.6, x + 4, h); c.fill()
      }
    })
    const blade = new THREE.PlaneGeometry(0.36, 1); blade.translate(0, 0.5, 0)
    const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o })
    return {
      d: build(),
      g: { frond: buildFrond(rng(5)), banana: buildBanana(), leaf: new THREE.PlaneGeometry(0.5, 0.34), tuft: mergeGeometries([0, 1, 2].map((i) => blade.clone().rotateY((i * Math.PI) / 3))),
        areca: trunkGeo(0.06, 0.11), coco: trunkGeo(0.08, 0.15), bark: trunkGeo(0.2, 0.3), core: new THREE.IcosahedronGeometry(1, 2), flower: new THREE.SphereGeometry(1, 8, 6) },
      m: {
        frond: sway(std({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }), 0.14), banana: sway(std({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.65 }), 0.1),
        leaf: sway(std({ map: leaf, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }), 0.07), grass: sway(std({ map: grass, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9 }), 0.06),
        areca: std({ map: ring, color: '#8d9a63' }), coco: std({ map: ring, color: '#a19680' }), bark: std({ color: '#6b5238', roughness: 0.95 }), stem: std({ map: ring, color: '#8aa45c' }),
        core: std({ color: '#2c5427', roughness: 0.95 }), flower: std({ color: '#ffffff', roughness: 0.5 }),
      },
    }
  }, [])
  return (
    <>
      <Instances geo={g.areca} mat={m.areca} matrices={d.areca.t} />
      <Instances geo={g.frond} mat={m.frond} matrices={d.areca.f} />
      <Instances geo={g.coco} mat={m.coco} matrices={d.coco.t} />
      <Instances geo={g.frond} mat={m.frond} matrices={d.coco.f} />
      <Instances geo={g.bark} mat={m.bark} matrices={d.bark} />
      <Instances geo={g.core} mat={m.core} matrices={d.core} />
      <Instances geo={g.leaf} mat={m.leaf} matrices={d.leaves} colors={d.leafC} />
      <Instances geo={g.areca} mat={m.stem} matrices={d.stem} />
      <Instances geo={g.banana} mat={m.banana} matrices={d.banana} />
      <Instances geo={g.flower} mat={m.flower} matrices={d.flowers} colors={d.flowerC} shadow={false} />
      <Instances geo={g.tuft} mat={m.grass} matrices={d.grass} colors={d.grassC} shadow={false} />
    </>
  )
}
