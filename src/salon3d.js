// Generador de "salón" 3D en el navegador: arma un GLB con EXACTAMENTE las personas del aforo.
// Mesas + sillas + personas variadas (hombres/mujeres). Cabezas esféricas (sin cuadrado), color de tela = rubro.

/* ── geometría (sin texturas, color plano PBR + buenas normales) ── */
function boxG(cx, cy, cz, sx, sy, sz) {
  const x = sx / 2, y = sy / 2, z = sz / 2
  const F = [
    { n: [1, 0, 0], v: [[x, -y, -z], [x, -y, z], [x, y, z], [x, y, -z]] },
    { n: [-1, 0, 0], v: [[-x, -y, z], [-x, -y, -z], [-x, y, -z], [-x, y, z]] },
    { n: [0, 1, 0], v: [[-x, y, -z], [x, y, -z], [x, y, z], [-x, y, z]] },
    { n: [0, -1, 0], v: [[-x, -y, z], [x, -y, z], [x, -y, -z], [-x, -y, -z]] },
    { n: [0, 0, 1], v: [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]] },
    { n: [0, 0, -1], v: [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]] },
  ]
  const pos = [], nrm = [], idx = []
  F.forEach(f => { const b = pos.length / 3; f.v.forEach(p => { pos.push(p[0] + cx, p[1] + cy, p[2] + cz); nrm.push(...f.n) }); idx.push(b, b + 1, b + 2, b, b + 2, b + 3) })
  return { pos, nrm, idx }
}
function sphereG(cx, cy, cz, rx, ry, rz, seg = 14, thMax = Math.PI) {
  const pos = [], nrm = [], idx = []
  for (let i = 0; i <= seg; i++) {
    const th = i / seg * thMax
    for (let j = 0; j <= seg; j++) {
      const ph = j / seg * 2 * Math.PI
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.sin(ph)
      pos.push(cx + nx * rx, cy + ny * ry, cz + nz * rz); nrm.push(nx, ny, nz)
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + 1, c = a + seg + 1, d = c + 1; idx.push(a, c, b, b, c, d) }
  return { pos, nrm, idx }
}
function cylG(x, z, y0, y1, r, seg = 12) {
  const pos = [], nrm = [], idx = []
  for (let j = 0; j <= seg; j++) {
    const a = j / seg * 2 * Math.PI, nx = Math.cos(a), nz = Math.sin(a)
    pos.push(x + nx * r, y0, z + nz * r); nrm.push(nx, 0, nz)
    pos.push(x + nx * r, y1, z + nz * r); nrm.push(nx, 0, nz)
  }
  for (let j = 0; j < seg; j++) { const a = j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) }
  // tapas
  const top = pos.length / 3; pos.push(x, y1, z); nrm.push(0, 1, 0)
  for (let j = 0; j <= seg; j++) { const a = j / seg * 2 * Math.PI; pos.push(x + Math.cos(a) * r, y1, z + Math.sin(a) * r); nrm.push(0, 1, 0) }
  for (let j = 0; j < seg; j++) idx.push(top, top + 1 + j, top + 2 + j)
  return { pos, nrm, idx }
}
// quad horizontal (mesa, mira hacia arriba) — con UV para el logo
function quadTop(cx, cy, cz, w, d) {
  const x = w / 2, z = d / 2
  return { pos: [cx - x, cy, cz - z, cx + x, cy, cz - z, cx + x, cy, cz + z, cx - x, cy, cz + z], nrm: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], uv: [0, 0, 1, 0, 1, 1, 0, 1], idx: [0, 1, 2, 0, 2, 3] }
}
// quad vertical que mira hacia (nx,nz) — respaldo de silla
function quadFacing(cx, cy, cz, nx, nz, w, h) {
  const px = -nz, pz = nx, hx = px * w / 2, hz = pz * w / 2, hy = h / 2
  return { pos: [cx - hx, cy - hy, cz - hz, cx + hx, cy - hy, cz + hz, cx + hx, cy + hy, cz + hz, cx - hx, cy + hy, cz - hz], nrm: [nx, 0, nz, nx, 0, nz, nx, 0, nz, nx, 0, nz], uv: [0, 1, 1, 1, 1, 0, 0, 0], idx: [0, 1, 2, 0, 2, 3] }
}
function add(M, mat, g) {
  const b = M[mat] || (M[mat] = { pos: [], nrm: [], idx: [], uv: [] })
  const base = b.pos.length / 3
  for (const v of g.pos) b.pos.push(v)
  for (const v of g.nrm) b.nrm.push(v)
  for (const v of g.idx) b.idx.push(v + base)
  if (g.uv) for (const v of g.uv) b.uv.push(v)
}
// PNG blanco 2×2 (ranura de textura del logo; ARModal le pone el logo real encima)
function whitePNGBytes() {
  const c = document.createElement('canvas'); c.width = c.height = 2
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 2, 2)
  const bin = atob(c.toDataURL('image/png').split(',')[1])
  const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return u8
}

/* ── colores ── */
function hexToLinear(hex) {
  const h = hex.replace('#', '')
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
  return [f(parseInt(h.slice(0, 2), 16)), f(parseInt(h.slice(2, 4), 16)), f(parseInt(h.slice(4, 6), 16))]
}
const PAL = {
  wood: [0.62, 0.43, 0.26], legs: [0.28, 0.30, 0.34], floor: [0.80, 0.78, 0.74],
  skin1: [0.93, 0.78, 0.66], skin2: [0.80, 0.60, 0.46], skin3: [0.58, 0.42, 0.31],
  hair1: [0.10, 0.08, 0.07], hair2: [0.34, 0.22, 0.12], hair3: [0.66, 0.50, 0.28],
  shirt1: [0.20, 0.36, 0.58], shirt2: [0.68, 0.22, 0.26], shirt3: [0.22, 0.48, 0.36],
  shirt4: [0.82, 0.58, 0.22], shirt5: [0.40, 0.30, 0.55], shirt6: [0.82, 0.82, 0.85],
}
const VARIANTS = [
  { g: 'm', skin: 'skin1', shirt: 'shirt1', hair: 'hair1' },
  { g: 'f', skin: 'skin2', shirt: 'shirt4', hair: 'hair2' },
  { g: 'm', skin: 'skin3', shirt: 'shirt3', hair: 'hair1' },
  { g: 'f', skin: 'skin1', shirt: 'shirt2', hair: 'hair3' },
  { g: 'm', skin: 'skin2', shirt: 'shirt5', hair: 'hair2' },
  { g: 'f', skin: 'skin3', shirt: 'shirt6', hair: 'hair1' },
]

/* ── piezas ── */
function person(M, cx, cz, seatY, fx, fz, v) {
  add(M, v.skin, sphereG(cx, seatY + 0.60, cz, 0.125, 0.145, 0.125, 14))   // cabeza esférica
  add(M, v.skin, boxG(cx, seatY + 0.47, cz, 0.07, 0.09, 0.07))             // cuello
  if (v.g === 'f') {
    add(M, v.hair, sphereG(cx, seatY + 0.605, cz - fz * 0.015, 0.150, 0.160, 0.150, 14, Math.PI * 0.66)) // casquete
    add(M, v.hair, boxG(cx, seatY + 0.42, cz - fz * 0.11, fz ? 0.20 : 0.09, 0.27, fz ? 0.09 : 0.20))      // melena
  } else {
    add(M, v.hair, sphereG(cx, seatY + 0.625, cz, 0.140, 0.115, 0.140, 14, Math.PI * 0.55))               // pelo corto
  }
  const sh = v.g === 'f' ? 0.30 : 0.37
  add(M, v.shirt, boxG(cx, seatY + 0.27, cz, sh, 0.42, 0.22))              // torso
  for (const s of [-1, 1]) add(M, v.shirt, boxG(fz ? cx + s * (sh / 2 + 0.02) : cx, seatY + 0.24, fx ? cz + s * (sh / 2 + 0.02) : cz, fz ? 0.09 : 0.14, 0.30, fz ? 0.14 : 0.09)) // brazos
  add(M, v.shirt, boxG(cx + fx * 0.19, seatY + 0.03, cz + fz * 0.19, fz ? (v.g === 'f' ? 0.34 : 0.30) : 0.42, 0.13, fz ? 0.42 : (v.g === 'f' ? 0.34 : 0.30))) // muslos/falda (hacia la mesa)
  const legMat = v.g === 'f' ? v.skin : v.shirt
  const kx = cx + fx * 0.38, kz = cz + fz * 0.38, sH = seatY + 0.06
  for (const s of [-1, 1]) add(M, legMat, boxG(kx + (fz ? s * 0.09 : 0), sH / 2, kz + (fx ? s * 0.09 : 0), 0.10, sH, 0.11)) // pantorrillas al piso (delante)
}
function chair(M, cx, cz, fx, fz, h = 0.45, withLogo = true) {
  add(M, 'fabric', boxG(cx, h, cz, 0.40, 0.06, 0.40))                       // asiento
  add(M, 'fabric', boxG(cx - fx * 0.19, h + 0.21, cz - fz * 0.19, fz ? 0.40 : 0.06, 0.40, fz ? 0.06 : 0.40)) // respaldo
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(M, 'legs', cylG(cx + sx * 0.17, cz + sz * 0.17, 0, h - 0.03, 0.018))
  if (withLogo) add(M, 'logoSilla', quadFacing(cx - fx * 0.225, h + 0.21, cz - fz * 0.225, -fx, -fz, 0.36, 0.36)) // logo casi todo el respaldo (llega al borde)
}
function diningTable(M, cx, cz, withLogo = true) {
  add(M, 'wood', boxG(cx, 0.74, cz, 0.95, 0.05, 0.78))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(M, 'legs', cylG(cx + sx * 0.40, cz + sz * 0.30, 0, 0.72, 0.024))
  if (withLogo) add(M, 'logoMesa', quadTop(cx, 0.768, cz, 0.88, 0.72))      // logo casi toda la mesa (llega al borde)
}
function barTable(M, cx, cz, withLogo = true) {
  add(M, 'wood', sphereG(cx, 1.04, cz, 0.34, 0.025, 0.34, 16))
  add(M, 'legs', cylG(cx, cz, 0, 1.02, 0.045))
  add(M, 'legs', cylG(cx, cz, 0, 0.05, 0.22, 16))
  if (withLogo) add(M, 'logoMesa', quadTop(cx, 1.068, cz, 0.6, 0.6))
}

const SEATS_DINE = [{ x: 0, z: 0.60, fx: 0, fz: -1 }, { x: 0, z: -0.60, fx: 0, fz: 1 }, { x: 0.60, z: 0, fx: -1, fz: 0 }, { x: -0.60, z: 0, fx: 1, fz: 0 }]
const SEATS_BAR = [{ x: 0, z: 0.58, fx: 0, fz: -1 }, { x: 0.50, z: -0.30, fx: -1, fz: 0.6 }, { x: -0.50, z: -0.30, fx: 1, fz: 0.6 }]

/* ── ensamblar GLB ── */
function buildGLB(M, accent) {
  PAL.fabric = hexToLinear(accent)
  const names = Object.keys(M)
  const bin = []; let off = 0
  const bvs = [], accs = []
  const pushView = (typed) => {
    const pad = (4 - (off % 4)) % 4; if (pad) { bin.push(new Uint8Array(pad)); off += pad }
    const u8 = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength)
    bin.push(u8); const i = bvs.push({ buffer: 0, byteOffset: off, byteLength: u8.length }) - 1; off += u8.length; return i
  }
  const prims = names.map((name, mi) => {
    const m = M[name]
    const pos = new Float32Array(m.pos), nrm = new Float32Array(m.nrm), idx = new Uint16Array(m.idx)
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v }
    const pv = pushView(pos), nv = pushView(nrm), iv = pushView(idx)
    const pa = accs.push({ bufferView: pv, componentType: 5126, count: pos.length / 3, type: 'VEC3', min: mn, max: mx }) - 1
    const na = accs.push({ bufferView: nv, componentType: 5126, count: nrm.length / 3, type: 'VEC3' }) - 1
    const ia = accs.push({ bufferView: iv, componentType: 5123, count: idx.length, type: 'SCALAR' }) - 1
    const attributes = { POSITION: pa, NORMAL: na }
    if (m.uv && m.uv.length) {
      const uvArr = new Float32Array(m.uv); const uvV = pushView(uvArr)
      attributes.TEXCOORD_0 = accs.push({ bufferView: uvV, componentType: 5126, count: uvArr.length / 2, type: 'VEC2' }) - 1
    }
    return { attributes, indices: ia, material: mi, mode: 4 }
  })
  // textura blanca para las ranuras de logo (ARModal le pega el logo real)
  const hasLogo = names.some(n => n.startsWith('logo'))
  let images, samplers, textures
  if (hasLogo) {
    const png = whitePNGBytes(); const imgV = pushView(png)
    images = [{ bufferView: imgV, mimeType: 'image/png' }]; samplers = [{ wrapS: 33071, wrapT: 33071 }]; textures = [{ source: 0, sampler: 0 }]
  }
  const materials = names.map(n => {
    if (n.startsWith('logo')) return { name: n, alphaMode: 'BLEND', doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 0], baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.6 } }
    const c = PAL[n] || [0.7, 0.7, 0.7]
    const metal = n === 'legs'
    return { name: n, pbrMetallicRoughness: { baseColorFactor: [c[0], c[1], c[2], 1], metallicFactor: metal ? 0.85 : 0, roughnessFactor: metal ? 0.4 : (n === 'wood' ? 0.55 : 0.8) }, doubleSided: true }
  })
  let binLen = 0; for (const b of bin) binLen += b.length
  if (binLen % 4) { const pad = 4 - (binLen % 4); bin.push(new Uint8Array(pad)); binLen += pad }
  const binBuf = new Uint8Array(binLen); { let o = 0; for (const b of bin) { binBuf.set(b, o); o += b.length } }
  const gltf = {
    asset: { version: '2.0', generator: 'korbax-salon' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    meshes: [{ primitives: prims }], accessors: accs, bufferViews: bvs, materials, buffers: [{ byteLength: binBuf.length }],
  }
  if (hasLogo) { gltf.images = images; gltf.samplers = samplers; gltf.textures = textures }
  let json = new TextEncoder().encode(JSON.stringify(gltf))
  if (json.length % 4) { const pad = 4 - (json.length % 4); const j2 = new Uint8Array(json.length + pad); j2.set(json); j2.fill(0x20, json.length); json = j2 }
  const total = 12 + 8 + json.length + 8 + binBuf.length
  const out = new Uint8Array(total); const dv = new DataView(out.buffer)
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true)
  dv.setUint32(12, json.length, true); dv.setUint32(16, 0x4E4F534A, true); out.set(json, 20)
  const bo = 20 + json.length
  dv.setUint32(bo, binBuf.length, true); dv.setUint32(bo + 4, 0x004E4942, true); out.set(binBuf, bo + 8)
  return new Blob([out], { type: 'model/gltf-binary' })
}

// cache simple para no regenerar ni filtrar URLs
let _cache = { key: '', url: '' }
export function buildSalonURL({ people, kind = 'dining', accent = '#E85D5D', logoOn = 'ambos' }) {
  const n = Math.max(1, Math.min(people | 0, 60))
  const key = `${kind}|${n}|${accent}|${logoOn}`
  if (_cache.key === key) return _cache.url
  if (_cache.url) URL.revokeObjectURL(_cache.url)
  const tableLogo = logoOn === 'mesas' || logoOn === 'ambos'
  const chairLogo = logoOn === 'sillas' || logoOn === 'ambos'
  const bar = kind === 'bar'
  const perTable = bar ? 3 : 4
  const seats = bar ? SEATS_BAR : SEATS_DINE
  const tables = Math.ceil(n / perTable)
  const cols = Math.max(1, Math.round(Math.sqrt(tables * 1.4)))
  const sx = bar ? 2.4 : 2.75, sz = bar ? 2.4 : 2.85
  const M = {}
  let placed = 0
  for (let t = 0; t < tables; t++) {
    const c = t % cols, r = Math.floor(t / cols)
    const tx = (c - (cols - 1) / 2) * sx, tz = (r - Math.floor((tables - 1) / cols) / 2) * sz
    if (bar) barTable(M, tx, tz, tableLogo); else diningTable(M, tx, tz, tableLogo)
    for (const s of seats) {
      if (placed >= n) break
      const px = tx + s.x, pz = tz + s.z
      chair(M, px, pz, s.fx, s.fz, bar ? 0.66 : 0.45, chairLogo)
      person(M, px, pz, bar ? 0.66 : 0.45, s.fx, s.fz, VARIANTS[placed % VARIANTS.length])
      placed++
    }
  }
  const url = URL.createObjectURL(buildGLB(M, accent))
  _cache = { key, url }
  return url
}
