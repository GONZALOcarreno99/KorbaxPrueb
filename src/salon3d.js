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
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
// cilindro tronco-cónico entre dos puntos (patas torneadas, postes, travesaños)
function tube(p0, p1, r0, r1 = r0, seg = 10) {
  const dir = norm([p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]])
  const up = Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
  const u = norm(cross(up, dir)), w = norm(cross(dir, u))
  const pos = [], nrm = [], idx = []
  for (let j = 0; j <= seg; j++) {
    const a = j / seg * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a)
    const nx = u[0] * ca + w[0] * sa, ny = u[1] * ca + w[1] * sa, nz = u[2] * ca + w[2] * sa
    pos.push(p0[0] + nx * r0, p0[1] + ny * r0, p0[2] + nz * r0); nrm.push(nx, ny, nz)
    pos.push(p1[0] + nx * r1, p1[1] + ny * r1, p1[2] + nz * r1); nrm.push(nx, ny, nz)
  }
  for (let j = 0; j < seg; j++) { const a = j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) }
  return { pos, nrm, idx }
}
// rota una geometría alrededor del eje X (en el plano YZ) sobre un pivote → reclinar respaldos
function rotX(g, ang, py, pz) {
  const c = Math.cos(ang), s = Math.sin(ang)
  for (let i = 0; i < g.pos.length; i += 3) { const y = g.pos[i + 1] - py, z = g.pos[i + 2] - pz; g.pos[i + 1] = py + y * c - z * s; g.pos[i + 2] = pz + y * s + z * c }
  for (let i = 0; i < g.nrm.length; i += 3) { const y = g.nrm[i + 1], z = g.nrm[i + 2]; g.nrm[i + 1] = y * c - z * s; g.nrm[i + 2] = y * s + z * c }
  return g
}
// vuelca un sub-modelo local (construido mirando a +z) al modelo global, rotado en Y (yaw) y trasladado
function mergeInto(M, L, cx, cz, theta) {
  const c = Math.cos(theta), s = Math.sin(theta)
  for (const mat in L) {
    const g = L[mat]
    for (let i = 0; i < g.pos.length; i += 3) { const x = g.pos[i], z = g.pos[i + 2]; g.pos[i] = x * c + z * s + cx; g.pos[i + 2] = -x * s + z * c + cz }
    for (let i = 0; i < g.nrm.length; i += 3) { const x = g.nrm[i], z = g.nrm[i + 2]; g.nrm[i] = x * c + z * s; g.nrm[i + 2] = -x * s + z * c }
    add(M, mat, g)
  }
}
// Tablero con esquinas redondeadas (planta) + canto abullonado (bullnose) → mesa real, no caja
function roundSlab(cx, cy, cz, w, d, th, corner = 0.07, edge = 0.018, vseg = 4, aseg = 5) {
  const hw = w / 2, hd = d / 2, r = Math.min(corner, hw, hd)
  const O = []
  const cs = [[hw - r, hd - r, 0], [-(hw - r), hd - r, Math.PI / 2], [-(hw - r), -(hd - r), Math.PI], [hw - r, -(hd - r), 3 * Math.PI / 2]]
  for (const [ax, az, a0] of cs) for (let i = 0; i <= aseg; i++) { const a = a0 + (i / aseg) * (Math.PI / 2), nx = Math.cos(a), nz = Math.sin(a); O.push({ x: ax + nx * r, z: az + nz * r, nx, nz }) }
  const M = O.length, pos = [], nrm = [], idx = []
  const push = (x, y, z, nx, ny, nz) => { pos.push(cx + x, cy + y, cz + z); nrm.push(nx, ny, nz); return pos.length / 3 - 1 }
  const rings = []
  for (let k = 0; k <= vseg; k++) {
    const a = (k / vseg) * Math.PI, y = (th / 2) * Math.cos(a), off = -edge * (1 - Math.sin(a)), ny = Math.cos(a), nh = Math.sin(a), ring = []
    for (const p of O) ring.push(push(p.x + p.nx * off, y, p.z + p.nz * off, p.nx * nh, ny, p.nz * nh)); rings.push(ring)
  }
  for (let k = 0; k < vseg; k++) for (let i = 0; i < M; i++) { const a = rings[k][i], b = rings[k][(i + 1) % M], c = rings[k + 1][i], e = rings[k + 1][(i + 1) % M]; idx.push(a, c, b, b, c, e) }
  const tc = push(0, th / 2, 0, 0, 1, 0); for (let i = 0; i < M; i++) idx.push(tc, rings[0][i], rings[0][(i + 1) % M])
  const bc = push(0, -th / 2, 0, 0, -1, 0); for (let i = 0; i < M; i++) idx.push(bc, rings[vseg][(i + 1) % M], rings[vseg][i])
  return { pos, nrm, idx }
}
const roundDisc = (cx, cy, cz, radius, th, edge = 0.016) => roundSlab(cx, cy, cz, radius * 2, radius * 2, th, radius, edge, 4, 9)
const lerp = (a, b, t) => a + (b - a) * t
// Cojín/almohadón: cubo esferizado (caras planas al centro, cantos abultados) → tapicería real, no caja
function roundBox(cx, cy, cz, sx, sy, sz, t = 0.5, seg = 7) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2, pos = [], nrm = [], idx = []
  const sph = (x, y, z) => { const x2 = x * x, y2 = y * y, z2 = z * z; return [x * Math.sqrt(1 - y2 / 2 - z2 / 2 + y2 * z2 / 3), y * Math.sqrt(1 - z2 / 2 - x2 / 2 + z2 * x2 / 3), z * Math.sqrt(1 - x2 / 2 - y2 / 2 + x2 * y2 / 3)] }
  const face = (ua, va, wa, ws) => {
    const base = pos.length / 3
    for (let i = 0; i <= seg; i++) for (let j = 0; j <= seg; j++) {
      const c = [0, 0, 0]; c[ua] = i / seg * 2 - 1; c[va] = j / seg * 2 - 1; c[wa] = ws
      const s = sph(c[0], c[1], c[2]), nl = Math.hypot(s[0], s[1], s[2]) || 1
      pos.push(lerp(c[0], s[0], t) * hx + cx, lerp(c[1], s[1], t) * hy + cy, lerp(c[2], s[2], t) * hz + cz); nrm.push(s[0] / nl, s[1] / nl, s[2] / nl)
    }
    for (let i = 0; i < seg; i++) for (let j = 0; j < seg; j++) { const a = base + i * (seg + 1) + j, b = a + 1, cc = a + (seg + 1), d = cc + 1; if (ws > 0) idx.push(a, cc, b, b, cc, d); else idx.push(a, b, cc, b, d, cc) }
  }
  face(1, 2, 0, 1); face(1, 2, 0, -1); face(0, 2, 1, 1); face(0, 2, 1, -1); face(0, 1, 2, 1); face(0, 1, 2, -1)
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
// Silla construida en orientación canónica (mira a +z, respaldo en -z) y luego rotada/colocada.
// style: 'clasica' (cojín+respaldo), 'apilable' (asiento fino+listones), 'taburete' (redondo, sin respaldo)
function chair(M, cx, cz, fx, fz, h = 0.45, withLogo = true, style = 'clasica') {
  const L = {}, SE = 0.42, hb = SE / 2 - 0.02   // borde trasero del asiento (z = -hb)
  if (style === 'taburete') {
    add(L, 'fabric', roundBox(0, h + 0.02, 0, 0.36, 0.10, 0.36, 0.6))   // asiento redondo
    for (const a of [0, 1, 2, 3]) { const ang = a * Math.PI / 2 + Math.PI / 4, dx = Math.cos(ang), dz = Math.sin(ang)
      add(L, 'legs', tube([dx * 0.13, h - 0.06, dz * 0.13], [dx * 0.21, 0, dz * 0.21], 0.02, 0.012, 8)) }
    add(L, 'legs', cylG(0, 0, h * 0.42, h * 0.42 + 0.02, 0.18, 16))      // aro reposapiés
    if (withLogo) add(L, 'logoSilla', quadTop(0, h + 0.072, 0, 0.3, 0.3))
    mergeInto(M, L, cx, cz, Math.atan2(fx, fz)); return
  }
  // patas torneadas ABIERTAS + travesaños (común a clásica y apilable)
  add(L, 'legs', boxG(0, h - 0.06, 0, SE - 0.04, 0.05, SE - 0.04))
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    add(L, 'legs', tube([sx * 0.145, h - 0.08, sz * 0.145], [sx * 0.205, 0, sz * 0.205], 0.021, 0.012, 8))
  for (const sx of [-1, 1]) add(L, 'legs', tube([sx * 0.185, 0.11, -0.185], [sx * 0.185, 0.11, 0.185], 0.011, 0.011, 6))
  add(L, 'legs', tube([-0.185, 0.085, 0.06], [0.185, 0.085, 0.06], 0.011, 0.011, 6))
  const recline = -0.17, pivY = h - 0.02, pivZ = -hb
  for (const s of [-1, 1]) add(L, 'legs', rotX(tube([s * (SE / 2 - 0.045), h - 0.02, -hb], [s * (SE / 2 - 0.045), h + 0.46, -hb], 0.017, 0.014, 8), recline, pivY, pivZ))
  if (style === 'apilable') {
    // asiento fino + respaldo de 2 listones (ligero, sin cojín grueso)
    add(L, 'fabric', roundBox(0, h + 0.01, 0, SE, 0.06, SE, 0.4))
    add(L, 'fabric', rotX(boxG(0, h + 0.16, -hb, SE - 0.06, 0.07, 0.035), recline, pivY, pivZ))
    add(L, 'fabric', rotX(boxG(0, h + 0.31, -hb, SE - 0.06, 0.07, 0.035), recline, pivY, pivZ))
    if (withLogo) add(L, 'logoSilla', rotX(quadFacing(0, h + 0.31, -hb - 0.025, 0, -1, SE - 0.08, 0.065), recline, pivY, pivZ))
  } else {
    // clásica: cojín mullido + respaldo cojín
    add(L, 'fabric', roundBox(0, h + 0.02, 0, SE, 0.11, SE, 0.55))
    add(L, 'fabric', rotX(roundBox(0, h + 0.27, -hb - 0.012, SE - 0.06, 0.34, 0.085, 0.55), recline, pivY, pivZ))
    if (withLogo) add(L, 'logoSilla', rotX(quadFacing(0, h + 0.28, -hb - 0.062, 0, -1, 0.34, 0.30), recline, pivY, pivZ))
  }
  mergeInto(M, L, cx, cz, Math.atan2(fx, fz))
}
// shape: 'rect' (rectangular), 'square' (cuadrada), 'round' (redonda con pedestal)
function diningTable(M, cx, cz, withLogo = true, shape = 'rect') {
  const TH = 0.74
  if (shape === 'round') {
    add(M, 'wood', roundDisc(cx, TH, cz, 0.47, 0.05, 0.02))                     // tablero redondo
    add(M, 'legs', tube([cx, 0.05, cz], [cx, TH - 0.02, cz], 0.06, 0.045, 14))  // columna central
    add(M, 'legs', cylG(cx, cz, 0, 0.05, 0.30, 20))                            // base disco
    if (withLogo) add(M, 'logoMesa', quadTop(cx, TH + 0.032, cz, 0.66, 0.66))
    return
  }
  const W = shape === 'square' ? 0.80 : 0.95, D = shape === 'square' ? 0.80 : 0.78
  add(M, 'wood', roundSlab(cx, TH, cz, W, D, 0.05, 0.11, 0.02))                 // tablero esquinas redondeadas + canto abullonado
  for (const sz of [-1, 1]) add(M, 'wood', boxG(cx, TH - 0.07, cz + sz * (D / 2 - 0.05), W - 0.10, 0.08, 0.04))
  for (const sx of [-1, 1]) add(M, 'wood', boxG(cx + sx * (W / 2 - 0.05), TH - 0.07, cz, 0.04, 0.08, D - 0.10))
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    add(M, 'legs', tube([cx + sx * (W / 2 - 0.09), TH - 0.06, cz + sz * (D / 2 - 0.08)], [cx + sx * (W / 2 - 0.12), 0, cz + sz * (D / 2 - 0.11)], 0.03, 0.019, 10))
  if (withLogo) add(M, 'logoMesa', quadTop(cx, TH + 0.032, cz, shape === 'square' ? 0.7 : 0.88, shape === 'square' ? 0.7 : 0.72))
}
function barTable(M, cx, cz, withLogo = true) {
  add(M, 'wood', roundDisc(cx, 1.04, cz, 0.34, 0.05, 0.018))                    // tablero redondo con canto abullonado
  add(M, 'legs', tube([cx, 0.05, cz], [cx, 1.00, cz], 0.06, 0.045, 14))         // columna
  add(M, 'legs', cylG(cx, cz, 0.30, 0.335, 0.27, 18))                          // aro reposapiés
  add(M, 'legs', cylG(cx, cz, 0, 0.05, 0.24, 18))                              // base disco
  if (withLogo) add(M, 'logoMesa', quadTop(cx, 1.072, cz, 0.6, 0.6))
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
    if (n.startsWith('logo')) return {
      name: n,
      // MASK (recorte duro) en vez de BLEND: la transparencia se exporta bien a la AR del
      // celular (Scene Viewer / Quick Look) → mismo resultado en PC y móvil, sin marco blanco.
      alphaMode: 'MASK', alphaCutoff: 0.4, doubleSided: true,
      // el logo se usa también como textura EMISIVA → brilla con su color y la luz de la
      // escena no lo apaga (se nota mucho más). El ARModal le pone la textura y el factor.
      emissiveTexture: { index: 0 }, emissiveFactor: [0, 0, 0],
      pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 0], baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 1 },
    }
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
export function buildSalonURL({ people, kind = 'dining', accent = '#E85D5D', logoOn = 'ambos', tableType = 'rect', chairType = 'clasica' }) {
  const n = Math.max(1, Math.min(people | 0, 60))
  const bar = kind === 'bar'
  const cstyle = bar ? 'taburete' : chairType
  const key = `${kind}|${n}|${accent}|${logoOn}|${tableType}|${cstyle}`
  if (_cache.key === key) return _cache.url
  if (_cache.url) URL.revokeObjectURL(_cache.url)
  const tableLogo = logoOn === 'mesas' || logoOn === 'ambos'
  const chairLogo = logoOn === 'sillas' || logoOn === 'ambos'
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
    if (bar) barTable(M, tx, tz, tableLogo); else diningTable(M, tx, tz, tableLogo, tableType)
    for (const s of seats) {
      if (placed >= n) break
      const px = tx + s.x, pz = tz + s.z
      chair(M, px, pz, s.fx, s.fz, bar ? 0.66 : 0.45, chairLogo, cstyle)
      placed++
    }
  }
  const url = URL.createObjectURL(buildGLB(M, accent))
  _cache = { key, url }
  return url
}
