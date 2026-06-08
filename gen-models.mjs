// Modelos 3D propios (.glb) para el configurador AR de Korbax — v4 REALISTA.
// Texturas procedurales (madera/tela), bordes biselados y metal con brillo.
import { writeFileSync } from 'fs'
import zlib from 'zlib'

/* ════════ geometría ════════ */
function box(cx, cy, cz, sx, sy, sz) {
  const x = sx / 2, y = sy / 2, z = sz / 2
  const faces = [
    { n: [1, 0, 0],  v: [[x, -y, -z], [x, -y, z], [x, y, z], [x, y, -z]] },
    { n: [-1, 0, 0], v: [[-x, -y, z], [-x, -y, -z], [-x, y, -z], [-x, y, z]] },
    { n: [0, 1, 0],  v: [[-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z]] },
    { n: [0, -1, 0], v: [[-x, -y, z], [x, -y, z], [x, -y, -z], [-x, -y, -z]] },
    { n: [0, 0, 1],  v: [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]] },
    { n: [0, 0, -1], v: [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]] },
  ]
  const pos = [], nrm = [], uv = [], idx = []
  faces.forEach(f => {
    const base = pos.length / 3
    f.v.forEach(p => { pos.push(p[0] + cx, p[1] + cy, p[2] + cz); nrm.push(...f.n) })
    uv.push(0, 0, 1, 0, 1, 1, 0, 1)
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3)
  })
  return { pos, nrm, uv, idx }
}
// Caja con bordes biselados (chaflán) → se ve mucho menos "CG"
function bbox(cx, cy, cz, sx, sy, sz, bev = 0.014) {
  const h = [sx / 2, sy / 2, sz / 2]
  const b = Math.min(bev, 0.45 * Math.min(h[0], h[1], h[2]))
  const c = [cx, cy, cz]
  const signs = []
  for (const sx2 of [-1, 1]) for (const sy2 of [-1, 1]) for (const sz2 of [-1, 1]) signs.push([sx2, sy2, sz2])
  // vértice de un corner sobre la cara 'axis' (coord de ese eje al máximo, las otras dos metidas b)
  const cv = (s, axis) => [0, 1, 2].map(k => c[k] + s[k] * (h[k] - (k === axis ? 0 : b)))
  const pos = [], nrm = [], uv = [], idx = []
  const tri = (a, b2, d) => { const base = pos.length / 3;[a, b2, d].forEach(p => { pos.push(...p.pos); nrm.push(...p.n); uv.push(...p.uv) }); idx.push(base, base + 1, base + 2) }
  const quad = (a, b2, d, e) => { tri(a, b2, d); tri(a, d, e) }
  const N = (v) => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l] }
  // 6 caras principales
  for (let axis = 0; axis < 3; axis++) for (const side of [-1, 1]) {
    const nrmF = [0, 0, 0]; nrmF[axis] = side
    const corners = signs.filter(s => s[axis] === side)
    // ordenar para quad coherente
    const o1 = (axis + 1) % 3, o2 = (axis + 2) % 3
    corners.sort((A, B) => (A[o1] - B[o1]) || (A[o2] - B[o2]))
    const [p00, p01, p10, p11] = corners.map(s => cv(s, axis))
    const mk = (p) => ({ pos: p, n: nrmF, uv: [(p[o1] - c[o1]) / sx + 0.5, (p[o2] - c[o2]) / sy + 0.5] })
    quad(mk(p00), mk(p10), mk(p11), mk(p01))
  }
  // 12 biseles (uno por arista)
  for (let a = 0; a < 3; a++) for (let bx = a + 1; bx < 3; bx++) for (const sa of [-1, 1]) for (const sb of [-1, 1]) {
    const cc = 3 - a - bx // tercer eje
    const P = [0, 0, 0]; P[a] = sa; P[bx] = sb; P[cc] = -1
    const Q = [0, 0, 0]; Q[a] = sa; Q[bx] = sb; Q[cc] = 1
    const nA = [0, 0, 0]; nA[a] = sa; const nB = [0, 0, 0]; nB[bx] = sb
    const n = N([nA[0] + nB[0], nA[1] + nB[1], nA[2] + nB[2]])
    const mk = (p) => ({ pos: p, n, uv: [0.5, 0.5] })
    quad(mk(cv(P, a)), mk(cv(P, bx)), mk(cv(Q, bx)), mk(cv(Q, a)))
  }
  // 8 esquinas (triángulo)
  for (const s of signs) {
    const n = N(s)
    const mk = (axis) => ({ pos: cv(s, axis), n, uv: [0.5, 0.5] })
    tri(mk(0), mk(1), mk(2))
  }
  return { pos, nrm, uv, idx }
}
function quadZ(cx, cy, cz, w, h) {
  const x = w / 2, y = h / 2
  return { pos: [-x + cx, -y + cy, cz, x + cx, -y + cy, cz, x + cx, y + cy, cz, -x + cx, y + cy, cz],
    nrm: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], uv: [0, 1, 1, 1, 1, 0, 0, 0], idx: [0, 1, 2, 0, 2, 3] }
}
function quadY(cx, cy, cz, w, d) {
  const x = w / 2, z = d / 2
  return { pos: [-x + cx, cy, z + cz, x + cx, cy, z + cz, x + cx, cy, -z + cz, -x + cx, cy, -z + cz],
    nrm: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], uv: [0, 1, 1, 1, 1, 0, 0, 0], idx: [0, 1, 2, 0, 2, 3] }
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
function tube(p0, p1, r, seg = 32, r1 = r) {
  // r = radio en p0, r1 = radio en p1 (cónico si difieren → patas de mueble real)
  const d = norm([p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]])
  const up = Math.abs(d[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0]
  const u = norm(cross(up, d)), v = cross(d, u)
  const pos = [], nrm = [], uv = [], idx = []
  const ring = (a, rad) => [u[0] * Math.cos(a) * rad + v[0] * Math.sin(a) * rad, u[1] * Math.cos(a) * rad + v[1] * Math.sin(a) * rad, u[2] * Math.cos(a) * rad + v[2] * Math.sin(a) * rad]
  for (let i = 0; i <= seg; i++) {
    const a = 2 * Math.PI * i / seg, off0 = ring(a, r), off1 = ring(a, r1), n = norm(ring(a, 1))
    pos.push(p0[0] + off0[0], p0[1] + off0[1], p0[2] + off0[2]); nrm.push(...n); uv.push(i / seg, 0)
    pos.push(p1[0] + off1[0], p1[1] + off1[1], p1[2] + off1[2]); nrm.push(...n); uv.push(i / seg, 1)
  }
  for (let i = 0; i < seg; i++) { const b = i * 2; idx.push(b, b + 1, b + 3, b, b + 3, b + 2) }
  for (const [cp, nd, flip, rad] of [[p0, [-d[0], -d[1], -d[2]], false, r], [p1, [d[0], d[1], d[2]], true, r1]]) {
    const ci = pos.length / 3
    pos.push(...cp); nrm.push(...nd); uv.push(0.5, 0.5)
    for (let i = 0; i <= seg; i++) { const a = 2 * Math.PI * i / seg, off = ring(a, rad); pos.push(cp[0] + off[0], cp[1] + off[1], cp[2] + off[2]); nrm.push(...nd); uv.push(0.5, 0.5) }
    for (let i = 0; i < seg; i++) { if (flip) idx.push(ci, ci + 2 + i, ci + 1 + i); else idx.push(ci, ci + 1 + i, ci + 2 + i) }
  }
  return { pos, nrm, uv, idx }
}
function rotX(g, deg, py, pz) {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a)
  const pos = [], nrm = []
  for (let i = 0; i < g.pos.length; i += 3) {
    const y = g.pos[i + 1] - py, z = g.pos[i + 2] - pz
    pos.push(g.pos[i], py + y * c - z * s, pz + y * s + z * c)
    const ny = g.nrm[i + 1], nz = g.nrm[i + 2]
    nrm.push(g.nrm[i], ny * c - nz * s, ny * s + nz * c)
  }
  return { pos, nrm, uv: g.uv.slice(), idx: g.idx.slice() }
}
function merge(parts) {
  const m = { pos: [], nrm: [], uv: [], idx: [] }
  parts.forEach(p => { const base = m.pos.length / 3; m.pos.push(...p.pos); m.nrm.push(...p.nrm); m.uv.push(...p.uv); p.idx.forEach(i => m.idx.push(i + base)) })
  return m
}
const lerp = (a, b, t) => a + (b - a) * t
// Cojín/almohadón: cubo esferizado (caras planas al centro, cantos abultados) → tapicería real, no caja
function roundBox(cx, cy, cz, sx, sy, sz, t = 0.45, seg = 8) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2
  const pos = [], nrm = [], uv = [], idx = []
  const sph = (x, y, z) => {
    const x2 = x * x, y2 = y * y, z2 = z * z
    return [x * Math.sqrt(1 - y2 / 2 - z2 / 2 + y2 * z2 / 3), y * Math.sqrt(1 - z2 / 2 - x2 / 2 + z2 * x2 / 3), z * Math.sqrt(1 - x2 / 2 - y2 / 2 + x2 * y2 / 3)]
  }
  const face = (ua, va, wa, ws) => {
    const base = pos.length / 3
    for (let i = 0; i <= seg; i++) for (let j = 0; j <= seg; j++) {
      const c = [0, 0, 0]; c[ua] = i / seg * 2 - 1; c[va] = j / seg * 2 - 1; c[wa] = ws
      const s = sph(c[0], c[1], c[2]), nl = Math.hypot(s[0], s[1], s[2]) || 1
      pos.push(lerp(c[0], s[0], t) * hx + cx, lerp(c[1], s[1], t) * hy + cy, lerp(c[2], s[2], t) * hz + cz)
      nrm.push(s[0] / nl, s[1] / nl, s[2] / nl); uv.push(i / seg, j / seg)
    }
    for (let i = 0; i < seg; i++) for (let j = 0; j < seg; j++) {
      const a = base + i * (seg + 1) + j, b = a + 1, cc = a + (seg + 1), d = cc + 1
      if (ws > 0) idx.push(a, cc, b, b, cc, d); else idx.push(a, b, cc, b, d, cc)
    }
  }
  face(1, 2, 0, 1); face(1, 2, 0, -1); face(0, 2, 1, 1); face(0, 2, 1, -1); face(0, 1, 2, 1); face(0, 1, 2, -1)
  return { pos, nrm, uv, idx }
}

/* ════════ texturas procedurales (PNG vía zlib) ════════ */
function crc32(buf) {
  let c; const t = []
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = t[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}
function pngRGB(w, h, fn) {
  const raw = Buffer.alloc(h * (1 + w * 3))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y)
      const o = y * (1 + w * 3) + 1 + x * 3
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b
    }
  }
  const idat = zlib.deflateSync(raw)
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0); return Buffer.concat([len, td, crc]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}
const clamp = (v) => Math.max(0, Math.min(255, v | 0))
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const TS = 256 // resolución de texturas (con tileado basta; el relieve lo da el normal map)
// ── ruido de valor periódico (tileable) → grano orgánico, no ondas matemáticas ──
const fade = t => t * t * (3 - 2 * t)
const nhash = (xi, yi, P, s) => { xi = ((xi % P) + P) % P; yi = ((yi % P) + P) % P; const n = Math.sin(xi * 127.1 + yi * 311.7 + s * 57.3) * 43758.5453; return n - Math.floor(n) }
const noise2 = (x, y, P, s) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = fade(xf), v = fade(yf); return lerp(lerp(nhash(xi, yi, P, s), nhash(xi + 1, yi, P, s), u), lerp(nhash(xi, yi + 1, P, s), nhash(xi + 1, yi + 1, P, s), u), v) }
// fbm tileable: x,y en 0..1; base = nº de celdas (entero); oct = octavas
const fbm = (x, y, base, oct) => { let sum = 0, amp = 0.5, f = base, tot = 0; for (let i = 0; i < oct; i++) { sum += amp * noise2(x * f, y * f, f, i); tot += amp; amp *= 0.5; f *= 2 } return sum / tot }
// alturas (heightfields) tileables en coords de pixel (0..TS) → de aquí salen color y normal map
const hWood = (px, py) => {
  const x = px / TS, y = py / TS
  const warp = (fbm(x, y, 4, 3) - 0.5)                       // ondulación natural de la veta
  const ring = 0.5 + 0.5 * Math.sin(2 * Math.PI * (8 * y + 1.6 * warp)) // líneas de veta a lo largo de X
  const pore = fbm(x * 2, y * 12, 8, 3)                      // poros finos estirados (anisotrópico)
  return clamp01(0.18 + 0.42 * ring + 0.4 * pore)
}
const hFab = (px, py) => {
  const x = px / TS, y = py / TS
  const N = 18                                               // nº de hilos
  const sx = Math.sin(2 * Math.PI * N * x), sy = Math.sin(2 * Math.PI * N * y)
  const weave = (sx * sy > 0) ? (0.5 + 0.5 * sx) : (0.5 + 0.5 * sy) // over-under (trama/urdimbre)
  const fuzz = fbm(x * 4, y * 4, 16, 2)                      // irregularidad del tejido
  return clamp01(0.3 + 0.5 * weave + 0.2 * fuzz)
}
// madera: grano vertical (grayscale; el color real lo da baseColorFactor)
const TEX_WOOD = pngRGB(TS, TS, (x, y) => {
  let v = 0.82 + 0.16 * (hWood(x, y) - 0.5) + (Math.random() - 0.5) * 0.03
  const g = clamp(v * 255); return [g, g, g]
})
// tela: tejido fino (grayscale)
const TEX_FABRIC = pngRGB(TS, TS, (x, y) => {
  let v = 0.83 + 0.12 * (hFab(x, y) - 0.5) + (Math.random() - 0.5) * 0.045
  const g = clamp(v * 255); return [g, g, g]
})
// normal map a partir de un heightfield (relieve real bajo la luz)
function normalMap(w, h, hf, strength) {
  return pngRGB(w, h, (x, y) => {
    const hL = hf((x - 1 + w) % w, y), hR = hf((x + 1) % w, y)
    const hD = hf(x, (y - 1 + h) % h), hU = hf(x, (y + 1) % h)
    let nx = (hL - hR) * strength, ny = (hD - hU) * strength, nz = 1
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l
    return [clamp((nx * 0.5 + 0.5) * 255), clamp((ny * 0.5 + 0.5) * 255), clamp((nz * 0.5 + 0.5) * 255)]
  })
}
const NRM_WOOD   = normalMap(TS, TS, hWood, 2.2)
const NRM_FABRIC = normalMap(TS, TS, hFab, 3.0)
const WHITE_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64')

/* ════════ materiales ════════ */
const MAT_DEFS = {
  fabric: { name: 'fabric', doubleSided: true, tex: 'fabric', nrm: 'nfabric', normalScale: 0.9, texScale: 4, metallic: 0, rough: 0.82, sheen: { color: [0.5, 0.5, 0.5], rough: 0.3 } },
  legs:   { name: 'legs', doubleSided: true, metallic: 1.0, rough: 0.38, factor: [0.6, 0.62, 0.66, 1] },
  wood:   { name: 'wood', doubleSided: true, tex: 'wood', nrm: 'nwood', normalScale: 0.55, texScale: 2, metallic: 0, rough: 0.5 },
  logo:   { name: 'logo', doubleSided: true, alphaMode: 'BLEND', tex: 'white', metallic: 0, rough: 0.6 },
}
const TEX_BYTES = { wood: TEX_WOOD, fabric: TEX_FABRIC, white: WHITE_PNG, nwood: NRM_WOOD, nfabric: NRM_FABRIC }

/* ════════ modelos ════════ */
function chair() {
  // patas cónicas (finas abajo) y ligeramente abiertas (splay): base ±0.20, top ±0.18
  const legParts = [
    tube([-0.20, 0, 0.20], [-0.18, 0.44, 0.18], 0.015, 32, 0.023), tube([0.20, 0, 0.20], [0.18, 0.44, 0.18], 0.015, 32, 0.023),
    tube([-0.20, 0, -0.20], [-0.18, 0.44, -0.18], 0.015, 32, 0.023), tube([0.20, 0, -0.20], [0.18, 0.44, -0.18], 0.015, 32, 0.023),
    tube([-0.19, 0.15, 0.19], [0.19, 0.15, 0.19], 0.012), tube([-0.19, 0.15, -0.19], [0.19, 0.15, -0.19], 0.012),
    tube([-0.19, 0.15, -0.19], [-0.19, 0.15, 0.19], 0.012), tube([0.19, 0.15, -0.19], [0.19, 0.15, 0.19], 0.012),
  ]
  const REC = -9, PY = 0.45, PZ = -0.19
  const posts = merge([tube([-0.18, 0.44, -0.18], [-0.175, 0.9, -0.18], 0.019, 32, 0.014), tube([0.18, 0.44, -0.18], [0.175, 0.9, -0.18], 0.019, 32, 0.014)])
  const legs = merge([...legParts, rotX(posts, REC, PY, PZ)])
  const seat = roundBox(0, 0.455, 0, 0.46, 0.08, 0.45, 0.4)
  const panel = roundBox(0, 0.70, -0.205, 0.40, 0.32, 0.06, 0.4)
  const fabric = merge([seat, rotX(panel, REC, PY, PZ)])
  const logo = rotX(quadZ(0, 0.70, -0.171, 0.40, 0.32), REC, PY, PZ) // por delante del cojín (cara en -0.18)
  return [{ m: 'fabric', g: fabric }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function table() { // mesa RECTANGULAR 1.2 × 0.75
  const TW = 1.2, TD = 0.75, TH = 0.735
  const wood = merge([
    roundBox(0, TH, 0, TW, 0.04, TD, 0.13, 12),
    bbox(0, TH - 0.04, 0.31, TW - 0.16, 0.06, 0.035), bbox(0, TH - 0.04, -0.31, TW - 0.16, 0.06, 0.035),
    bbox(0.55, TH - 0.04, 0, 0.035, 0.06, TD - 0.12), bbox(-0.55, TH - 0.04, 0, 0.035, 0.06, TD - 0.12),
  ])
  const lx = TW / 2 - 0.07, lz = TD / 2 - 0.07, h = TH - 0.045
  const legs = merge([
    tube([-lx, 0, -lz], [-lx, h, -lz], 0.02, 32, 0.03), tube([lx, 0, -lz], [lx, h, -lz], 0.02, 32, 0.03),
    tube([-lx, 0, lz], [-lx, h, lz], 0.02, 32, 0.03), tube([lx, 0, lz], [lx, h, lz], 0.02, 32, 0.03),
  ])
  const logo = quadY(0, TH + 0.021, 0, 0.9, 0.56)
  return [{ m: 'wood', g: wood }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function squareTable() { // mesacuad 0.72
  const S = 0.72, TH = 0.735, l = S / 2 - 0.06, h = TH - 0.045
  const wood = merge([
    roundBox(0, TH, 0, S, 0.04, S, 0.13, 12),
    bbox(0, TH - 0.04, 0.27, S - 0.14, 0.06, 0.035), bbox(0, TH - 0.04, -0.27, S - 0.14, 0.06, 0.035),
  ])
  const legs = merge([
    tube([-l, 0, -l], [-l, h, -l], 0.018, 32, 0.028), tube([l, 0, -l], [l, h, -l], 0.018, 32, 0.028),
    tube([-l, 0, l], [-l, h, l], 0.018, 32, 0.028), tube([l, 0, l], [l, h, l], 0.018, 32, 0.028),
  ])
  const logo = quadY(0, TH + 0.021, 0, 0.6, 0.6)
  return [{ m: 'wood', g: wood }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function confTable() { // mesaconf: larga 1.9 × 0.9 con patas tipo panel
  const TW = 1.9, TD = 0.9, TH = 0.74
  const wood = merge([roundBox(0, TH, 0, TW, 0.05, TD, 0.11, 12)])
  const legs = merge([
    bbox(-0.8, 0.35, 0, 0.05, 0.66, TD - 0.18, 0.012), bbox(0.8, 0.35, 0, 0.05, 0.66, TD - 0.18, 0.012),
    bbox(-0.8, 0.05, 0, 0.07, 0.06, TD - 0.08), bbox(0.8, 0.05, 0, 0.07, 0.06, TD - 0.08),
    tube([-0.8, 0.4, 0], [0.8, 0.4, 0], 0.03),
  ])
  const logo = quadY(0, TH + 0.026, 0, 1.4, 0.62)
  return [{ m: 'wood', g: wood }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function stackChair() { // sillapil: asiento fino, respaldo de listones, marco tubular
  const REC = -8, PY = 0.45, PZ = -0.19
  const seat = roundBox(0, 0.45, 0, 0.44, 0.06, 0.42, 0.35)
  const slat1 = bbox(0, 0.62, -0.19, 0.42, 0.07, 0.035, 0.015)
  const slat2 = bbox(0, 0.78, -0.19, 0.42, 0.07, 0.035, 0.015)
  const fabric = merge([seat, rotX(slat1, REC, PY, PZ), rotX(slat2, REC, PY, PZ)])
  const posts = merge([tube([-0.19, 0.45, -0.19], [-0.19, 0.82, -0.19], 0.016), tube([0.19, 0.45, -0.19], [0.19, 0.82, -0.19], 0.016)])
  const legs = merge([
    tube([-0.19, 0, 0.19], [-0.19, 0.45, 0.19], 0.018), tube([0.19, 0, 0.19], [0.19, 0.45, 0.19], 0.018),
    tube([-0.19, 0, -0.19], [-0.19, 0.45, -0.19], 0.018), tube([0.19, 0, -0.19], [0.19, 0.45, -0.19], 0.018),
    tube([-0.19, 0.16, 0.19], [0.19, 0.16, 0.19], 0.011), tube([-0.19, 0.16, -0.19], [0.19, 0.16, -0.19], 0.011),
    rotX(posts, REC, PY, PZ),
  ])
  const logo = rotX(quadZ(0, 0.70, -0.171, 0.40, 0.26), REC, PY, PZ)
  return [{ m: 'fabric', g: fabric }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function execChair() { // sillejec: base estrella 5 ruedas, columna, asiento+respaldo alto, apoyabrazos
  const star = []
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2, ex = Math.cos(a) * 0.30, ez = Math.sin(a) * 0.30
    star.push(tube([0, 0.06, 0], [ex, 0.045, ez], 0.022))
    star.push(tube([ex, 0.05, ez], [ex, 0.0, ez], 0.022, 14)) // rueda
  }
  const column = tube([0, 0.06, 0], [0, 0.42, 0], 0.035)
  const arms = [
    bbox(-0.27, 0.60, 0.04, 0.06, 0.05, 0.34, 0.02), bbox(0.27, 0.60, 0.04, 0.06, 0.05, 0.34, 0.02),
    tube([-0.27, 0.47, 0.04], [-0.27, 0.60, 0.04], 0.016), tube([0.27, 0.47, 0.04], [0.27, 0.60, 0.04], 0.016),
  ]
  const legs = merge([...star, column, ...arms])
  const REC = -6, PY = 0.5, PZ = -0.22
  const seat = roundBox(0, 0.47, 0.02, 0.5, 0.11, 0.48, 0.4)
  const back = rotX(roundBox(0, 0.80, -0.22, 0.46, 0.56, 0.09, 0.4), REC, PY, PZ)
  const fabric = merge([seat, back])
  const logo = rotX(quadZ(0, 0.82, -0.171, 0.40, 0.40), REC, PY, PZ)
  return [{ m: 'fabric', g: fabric }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function armchair() { // butaca individual (1 plaza)
  const REC = -9, PY = 0.42, PZ = -0.22
  const base = roundBox(0, 0.30, 0, 0.74, 0.22, 0.62, 0.3)
  const seatC = roundBox(0, 0.45, 0.03, 0.58, 0.14, 0.5, 0.45)
  const arms = merge([roundBox(-0.35, 0.48, 0, 0.1, 0.3, 0.6, 0.45), roundBox(0.35, 0.48, 0, 0.1, 0.3, 0.6, 0.45)])
  const back = rotX(roundBox(0, 0.62, -0.24, 0.62, 0.42, 0.14, 0.45), REC, PY, PZ)
  const fabric = merge([base, seatC, arms, back])
  const feet = merge([
    tube([-0.3, 0, 0.26], [-0.3, 0.2, 0.26], 0.028), tube([0.3, 0, 0.26], [0.3, 0.2, 0.26], 0.028),
    tube([-0.3, 0, -0.26], [-0.3, 0.2, -0.26], 0.028), tube([0.3, 0, -0.26], [0.3, 0.2, -0.26], 0.028),
  ])
  const logo = rotX(quadZ(0, 0.62, -0.151, 0.5, 0.30), REC, PY, PZ)
  return [{ m: 'fabric', g: fabric }, { m: 'legs', g: feet }, { m: 'logo', g: logo }]
}
function diningSet() { // set: mesa + 2 sillas
  const TH = 0.70, S = 0.66, tl = S / 2 - 0.06
  const wood = bbox(0, TH, 0, S, 0.04, S, 0.014)
  const tlegs = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tlegs.push(tube([sx * tl, 0, sz * tl], [sx * tl, TH - 0.045, sz * tl], 0.025))
  const seats = [], backs = [], clegs = []
  for (const [zc, bd] of [[0.6, 1], [-0.6, -1]]) {
    seats.push(roundBox(0, 0.43, zc, 0.4, 0.06, 0.4, 0.35))
    backs.push(roundBox(0, 0.56, zc + bd * 0.18, 0.4, 0.3, 0.06, 0.35))
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) clegs.push(tube([sx * 0.16, 0, zc + sz * 0.16], [sx * 0.16, 0.43, zc + sz * 0.16], 0.017))
  }
  const fabric = merge([...seats, ...backs])
  const legs = merge([...tlegs, ...clegs])
  const logo = quadY(0, TH + 0.021, 0, 0.5, 0.5)
  return [{ m: 'fabric', g: fabric }, { m: 'wood', g: wood }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function barSet() { // setbar: mesa alta redonda + 2 taburetes
  const H = 1.05
  const wood = merge([tube([0, H, 0], [0, H + 0.035, 0], 0.30, 40)])
  const legs = [tube([0, 0.05, 0], [0, H, 0], 0.04), tube([0, 0, 0], [0, 0.05, 0], 0.22, 32)]
  const sseats = []
  for (const sx of [-1, 1]) {
    const cx = sx * 0.62
    sseats.push(tube([cx, 0.66, 0], [cx, 0.72, 0], 0.16, 28))
    legs.push(tube([cx, 0.05, 0], [cx, 0.66, 0], 0.03))
    legs.push(tube([cx, 0, 0], [cx, 0.05, 0], 0.17, 28))
    legs.push(tube([cx - 0.13, 0.30, 0], [cx + 0.13, 0.30, 0], 0.012))
  }
  const fabric = merge(sseats)
  const logo = quadY(0, H + 0.036, 0, 0.46, 0.46)
  return [{ m: 'wood', g: wood }, { m: 'legs', g: merge(legs) }, { m: 'fabric', g: fabric }, { m: 'logo', g: logo }]
}
function stool() {
  const seat = tube([0, 0.66, 0], [0, 0.72, 0], 0.18, 32)
  const legs = merge([
    tube([0.10, 0.70, 0.10], [0.27, 0, 0.27], 0.022), tube([-0.10, 0.70, 0.10], [-0.27, 0, 0.27], 0.022),
    tube([0.10, 0.70, -0.10], [0.27, 0, -0.27], 0.022), tube([-0.10, 0.70, -0.10], [-0.27, 0, -0.27], 0.022),
    tube([0.19, 0.26, 0.19], [-0.19, 0.26, 0.19], 0.013), tube([0.19, 0.26, -0.19], [-0.19, 0.26, -0.19], 0.013),
    tube([0.19, 0.26, -0.19], [0.19, 0.26, 0.19], 0.013), tube([-0.19, 0.26, -0.19], [-0.19, 0.26, 0.19], 0.013),
  ])
  const logo = quadY(0, 0.721, 0, 0.36, 0.36) // asiento redondo Ø0.36
  return [{ m: 'fabric', g: seat }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function bench() {
  const REC = -9, PY = 0.45, PZ = -0.18, W = 1.2
  const seat = roundBox(0, 0.45, 0, W, 0.09, 0.44, 0.3)
  const panel = roundBox(0, 0.70, -0.205, W - 0.10, 0.30, 0.06, 0.35)
  const fabric = merge([seat, rotX(panel, REC, PY, PZ)])
  const posts = merge([
    tube([-0.52, 0.44, -0.18], [-0.52, 0.88, -0.18], 0.02), tube([0.52, 0.44, -0.18], [0.52, 0.88, -0.18], 0.02), tube([0, 0.44, -0.18], [0, 0.88, -0.18], 0.02),
  ])
  const legParts = [
    tube([-0.52, 0, 0.18], [-0.52, 0.44, 0.18], 0.024), tube([0.52, 0, 0.18], [0.52, 0.44, 0.18], 0.024),
    tube([-0.52, 0, -0.18], [-0.52, 0.44, -0.18], 0.024), tube([0.52, 0, -0.18], [0.52, 0.44, -0.18], 0.024),
    tube([0, 0, 0.18], [0, 0.44, 0.18], 0.024), tube([0, 0, -0.18], [0, 0.44, -0.18], 0.024),
    tube([-0.52, 0.13, 0.18], [0.52, 0.13, 0.18], 0.013), tube([-0.52, 0.13, -0.18], [0.52, 0.13, -0.18], 0.013),
  ]
  const legs = merge([...legParts, rotX(posts, REC, PY, PZ)])
  const logo = rotX(quadZ(0, 0.70, -0.171, 1.06, 0.30), REC, PY, PZ) // por delante del cojín
  return [{ m: 'fabric', g: fabric }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function roundTable() {
  const wood = merge([tube([0, 0.72, 0], [0, 0.755, 0], 0.5, 48)])
  const legs = merge([tube([0, 0.05, 0], [0, 0.72, 0], 0.05), tube([0, 0, 0], [0, 0.05, 0], 0.27, 36)])
  const logo = quadY(0, 0.756, 0, 1.0, 1.0) // tablero redondo Ø1.0 (esquinas del quad quedan transparentes)
  return [{ m: 'wood', g: wood }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function barTable() {
  const H = 1.05
  const wood = merge([tube([0, H, 0], [0, H + 0.035, 0], 0.34, 44)])
  const legs = merge([tube([0, 0.05, 0], [0, H, 0], 0.045), tube([0, 0, 0], [0, 0.05, 0], 0.24, 32)])
  const logo = quadY(0, H + 0.036, 0, 0.68, 0.68) // tablero redondo Ø0.68
  return [{ m: 'wood', g: wood }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function barCounter() {
  const wood = merge([bbox(0, 0.52, -0.02, 1.3, 1.0, 0.46, 0.02), bbox(0, 1.06, 0.04, 1.42, 0.05, 0.62, 0.015)])
  const legs = merge([box(0, 0.04, 0.18, 1.26, 0.08, 0.06)])
  const logo = quadZ(0, 0.6, 0.212, 1.1, 0.6)
  return [{ m: 'wood', g: wood }, { m: 'legs', g: legs }, { m: 'logo', g: logo }]
}
function sofa() {
  const REC = -9, PY = 0.42, PZ = -0.24
  const base = bbox(0, 0.30, 0, 1.4, 0.22, 0.66, 0.04)
  const seatC = merge([bbox(-0.34, 0.46, 0.03, 0.62, 0.12, 0.56, 0.055), bbox(0.34, 0.46, 0.03, 0.62, 0.12, 0.56, 0.055)])
  const arms = merge([bbox(-0.66, 0.5, 0, 0.12, 0.34, 0.66, 0.058), bbox(0.66, 0.5, 0, 0.12, 0.34, 0.66, 0.058)])
  const back = rotX(bbox(0, 0.66, -0.24, 1.28, 0.46, 0.16, 0.07), REC, PY, PZ)
  const fabric = merge([base, seatC, arms, back])
  const feet = merge([
    tube([-0.58, 0, 0.28], [-0.58, 0.2, 0.28], 0.03), tube([0.58, 0, 0.28], [0.58, 0.2, 0.28], 0.03),
    tube([-0.58, 0, -0.28], [-0.58, 0.2, -0.28], 0.03), tube([0.58, 0, -0.28], [0.58, 0.2, -0.28], 0.03),
  ])
  const logo = rotX(quadZ(0, 0.66, -0.151, 1.0, 0.34), REC, PY, PZ)
  return [{ m: 'fabric', g: fabric }, { m: 'legs', g: feet }, { m: 'logo', g: logo }]
}

/* ════════ empaquetado GLB ════════ */
function buildGLB(prims) {
  const matOrder = []
  prims.forEach(p => { if (!matOrder.includes(p.m)) matOrder.push(p.m) })
  const texKeys = []
  matOrder.forEach(k => { for (const t of [MAT_DEFS[k].tex, MAT_DEFS[k].nrm]) if (t && !texKeys.includes(t)) texKeys.push(t) })

  const bin = []; let offset = 0
  const bufferViews = [], accessors = []
  const align = () => { const pad = (4 - (offset % 4)) % 4; if (pad) { bin.push(Buffer.alloc(pad)); offset += pad } }
  const addView = (buf) => { align(); const bv = { buffer: 0, byteOffset: offset, byteLength: buf.length }; bufferViews.push(bv); bin.push(buf); offset += buf.length; return bufferViews.length - 1 }
  const f32 = arr => Buffer.from(Float32Array.from(arr).buffer)
  const u16 = arr => Buffer.from(Uint16Array.from(arr).buffer)
  const matIndex = Object.fromEntries(matOrder.map((k, i) => [k, i]))
  const texIndex = Object.fromEntries(texKeys.map((k, i) => [k, i]))

  const primitives = prims.map(p => {
    const g = p.g, n = g.pos.length / 3
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { const v = g.pos[i * 3 + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v }
    const posV = addView(f32(g.pos)), nrmV = addView(f32(g.nrm)), uvV = addView(f32(g.uv)), idxV = addView(u16(g.idx))
    const posA = accessors.push({ bufferView: posV, componentType: 5126, count: n, type: 'VEC3', min, max }) - 1
    const nrmA = accessors.push({ bufferView: nrmV, componentType: 5126, count: n, type: 'VEC3' }) - 1
    const uvA = accessors.push({ bufferView: uvV, componentType: 5126, count: n, type: 'VEC2' }) - 1
    const idxA = accessors.push({ bufferView: idxV, componentType: 5123, count: g.idx.length, type: 'SCALAR' }) - 1
    return { attributes: { POSITION: posA, NORMAL: nrmA, TEXCOORD_0: uvA }, indices: idxA, material: matIndex[p.m], mode: 4 }
  })

  let usesTransform = false, usesSheen = false
  const materials = matOrder.map(k => {
    const d = MAT_DEFS[k]
    const pbr = { baseColorFactor: d.factor || [1, 1, 1, 1], metallicFactor: d.metallic, roughnessFactor: d.rough }
    const xform = d.texScale ? { KHR_texture_transform: { scale: [d.texScale, d.texScale] } } : undefined
    if (d.tex) {
      pbr.baseColorTexture = { index: texIndex[d.tex] }
      if (xform) { usesTransform = true; pbr.baseColorTexture.extensions = xform }
    }
    const mat = { name: d.name, pbrMetallicRoughness: pbr, doubleSided: !!d.doubleSided }
    if (d.nrm) {
      mat.normalTexture = { index: texIndex[d.nrm], scale: d.normalScale ?? 1 }
      if (xform) { usesTransform = true; mat.normalTexture.extensions = xform }
    }
    if (d.sheen) {
      usesSheen = true
      mat.extensions = { ...(mat.extensions || {}), KHR_materials_sheen: { sheenColorFactor: d.sheen.color, sheenRoughnessFactor: d.sheen.rough } }
    }
    if (d.alphaMode) mat.alphaMode = d.alphaMode
    return mat
  })

  const gltf = { asset: { version: '2.0', generator: 'korbax-gen-v4' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives }], materials, accessors, bufferViews, buffers: [{ byteLength: 0 }] }
  const exts = []
  if (usesTransform) exts.push('KHR_texture_transform')
  if (usesSheen) exts.push('KHR_materials_sheen')
  if (exts.length) gltf.extensionsUsed = exts
  if (texKeys.length) {
    gltf.images = texKeys.map(k => ({ bufferView: addView(TEX_BYTES[k]), mimeType: 'image/png' }))
    gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }]
    gltf.textures = texKeys.map((_, i) => ({ source: i, sampler: 0 }))
  }
  let binBuf = Buffer.concat(bin)
  if (binBuf.length % 4) binBuf = Buffer.concat([binBuf, Buffer.alloc(4 - (binBuf.length % 4))])
  gltf.buffers[0].byteLength = binBuf.length
  let json = Buffer.from(JSON.stringify(gltf), 'utf8')
  if (json.length % 4) json = Buffer.concat([json, Buffer.alloc(4 - (json.length % 4), 0x20)])
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546C67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + json.length + 8 + binBuf.length, 8)
  const jH = Buffer.alloc(8); jH.writeUInt32LE(json.length, 0); jH.writeUInt32LE(0x4E4F534A, 4)
  const bH = Buffer.alloc(8); bH.writeUInt32LE(binBuf.length, 0); bH.writeUInt32LE(0x004E4942, 4)
  return Buffer.concat([header, jH, json, bH, binBuf])
}

const out = {
  silla: chair, sillapil: stackChair, sillejec: execChair, butaca: armchair,
  mesa: table, mesacuad: squareTable, mesaconf: confTable, mesaredonda: roundTable, mesaalta: barTable,
  taburete: stool, banca: bench, barra: barCounter,
  set: diningSet, setbar: barSet,
}
for (const [name, fn] of Object.entries(out)) writeFileSync(`public/models/${name}.glb`, buildGLB(fn()))
console.log('OK -> ' + Object.keys(out).join(', ') + ' (v4 realista)')
