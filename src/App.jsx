import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  MessageCircle, Phone, Mail, MapPin, ArrowRight,
  ShieldCheck, Truck, BadgeCheck, Headphones,
  CheckCircle, X, ChevronRight, ChevronDown, Star, Camera, ZoomIn, LayoutGrid,
  Pencil, Hammer, ArrowUp, Sun, Moon, ChevronsLeftRight,
  Utensils, Wine, Building2, GraduationCap, Coffee, Stethoscope, Calendar,
  Sparkles, Upload, Check, Plus, ArrowLeft, Trash2, RotateCcw,
  ShoppingBag, Search, CreditCard, Clock, Award, FileText
} from 'lucide-react'
import './index.css'

/* ── paletas ── */
const LIGHT_C = {
  carbon:  '#161010',
  petrol:  '#1E2E30',
  stone:   '#77706C',
  mist:    '#B6B5B4',
  ivory:   '#FBFBFB',
  gray:    '#F2F2F0',
  sand:    '#F1AF78',
  sandDim: '#e89d5f',
  border:  '#E4E4E2',
  onDark:  '#FBFBFB',
}
const DARK_C = {
  carbon:  '#E8E2DC',
  petrol:  '#070E10',
  stone:   '#9E9790',
  mist:    '#686460',
  ivory:   '#0C1416',
  gray:    '#0F1A1C',
  sand:    '#F1AF78',
  sandDim: '#e89d5f',
  border:  '#1C2E30',
  onDark:  '#E8E2DC',
}

const ThemeCtx = createContext(LIGHT_C)

const hexDarken = (hex, pct) => {
  const n = parseInt(hex.replace('#',''), 16)
  const d = v => Math.max(0, Math.round(v * (1 - pct / 100))).toString(16).padStart(2,'0')
  return `#${d(n >> 16)}${d((n >> 8) & 0xff)}${d(n & 0xff)}`
}
const hexLighten = (hex, pct) => {
  const n = parseInt(hex.replace('#',''), 16)
  const l = v => Math.min(255, Math.round(v + (255 - v) * pct / 100)).toString(16).padStart(2,'0')
  return `#${l(n >> 16)}${l((n >> 8) & 0xff)}${l(n & 0xff)}`
}
// Paleta de madera + acero para los muebles SVG del configurador
const FCOL = {
  woodL: '#CFA46C', wood: '#B0823F', woodD: '#8A5E2E',
  steelL: '#C7CCD0', steel: '#9AA0A6', steelD: '#6C727A',
}

// Acabados/materiales seleccionables en el configurador (swatches de 1 clic)
const MATERIALS = {
  tablero: [
    { name: 'Roble claro', color: '#C9A36A' },
    { name: 'Haya',        color: '#D8B98A' },
    { name: 'Nogal',       color: '#8A5A33' },
    { name: 'Caoba',       color: '#7A3B2A' },
    { name: 'Wengue',      color: '#4A3528' },
    { name: 'Blanco',      color: '#ECE7DF' },
    { name: 'Gris piedra', color: '#9B958C' },
    { name: 'Negro',       color: '#2B2622' },
  ],
  estructura: [
    { name: 'Acero',      color: '#9AA0A6' },
    { name: 'Negro mate', color: '#2C2C2E' },
    { name: 'Cromado',    color: '#CDD3D8' },
    { name: 'Blanco',     color: '#E8E8E8' },
    { name: 'Dorado',     color: '#C8A24A' },
    { name: 'Madera',     color: '#9C6B3C' },
  ],
  tapizado: [
    { name: 'Negro',     color: '#2B2B2B' },
    { name: 'Gris',      color: '#6B7077' },
    { name: 'Beige',     color: '#C9B79A' },
    { name: 'Camel',     color: '#B07B4A' },
    { name: 'Vino',      color: '#7A2230' },
    { name: 'Azul',      color: '#2F4A7A' },
    { name: 'Verde',     color: '#2F5D4A' },
    { name: 'Mostaza',   color: '#C8932A' },
  ],
}

// Modelos 3D propios para AR (silla/mesa generados con materiales separados = color editable + logo)
const AR_MODELS = {
  silla: '/models/silla.glb', sillapil: '/models/sillapil.glb', sillejec: '/models/sillejec.glb',
  set: '/models/set.glb', setbar: '/models/setbar.glb', setespera: '/models/banca.glb',
  taburete: '/models/taburete.glb', butaca: '/models/butaca.glb',
  mesa: '/models/mesa.glb', mesacuad: '/models/mesacuad.glb', mesaconf: '/models/mesaconf.glb',
  mesared: '/models/mesaredonda.glb', mesaalta: '/models/mesaalta.glb',
  barra: '/models/barra.glb', mostrador: '/models/barra.glb',
}
const arModelFor = (svgType) => AR_MODELS[svgType] ?? '/models/silla.glb'

// Proporción (ancho/alto) de la superficie donde se estampa el logo en cada .glb
// (debe coincidir con los quads de logo de gen-models.mjs). Evita que el logo se deforme.
const AR_LOGO_ASPECT = {
  '/models/silla.glb':       0.40 / 0.32,
  '/models/sillapil.glb':    0.40 / 0.26,
  '/models/sillejec.glb':    1,
  '/models/butaca.glb':      0.50 / 0.30,
  '/models/mesa.glb':        0.90 / 0.56,
  '/models/mesacuad.glb':    1,
  '/models/mesaconf.glb':    1.40 / 0.62,
  '/models/mesaredonda.glb': 1,
  '/models/mesaalta.glb':    1,
  '/models/taburete.glb':    1,
  '/models/banca.glb':       1.06 / 0.30,
  '/models/barra.glb':       1.10 / 0.60,
  '/models/set.glb':         1,
  '/models/setbar.glb':      1,
}
const arLogoAspect = (svgType) => AR_LOGO_ASPECT[arModelFor(svgType)] ?? 1

// Superficies redondas: el logo se limita a un círculo (no a un cuadrado)
const AR_LOGO_ROUND = {
  '/models/mesaredonda.glb': true,
  '/models/mesaalta.glb':    true,
  '/models/taburete.glb':    true,
  '/models/setbar.glb':      true,
}
const arLogoRound = (svgType) => !!AR_LOGO_ROUND[arModelFor(svgType)]

// hex sRGB → RGB lineal (lo que espera glTF baseColorFactor) para que el color en AR coincida con el 2D
const hexToLinear = (hex) => {
  const h = (hex || '#888888').replace('#', '')
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  return [0, 2, 4].map(i => {
    const c = parseInt(s.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
}

const loadImage = (src) => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = src })
// Dibuja el logo en un lienzo con la posición/giro/tamaño del editor → se usa como textura del respaldo/tablero en AR
async function composeLogoTexture(logoUrl, pl, aspect = 1, round = false) {
  const img = await loadImage(logoUrl)
  const S = 512
  // Lienzo con la MISMA proporción que la superficie (ancho/alto). Así el mapeo
  // lienzo→mueble es uniforme: el logo conserva su forma y el 0–100% de los
  // sliders llega al borde por igual en mesa cuadrada, banca, barra, etc.
  const A = aspect || 1
  const W = A >= 1 ? S : Math.round(S * A)
  const H = A >= 1 ? Math.round(S / A) : S
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  let cx = ((pl?.x ?? 50) / 100) * W
  let cy = ((pl?.y ?? 45) / 100) * H
  // Superficie redonda: el centro del logo no puede salir del círculo del tablero
  if (round) {
    const R = Math.min(W, H) / 2
    const dx = cx - W / 2, dy = cy - H / 2, d = Math.hypot(dx, dy)
    if (d > R) { cx = W / 2 + (dx / d) * R; cy = H / 2 + (dy / d) * R }
  }
  const scale = pl?.scale ?? 1
  const rot = ((pl?.rotate ?? 0) * Math.PI) / 180
  // tamaño base = 60% del lado corto del lienzo, conservando la proporción del logo
  const w = Math.min(W, H) * 0.6 * scale
  const h = w * (img.height / img.width)
  ctx.translate(cx, cy); ctx.rotate(rot)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  return cv.toDataURL('image/png')
}

const WA          = '51936020199'
const EMAIL       = 'industriaskorbax@gmail.com'
const wa          = m => `https://wa.me/${WA}?text=${encodeURIComponent(m)}`
const DEFAULT_MSG = '¡Hola! Quisiera cotizar mobiliario para mi empresa. ¿Pueden ayudarme?'

/* ── hooks ── */
function useScrollReveal(dep) {
  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    // pequeño respiro para que el DOM de la página nueva ya esté montado
    const id = requestAnimationFrame(() => {
      document.querySelectorAll('.fade-up:not(.visible)').forEach(el => obs.observe(el))
    })
    return () => { cancelAnimationFrame(id); obs.disconnect() }
  }, [dep])
}

// Router minimalista por hash: '', '#/configurador', '#/catalogo', etc.
const ROUTES = ['home', 'catalogo', 'configurador', 'galeria', 'nosotros', 'contacto']
function useRoute() {
  const read = () => {
    const h = window.location.hash.replace(/^#\/?/, '').toLowerCase()
    return ROUTES.includes(h) ? h : 'home'
  }
  const [route, setRoute] = useState(read())
  useEffect(() => {
    const onChange = () => { setRoute(read()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

/* ── carrito de cotización (global, persistente) ── */
const CART_KEY = 'korbax_cart_v1'
const CartCtx = createContext(null)
const useCart = () => useContext(CartCtx)
function useCartState() {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || {} } catch { return {} }
  })
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* sin storage */ }
  }, [cart])

  const setQty = (key, name, qty) => setCart(p => {
    if (qty <= 0) { const { [key]: _drop, ...rest } = p; return rest }
    return { ...p, [key]: { name: name || p[key]?.name, qty } }
  })
  const add = (key, name) => setCart(p => ({ ...p, [key]: { name, qty: (p[key]?.qty || 0) + 1 } }))
  const inc = (key) => setCart(p => p[key] ? { ...p, [key]: { ...p[key], qty: p[key].qty + 1 } } : p)
  const dec = (key) => setCart(p => {
    const cur = p[key]; if (!cur) return p
    if (cur.qty <= 1) { const { [key]: _drop, ...rest } = p; return rest }
    return { ...p, [key]: { ...cur, qty: cur.qty - 1 } }
  })
  const remove = (key) => setQty(key, null, 0)
  const clear = () => setCart({})
  const qtyOf = (key) => cart[key]?.qty || 0
  const totalQty  = Object.values(cart).reduce((a, i) => a + i.qty, 0)
  const lineCount = Object.keys(cart).length
  return { cart, add, inc, dec, remove, clear, qtyOf, totalQty, lineCount, open, setOpen }
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? window.scrollY / total : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])
  return progress
}

/* ── counter ── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let n = 0, step = Math.ceil(target / 55)
      const t = setInterval(() => { n = Math.min(n + step, target); setVal(n); if (n >= target) clearInterval(t) }, 22)
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{val}{suffix}</span>
}

/* ── typed text ── */
const HERO_TEXTS = [
  'para restaurantes', 'para hoteles', 'para oficinas',
  'para colegios', 'para clínicas', 'para toda empresa',
]
function TypedText({ texts, speed = 72, deleteSpeed = 34, pauseMs = 1900 }) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  useEffect(() => {
    const current = texts[idx]
    if (!isDeleting && charIdx < current.length) {
      const t = setTimeout(() => { setDisplay(current.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }, speed)
      return () => clearTimeout(t)
    }
    if (!isDeleting && charIdx === current.length) {
      const t = setTimeout(() => setIsDeleting(true), pauseMs)
      return () => clearTimeout(t)
    }
    if (isDeleting && charIdx > 0) {
      const t = setTimeout(() => { setDisplay(current.slice(0, charIdx - 1)); setCharIdx(c => c - 1) }, deleteSpeed)
      return () => clearTimeout(t)
    }
    if (isDeleting && charIdx === 0) { setIsDeleting(false); setIdx(i => (i + 1) % texts.length) }
  }, [charIdx, isDeleting, idx, texts, speed, deleteSpeed, pauseMs])
  return <>{display}</>
}

/* ── partículas ── */
function Particles() {
  const C = useContext(ThemeCtx)
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      o: Math.random() * 0.35 + 0.08,
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(241,175,120,${p.o})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [C.ivory])
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none select-none" />
}

/* ── datos ── */
const STATS = [
  { label: 'Departamentos\natendidos', value: 25,  suffix: '+' },
  { label: 'Modelos\ndisponibles',     value: 40,  suffix: '+' },
  { label: 'Años de\nexperiencia',     value: 10,  suffix: '+' },
  { label: 'Empresas\nequipadas',      value: 500, suffix: '+' },
]
const PRODUCTS = [
  { id:1, tag:'Mesas',  name:'Mesa Cuadrada Industrial',   price:150, desc:'Tablero de madera o melamínico sobre estructura de acero. Para oficinas, comedores y espacios de trabajo.', img:'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80&fit=crop' },
  { id:2, tag:'Mesas',  name:'Mesa Rectangular Reforzada', price:220, desc:'Base anclable de alta resistencia. Personalizable en dimensiones, color y acabado para cualquier empresa.', img:'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&q=80&fit=crop' },
  { id:3, tag:'Sillas', name:'Silla Apilable Premium',     price:49,  desc:'Respaldo ergonómico y patas de acero galvanizado. Fácil de almacenar. Ideal para eventos, colegios y oficinas.', img:'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80&fit=crop' },
  { id:4, tag:'Sillas', name:'Silla con Cojín Vinílico',   price:75,  desc:'Tapizado resistente y fácil de limpiar. Estructura pintada al horno para uso intensivo en cualquier empresa.', img:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&fit=crop' },
  { id:5, tag:'Sets',   name:'Set Completo (mesa + sillas)', price:380, desc:'Juego a medida, entregamos armado. Personalizamos cantidad de sillas, color y acabado.', img:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop' },
  { id:6, tag:'Barras', name:'Barra y Mostrador a Medida', price:900, desc:'Tablero de alto tráfico, estructura metálica y estante inferior. Para recepciones, cafeterías y tiendas.', img:'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80&fit=crop' },
]
const CATALOG = {
  Mesas: [
    { id:'m1', name:'Mesa Cuadrada 70×70 cm',    price:150, desc:'Estructura de acero + tablero melamínico. Disponible en varios colores.',           img:'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&q=75&fit=crop' },
    { id:'m2', name:'Mesa Rectangular 120×60 cm', price:220, desc:'Ideal para comedores empresariales y salas de reunión pequeñas.',                   img:'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500&q=75&fit=crop' },
    { id:'m3', name:'Mesa Rectangular 160×80 cm', price:320, desc:'Para salas de conferencias, aulas y comedores de empresa.',                         img:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=75&fit=crop' },
    { id:'m4', name:'Mesa Redonda 4 Personas',     price:190, desc:'Base central de acero, tablero redondo. Perfecta para espacios de espera.',         img:'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=75&fit=crop' },
    { id:'m5', name:'Mesa Alta para Bar',           price:230, desc:'Altura 100–110 cm. Compatible con taburetes. Para bares, cafeterías y eventos.',    img:'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=500&q=75&fit=crop' },
    { id:'m6', name:'Mesa de Trabajo Industrial',   price:280, desc:'Tablero grueso reforzado, patas regulables. Para talleres y plantas industriales.', img:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500&q=75&fit=crop' },
  ],
  Sillas: [
    { id:'s1', name:'Silla Apilable Premium',   price:49,  desc:'Acero galvanizado + polipropileno. Liviana, resistente y apilable.',           img:'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&q=75&fit=crop' },
    { id:'s2', name:'Silla con Cojín Vinílico', price:75,  desc:'Tapizado vinílico resistente. Fácil de limpiar. Ideal para comedores.',         img:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=75&fit=crop' },
    { id:'s3', name:'Taburete con Respaldo',     price:70,  desc:'Altura regulable. Para barras altas, cocinas y mostradores.',                  img:'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=75&fit=crop' },
    { id:'s4', name:'Silla de Espera',           price:110, desc:'Diseño minimalista, cómoda y duradera. Para lobbies y salas de espera.',       img:'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&q=75&fit=crop' },
    { id:'s5', name:'Silla Tapizada Ejecutiva',  price:180, desc:'Tapizado de tela o vinilo, respaldo alto. Para oficinas y salas de reunión.',  img:'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500&q=75&fit=crop' },
    { id:'s6', name:'Silla de Madera Clásica',   price:90,  desc:'Estructura 100% madera tratada. Acabado natural o laqueado. Atemporal.',      img:'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=500&q=75&fit=crop' },
  ],
  Sets: [
    { id:'c1', name:'Set Comedor 4 Personas', price:380, desc:'1 mesa rectangular + 4 sillas a juego. Entregamos armado y listo para usar.',  img:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=75&fit=crop' },
    { id:'c2', name:'Set Comedor 6 Personas', price:560, desc:'1 mesa 160×80 + 6 sillas. Ideal para comedores empresariales.',               img:'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&q=75&fit=crop' },
    { id:'c3', name:'Set Sala de Espera',     price:450, desc:'3–6 sillas lineales + mesa auxiliar. Para lobbies, clínicas y oficinas.',     img:'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=500&q=75&fit=crop' },
  ],
  Barras: [
    { id:'b1', name:'Barra de Bar / Cafetería', price:900,  desc:'Tablero de alto tráfico, estructura metálica y estante inferior. A medida.',  img:'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500&q=75&fit=crop' },
    { id:'b2', name:'Mostrador de Recepción',   price:1200, desc:'Diseño elegante, superficie amplia. Para hoteles y oficinas.',               img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=75&fit=crop' },
    { id:'b3', name:'Barra Modular a Medida',   price:1100, desc:'Sistema modular adaptable a cualquier espacio. Varios acabados disponibles.',img:'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=75&fit=crop' },
  ],
}
const CAT_KEYS = Object.keys(CATALOG)
const SECTORS = ['Restaurantes','Oficinas','Hoteles','Colegios','Clínicas','Eventos','Tiendas','Centros comerciales','Cafeterías','Industria']
const PROCESS = [
  { step:'01', icon: Pencil,      title:'Coordinamos', desc:'Medidas, materiales y acabados según tu espacio y presupuesto. Sin costo adicional.' },
  { step:'02', icon: Hammer,      title:'Fabricamos',  desc:'Cortamos, soldamos y pintamos cada pieza en nuestra fábrica en Villa El Salvador.' },
  { step:'03', icon: ShieldCheck, title:'Revisamos',   desc:'Control de calidad: soldadura, pintura y tapizado antes del despacho.' },
  { step:'04', icon: Truck,       title:'Entregamos',  desc:'Envío coordinado a tu empresa, armado y listo para usar en cualquier región del Perú.' },
]
const TESTIMONIALS = [
  { name:'Mario Quispe',    company:'Rest. El Sabor Criollo', location:'Surco, Lima',      rating:5, text:'Compramos 30 mesas y 120 sillas para nuestro local. La calidad superó nuestras expectativas y el precio fue muy competitivo. Llegaron en el plazo acordado.' },
  { name:'Lucía Fernández', company:'Clínica San Borja',      location:'San Borja, Lima',  rating:5, text:'Equipamos nuestra sala de espera y consultorios. Son resistentes, fáciles de limpiar y lucen muy profesionales. Los recomiendo ampliamente.' },
  { name:'Carlos Mendoza',  company:'I.E. Los Andes',         location:'Ate, Lima',        rating:5, text:'Pedimos 200 sillas apilables para los salones. El trato fue excelente, nos asesoraron sin problema y el envío fue puntual. Volveremos a comprar.' },
  { name:'Ana Torres',      company:'Hotel Casa Verde',       location:'Miraflores, Lima', rating:5, text:'Renovamos todo el comedor del hotel. El diseño va perfecto con nuestra decoración y la relación precio-calidad es excelente. Muy satisfecha.' },
]
const FAQS = [
  { q:'¿Hacen envíos a provincias?',            a:'Sí, coordinamos envíos a todo el Perú. Trabajamos con empresas de transporte de confianza para garantizar que tu pedido llegue en perfectas condiciones, sin importar la región.' },
  { q:'¿Cuánto demora la fabricación y entrega?', a:'Para pedidos estándar, el plazo es de 7 a 15 días hábiles. Pedidos grandes o a medida pueden tomar de 15 a 25 días. Al cotizar te confirmamos el plazo exacto.' },
  { q:'¿Personalizan colores y medidas?',        a:'Sí, todo nuestro mobiliario es personalizable: color de tapizado, acabado del tablero (melamínico, madera natural, laminado), dimensiones exactas y diseño estructural.' },
  { q:'¿Cuál es el pedido mínimo?',              a:'No tenemos pedido mínimo obligatorio. Atendemos desde una sola pieza hasta pedidos de miles de unidades. También puedes comprar directamente en nuestra fábrica en Villa El Salvador.' },
  { q:'¿Qué formas de pago aceptan?',            a:'Aceptamos Yape, Plin, transferencia bancaria y depósito. Emitimos boleta o factura electrónica. En pedidos grandes trabajamos con un adelanto y el saldo contra entrega.' },
  { q:'¿Los productos tienen garantía?',         a:'Sí. Todos tienen garantía por defectos de fabricación: soldadura, pintura y tapizado. Si detectas algún problema al recibir el pedido, lo solucionamos sin costo adicional.' },
  { q:'¿Puedo visitar la fábrica antes de comprar?', a:'Claro. Puedes visitar nuestra planta en Villa El Salvador de lunes a sábado. Coordina tu visita por WhatsApp para que un asesor pueda atenderte y mostrarte materiales y modelos.' },
]
/* ── configurador 3D ── */
const EST_TYPES = [
  { id:'restaurante', label:'Restaurante',  icon: Utensils,     color:'#E85D5D' },
  { id:'bar',         label:'Bar / Cantina',icon: Wine,         color:'#7C5CBF' },
  { id:'oficina',     label:'Oficina',      icon: Building2,    color:'#3B82F6' },
  { id:'colegio',     label:'Colegio',      icon: GraduationCap,color:'#10B981' },
  { id:'hotel',       label:'Hotel',        icon: Sparkles,     color:'#F59E0B' },
  { id:'cafeteria',   label:'Cafetería',    icon: Coffee,       color:'#92400E' },
  { id:'clinica',     label:'Clínica',      icon: Stethoscope,  color:'#0EA5E9' },
  { id:'eventos',     label:'Eventos',      icon: Calendar,     color:'#EC4899' },
]

// Superficie donde se proyecta el logo del cliente, por tipo de mueble (% de la tarjeta)
const LOGO_SURFACE = {
  mesa:      { top:43, left:50, w:30, rotateX:54, rotateY:0 },
  mesacuad:  { top:44, left:50, w:26, rotateX:54, rotateY:0 },
  mesared:   { top:45, left:50, w:30, rotateX:56, rotateY:0 },
  mesaalta:  { top:31, left:50, w:20, rotateX:50, rotateY:0 },
  mesaconf:  { top:42, left:50, w:34, rotateX:55, rotateY:0 },
  silla:     { top:33, left:50, w:17, rotateX:10, rotateY:0 },
  sillapil:  { top:30, left:50, w:17, rotateX:8,  rotateY:0 },
  sillejec:  { top:35, left:50, w:16, rotateX:8,  rotateY:0 },
  butaca:    { top:37, left:50, w:22, rotateX:8,  rotateY:0 },
  taburete:  { top:49, left:50, w:17, rotateX:56, rotateY:0 },
  barra:     { top:60, left:50, w:40, rotateX:6,  rotateY:0 },
  mostrador: { top:59, left:50, w:36, rotateX:6,  rotateY:0 },
  set:       { top:46, left:50, w:22, rotateX:54, rotateY:0 },
  setbar:    { top:32, left:50, w:18, rotateX:50, rotateY:0 },
  setespera: { top:37, left:50, w:26, rotateX:10, rotateY:0 },
}

const CONF_FURNITURE = {
  restaurante: [
    { id:'r1', name:'Mesa Rectangular',       cat:'Mesas',  desc:'Tablero melamínico, estructura de acero',        svgType:'mesa' },
    { id:'r2', name:'Mesa Cuadrada 70×70',    cat:'Mesas',  desc:'Ideal para parejas y espacios compactos',        svgType:'mesacuad' },
    { id:'r3', name:'Mesa Redonda',           cat:'Mesas',  desc:'Base central, perfecta para ambientes íntimos',  svgType:'mesared' },
    { id:'r4', name:'Silla con Cojín',        cat:'Sillas', desc:'Tapizado vinílico, fácil de limpiar',            svgType:'silla' },
    { id:'r5', name:'Silla Apilable',         cat:'Sillas', desc:'Práctica para guardar y reorganizar',            svgType:'sillapil' },
    { id:'r6', name:'Butaca Lounge',          cat:'Sillas', desc:'Acolchada, para zona de espera o barra',         svgType:'butaca' },
    { id:'r7', name:'Set Comedor 4 personas', cat:'Sets',   desc:'Mesa + 4 sillas, entregamos armado',             svgType:'set' },
    { id:'r8', name:'Barra de Atención',      cat:'Barras', desc:'Para caja y despacho, tablero reforzado',        svgType:'barra' },
  ],
  bar: [
    { id:'b1', name:'Mesa Alta para Bar',        cat:'Mesas',  desc:'100–110 cm, para ambiente de bar/lounge',      svgType:'mesaalta' },
    { id:'b2', name:'Mesa Cuadrada Lounge',      cat:'Mesas',  desc:'Compacta para zonas de copas',                 svgType:'mesacuad' },
    { id:'b3', name:'Mesa Redonda Lounge',       cat:'Mesas',  desc:'Base central, ideal para grupos',              svgType:'mesared' },
    { id:'b4', name:'Taburete con Respaldo',     cat:'Sillas', desc:'Altura regulable, para barras altas',          svgType:'taburete' },
    { id:'b5', name:'Butaca de Lounge',          cat:'Sillas', desc:'Tapizada y cómoda para zonas chill',           svgType:'butaca' },
    { id:'b6', name:'Barra de Bar a Medida',     cat:'Barras', desc:'Tablero de alto tráfico, estructura metálica', svgType:'barra' },
    { id:'b7', name:'Barra Isla / Mostrador',    cat:'Barras', desc:'Punto central de atención',                    svgType:'mostrador' },
    { id:'b8', name:'Set Mesa Alta + Taburetes', cat:'Sets',   desc:'Combinación perfecta para zona de bar',        svgType:'setbar' },
  ],
  oficina: [
    { id:'o1', name:'Mesa de Trabajo',          cat:'Mesas',  desc:'Tablero reforzado, patas regulables',        svgType:'mesa' },
    { id:'o2', name:'Mesa Conferencia 160×80',  cat:'Mesas',  desc:'Sala de reuniones, hasta 8 personas',        svgType:'mesaconf' },
    { id:'o3', name:'Mesa Reunión Redonda',     cat:'Mesas',  desc:'Para reuniones rápidas de equipo',           svgType:'mesared' },
    { id:'o4', name:'Silla Ejecutiva',          cat:'Sillas', desc:'Respaldo alto, base rodante y apoyabrazos',  svgType:'sillejec' },
    { id:'o5', name:'Silla de Visita Apilable', cat:'Sillas', desc:'Para salas de espera y capacitaciones',      svgType:'sillapil' },
    { id:'o6', name:'Butaca de Recepción',      cat:'Sillas', desc:'Tapizada, para lobby corporativo',           svgType:'butaca' },
    { id:'o7', name:'Set Sala de Espera',       cat:'Sets',   desc:'Para recepción y lobby de oficina',          svgType:'setespera' },
    { id:'o8', name:'Mostrador de Recepción',   cat:'Barras', desc:'Diseño ejecutivo para el ingreso',           svgType:'mostrador' },
  ],
  colegio: [
    { id:'c1', name:'Mesa Cuadrada 70×70',     cat:'Mesas',  desc:'Resistente, ideal para aulas',                svgType:'mesacuad' },
    { id:'c2', name:'Mesa Rectangular 120×60', cat:'Mesas',  desc:'Comedores y salas de estudio',                svgType:'mesa' },
    { id:'c3', name:'Mesa Redonda Infantil',   cat:'Mesas',  desc:'Bordes seguros para los más pequeños',        svgType:'mesared' },
    { id:'c4', name:'Silla Apilable',          cat:'Sillas', desc:'Fácil de almacenar, muy durable',             svgType:'sillapil' },
    { id:'c5', name:'Silla con Cojín',         cat:'Sillas', desc:'Para salas de profesores y dirección',        svgType:'silla' },
    { id:'c6', name:'Taburete de Laboratorio', cat:'Sillas', desc:'Para talleres y laboratorios',                svgType:'taburete' },
    { id:'c7', name:'Set Comedor 6 personas',  cat:'Sets',   desc:'Comedor escolar completo, entregamos armado', svgType:'set' },
    { id:'c8', name:'Banca de Espera',         cat:'Sets',   desc:'Para pasillos y zonas comunes',               svgType:'setespera' },
  ],
  hotel: [
    { id:'h1', name:'Mostrador de Recepción',   cat:'Barras', desc:'Diseño elegante para el lobby',          svgType:'mostrador' },
    { id:'h2', name:'Mesa Redonda 4 personas',  cat:'Mesas',  desc:'Para restaurante y salón del hotel',     svgType:'mesared' },
    { id:'h3', name:'Mesa Conferencia',         cat:'Mesas',  desc:'Salas de eventos y reuniones',           svgType:'mesaconf' },
    { id:'h4', name:'Mesa Alta de Bar',         cat:'Mesas',  desc:'Para el bar y la terraza',               svgType:'mesaalta' },
    { id:'h5', name:'Silla Tapizada Ejecutiva', cat:'Sillas', desc:'Para salas de reuniones',                svgType:'silla' },
    { id:'h6', name:'Butaca de Lobby',          cat:'Sillas', desc:'Confort premium para zonas de descanso', svgType:'butaca' },
    { id:'h7', name:'Taburete de Bar',          cat:'Sillas', desc:'Para la barra del lounge',               svgType:'taburete' },
    { id:'h8', name:'Set Sala de Espera',       cat:'Sets',   desc:'Para lobby y zonas de descanso',         svgType:'setespera' },
  ],
  cafeteria: [
    { id:'ca1', name:'Mesa Alta para Bar',       cat:'Mesas',  desc:'Perfecta para café de moda',           svgType:'mesaalta' },
    { id:'ca2', name:'Mesa Cuadrada 70×70',      cat:'Mesas',  desc:'Para interior del café',               svgType:'mesacuad' },
    { id:'ca3', name:'Mesa Redonda',             cat:'Mesas',  desc:'Para terraza y ventanal',              svgType:'mesared' },
    { id:'ca4', name:'Taburete con Respaldo',    cat:'Sillas', desc:'Para zona de barra y mesas altas',     svgType:'taburete' },
    { id:'ca5', name:'Silla con Cojín',          cat:'Sillas', desc:'Cómoda para estancias largas',         svgType:'silla' },
    { id:'ca6', name:'Butaca Lounge',            cat:'Sillas', desc:'Para rincón de lectura y café',        svgType:'butaca' },
    { id:'ca7', name:'Barra Modular a Medida',   cat:'Barras', desc:'Mostrador principal del café',         svgType:'barra' },
    { id:'ca8', name:'Set Mesa Alta + Taburetes', cat:'Sets',  desc:'Para la zona de barra',                svgType:'setbar' },
  ],
  clinica: [
    { id:'cl1', name:'Silla de Espera',        cat:'Sillas', desc:'Cómoda y durable para sala de espera', svgType:'silla' },
    { id:'cl2', name:'Butaca de Espera',       cat:'Sillas', desc:'Tapizado lavable, confort superior',   svgType:'butaca' },
    { id:'cl3', name:'Silla Apilable',         cat:'Sillas', desc:'Para áreas de alta rotación',          svgType:'sillapil' },
    { id:'cl4', name:'Taburete Médico',        cat:'Sillas', desc:'Giratorio, para consultorios',         svgType:'taburete' },
    { id:'cl5', name:'Set Sala de Espera',     cat:'Sets',   desc:'Bancas lineales, fáciles de limpiar',  svgType:'setespera' },
    { id:'cl6', name:'Mostrador de Recepción', cat:'Barras', desc:'Para el área de admisión',             svgType:'mostrador' },
    { id:'cl7', name:'Mesa de Trabajo',        cat:'Mesas',  desc:'Para consultorios y área de trabajo',  svgType:'mesa' },
    { id:'cl8', name:'Mesa de Juntas',         cat:'Mesas',  desc:'Para reuniones del personal médico',   svgType:'mesaconf' },
  ],
  eventos: [
    { id:'e1', name:'Set Comedor 6 personas',     cat:'Sets',   desc:'Para banquetes y eventos empresariales', svgType:'set' },
    { id:'e2', name:'Set Comedor 4 personas',     cat:'Sets',   desc:'Para distribución flexible del espacio', svgType:'set' },
    { id:'e3', name:'Mesa Rectangular Reforzada', cat:'Mesas',  desc:'Para mesas de banquete y conferencia',   svgType:'mesa' },
    { id:'e4', name:'Mesa Redonda Banquete',      cat:'Mesas',  desc:'Clásica para bodas y celebraciones',     svgType:'mesared' },
    { id:'e5', name:'Mesa Alta Cóctel',           cat:'Mesas',  desc:'Para recepciones de pie',                svgType:'mesaalta' },
    { id:'e6', name:'Silla Apilable Premium',     cat:'Sillas', desc:'Fácil de almacenar entre eventos',       svgType:'sillapil' },
    { id:'e7', name:'Silla Tiffany Tapizada',     cat:'Sillas', desc:'Elegante para eventos formales',         svgType:'silla' },
    { id:'e8', name:'Set Mesa Alta + Taburetes',  cat:'Sets',   desc:'Para zona de cóctel y barra',            svgType:'setbar' },
  ],
}

const WHY = [
  { icon: ShieldCheck, title: 'Calidad garantizada',    desc: 'Materiales seleccionados y soldadura reforzada para uso comercial e institucional intensivo.' },
  { icon: BadgeCheck,  title: 'Fábrica propia',         desc: 'Todo fabricado en Villa El Salvador. Sin intermediarios — precio directo al cliente.' },
  { icon: Truck,       title: 'Envíos a todo el Perú',  desc: 'Coordinamos el despacho a cualquier región del país con embalaje seguro.' },
  { icon: Headphones,  title: 'Asesoría personalizada', desc: 'Te ayudamos a elegir el mobiliario ideal según el tamaño y tipo de tu empresa.' },
]
const GALLERY = [
  { id:1, label:'Comedor empresarial',   sub:'Mesa rectangular + sillas',    img:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&fit=crop' },
  { id:2, label:'Sala de reuniones',     sub:'Sets mesa + sillas ejecutivas', img:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1000&q=80&fit=crop' },
  { id:3, label:'Recepción y mostrador', sub:'Mostrador a medida',            img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1000&q=80&fit=crop' },
  { id:4, label:'Sillas para oficina',   sub:'Modelo apilable premium',       img:'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80&fit=crop' },
  { id:5, label:'Cafetería corporativa', sub:'Mesas altas + taburetes',       img:'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80&fit=crop' },
  { id:6, label:'Lobby y sala de espera',sub:'Sillas de espera acolchadas',   img:'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80&fit=crop' },
  { id:7, label:'Barra de bar',          sub:'Barra + taburetes altos',       img:'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80&fit=crop' },
]
const PRIVACY = `POLÍTICA DE PRIVACIDAD — Industrias Korbax\n\nAl completar el formulario, Industrias Korbax recopila únicamente los datos necesarios para responder tu consulta (nombre, teléfono, empresa y mensaje). Estos datos no se comparten con terceros ni se usan con fines comerciales adicionales.\n\nConforme a la Ley N.° 29733 (Ley de Protección de Datos Personales del Perú), tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos. Escríbenos a: ${EMAIL}`
const TERMS   = `TÉRMINOS DE USO — Industrias Korbax\n\nEste sitio web es de carácter informativo y comercial. Los precios y disponibilidad están sujetos a cambio sin previo aviso. Las cotizaciones no constituyen una oferta vinculante hasta su confirmación por escrito.\n\nIndustrias Korbax no se hace responsable por el uso indebido de la información publicada. El contenido es propiedad de Industrias Korbax y no puede reproducirse sin autorización.`

const NAV_LINKS   = [{ label:'Catálogo', href:'#/catalogo', route:'catalogo' }, { label:'Configurador', href:'#/configurador', route:'configurador' }, { label:'Galería', href:'#/galeria', route:'galeria' }, { label:'Nosotros', href:'#/nosotros', route:'nosotros' }, { label:'Contacto', href:'#/contacto', route:'contacto' }]
const CAT_TABS    = ['Todos', ...new Set(PRODUCTS.map(p => p.tag))]
const MARQUEE_ROW1 = [...SECTORS, ...SECTORS]
const MARQUEE_ROW2 = [...SECTORS.slice(4), ...SECTORS, ...SECTORS.slice(0, 4), ...SECTORS]

/* ════════════════ BASE UI ════════════════ */

const SectionLabel = ({ children }) => {
  const C = useContext(ThemeCtx)
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4 font-nunito"
      style={{ color: C.sand, background: `${C.sand}15`, border: `1px solid ${C.sand}35` }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: C.sand }} />
      {children}
    </span>
  )
}

const SandBtn = ({ href, onClick, children, size = 'md', className = '' }) => {
  const C = useContext(ThemeCtx)
  const pad = size === 'lg' ? 'px-8 py-4 text-base' : size === 'sm' ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm'
  const cls = `inline-flex items-center justify-center gap-2 font-bold font-nunito rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.97] ${pad} ${className}`
  const s   = { background: C.sand, color: C.petrol }
  const internal = href && href.startsWith('#')
  return href
    ? <a href={href} target={internal ? undefined : '_blank'} rel={internal ? undefined : 'noopener noreferrer'} className={cls} style={s}>{children}</a>
    : <button onClick={onClick} className={cls} style={s}>{children}</button>
}

const OutlineBtn = ({ href, onClick, children, size = 'md', className = '' }) => {
  const C = useContext(ThemeCtx)
  const pad = size === 'lg' ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm'
  const cls = `inline-flex items-center justify-center gap-2 font-bold font-nunito rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${pad} ${className}`
  const s   = { borderColor: C.carbon, color: C.carbon }
  return href
    ? <a href={href} className={cls} style={s}
        onMouseEnter={e => { e.currentTarget.style.background = C.carbon; e.currentTarget.style.color = C.onDark }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.carbon }}>
        {children}
      </a>
    : <button onClick={onClick} className={cls} style={s}
        onMouseEnter={e => { e.currentTarget.style.background = C.carbon; e.currentTarget.style.color = C.onDark }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.carbon }}>
        {children}
      </button>
}

/* ════════════════ WA SVG ════════════════ */
const WhatsAppIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

/* ════════════════ LOADING ════════════════ */
function LoadingScreen({ onDone }) {
  const C = useContext(ThemeCtx)
  const [fading, setFading] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1400)
    const t2 = setTimeout(onDone, 1900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ background: C.petrol }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl border-2 pulse-ring" style={{ borderColor: `${C.sand}55` }} />
          <div className="absolute inset-0 rounded-3xl border pulse-ring" style={{ borderColor: `${C.sand}30`, animationDelay: '1.2s' }} />
          <img src="/logo.jpg" alt="Korbax" className="w-28 h-28 rounded-3xl object-cover relative z-10"
            style={{ border: `3px solid ${C.sand}` }} />
        </div>
        <div className="text-center">
          <p className="font-outfit text-xs font-bold uppercase tracking-[0.35em]" style={{ color: C.mist }}>Industrias</p>
          <p className="font-outfit font-black text-4xl uppercase tracking-widest" style={{ color: C.sand }}>Korbax</p>
        </div>
        <div className="flex gap-2 mt-1">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full loading-dot"
              style={{ background: C.sand, animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════════════ SCROLL BAR ════════════════ */
function ScrollProgressBar({ progress }) {
  const C = useContext(ThemeCtx)
  return (
    <div className="fixed top-0 left-0 right-0 z-[50] h-[3px] pointer-events-none">
      <div className="scroll-bar h-full" style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${C.sand}, #C45A1A)` }} />
    </div>
  )
}

/* ════════════════ WA FAB ════════════════ */
function WhatsAppFAB() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 2200); return () => clearTimeout(t) }, [])
  return (
    <a href={wa(DEFAULT_MSG)} target="_blank" rel="noopener noreferrer"
      className={`wa-fab-btn fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl ${visible ? 'wa-fab-visible' : ''}`}
      style={{ background: '#25D366' }} aria-label="Contactar por WhatsApp">
      <span className="absolute inset-0 rounded-full wa-ping" style={{ background: '#25D366' }} />
      <span className="relative z-10 text-white flex items-center justify-center"><WhatsAppIcon size={26} /></span>
    </a>
  )
}

/* ════════════════ MODALES ════════════════ */
function PolicyModal({ title, text, onClose }) {
  const C = useContext(ThemeCtx)
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ background: C.ivory }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.border }}>
          <h3 className="font-outfit font-black text-lg uppercase tracking-wide" style={{ color: C.carbon }}>{title}</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.gray }} aria-label="Cerrar">
            <X size={16} style={{ color: C.stone }} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm font-nunito leading-relaxed whitespace-pre-line" style={{ color: C.stone }}>{text}</p>
        </div>
        <div className="px-6 pb-6"><SandBtn onClick={onClose} className="w-full justify-center">Cerrar</SandBtn></div>
      </div>
    </div>
  )
}

/* ════════════════ CATÁLOGO COMPLETO ════════════════ */
function CatalogPage({ onClose }) {
  const C = useContext(ThemeCtx)
  const [active, setActive] = useState(CAT_KEYS[0])
  const items = CATALOG[active]
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: C.ivory }}>
      <div className="px-4 sm:px-8 py-4 flex items-center justify-between shrink-0" style={{ background: C.petrol }}>
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Korbax" className="h-9 w-9 rounded-xl object-cover" />
          <div>
            <p className="font-outfit font-black text-lg uppercase leading-tight" style={{ color: C.onDark }}>Catálogo Completo</p>
            <p className="text-xs font-nunito" style={{ color: C.mist }}>Industrias Korbax — {Object.values(CATALOG).flat().length} modelos disponibles</p>
          </div>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: `${C.sand}20` }} aria-label="Cerrar"
          onMouseEnter={e => e.currentTarget.style.background = `${C.sand}35`}
          onMouseLeave={e => e.currentTarget.style.background = `${C.sand}20`}>
          <X size={18} style={{ color: C.sand }} />
        </button>
      </div>
      <div className="flex shrink-0 overflow-x-auto border-b" style={{ background: C.ivory, borderColor: C.border }}>
        {CAT_KEYS.map(k => (
          <button key={k} onClick={() => setActive(k)} className="relative px-6 py-4 text-sm font-bold font-nunito whitespace-nowrap transition-all"
            style={{ color: active === k ? C.carbon : C.stone }}>
            {k}<span className="ml-1.5 text-xs font-normal" style={{ color: C.mist }}>({CATALOG[k].length})</span>
            {active === k && <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: C.sand }} />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8" style={{ background: C.gray }}>
        <p className="text-xs font-nunito text-center mb-5 max-w-2xl mx-auto" style={{ color: C.stone }}>
          💡 Los precios son <strong>referenciales (desde, por unidad)</strong> y varían según material, acabado, medidas y cantidad. El precio final lo confirmamos en la cotización.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map(p => {
            const msg = `Hola, me interesa cotizar: ${p.name}. ¿Precio y disponibilidad?`
            return (
              <div key={p.id} className="rounded-2xl overflow-hidden flex flex-col border transition-all duration-300 hover:-translate-y-1"
                style={{ background: C.ivory, borderColor: C.border, boxShadow: '0 1px 4px rgba(22,16,16,0.06)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,16,16,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(22,16,16,0.06)'}>
                <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full font-nunito" style={{ background: C.sand, color: C.petrol }}>{active}</span>
                </div>
                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  <h3 className="font-nunito font-extrabold text-sm leading-snug" style={{ color: C.carbon }}>{p.name}</h3>
                  <p className="text-xs font-nunito leading-relaxed flex-1" style={{ color: C.stone }}>{p.desc}</p>
                  <PriceTag value={p.price} size="sm" />
                  <SandBtn href={wa(msg)} size="sm" className="w-full mt-1 py-2.5"><MessageCircle size={13} /> Cotizar por WhatsApp</SandBtn>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-12 mb-4 rounded-2xl p-6 text-center border" style={{ background: C.ivory, borderColor: C.border }}>
          <p className="font-outfit font-black text-xl mb-1" style={{ color: C.carbon }}>¿No encuentras lo que buscas?</p>
          <p className="text-sm font-nunito mb-4" style={{ color: C.stone }}>Fabricamos mobiliario a medida para tu espacio y presupuesto.</p>
          <SandBtn href={wa('Hola, quisiera un presupuesto para mobiliario a medida para mi empresa.')}><MessageCircle size={15} /> Solicitar fabricación a medida</SandBtn>
        </div>
      </div>
    </div>
  )
}

/* ════════════════ GALLERY CARD ════════════════ */
function GalleryCard({ item }) {
  const C = useContext(ThemeCtx)
  const [open, setOpen] = useState(false)
  return (
    <>
      <div onClick={() => setOpen(true)} className="relative rounded-2xl overflow-hidden cursor-zoom-in group h-full" style={{ boxShadow: '0 2px 8px rgba(22,16,16,0.1)' }}>
        <img src={item.img} alt={item.label} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-108" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ background: `${C.sand}15` }} />
        <div className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <ZoomIn size={15} className="text-white" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <p className="font-outfit font-black text-white uppercase text-base sm:text-lg leading-tight drop-shadow-sm">{item.label}</p>
          <p className="text-white/65 text-xs font-nunito mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{item.sub}</p>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/93 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <button className="absolute top-4 right-4 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors" aria-label="Cerrar"><X size={18} className="text-white" /></button>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={item.img} alt={item.label} className="w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl" />
            <div className="text-center mt-5">
              <p className="font-outfit font-black text-white text-2xl uppercase tracking-wide">{item.label}</p>
              <p className="text-white/50 text-sm font-nunito mt-1">{item.sub}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ════════════════ PRICE TAG (precio "desde" referencial, con descuento) ════════════════ */
function PriceTag({ value, size = 'md' }) {
  const C = useContext(ThemeCtx)
  if (!value) return null
  const big = size === 'md'
  // Precio "antes" ≈ 30% más alto, redondeado a número limpio (acabado en 0/5)
  const before = Math.round((value / 0.7) / 5) * 5
  const off = Math.round((1 - value / before) * 100)
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-nunito line-through" style={{ color: C.mist, fontSize: big ? '0.8rem' : '0.7rem' }}>
          S/ {before.toLocaleString('es-PE')}
        </span>
        <span className="font-nunito font-black rounded-full px-2 py-0.5" style={{ background: '#E11D48', color: '#fff', fontSize: big ? '0.62rem' : '0.56rem' }}>
          -{off}%
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="font-nunito font-bold uppercase tracking-wide" style={{ color: C.stone, fontSize: big ? '0.7rem' : '0.62rem' }}>Desde</span>
        <span className="font-outfit font-black leading-none" style={{ color: C.carbon, fontSize: big ? '1.5rem' : '1.15rem' }}>
          S/ {value.toLocaleString('es-PE')}
        </span>
        <span className="font-nunito" style={{ color: C.mist, fontSize: big ? '0.66rem' : '0.6rem' }}>ref. + IGV</span>
      </div>
    </div>
  )
}

/* ════════════════ PRODUCT CARD ════════════════ */
function ProductCard({ p, delay }) {
  const C = useContext(ThemeCtx)
  const cardRef = useRef(null)
  const { qtyOf, add, inc, dec } = useCart()
  const key = `cat-${p.id}`
  const q = qtyOf(key)
  const msg = `Hola, me interesa cotizar: ${p.name}. ¿Precio y disponibilidad?`
  const handleMove = (e) => {
    const card = cardRef.current; if (!card) return
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top)  / r.height - 0.5
    card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`
    card.style.boxShadow = `${-x * 20}px ${Math.abs(y) * 10 + 16}px 40px rgba(22,16,16,0.14)`
  }
  const handleLeave = () => {
    const card = cardRef.current; if (!card) return
    card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0px)'
    card.style.boxShadow = '0 1px 4px rgba(22,16,16,0.06)'
  }
  return (
    <div ref={cardRef} className="product-card flex flex-col rounded-2xl overflow-hidden border"
      style={{ background: C.ivory, borderColor: C.border, boxShadow: '0 1px 4px rgba(22,16,16,0.06)', animation: 'card-appear 0.4s ease both', animationDelay: `${delay}ms` }}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div className="relative overflow-hidden group" style={{ aspectRatio: '4/3' }}>
        <img src={p.img} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `${C.sand}12` }} />
        <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full font-nunito" style={{ background: C.sand, color: C.petrol }}>{p.tag}</span>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="font-nunito font-extrabold text-base leading-snug" style={{ color: C.carbon }}>{p.name}</h3>
        <p className="text-sm font-nunito leading-relaxed flex-1" style={{ color: C.stone }}>{p.desc}</p>
        <PriceTag value={p.price} />
        {q > 0
          ? <div className="mt-auto flex items-center justify-between gap-2 rounded-xl p-1" style={{ background: C.gray }}>
              <button onClick={() => dec(key)} className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg active:scale-90 transition-transform" style={{ background: C.ivory, color: C.carbon, border: `1px solid ${C.border}` }}>−</button>
              <span className="font-nunito font-extrabold text-sm" style={{ color: C.carbon }}>{q} en el pedido</span>
              <button onClick={() => inc(key)} className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg active:scale-90 transition-transform" style={{ background: C.sand, color: C.petrol }}>+</button>
            </div>
          : <SandBtn onClick={() => add(key, p.name)} className="w-full mt-auto"><Plus size={15} /> Agregar al pedido</SandBtn>}
        <a href={wa(msg)} target="_blank" rel="noopener noreferrer" className="text-center text-xs font-nunito font-bold underline underline-offset-2 transition-opacity hover:opacity-70" style={{ color: C.stone }}>o cotízalo ya por WhatsApp</a>
      </div>
    </div>
  )
}

/* ════════════════ BEFORE / AFTER SLIDER ════════════════ */
function BeforeAfterSlider() {
  const C = useContext(ThemeCtx)
  const [pos, setPos] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const getPos = (clientX) => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    setPos(Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.petrol }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 fade-up">
          <SectionLabel>Transformación</SectionLabel>
          <h2 className="font-outfit font-black uppercase leading-none mb-3"
            style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.onDark }}>
            Antes y después
          </h2>
          <p className="font-nunito text-base" style={{ color: C.mist }}>
            Así transformamos los espacios comerciales de nuestros clientes.
          </p>
        </div>

        <div className="fade-up rounded-2xl overflow-hidden relative select-none"
          ref={containerRef}
          style={{ aspectRatio: '16/9', touchAction: 'none', cursor: 'ew-resize' }}
          onMouseMove={e => dragging.current && getPos(e.clientX)}
          onMouseDown={e => { dragging.current = true; getPos(e.clientX) }}
          onMouseUp={() => dragging.current = false}
          onMouseLeave={() => dragging.current = false}
          onTouchMove={e => { e.preventDefault(); getPos(e.touches[0].clientX) }}
          onTouchStart={e => getPos(e.touches[0].clientX)}>

          {/* Después (fondo completo) */}
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&fit=crop"
            alt="Después — con mobiliario Korbax"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Antes (izquierda, recortada) */}
          <div className="absolute top-0 left-0 bottom-0 overflow-hidden pointer-events-none"
            style={{ width: `${pos}%` }}>
            <img
              src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80&fit=crop"
              alt="Antes"
              className="absolute top-0 left-0 h-full object-cover"
              style={{ width: `${10000 / pos}%`, maxWidth: 'none' }}
              draggable={false}
            />
          </div>

          {/* Línea divisoria */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `calc(${pos}% - 1px)` }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-2xl flex items-center justify-center">
              <ChevronsLeftRight size={17} style={{ color: C.petrol }} />
            </div>
          </div>

          {/* Etiquetas */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <span className="text-xs font-nunito font-black px-3 py-1.5 rounded-full text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>Antes</span>
          </div>
          <div className="absolute top-4 right-4 pointer-events-none">
            <span className="text-xs font-nunito font-black px-3 py-1.5 rounded-full" style={{ background: C.sand, color: C.petrol }}>Con Korbax</span>
          </div>
        </div>

        <p className="text-center text-xs font-nunito mt-4" style={{ color: C.mist }}>
          Arrastra para comparar · Mobiliario fabricado por Industrias Korbax
        </p>
      </div>
    </section>
  )
}

/* ════════════════ PROCESS TIMELINE ════════════════ */
function ProcessTimeline() {
  const C = useContext(ThemeCtx)
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.gray }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 fade-up">
          <SectionLabel>Proceso</SectionLabel>
          <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Cómo fabricamos</h2>
          <p className="font-nunito max-w-md mx-auto text-base" style={{ color: C.stone }}>De la idea al mobiliario terminado, controlamos cada etapa sin intermediarios.</p>
        </div>
        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${C.sand}50 15%, ${C.sand}50 85%, transparent)` }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROCESS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="fade-up flex flex-col items-center text-center" style={{ transitionDelay: `${i * 110}ms` }}>
                  <div className="relative mb-5">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 relative z-10"
                      style={{ background: C.ivory, borderColor: `${C.sand}55`, boxShadow: `0 4px 24px ${C.sand}22` }}>
                      <Icon size={28} style={{ color: C.sand }} />
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black font-outfit z-20"
                      style={{ background: C.sand, color: C.petrol }}>{step.step}</span>
                  </div>
                  <h3 className="font-outfit font-black text-lg uppercase mb-2" style={{ color: C.carbon }}>{step.title}</h3>
                  <p className="text-sm font-nunito leading-relaxed max-w-[200px]" style={{ color: C.stone }}>{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
        <div className="text-center mt-12 fade-up">
          <SandBtn href={wa('Hola, quisiera iniciar el proceso para fabricar mobiliario para mi empresa.')} size="md">
            <MessageCircle size={15} /> Iniciar mi pedido
          </SandBtn>
        </div>
      </div>
    </section>
  )
}

/* ════════════════ TESTIMONIOS ════════════════ */
function Testimonials() {
  const C = useContext(ThemeCtx)
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.ivory }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 fade-up">
          <SectionLabel>Testimonios</SectionLabel>
          <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Lo que dicen nuestros clientes</h2>
          <p className="font-nunito max-w-md mx-auto text-base" style={{ color: C.stone }}>Más de 500 empresas en todo el Perú confían en Industrias Korbax.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="fade-up rounded-2xl p-6 sm:p-7 border relative overflow-hidden"
              style={{ background: C.ivory, borderColor: C.border, boxShadow: '0 1px 4px rgba(22,16,16,0.05)', transitionDelay: `${i * 80}ms` }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 32px rgba(22,16,16,0.08)`; e.currentTarget.style.borderColor = `${C.sand}60` }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(22,16,16,0.05)'; e.currentTarget.style.borderColor = C.border }}>
              <div className="absolute top-4 right-5 font-outfit font-black text-8xl leading-none select-none pointer-events-none" style={{ color: `${C.sand}18` }}>"</div>
              <div className="flex gap-0.5 mb-4">{[...Array(t.rating)].map((_, si) => <Star key={si} size={14} style={{ fill: C.sand, color: C.sand }} />)}</div>
              <p className="text-sm font-nunito leading-relaxed mb-5 relative z-10" style={{ color: C.stone }}>"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: C.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-outfit font-black text-sm shrink-0" style={{ background: `${C.petrol}12`, color: C.petrol }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-nunito font-extrabold text-sm" style={{ color: C.carbon }}>{t.name}</p>
                  <p className="text-xs font-nunito" style={{ color: C.stone }}>{t.company} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════ FURNITURE CARD (foto real + logo) ════════════════ */
/* ── mueble vectorial (madera + acero, tapizado teñido con el color del rubro) ── */
function FurnitureSVG({ type, accent, wood, steel, bare }) {
  const baseW = wood || FCOL.wood
  const baseS = steel || FCOL.steel
  const w = {
    woodL: hexLighten(baseW, 18), wood: baseW, woodD: hexDarken(baseW, 22),
    steelL: hexLighten(baseS, 20), steel: baseS, steelD: hexDarken(baseS, 24),
  }
  const up = accent, upD = hexDarken(accent, 26), upL = hexLighten(accent, 16)
  const gid = `floor-${type}`

  const piece = () => {
    switch (type) {
      case 'mesa': return (
        <g>
          <rect x="80"  y="150" width="9" height="104" rx="3" fill={w.steel} />
          <rect x="311" y="150" width="9" height="104" rx="3" fill={w.steelD} />
          <rect x="124" y="150" width="9" height="96"  rx="3" fill={w.steelD} />
          <rect x="267" y="150" width="9" height="96"  rx="3" fill={w.steel} />
          <polygon points="60,150 340,150 340,163 60,163" fill={w.woodD} />
          <polygon points="84,116 316,116 348,150 52,150" fill={w.wood} />
          <polygon points="84,116 316,116 312,121 88,121" fill={w.woodL} opacity="0.7" />
        </g>
      )
      case 'mesared': return (
        <g>
          <ellipse cx="200" cy="250" rx="46" ry="11" fill={w.steelD} />
          <rect x="192" y="150" width="16" height="100" fill={w.steel} />
          <rect x="192" y="150" width="6"  height="100" fill={w.steelL} opacity="0.5" />
          <ellipse cx="200" cy="146" rx="120" ry="38" fill={w.woodD} />
          <ellipse cx="200" cy="140" rx="120" ry="38" fill={w.wood} />
          <ellipse cx="200" cy="138" rx="112" ry="32" fill={w.woodL} opacity="0.6" />
        </g>
      )
      case 'mesaalta': return (
        <g>
          <ellipse cx="200" cy="250" rx="40" ry="11" fill={w.steelD} />
          <rect x="195" y="98" width="10" height="152" fill={w.steel} />
          <rect x="195" y="98" width="4"  height="152" fill={w.steelL} opacity="0.5" />
          <ellipse cx="200" cy="96" rx="70" ry="22" fill={w.woodD} />
          <ellipse cx="200" cy="92" rx="70" ry="22" fill={w.wood} />
          <ellipse cx="200" cy="90" rx="64" ry="18" fill={w.woodL} opacity="0.6" />
        </g>
      )
      case 'silla': return (
        <g>
          <rect x="150" y="120" width="8" height="138" rx="3" fill={w.steelD} />
          <rect x="242" y="120" width="8" height="138" rx="3" fill={w.steelD} />
          <rect x="148" y="68" width="104" height="62" rx="12" fill={upD} />
          <rect x="155" y="73" width="90"  height="52" rx="9"  fill={up} />
          <rect x="161" y="79" width="78"  height="15" rx="6"  fill={upL} opacity="0.5" />
          <polygon points="138,150 262,150 272,174 128,174" fill={upD} />
          <polygon points="140,147 260,147 268,167 132,167" fill={up} />
          <rect x="136" y="167" width="8" height="92" rx="3" fill={w.steel} />
          <rect x="256" y="167" width="8" height="92" rx="3" fill={w.steel} />
        </g>
      )
      case 'taburete': return (
        <g>
          <ellipse cx="200" cy="252" rx="42" ry="10" fill={w.steelD} />
          <line x1="200" y1="150" x2="158" y2="252" stroke={w.steelD} strokeWidth="7" strokeLinecap="round" />
          <line x1="200" y1="150" x2="242" y2="252" stroke={w.steel}  strokeWidth="7" strokeLinecap="round" />
          <line x1="200" y1="150" x2="185" y2="254" stroke={w.steel}  strokeWidth="6" strokeLinecap="round" />
          <line x1="200" y1="150" x2="215" y2="254" stroke={w.steelD} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="200" cy="208" rx="36" ry="9" fill="none" stroke={w.steelL} strokeWidth="4" />
          <ellipse cx="200" cy="150" rx="58" ry="18" fill={upD} />
          <ellipse cx="200" cy="146" rx="58" ry="18" fill={up} />
          <ellipse cx="200" cy="143" rx="48" ry="12" fill={upL} opacity="0.5" />
        </g>
      )
      case 'barra': return (
        <g>
          <polygon points="74,108 326,108 348,128 52,128" fill={w.woodL} />
          <polygon points="52,128 348,128 348,134 52,134" fill={w.woodD} />
          <rect x="58" y="134" width="284" height="116" fill={w.wood} />
          <rect x="58" y="130" width="284" height="5" fill={accent} />
          <line x1="152" y1="134" x2="152" y2="250" stroke={w.woodD} strokeWidth="3" />
          <line x1="248" y1="134" x2="248" y2="250" stroke={w.woodD} strokeWidth="3" />
          <rect x="58" y="244" width="284" height="8" fill={w.woodD} />
        </g>
      )
      case 'mostrador': return (
        <g>
          <polygon points="70,120 330,120 350,140 50,140" fill={w.woodL} />
          <rect x="50" y="140" width="300" height="110" fill={w.wood} />
          <polygon points="64,112 336,112 356,134 44,134" fill={accent} />
          <polygon points="44,134 356,134 356,140 44,140" fill={hexDarken(accent, 28)} />
          <line x1="150" y1="140" x2="150" y2="250" stroke={w.woodD} strokeWidth="3" />
          <line x1="250" y1="140" x2="250" y2="250" stroke={w.woodD} strokeWidth="3" />
          <rect x="50" y="244" width="300" height="8" fill={w.woodD} />
        </g>
      )
      case 'set': return (
        <g>
          <rect x="118" y="92" width="40" height="44" rx="8" fill={upD} />
          <rect x="242" y="92" width="40" height="44" rx="8" fill={upD} />
          <rect x="122" y="150" width="8" height="86" fill={w.steelD} />
          <rect x="270" y="150" width="8" height="86" fill={w.steelD} />
          <polygon points="112,128 288,128 312,154 88,154" fill={w.wood} />
          <polygon points="88,154 312,154 312,163 88,163" fill={w.woodD} />
          <rect x="92"  y="170" width="62" height="18" rx="6" fill={up} />
          <rect x="246" y="170" width="62" height="18" rx="6" fill={up} />
          <rect x="98"  y="118" width="50" height="54" rx="10" fill={up} />
          <rect x="252" y="118" width="50" height="54" rx="10" fill={up} />
          <rect x="104" y="186" width="8" height="66" fill={w.steel} />
          <rect x="288" y="186" width="8" height="66" fill={w.steel} />
        </g>
      )
      case 'setbar': return (
        <g>
          <ellipse cx="200" cy="246" rx="34" ry="9" fill={w.steelD} />
          <rect x="196" y="100" width="9" height="146" fill={w.steel} />
          <ellipse cx="200" cy="100" rx="60" ry="18" fill={w.woodD} />
          <ellipse cx="200" cy="96"  rx="60" ry="18" fill={w.wood} />
          <line x1="110" y1="172" x2="92"  y2="250" stroke={w.steelD} strokeWidth="6" strokeLinecap="round" />
          <line x1="110" y1="172" x2="128" y2="250" stroke={w.steel}  strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="110" cy="170" rx="34" ry="11" fill={upD} />
          <ellipse cx="110" cy="166" rx="34" ry="11" fill={up} />
          <line x1="290" y1="172" x2="272" y2="250" stroke={w.steelD} strokeWidth="6" strokeLinecap="round" />
          <line x1="290" y1="172" x2="308" y2="250" stroke={w.steel}  strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="290" cy="170" rx="34" ry="11" fill={upD} />
          <ellipse cx="290" cy="166" rx="34" ry="11" fill={up} />
        </g>
      )
      case 'setespera': return (
        <g>
          <rect x="78"  y="170" width="9" height="84" fill={w.steelD} />
          <rect x="313" y="170" width="9" height="84" fill={w.steelD} />
          <rect x="196" y="170" width="9" height="84" fill={w.steel} />
          <rect x="68" y="84"  width="264" height="50" rx="12" fill={upD} />
          <rect x="74" y="89"  width="252" height="40" rx="9"  fill={up} />
          <line x1="200" y1="89" x2="200" y2="129" stroke={upD} strokeWidth="3" />
          <polygon points="58,150 342,150 354,178 46,178" fill={upD} />
          <polygon points="60,147 340,147 350,170 50,170" fill={up} />
          <line x1="200" y1="147" x2="200" y2="170" stroke={upD} strokeWidth="3" />
        </g>
      )
      case 'mesacuad': return (
        <g>
          <rect x="110" y="150" width="9" height="98" rx="3" fill={w.steel} />
          <rect x="281" y="150" width="9" height="98" rx="3" fill={w.steelD} />
          <rect x="140" y="150" width="9" height="92" rx="3" fill={w.steelD} />
          <rect x="251" y="150" width="9" height="92" rx="3" fill={w.steel} />
          <polygon points="110,150 290,150 290,162 110,162" fill={w.woodD} />
          <polygon points="120,120 280,120 312,150 88,150" fill={w.wood} />
          <polygon points="120,120 280,120 276,125 124,125" fill={w.woodL} opacity="0.7" />
        </g>
      )
      case 'mesaconf': return (
        <g>
          <rect x="58"  y="150" width="9" height="100" rx="3" fill={w.steel} />
          <rect x="333" y="150" width="9" height="100" rx="3" fill={w.steelD} />
          <rect x="160" y="150" width="9" height="96"  rx="3" fill={w.steelD} />
          <rect x="231" y="150" width="9" height="96"  rx="3" fill={w.steel} />
          <polygon points="40,150 360,150 360,164 40,164" fill={w.woodD} />
          <polygon points="70,112 330,112 372,150 28,150" fill={w.wood} />
          <polygon points="70,112 330,112 326,118 74,118" fill={w.woodL} opacity="0.7" />
        </g>
      )
      case 'sillapil': return (
        <g>
          <rect x="150" y="120" width="7" height="138" rx="3" fill={w.steel} />
          <rect x="243" y="120" width="7" height="138" rx="3" fill={w.steel} />
          <rect x="142" y="160" width="7" height="98"  rx="3" fill={w.steelD} />
          <rect x="251" y="160" width="7" height="98"  rx="3" fill={w.steelD} />
          <rect x="150" y="72" width="100" height="17" rx="7" fill={up} />
          <rect x="150" y="97" width="100" height="17" rx="7" fill={up} />
          <polygon points="138,150 262,150 270,170 130,170" fill={upD} />
          <polygon points="140,148 260,148 266,164 134,164" fill={up} />
        </g>
      )
      case 'sillejec': return (
        <g>
          <line x1="200" y1="222" x2="150" y2="252" stroke={w.steelD} strokeWidth="6" strokeLinecap="round" />
          <line x1="200" y1="222" x2="250" y2="252" stroke={w.steelD} strokeWidth="6" strokeLinecap="round" />
          <line x1="200" y1="222" x2="200" y2="256" stroke={w.steel}  strokeWidth="6" strokeLinecap="round" />
          <line x1="200" y1="222" x2="122" y2="242" stroke={w.steel}  strokeWidth="6" strokeLinecap="round" />
          <line x1="200" y1="222" x2="278" y2="242" stroke={w.steelD} strokeWidth="6" strokeLinecap="round" />
          <circle cx="150" cy="254" r="6" fill={w.steelD} />
          <circle cx="250" cy="254" r="6" fill={w.steelD} />
          <circle cx="200" cy="258" r="6" fill={w.steelD} />
          <circle cx="122" cy="244" r="6" fill={w.steelD} />
          <circle cx="278" cy="244" r="6" fill={w.steelD} />
          <rect x="194" y="170" width="12" height="54" fill={w.steel} />
          <rect x="152" y="64" width="96" height="78" rx="16" fill={upD} />
          <rect x="159" y="69" width="82" height="68" rx="12" fill={up} />
          <rect x="165" y="75" width="70" height="16" rx="6" fill={upL} opacity="0.5" />
          <rect x="138" y="122" width="10" height="42" rx="4" fill={w.steelD} />
          <rect x="252" y="122" width="10" height="42" rx="4" fill={w.steelD} />
          <ellipse cx="200" cy="168" rx="56" ry="16" fill={upD} />
          <ellipse cx="200" cy="164" rx="56" ry="16" fill={up} />
        </g>
      )
      case 'butaca': return (
        <g>
          <rect x="120" y="198" width="9" height="56" fill={w.woodD} />
          <rect x="271" y="198" width="9" height="56" fill={w.woodD} />
          <rect x="116" y="76" width="168" height="74" rx="18" fill={upD} />
          <rect x="124" y="82" width="152" height="62" rx="14" fill={up} />
          <rect x="130" y="88" width="60"  height="16" rx="6" fill={upL} opacity="0.45" />
          <rect x="102" y="130" width="34" height="76" rx="14" fill={upD} />
          <rect x="264" y="130" width="34" height="76" rx="14" fill={upD} />
          <ellipse cx="119" cy="134" rx="17" ry="10" fill={up} />
          <ellipse cx="281" cy="134" rx="17" ry="10" fill={up} />
          <rect x="116" y="146" width="168" height="42" rx="12" fill={up} />
          <rect x="124" y="150" width="152" height="14" rx="6" fill={upL} opacity="0.4" />
        </g>
      )
      default: return null
    }
  }

  // Modo "bare": solo el mueble + sombra (sin fondo), para componer escenas/ambientes
  if (bare) {
    return (
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id={`${gid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <ellipse cx="200" cy="266" rx="120" ry="13" fill="rgba(0,0,0,0.28)" filter={`url(#${gid}-blur)`} />
        {piece()}
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Pared de fondo (showroom) */}
        <linearGradient id={`${gid}-wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#efe9e0" />
          <stop offset="100%" stopColor="#e2dacd" />
        </linearGradient>
        {/* Piso con degradado (más oscuro al frente = profundidad) */}
        <linearGradient id={`${gid}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#dccfbd" />
          <stop offset="100%" stopColor="#cab792" stopOpacity="0.85" />
        </linearGradient>
        {/* Spotlight detrás del mueble */}
        <radialGradient id={`${gid}-spot`} cx="50%" cy="44%" r="60%">
          <stop offset="0%"   stopColor="#fffdf8" stopOpacity="0.9" />
          <stop offset="55%"  stopColor="#fffdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#fffdf8" stopOpacity="0" />
        </radialGradient>
        {/* Viñeta para dar foco al centro */}
        <radialGradient id={`${gid}-vig`} cx="50%" cy="46%" r="72%">
          <stop offset="60%"  stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </radialGradient>
        {/* Sombra de contacto difuminada (realista) */}
        <filter id={`${gid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {/* Pared + piso con línea de horizonte */}
      <rect x="0" y="0"   width="400" height="186" fill={`url(#${gid}-wall)`} />
      <rect x="0" y="186" width="400" height="114" fill={`url(#${gid}-floor)`} />
      <rect x="0" y="184" width="400" height="3" fill="#000" opacity="0.05" />
      {/* Líneas de piso en perspectiva (convergen al centro) */}
      <g stroke="#b8a888" strokeWidth="1" opacity="0.35">
        <line x1="200" y1="186" x2="-60"  y2="300" />
        <line x1="200" y1="186" x2="120"  y2="300" />
        <line x1="200" y1="186" x2="280"  y2="300" />
        <line x1="200" y1="186" x2="460"  y2="300" />
      </g>
      {/* Spotlight */}
      <rect x="0" y="0" width="400" height="300" fill={`url(#${gid}-spot)`} />
      {/* Sombra de contacto difuminada bajo el mueble */}
      <ellipse cx="200" cy="266" rx="140" ry="16" fill="rgba(0,0,0,0.22)" filter={`url(#${gid}-blur)`} />
      {piece()}
      {/* Viñeta encima para enfocar */}
      <rect x="0" y="0" width="400" height="300" fill={`url(#${gid}-vig)`} pointerEvents="none" />
    </svg>
  )
}

/* ════════════════ TEMAS DE AMBIENTE POR RUBRO ════════════════ */
// Cada rubro = paleta de pared/piso + decoración propia (props SVG). decor(accent) usa el color del rubro.
const ROOM_THEMES = {
  restaurante: {
    wall: ['#f3ede4', '#e7dccb'], floor: ['#d9c9af', '#c2ab82'], line: '#a8946f',
    decor: (a) => (<>
      <rect x="36" y="28" width="116" height="92" rx="4" fill="#cfe8f2" stroke="#b9b0a2" strokeWidth="3" />
      <line x1="94" y1="28" x2="94" y2="120" stroke="#b9b0a2" strokeWidth="3" /><line x1="36" y1="74" x2="152" y2="74" stroke="#b9b0a2" strokeWidth="3" />
      <rect x="250" y="40" width="64" height="48" rx="3" fill={a} opacity="0.8" stroke="#b9b0a2" strokeWidth="3" />
      <rect x="338" y="118" width="20" height="46" rx="3" fill="#9c7b53" /><ellipse cx="348" cy="110" rx="22" ry="20" fill="#5b8c5a" /><ellipse cx="334" cy="118" rx="15" ry="14" fill="#6fa36c" /><ellipse cx="362" cy="118" rx="15" ry="14" fill="#4f7d4e" />
    </>),
  },
  bar: {
    wall: ['#2c2630', '#1f1b24'], floor: ['#3a3138', '#241e25'], line: '#4a3f48',
    decor: (a) => (<>
      {/* repisa con botellas */}
      <rect x="28" y="30" width="180" height="64" rx="3" fill="#171319" stroke="#3a323e" strokeWidth="2" />
      <line x1="28" y1="62" x2="208" y2="62" stroke="#3a323e" strokeWidth="2" />
      {[40,58,76,94,112,130,148,166,184].map((x,i)=>(<rect key={i} x={x} y={i%2?38:42} width="9" height={i%2?20:16} rx="2" fill={['#7c5cbf','#c98a3a','#3a8f6f','#b14a4a'][i%4]} opacity="0.85" />))}
      {[40,58,76,94,112,130,148,166,184].map((x,i)=>(<rect key={'b'+i} x={x} y={70} width="9" height="18" rx="2" fill={['#c98a3a','#7c5cbf','#b14a4a','#3a8f6f'][i%4]} opacity="0.8" />))}
      {/* letrero neón */}
      <rect x="244" y="40" width="86" height="34" rx="17" fill="none" stroke={a} strokeWidth="3" opacity="0.9" />
      <circle cx="262" cy="57" r="4" fill={a} /><circle cx="287" cy="57" r="4" fill={a} /><circle cx="312" cy="57" r="4" fill={a} />
    </>),
  },
  oficina: {
    wall: ['#eef1f4', '#dde3ea'], floor: ['#cdd2d8', '#aeb6c0'], line: '#9aa3ae',
    decor: (a) => (<>
      {/* ventanal con persianas */}
      <rect x="30" y="26" width="150" height="96" rx="3" fill="#cfe2ee" stroke="#9aa3ae" strokeWidth="3" />
      {[40,54,68,82,96,110].map(y=>(<line key={y} x1="30" y1={y} x2="180" y2={y} stroke="#b7cad8" strokeWidth="4" />))}
      <line x1="105" y1="26" x2="105" y2="122" stroke="#9aa3ae" strokeWidth="3" />
      {/* reloj de pared */}
      <circle cx="280" cy="56" r="22" fill="#fff" stroke={a} strokeWidth="3" /><line x1="280" y1="56" x2="280" y2="42" stroke="#333" strokeWidth="2" /><line x1="280" y1="56" x2="291" y2="60" stroke="#333" strokeWidth="2" />
      <rect x="328" y="120" width="22" height="44" rx="3" fill="#7d6a52" /><ellipse cx="339" cy="112" rx="20" ry="18" fill="#5b8c5a" />
    </>),
  },
  colegio: {
    wall: ['#eaf4f0', '#d6ebe3'], floor: ['#d8cdb6', '#c0b18d'], line: '#aa9c78',
    decor: (a) => (<>
      {/* pizarra */}
      <rect x="32" y="28" width="186" height="86" rx="4" fill="#2f5d4a" stroke="#caa45a" strokeWidth="5" />
      <path d="M48 64 H120 M48 78 H150 M48 92 H100" stroke="#e8efe8" strokeWidth="2" opacity="0.8" fill="none" />
      <rect x="60" y="106" width="40" height="5" rx="2" fill="#caa45a" />
      {/* mapa/poster */}
      <rect x="252" y="36" width="64" height="50" rx="3" fill={a} opacity="0.75" stroke="#b9b0a2" strokeWidth="3" />
    </>),
  },
  hotel: {
    wall: ['#efe7da', '#e1d3bd'], floor: ['#c9b79a', '#a98f6c'], line: '#9a8364',
    decor: (a) => (<>
      {/* cuadro elegante con doble marco */}
      <rect x="40" y="30" width="84" height="64" rx="2" fill="#cdbf9e" stroke="#b89b5e" strokeWidth="4" /><rect x="50" y="40" width="64" height="44" rx="2" fill={a} opacity="0.6" />
      <rect x="150" y="30" width="84" height="64" rx="2" fill="#cdbf9e" stroke="#b89b5e" strokeWidth="4" /><rect x="160" y="40" width="64" height="44" rx="2" fill={a} opacity="0.45" />
      {/* aplique de luz */}
      <circle cx="288" cy="50" r="10" fill="#ffe9b8" /><path d="M278 50 Q288 78 298 50 Z" fill="#ffe9b8" opacity="0.5" />
      <rect x="336" y="116" width="22" height="48" rx="3" fill="#8a6f4f" /><ellipse cx="347" cy="108" rx="22" ry="20" fill="#5e8a5c" />
    </>),
  },
  cafeteria: {
    wall: ['#efe4d4', '#e0cdb2'], floor: ['#cdb892', '#b39a6e'], line: '#9c8460',
    decor: (a) => (<>
      {/* pizarra de menú */}
      <rect x="34" y="28" width="120" height="92" rx="4" fill="#2a2420" stroke="#8a6f4f" strokeWidth="5" />
      <path d="M48 50 H140 M48 66 H120 M48 82 H132 M48 98 H110" stroke={a} strokeWidth="2" opacity="0.85" fill="none" />
      {/* lámparas colgantes */}
      {[210,250,290].map(x=>(<g key={x}><line x1={x} y1="20" x2={x} y2="40" stroke="#7d6a52" strokeWidth="2" /><path d={`M${x-12} 54 Q${x} 30 ${x+12} 54 Z`} fill={a} opacity="0.85" /></g>))}
      <rect x="338" y="120" width="20" height="44" rx="3" fill="#9c7b53" /><ellipse cx="348" cy="112" rx="20" ry="18" fill="#5b8c5a" />
    </>),
  },
  clinica: {
    wall: ['#f4f8fa', '#e4eef2'], floor: ['#dfe6e8', '#c4d0d3'], line: '#a9b6ba',
    decor: (a) => (<>
      {/* cruz médica */}
      <rect x="58" y="40" width="56" height="56" rx="8" fill="#fff" stroke={a} strokeWidth="3" /><rect x="80" y="50" width="12" height="36" rx="2" fill={a} /><rect x="68" y="62" width="36" height="12" rx="2" fill={a} />
      {/* ventana limpia */}
      <rect x="244" y="30" width="92" height="80" rx="3" fill="#dff0f5" stroke="#a9b6ba" strokeWidth="3" /><line x1="290" y1="30" x2="290" y2="110" stroke="#a9b6ba" strokeWidth="3" /><line x1="244" y1="70" x2="336" y2="70" stroke="#a9b6ba" strokeWidth="3" />
    </>),
  },
  eventos: {
    wall: ['#352b3e', '#241d2c'], floor: ['#5a4a52', '#33272f'], line: '#5a4a55',
    decor: (a) => (<>
      {/* cortinas / drapeado */}
      {[0,1,2,3,4,5,6,7].map(i=>(<path key={i} d={`M${i*52} 0 Q${i*52+26} 70 ${i*52} 130 L${i*52+52} 130 Q${i*52+26} 70 ${i*52+52} 0 Z`} fill={i%2?'#3d3147':'#463853'} opacity="0.7" />))}
      {/* guirnalda de luces */}
      <path d="M10 24 Q200 70 390 24" stroke="#6b5a66" strokeWidth="2" fill="none" />
      {[30,70,110,150,190,230,270,310,350].map((x,i)=>(<circle key={x} cx={x} cy={36 + (i%2?14:0)} r="4" fill={i%2?a:'#ffe08a'} />))}
    </>),
  },
}

/* ════════════════ ROOM SCENE (vista de ambiente / local equipado) ════════════════ */
function RoomScene({ model, accent, wood, steel, logo, placement, estType }) {
  const theme = ROOM_THEMES[estType] ?? ROOM_THEMES.restaurante
  const surf = LOGO_SURFACE[model.svgType] ?? LOGO_SURFACE.mesa
  const pl = placement ?? { x: surf.left, y: surf.top, scale: 1, tilt: surf.rotateX, rotate: 0 }

  // Una pieza con su logo encima (caja relativa 4:3)
  const Piece = () => (
    <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
      <FurnitureSVG type={model.svgType} accent={accent} wood={wood} steel={steel} bare />
      {logo && (
        <div className="absolute pointer-events-none"
          style={{
            top: `${pl.y}%`, left: `${pl.x}%`, width: `${surf.w * pl.scale}%`,
            transform: `translate(-50%,-50%) perspective(420px) rotateX(${pl.tilt}deg) rotateY(${surf.rotateY}deg) rotateZ(${pl.rotate || 0}deg)`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
          }}>
          <img src={logo} alt="logo" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
      )}
    </div>
  )

  // 3 copias colocadas con profundidad (atrás más pequeñas, adelante más grande)
  const spots = [
    { left: '2%',  bottom: '34%', width: '38%', z: 1, op: 0.92 },
    { left: '60%', bottom: '36%', width: '36%', z: 1, op: 0.92 },
    { left: '27%', bottom: '2%',  width: '50%', z: 2, op: 1 },
  ]

  return (
    <div className="relative w-full overflow-hidden rounded-2xl select-none" style={{ aspectRatio: '4/3' }}>
      {/* Pared + decoración + piso del local (según rubro) */}
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`room-wall-${estType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.wall[0]} /><stop offset="100%" stopColor={theme.wall[1]} />
          </linearGradient>
          <linearGradient id={`room-floor-${estType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.floor[0]} /><stop offset="100%" stopColor={theme.floor[1]} />
          </linearGradient>
        </defs>
        {/* pared */}
        <rect x="0" y="0" width="400" height="172" fill={`url(#room-wall-${estType})`} />
        {/* decoración propia del rubro */}
        {theme.decor(accent)}
        {/* piso */}
        <rect x="0" y="170" width="400" height="130" fill={`url(#room-floor-${estType})`} />
        <rect x="0" y="168" width="400" height="4" fill="#000" opacity="0.07" />
        {/* tablas del piso en perspectiva */}
        <g stroke={theme.line} strokeWidth="1" opacity="0.4">
          <line x1="200" y1="170" x2="-120" y2="300" />
          <line x1="200" y1="170" x2="60"   y2="300" />
          <line x1="200" y1="170" x2="200"  y2="300" />
          <line x1="200" y1="170" x2="340"  y2="300" />
          <line x1="200" y1="170" x2="520"  y2="300" />
        </g>
      </svg>
      {/* Muebles colocados */}
      {spots.map((s, i) => (
        <div key={i} className="absolute" style={{ left: s.left, bottom: s.bottom, width: s.width, zIndex: s.z, opacity: s.op }}>
          <Piece />
        </div>
      ))}
    </div>
  )
}

/* ════════════════ AR MODAL (Realidad Aumentada con model-viewer) ════════════════ */
function ARModal({ model, logo, finish, placement, onClose }) {
  const C = useContext(ThemeCtx)
  const src = arModelFor(model.svgType)
  const mvRef = useRef(null)
  const logoPbrRef = useRef(null)
  const debRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [ready,   setReady]   = useState(false)
  // controles del logo (en vivo sobre el modelo 3D)
  const [lx,   setLx]   = useState(placement?.x ?? 50)
  const [ly,   setLy]   = useState(placement?.y ?? 45)
  const [lsc,  setLsc]  = useState(placement?.scale ?? 1)
  const [lrot, setLrot] = useState(placement?.rotate ?? 0)

  useEffect(() => {
    const el = mvRef.current
    if (!el) return
    // Aplica colores a cada material y guarda el material del logo
    const applyFinish = () => {
      try {
        for (const m of el.model?.materials || []) {
          const n = (m.name || '').toLowerCase()
          const pbr = m.pbrMetallicRoughness
          if (n === 'fabric')    pbr.setBaseColorFactor([...hexToLinear(finish?.uph   || FCOL.wood),  1])
          else if (n === 'legs') pbr.setBaseColorFactor([...hexToLinear(finish?.steel || FCOL.steel), 1])
          else if (n === 'wood') pbr.setBaseColorFactor([...hexToLinear(finish?.wood  || FCOL.wood),  1])
          else if (n === 'logo') {
            logoPbrRef.current = pbr
            if (!logo) pbr.setBaseColorFactor([1, 1, 1, 0]) // sin logo → superficie limpia
          }
        }
      } catch { /* API no disponible */ }
      setReady(true)
    }
    const onLoad = () => { setLoading(false); applyFinish() }
    const onErr  = () => { setLoading(false); setError(true) }
    el.addEventListener('load', onLoad)
    el.addEventListener('error', onErr)
    if (el.loaded) { setLoading(false); applyFinish() }
    return () => { el.removeEventListener('load', onLoad); el.removeEventListener('error', onErr) }
  }, [])

  // Recompone y aplica el logo en vivo cuando cambian los controles (con pequeño debounce)
  useEffect(() => {
    if (!ready || !logo || !logoPbrRef.current) return
    clearTimeout(debRef.current)
    debRef.current = setTimeout(async () => {
      try {
        const url = await composeLogoTexture(logo, { x: lx, y: ly, scale: lsc, rotate: lrot }, arLogoAspect(model.svgType), arLogoRound(model.svgType))
        const tex = await mvRef.current.createTexture(url)
        logoPbrRef.current.baseColorTexture.setTexture(tex)
        logoPbrRef.current.setBaseColorFactor([1, 1, 1, 1])
      } catch { /* noop */ }
    }, 110)
    return () => clearTimeout(debRef.current)
  }, [ready, lx, ly, lsc, lrot])

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#0d0d0f' }}
      onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
      {/* header */}
      <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: C.petrol }}>
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} style={{ color: C.sand }} className="shrink-0" />
          <p className="font-outfit font-black text-sm uppercase truncate" style={{ color: C.onDark }}>AR · {model.name}</p>
        </div>
        <button onClick={onClose} aria-label="Cerrar" className="shrink-0 ml-2"><X size={18} style={{ color: C.sand }} /></button>
      </div>

      {/* visor 3D / AR */}
      <div className="flex-1 relative">
        <model-viewer
          ref={mvRef}
          src={src}
          ar="true"
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          ar-scale="auto"
          camera-controls="true"
          disable-pan="true"
          auto-rotate="true"
          interaction-prompt="none"
          min-camera-orbit="auto auto 50%"
          max-camera-orbit="auto auto 150%"
          touch-action="pan-y"
          environment-image="neutral"
          tone-mapping="neutral"
          shadow-intensity="1"
          shadow-softness="1"
          exposure="1.3"
          loading="eager"
          reveal="auto"
          alt={model.name}
          style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 40%, #f3efe9 0%, #e7e0d6 60%, #d8cfc1 100%)' }}>
          {/* botón AR (solo aparece en dispositivos con soporte AR) */}
          <button slot="ar-button"
            className="absolute bottom-24 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-5 py-3 rounded-full font-nunito font-extrabold text-sm shadow-xl active:scale-95"
            style={{ background: C.sand, color: C.petrol }}>
            <Sparkles size={16} /> Ver en mi espacio (AR)
          </button>
        </model-viewer>

        {/* overlay de carga / error (encima del visor) */}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 40%, #f3efe9 0%, #e7e0d6 100%)' }}>
            <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: `${C.sand}40`, borderTopColor: C.sand }} />
            <p className="font-nunito font-bold text-sm" style={{ color: C.petrol }}>Cargando modelo 3D…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center"
            style={{ background: 'radial-gradient(circle at 50% 40%, #f3efe9 0%, #e7e0d6 100%)' }}>
            <p className="font-outfit font-black text-base" style={{ color: C.carbon }}>No se pudo cargar el modelo 3D</p>
            <p className="font-nunito text-xs" style={{ color: C.stone }}>Revisa tu conexión a internet e inténtalo de nuevo.</p>
          </div>
        )}
      </div>

      {/* controles del logo (en vivo) */}
      {logo && (
        <div className="px-4 py-3 shrink-0 overflow-y-auto" style={{ background: C.ivory, maxHeight: '34vh' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-nunito font-bold uppercase tracking-wide" style={{ color: C.carbon }}>Ajustar logo</p>
            <button onClick={() => { setLx(50); setLy(45); setLsc(1); setLrot(0) }}
              className="flex items-center gap-1 text-[11px] font-nunito font-bold px-2.5 py-1 rounded-lg border" style={{ borderColor: C.border, color: C.stone }}>
              <RotateCcw size={12} /> Centrar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <EditorSlider accent={C.sand} label="Posición ←→" val={lx}   set={setLx}   min={0} max={100} step={1}    fmt={`${Math.round(lx)}%`} />
            <EditorSlider accent={C.sand} label="Posición ↕"  val={ly}   set={setLy}   min={0} max={100} step={1}    fmt={`${Math.round(ly)}%`} />
            <EditorSlider accent={C.sand} label="Tamaño"      val={lsc}  set={setLsc}  min={0.3} max={2.4} step={0.05} fmt={`${Math.round(lsc * 100)}%`} />
            <EditorSlider accent={C.sand} label="Giro"        val={lrot} set={setLrot} min={-180} max={180} step={1}   fmt={`${Math.round(lrot)}°`} />
          </div>
        </div>
      )}

      {/* nota */}
      <div className="px-4 py-2.5 shrink-0 text-center" style={{ background: C.petrol }}>
        <p className="text-[11px] font-nunito" style={{ color: C.mist }}>
          Modelo 3D referencial · mueve el logo con los controles. En el celular pulsa <strong style={{ color: C.onDark }}>«Ver en mi espacio»</strong> para colocarlo a tamaño real.
        </p>
      </div>
    </div>
  )
}

function FurnitureCard3D({ model, logo, accent, finish, placement, onEditLogo, qty = 0, onAdd, onInc, onDec }) {
  const C = useContext(ThemeCtx)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const ref = useRef(null)
  const inOrder = qty > 0

  const handleMove = (e) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setTilt({
      x: ((e.clientY - r.top)  / r.height - 0.5) * -8,
      y: ((e.clientX - r.left) / r.width  - 0.5) *  8,
    })
  }
  const handleLeave = () => setTilt({ x: 0, y: 0 })
  const isResting = tilt.x === 0 && tilt.y === 0
  const surf = LOGO_SURFACE[model.svgType] ?? LOGO_SURFACE.mesa
  const pl = placement ?? { x: surf.left, y: surf.top, scale: 1, tilt: surf.rotateX, rotate: 0 }

  return (
    <div ref={ref}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: C.ivory,
        transformStyle: 'preserve-3d',
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: isResting ? 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)' : 'transform 0.08s ease',
        border: `2px solid ${inOrder ? C.sand : C.border}`,
        boxShadow: inOrder ? `0 10px 30px ${C.sand}33` : '0 6px 22px rgba(0,0,0,0.10)',
      }}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>

      {/* Mueble vectorial */}
      <div className="relative overflow-hidden cursor-pointer" style={{ aspectRatio: '4/3' }}
        onClick={onEditLogo}>
        <FurnitureSVG type={model.svgType} accent={finish?.uph || accent} wood={finish?.wood} steel={finish?.steel} />

        {/* Logo del cliente sobre la superficie (posición por mueble) */}
        {logo && (
          <div className="absolute pointer-events-none"
            style={{
              top: `${pl.y}%`,
              left: `${pl.x}%`,
              width: `${surf.w * pl.scale}%`,
              transform: `translate(-50%,-50%) perspective(420px) rotateX(${pl.tilt}deg) rotateY(${surf.rotateY}deg) rotateZ(${pl.rotate || 0}deg)`,
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
            }}>
            <img src={logo} alt="logo" style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
        )}

        {/* Botón personalizar */}
        <button onClick={e => { e.stopPropagation(); onEditLogo() }}
          className="absolute bottom-2 left-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-nunito font-black shadow-md transition-all active:scale-95"
          style={{ background: (placement || finish) ? accent : 'rgba(255,255,255,0.92)', color: (placement || finish) ? '#fff' : C.petrol }}>
          <Sparkles size={11} /> Personalizar
        </button>

        {/* Badge categoría */}
        <span className="absolute top-3 left-3 text-[10px] font-nunito font-black px-2.5 py-1 rounded-full"
          style={{ background: accent, color: '#fff' }}>{model.cat}</span>

        {/* Check en pedido */}
        {inOrder && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg"
            style={{ background: C.sand }}>
            <Check size={12} style={{ color: C.petrol }} />
            <span className="text-[10px] font-nunito font-black" style={{ color: C.petrol }}>×{qty}</span>
          </div>
        )}
      </div>

      {/* Info + control de pedido */}
      <div className="p-3.5 flex flex-col gap-2.5 flex-1" style={{ background: C.ivory }}>
        <div>
          <p className="font-nunito font-extrabold text-sm leading-snug" style={{ color: C.carbon }}>{model.name}</p>
          <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: C.stone }}>{model.desc}</p>
        </div>
        {inOrder ? (
          <div className="flex items-center justify-between gap-2 mt-auto rounded-xl p-1" style={{ background: C.gray }}>
            <button onClick={onDec} className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
              style={{ background: C.ivory, color: C.carbon, border: `1px solid ${C.border}` }}>−</button>
            <span className="font-outfit font-black text-base" style={{ color: C.carbon }}>{qty}</span>
            <button onClick={onInc} className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
              style={{ background: C.sand, color: C.petrol }}>+</button>
          </div>
        ) : (
          <button onClick={onAdd}
            className="mt-auto w-full py-2.5 rounded-xl font-nunito font-bold text-xs transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-1.5"
            style={{ background: `${accent}15`, color: accent, border: `1.5px solid ${accent}40` }}>
            <Plus size={14} /> Agregar al pedido
          </button>
        )}
      </div>
    </div>
  )
}

function EditorSlider({ label, val, set, min, max, step, fmt, accent }) {
  const C = useContext(ThemeCtx)
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-nunito font-bold uppercase tracking-wide" style={{ color: C.stone }}>{label}</label>
        <span className="text-xs font-nunito font-bold" style={{ color: accent }}>{fmt}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(parseFloat(e.target.value))} className="w-full logo-range" style={{ accentColor: accent }} />
    </div>
  )
}

/* ── editor: personalizar mueble (colores + logo) y compartir imagen ── */
function LogoPlacerModal({ model, accent, logo, placement, finish, onSave, onClose, estType }) {
  const C = useContext(ThemeCtx)
  const surf = LOGO_SURFACE[model.svgType] ?? LOGO_SURFACE.mesa
  const init = placement ?? { x: surf.left, y: surf.top, scale: 1, tilt: surf.rotateX, rotate: 0 }
  const [pos,   setPos]   = useState({ x: init.x, y: init.y })
  const [scale, setScale] = useState(init.scale)
  const [tilt,  setTilt]  = useState(init.tilt)
  const [rot,   setRot]   = useState(init.rotate ?? 0)
  const [woodC,  setWoodC]  = useState(finish?.wood  || FCOL.wood)
  const [steelC, setSteelC] = useState(finish?.steel || FCOL.steel)
  const [uphC,   setUphC]   = useState(finish?.uph   || accent)
  const [busy,   setBusy]   = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const [view,   setView]   = useState('mueble') // 'mueble' | 'ambiente'
  const [arOpen, setArOpen] = useState(false)
  const canvasRef = useRef(null)
  const dragging  = useRef(false)

  useEffect(() => {
    const stop = () => { dragging.current = false }
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchend', stop)
    return () => { window.removeEventListener('mouseup', stop); window.removeEventListener('touchend', stop) }
  }, [])

  const moveTo = (clientX, clientY) => {
    if (!canvasRef.current) return
    const r = canvasRef.current.getBoundingClientRect()
    const x = Math.max(4, Math.min(96, ((clientX - r.left) / r.width)  * 100))
    const y = Math.max(4, Math.min(96, ((clientY - r.top)  / r.height) * 100))
    setPos({ x: Math.round(x), y: Math.round(y) })
  }
  const reset = () => {
    setPos({ x: surf.left, y: surf.top }); setScale(1); setTilt(surf.rotateX); setRot(0)
    setWoodC(FCOL.wood); setSteelC(FCOL.steel); setUphC(accent)
  }

  // Genera un PNG del mueble (colores + logo) y lo comparte/descarga para WhatsApp
  const shareImage = async () => {
    const svgEl = canvasRef.current?.querySelector('svg')
    if (!svgEl || busy) return
    setBusy(true)
    try {
      const W = 1000, H = 750
      const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')
      const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src })
      ctx.fillStyle = '#e7e0d6'; ctx.fillRect(0, 0, W, H)
      const clone = svgEl.cloneNode(true)
      clone.setAttribute('width', W); clone.setAttribute('height', H)
      const svgStr = new XMLSerializer().serializeToString(clone)
      ctx.drawImage(await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)), 0, 0, W, H)
      if (logo) {
        try {
          const li = await loadImg(logo)
          const lw = W * (surf.w * scale) / 100
          const lh = lw * (li.height / li.width)
          ctx.save()
          ctx.translate(W * pos.x / 100, H * pos.y / 100)
          ctx.rotate(rot * Math.PI / 180)
          ctx.drawImage(li, -lw / 2, -lh / 2, lw, lh)
          ctx.restore()
        } catch { /* logo opcional */ }
      }
      ctx.fillStyle = 'rgba(30,46,48,0.92)'; ctx.fillRect(0, H - 58, W, 58)
      ctx.fillStyle = '#fff'; ctx.font = '700 26px sans-serif'; ctx.textBaseline = 'middle'
      ctx.fillText(`${model.name} — Industrias Korbax`, 24, H - 29)
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'))
      if (!blob) return
      const file = new File([blob], `korbax-${model.id}.png`, { type: 'image/png' })
      const text = `Hola, me interesa este modelo personalizado: ${model.name}. ¿Precio y disponibilidad?`

      // 1) Móvil / SO con share de archivos → adjunta la imagen directo
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text }); return } catch { /* canceló */ }
      }

      // 2) PC: copia la imagen al portapapeles y abre WhatsApp Web → pegar con Ctrl+V
      let copied = false
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          copied = true
        }
      } catch { /* sin permiso de portapapeles */ }

      // 3) Descarga de respaldo siempre disponible
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)

      window.open(wa(text), '_blank', 'noopener')
      setShareMsg(copied
        ? '✅ Imagen copiada. En WhatsApp pégala con Ctrl + V (también se descargó por si acaso).'
        : '⬇️ Imagen descargada. Adjúntala en WhatsApp con el clip 📎.')
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" style={{ background: 'rgba(0,0,0,0.62)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col" style={{ background: C.ivory, maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: C.petrol }}>
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={16} style={{ color: C.sand }} className="shrink-0" />
            <p className="font-outfit font-black text-sm uppercase truncate" style={{ color: C.onDark }}>{model.name}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="shrink-0 ml-2"><X size={18} style={{ color: C.sand }} /></button>
        </div>

        {/* canvas + controles */}
        <div className="p-4 overflow-y-auto">
          {/* Toggle Mueble / Ambiente */}
          <div className="flex p-1 rounded-xl mb-3" style={{ background: C.gray }}>
            {[['mueble', 'Mueble'], ['ambiente', 'Ver en mi local']].map(([id, lbl]) => (
              <button key={id} onClick={() => setView(id)}
                className="flex-1 py-2 rounded-lg text-xs font-nunito font-extrabold transition-all"
                style={{ background: view === id ? C.sand : 'transparent', color: view === id ? C.petrol : C.stone }}>
                {lbl}
              </button>
            ))}
          </div>

          {view === 'ambiente' ? (
            <>
              <RoomScene model={model} accent={uphC} wood={woodC} steel={steelC} logo={logo} placement={{ x: pos.x, y: pos.y, scale, tilt, rotate: rot }} estType={estType} />
              <p className="text-[11px] font-nunito text-center mt-2" style={{ color: C.mist }}>
                Vista referencial de tu local equipado. Ajusta colores y logo en la pestaña «Mueble».
              </p>
            </>
          ) : (
          <div ref={canvasRef}
            className="relative rounded-2xl overflow-hidden select-none"
            style={{ aspectRatio: '4/3', touchAction: 'none', border: `1px solid ${C.border}` }}
            onMouseMove={e => dragging.current && moveTo(e.clientX, e.clientY)}
            onTouchMove={e => { if (dragging.current) { e.preventDefault(); moveTo(e.touches[0].clientX, e.touches[0].clientY) } }}>
            <FurnitureSVG type={model.svgType} accent={uphC} wood={woodC} steel={steelC} />
            {logo && (
              <div className="absolute"
                onMouseDown={e => { dragging.current = true; moveTo(e.clientX, e.clientY) }}
                onTouchStart={e => { dragging.current = true; moveTo(e.touches[0].clientX, e.touches[0].clientY) }}
                style={{
                  top: `${pos.y}%`, left: `${pos.x}%`, width: `${surf.w * scale}%`,
                  transform: `translate(-50%,-50%) perspective(420px) rotateX(${tilt}deg) rotateZ(${rot}deg)`,
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))', cursor: 'grab',
                }}>
                <div style={{ padding: '4px', outline: `1.5px dashed ${uphC}`, outlineOffset: '2px', borderRadius: '4px' }}>
                  <img src={logo} alt="logo" draggable={false} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />
                </div>
              </div>
            )}
          </div>
          )}

          {/* acabados / materiales del mueble */}
          {view !== 'ambiente' && (
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs font-nunito font-bold uppercase tracking-wide block -mb-1" style={{ color: C.stone }}>Acabados del mueble</label>
            {[
              { lbl: 'Tablero',          val: woodC,  set: setWoodC,  opts: MATERIALS.tablero },
              { lbl: 'Estructura / patas', val: steelC, set: setSteelC, opts: MATERIALS.estructura },
              { lbl: 'Tapizado',         val: uphC,   set: setUphC,   opts: MATERIALS.tapizado },
            ].map(({ lbl, val, set, opts }) => {
              const sel = opts.find(o => o.color.toLowerCase() === val.toLowerCase())
              return (
                <div key={lbl}>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] font-nunito font-bold" style={{ color: C.carbon }}>{lbl}</span>
                    <span className="text-[10px] font-nunito" style={{ color: C.mist }}>{sel ? sel.name : 'Personalizado'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {opts.map(o => {
                      const active = o.color.toLowerCase() === val.toLowerCase()
                      return (
                        <button key={o.color} type="button" onClick={() => set(o.color)} title={o.name}
                          className="w-7 h-7 rounded-full transition-transform active:scale-90"
                          style={{ background: o.color, border: `1px solid ${C.border}`,
                                   outline: active ? `2px solid ${C.sand}` : 'none', outlineOffset: '1px' }} />
                      )
                    })}
                    <label className="w-7 h-7 rounded-full cursor-pointer relative" title="Color personalizado"
                      style={{ border: `1px solid ${C.border}`, background: 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' }}>
                      <input type="color" value={val} onChange={e => set(e.target.value)} className="sr-only" />
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
          )}

          {/* logo */}
          {logo
            ? <>
                <p className="text-[11px] font-nunito text-center mt-4 mb-1" style={{ color: C.stone }}>Arrastra el logo sobre el mueble para colocarlo</p>
                <EditorSlider accent={uphC} label="Tamaño"      val={scale} set={setScale} min={0.4}  max={2.2} step={0.05} fmt={`${Math.round(scale * 100)}%`} />
                <EditorSlider accent={uphC} label="Inclinación" val={tilt}  set={setTilt}  min={0}    max={70}  step={1}    fmt={`${Math.round(tilt)}°`} />
                <EditorSlider accent={uphC} label="Giro"        val={rot}   set={setRot}   min={-180} max={180} step={1}    fmt={`${Math.round(rot)}°`} />
              </>
            : <p className="text-[11px] font-nunito text-center mt-4" style={{ color: C.stone }}>Sube un logo en el Paso 2 para colocarlo sobre el mueble.</p>}

          {/* ver en realidad aumentada */}
          <button onClick={() => setArOpen(true)}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-nunito font-bold text-sm transition-all active:scale-[0.98]"
            style={{ background: C.petrol, color: C.onDark }}>
            <Sparkles size={16} style={{ color: C.sand }} /> Ver en Realidad Aumentada
          </button>

          {/* compartir imagen */}
          <button onClick={shareImage} disabled={busy}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-nunito font-bold text-sm border-2 transition-colors active:scale-[0.98] disabled:opacity-60"
            style={{ borderColor: '#25D366', color: '#25D366' }}>
            <WhatsAppIcon size={16} /> {busy ? 'Generando imagen…' : 'Enviar imagen por WhatsApp'}
          </button>
          {shareMsg
            ? <p className="text-[11px] font-nunito font-bold text-center mt-2 rounded-lg py-2 px-2" style={{ color: C.carbon, background: `${C.sand}20` }}>{shareMsg}</p>
            : <p className="text-[10px] font-nunito text-center mt-1.5" style={{ color: C.mist }}>En el celular adjunta la imagen; en PC la copia para pegar con Ctrl+V.</p>}
        </div>

        {/* footer */}
        <div className="px-4 py-3 border-t flex items-center justify-between gap-3 shrink-0" style={{ borderColor: C.border }}>
          <button onClick={reset} className="flex items-center gap-1.5 text-xs font-nunito font-bold px-3 py-2 rounded-xl border" style={{ borderColor: C.border, color: C.stone }}>
            <RotateCcw size={13} /> Restablecer
          </button>
          <button onClick={() => onSave({ placement: { x: pos.x, y: pos.y, scale, tilt, rotate: rot }, finish: { wood: woodC, steel: steelC, uph: uphC } })}
            className="flex items-center gap-1.5 text-sm font-nunito font-extrabold px-5 py-2.5 rounded-xl active:scale-95 transition-transform" style={{ background: C.sand, color: C.petrol }}>
            <Check size={15} /> Listo
          </button>
        </div>
      </div>

      {arOpen && <ARModal model={model} logo={logo} finish={{ wood: woodC, steel: steelC, uph: uphC }} placement={{ x: pos.x, y: pos.y, scale, rotate: rot }} onClose={() => setArOpen(false)} />}
    </div>
  )
}

/* ════════════════ CONFIGURADOR (sección) ════════════════ */
function ConfiguradorSection() {
  const C = useContext(ThemeCtx)
  const [estType,    setEstType]    = useState(null)
  const [logo,       setLogo]       = useState(null)
  const [placements, setPlacements] = useState({})   // { [modelId]: {x,y,scale,tilt,rotate} }
  const [finishes,   setFinishes]   = useState({})   // { [modelId]: {wood,steel,uph} }
  const [editModel,  setEditModel]  = useState(null)  // mueble que se está personalizando
  const { qtyOf, add, inc, dec, totalQty, setOpen } = useCart()
  const fileRef = useRef(null)

  const models = estType ? CONF_FURNITURE[estType.id] : []
  const ckey = (id) => `conf-${id}`

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (logo) URL.revokeObjectURL(logo)
    setLogo(URL.createObjectURL(file))
    setPlacements({})
  }
  const removeLogo = () => { if (logo) URL.revokeObjectURL(logo); setLogo(null); setPlacements({}) }
  const handleDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }

  useEffect(() => () => { if (logo) URL.revokeObjectURL(logo) }, [])

  const changeType = (type) => setEstType(type)

  return (
    <section id="configurador" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-16" style={{ background: C.gray }}>

      {/* Encabezado de sección */}
      <div className="max-w-6xl mx-auto text-center mb-12 fade-up">
        <SectionLabel>Configurador 3D</SectionLabel>
        <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>
          Diseña tu local con tu marca
        </h2>
        <p className="font-nunito text-sm sm:text-base max-w-2xl mx-auto" style={{ color: C.stone }}>
          Elige tu tipo de negocio, sube tu logo y míralo aplicado en cada mueble. Ajusta cantidades y cotiza tu pedido directo por WhatsApp.
        </p>
      </div>

      {/* Content */}
      <div>
        <div className="max-w-6xl mx-auto">

          {/* Paso 1: Tipo de local */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center font-outfit font-black text-xs shrink-0" style={{ background: C.sand, color: C.petrol }}>1</div>
              <h2 className="font-outfit font-black text-xl uppercase" style={{ color: C.carbon }}>¿Qué tipo de local es?</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {EST_TYPES.map(type => {
                const Icon = type.icon
                const active = estType?.id === type.id
                return (
                  <button key={type.id} onClick={() => changeType(type)}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97]"
                    style={{ background: active ? `${type.color}12` : C.ivory, borderColor: active ? type.color : C.border,
                             boxShadow: active ? `0 4px 20px ${type.color}22` : 'none' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{ background: active ? type.color : `${type.color}15` }}>
                      <Icon size={22} style={{ color: active ? '#fff' : type.color }} />
                    </div>
                    <span className="font-nunito font-bold text-sm text-center leading-tight" style={{ color: C.carbon }}>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {estType && (
            <>
              {/* Paso 2: Logo */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-outfit font-black text-xs shrink-0" style={{ background: C.sand, color: C.petrol }}>2</div>
                  <h2 className="font-outfit font-black text-xl uppercase" style={{ color: C.carbon }}>
                    Tu logo{' '}
                    <span className="text-sm font-nunito normal-case font-normal" style={{ color: C.stone }}>(opcional — se verá en los muebles)</span>
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 items-start">
                  <div
                    className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-8 cursor-pointer transition-all duration-200"
                    style={{ borderColor: logo ? C.sand : C.border, background: logo ? `${C.sand}08` : C.ivory, minHeight: '148px' }}
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = C.sand }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = logo ? C.sand : C.border }}
                    onDrop={handleDrop}>
                    {logo
                      ? <img src={logo} className="max-h-20 max-w-full object-contain" alt="Logo subido" />
                      : <>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${C.sand}15` }}>
                            <Upload size={22} style={{ color: C.sand }} />
                          </div>
                          <div className="text-center">
                            <p className="font-nunito font-bold text-sm" style={{ color: C.carbon }}>Arrastra o haz clic aquí</p>
                            <p className="text-xs font-nunito mt-0.5" style={{ color: C.stone }}>PNG · JPG · SVG — se mostrará en tus muebles</p>
                          </div>
                        </>
                    }
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => handleFile(e.target.files[0])} />

                  <div className="flex flex-col gap-3">
                    {logo
                      ? <div className="rounded-xl p-4 border h-full flex flex-col justify-center" style={{ background: `${C.sand}10`, borderColor: `${C.sand}30` }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Check size={15} style={{ color: C.sand }} />
                              <p className="font-nunito font-bold text-sm" style={{ color: C.carbon }}>Logo cargado</p>
                            </div>
                            <button onClick={removeLogo}
                              className="text-xs font-nunito font-bold underline underline-offset-2" style={{ color: C.stone }}>
                              Cambiar
                            </button>
                          </div>
                          <p className="text-xs font-nunito leading-relaxed" style={{ color: C.stone }}>
                            Ahora baja a los modelos y pulsa <span className="font-bold" style={{ color: C.carbon }}>“Personalizar”</span> en cada mueble para elegir colores y colocar tu logo donde quieras.
                          </p>
                        </div>
                      : <div className="rounded-xl p-4 border" style={{ background: C.ivory, borderColor: C.border }}>
                          <p className="font-nunito font-bold text-sm mb-1" style={{ color: C.carbon }}>¿Por qué subir el logo?</p>
                          <p className="text-xs font-nunito leading-relaxed" style={{ color: C.stone }}>Verás exactamente cómo quedaría tu marca en cada modelo de mueble — y podrás colocarla a tu gusto en cada uno. Ideal para mostrarle la propuesta a tu equipo antes de comprar.</p>
                        </div>
                    }
                  </div>
                </div>
              </div>

              {/* Paso 3: Modelos 3D */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-outfit font-black text-xs shrink-0" style={{ background: C.sand, color: C.petrol }}>3</div>
                    <h2 className="font-outfit font-black text-xl uppercase" style={{ color: C.carbon }}>
                      Modelos para <span style={{ color: estType.color }}>{estType.label}</span>
                    </h2>
                  </div>
                  {totalQty > 0 && (
                    <span className="text-sm font-nunito font-bold px-3 py-1.5 rounded-full" style={{ background: `${C.sand}20`, color: C.sandDim }}>
                      {totalQty} pieza{totalQty !== 1 ? 's' : ''} en el pedido
                    </span>
                  )}
                </div>
                <p className="text-xs font-nunito mb-5" style={{ color: C.stone }}>
                  Pulsa <span className="font-bold">“Personalizar”</span> en cada mueble para elegir colores y colocar tu logo · Ajusta cantidades con + / − · Comparte la imagen por WhatsApp
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {models.map(model => (
                    <FurnitureCard3D key={model.id} model={model} logo={logo} accent={estType.color}
                      placement={placements[model.id]} finish={finishes[model.id]}
                      onEditLogo={() => setEditModel(model)}
                      qty={qtyOf(ckey(model.id))}
                      onAdd={() => add(ckey(model.id), model.name)}
                      onInc={() => inc(ckey(model.id))}
                      onDec={() => dec(ckey(model.id))} />
                  ))}
                </div>
              </div>
            </>
          )}

          {!estType && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-5" style={{ background: `${C.sand}18` }}>
                <Sparkles size={32} style={{ color: C.sand }} />
              </div>
              <p className="font-outfit font-black text-2xl uppercase mb-2" style={{ color: C.carbon }}>Elige tu tipo de local</p>
              <p className="text-sm font-nunito max-w-sm mx-auto" style={{ color: C.stone }}>
                Selecciona arriba y verás los muebles perfectos para tu negocio en 3D — con tu logo aplicado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barra de pedido (sticky dentro de la sección) */}
      {estType && (
        <div className="sticky bottom-4 z-30 max-w-6xl mx-auto mt-8 px-1">
          <div className="rounded-2xl shadow-xl border flex items-center justify-between gap-4 flex-wrap px-5 py-4"
            style={{ background: C.ivory, borderColor: C.border }}>
            <div>
              <p className="font-nunito font-extrabold text-sm" style={{ color: C.carbon }}>
                {totalQty > 0
                  ? `${totalQty} pieza${totalQty !== 1 ? 's' : ''} en tu pedido`
                  : `Arma tu pedido para ${estType.label}`}
              </p>
              <p className="text-xs font-nunito" style={{ color: C.stone }}>
                {totalQty > 0 ? 'Tu pedido se guarda aunque cambies de página' : 'Agrega modelos con “Agregar al pedido”'}
              </p>
            </div>
            {totalQty > 0
              ? <SandBtn onClick={() => setOpen(true)} size="lg" className="shadow-lg"><ShoppingBag size={18} /> Ver pedido y cotizar</SandBtn>
              : <SandBtn href={wa(`Hola, quiero cotizar mobiliario para mi ${estType.label}.`)} size="lg" className="shadow-lg"><MessageCircle size={18} /> Cotizar por WhatsApp</SandBtn>}
          </div>
        </div>
      )}

      {/* Editor de logo por mueble */}
      {editModel && (
        <LogoPlacerModal
          model={editModel}
          accent={estType.color}
          estType={estType.id}
          logo={logo}
          placement={placements[editModel.id]}
          finish={finishes[editModel.id]}
          onClose={() => setEditModel(null)}
          onSave={({ placement, finish }) => {
            setPlacements(prev => ({ ...prev, [editModel.id]: placement }))
            setFinishes(prev => ({ ...prev, [editModel.id]: finish }))
            setEditModel(null)
          }}
        />
      )}
    </section>
  )
}

/* ════════════════ FAQ ════════════════ */
function FaqItem({ item, isOpen, onToggle }) {
  const C = useContext(ThemeCtx)
  const bodyRef = useRef(null)
  return (
    <div className="border-b" style={{ borderColor: C.border }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 py-5 text-left">
        <span className="font-nunito font-extrabold text-sm sm:text-base leading-snug" style={{ color: C.carbon }}>{item.q}</span>
        <ChevronDown size={18} className="shrink-0 transition-transform duration-300"
          style={{ color: C.sand, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div ref={bodyRef} style={{ maxHeight: isOpen ? `${bodyRef.current?.scrollHeight ?? 300}px` : '0', overflow: 'hidden', transition: 'max-height 0.35s ease' }}>
        <p className="pb-5 text-sm font-nunito leading-relaxed" style={{ color: C.stone }}>{item.a}</p>
      </div>
    </div>
  )
}
function FAQ() {
  const C = useContext(ThemeCtx)
  const [open, setOpen] = useState(null)
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.gray }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 fade-up">
          <SectionLabel>Preguntas frecuentes</SectionLabel>
          <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Resolvemos tus dudas</h2>
        </div>
        <div className="fade-up rounded-2xl border overflow-hidden" style={{ background: C.ivory, borderColor: C.border }}>
          <div className="px-6 sm:px-8">
            {FAQS.map((item, i) => <FaqItem key={i} item={item} isOpen={open === i} onToggle={() => setOpen(p => p === i ? null : i)} />)}
          </div>
          <div className="px-6 sm:px-8 py-5 border-t" style={{ borderColor: C.border, background: C.gray }}>
            <p className="text-sm font-nunito text-center" style={{ color: C.stone }}>
              ¿No encuentras tu respuesta?{' '}
              <a href={wa('Hola, tengo una consulta sobre sus productos y servicios.')} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2" style={{ color: C.sand }}>Escríbenos por WhatsApp</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════ FORMULARIO ════════════════ */
function Field({ label, error, children }) {
  const C = useContext(ThemeCtx)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold font-nunito uppercase tracking-wide" style={{ color: C.stone }}>{label}</label>
      {children}
      {error && <p className="text-xs font-nunito" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  )
}
function ContactForm({ onOpenPrivacy }) {
  const C = useContext(ThemeCtx)
  const [form, setForm]     = useState({ nombre: '', empresa: '', telefono: '', mensaje: '', ok: false, hp: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState(null)
  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: null })) }
  function validate() {
    const e = {}
    if (!form.nombre.trim())   e.nombre   = 'Campo obligatorio'
    if (!form.telefono.trim()) e.telefono = 'Campo obligatorio'
    if (!form.mensaje.trim())  e.mensaje  = 'Campo obligatorio'
    if (!form.ok)              e.ok       = 'Debes aceptar la política de privacidad'
    return e
  }
  async function submit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    if (form.hp) return
    setStatus('loading')
    try {
      const res  = await fetch('/api/contacto.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, consentimiento: form.ok }) })
      const data = await res.json()
      setStatus(res.ok && data.ok ? 'ok' : 'error')
      if (res.ok && data.ok) setForm({ nombre: '', empresa: '', telefono: '', mensaje: '', ok: false, hp: '' })
    } catch { setStatus('error') }
  }
  if (status === 'ok') return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${C.sand}15` }}><CheckCircle size={32} style={{ color: C.sand }} /></div>
      <div>
        <h3 className="font-outfit font-black text-xl uppercase mb-1" style={{ color: C.carbon }}>¡Mensaje enviado!</h3>
        <p className="text-sm font-nunito" style={{ color: C.stone }}>Nos contactaremos contigo pronto.</p>
      </div>
      <button onClick={() => setStatus(null)} className="text-sm font-nunito font-bold underline underline-offset-2" style={{ color: C.sand }}>Enviar otro mensaje</button>
    </div>
  )
  const inputCls = () => `w-full rounded-xl px-4 py-3.5 text-sm font-nunito border transition-all duration-200 focus:outline-none focus:ring-2`
  const inputStyle = hasError => ({ borderColor: hasError ? '#ef4444' : C.border, background: hasError ? '#fef2f2' : C.gray, color: C.carbon, '--tw-ring-color': C.sand })
  return (
    <div className="flex flex-col gap-5">
      <input type="text" name="web" className="hidden" tabIndex={-1} aria-hidden="true" value={form.hp} onChange={e => set('hp', e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
        <Field label="Tu nombre *" error={errors.nombre}><input className={inputCls()} style={inputStyle(errors.nombre)} placeholder="Ej. Carlos Huanca" value={form.nombre} onChange={e => set('nombre', e.target.value)} /></Field>
        <Field label="Empresa (opcional)"><input className={inputCls()} style={inputStyle(false)} placeholder="Nombre de tu empresa" value={form.empresa} onChange={e => set('empresa', e.target.value)} /></Field>
      </div>
      <Field label="WhatsApp / Teléfono *" error={errors.telefono}><input className={inputCls()} style={inputStyle(errors.telefono)} placeholder="Ej. 999 123 456" value={form.telefono} onChange={e => set('telefono', e.target.value)} /></Field>
      <Field label="¿Qué necesitas? *" error={errors.mensaje}><textarea className={`${inputCls()} resize-none`} style={inputStyle(errors.mensaje)} rows={4} placeholder="Tipo de empresa, cantidad de muebles, dimensiones aproximadas..." value={form.mensaje} onChange={e => set('mensaje', e.target.value)} /></Field>
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.ok} onChange={e => set('ok', e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 rounded accent-[#F1AF78]" />
          <span className="text-xs font-nunito leading-relaxed" style={{ color: C.stone }}>
            Acepto que Industrias Korbax trate mis datos para responder mi consulta, conforme a la{' '}
            <button type="button" onClick={onOpenPrivacy} className="font-bold underline underline-offset-2" style={{ color: C.sand }}>Política de Privacidad</button>{' '}(Ley N.° 29733).
          </span>
        </label>
        {errors.ok && <p className="text-xs font-nunito pl-7" style={{ color: '#ef4444' }}>{errors.ok}</p>}
      </div>
      {status === 'error' && (
        <div className="flex gap-3 items-start rounded-xl px-4 py-3 border" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <X size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm font-nunito" style={{ color: '#dc2626' }}>Error al enviar. Por favor escríbenos directamente por WhatsApp.</p>
        </div>
      )}
      <button onClick={submit} disabled={status === 'loading'}
        className="w-full py-4 rounded-xl font-bold font-nunito text-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        style={{ background: C.sand, color: C.petrol }}>
        {status === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </div>
  )
}

/* ════════════════ APP ════════════════ */
/* ════════════════ NAVEGACIÓN MULTIPÁGINA ════════════════ */
const PAGE_META = {
  catalogo:     { label: 'Catálogo',     title: 'Nuestros productos',        icon: LayoutGrid },
  configurador: { label: 'Configurador', title: 'Diseña tu local en 3D',     icon: Sparkles },
  galeria:      { label: 'Galería',      title: 'Nuestro trabajo',           icon: Camera },
  nosotros:     { label: 'Nosotros',     title: 'Conoce Industrias Korbax',  icon: ShieldCheck },
  contacto:     { label: 'Contacto',     title: 'Hablemos',                  icon: MessageCircle },
}

function BackBar({ route }) {
  const C = useContext(ThemeCtx)
  const meta = PAGE_META[route]
  return (
    <div className="pt-16" style={{ background: C.petrol }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <a href="#/" className="inline-flex items-center gap-2 text-sm font-nunito font-bold transition-opacity hover:opacity-75" style={{ color: C.sand }}>
          <ArrowLeft size={16} /> Volver al inicio
        </a>
        {meta && (
          <span className="inline-flex items-center gap-2 text-xs font-nunito font-bold uppercase tracking-wide" style={{ color: C.mist }}>
            {meta.label}
          </span>
        )}
      </div>
    </div>
  )
}

const HOME_NAV_CARDS = [
  { route:'catalogo', img:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&fit=crop' },
  { route:'galeria',  img:'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop' },
  { route:'nosotros', img:'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&fit=crop' },
  { route:'contacto', img:'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80&fit=crop' },
]
const HOME_PREVIEW = [
  { type:'mesared',  accent:'#E85D5D' },
  { type:'silla',    accent:'#3B82F6' },
  { type:'barra',    accent:'#F59E0B' },
]

function HomeSummary() {
  const C = useContext(ThemeCtx)
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.ivory }}>
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-10 fade-up">
          <SectionLabel>Explora Korbax</SectionLabel>
          <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Todo en un solo lugar</h2>
          <p className="font-nunito max-w-md mx-auto text-base" style={{ color: C.stone }}>Diseña tu local, mira el catálogo, conócenos y cotiza — cada cosa en su propia página.</p>
        </div>

        {/* Tarjeta destacada: Configurador */}
        <a href="#/configurador"
          className="fade-up group block rounded-3xl overflow-hidden mb-5 relative"
          style={{ background: C.petrol }}>
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: `${C.sand}20` }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-7 sm:p-10 relative">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-nunito font-black uppercase tracking-wider px-3 py-1 rounded-full mb-4" style={{ background: C.sand, color: C.petrol }}>
                <Sparkles size={12} /> Herramienta estrella
              </span>
              <h3 className="font-outfit font-black uppercase leading-none mb-4" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', color: C.onDark }}>
                Diseña tu local en 3D
              </h3>
              <p className="font-nunito text-sm sm:text-base leading-relaxed mb-6" style={{ color: C.mist }}>
                Elige tu tipo de negocio, sube tu logo y míralo aplicado sobre cada mueble. Arma tu pedido y cotízalo por WhatsApp.
              </p>
              <span className="inline-flex items-center gap-2 font-nunito font-black text-base px-7 py-3.5 rounded-2xl transition-transform duration-200 group-hover:scale-[1.03]"
                style={{ background: C.sand, color: C.petrol }}>
                Abrir configurador <ArrowRight size={18} />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {HOME_PREVIEW.map((p, i) => (
                <div key={i} className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio:'3/4' }}>
                  <FurnitureSVG type={p.type} accent={p.accent} />
                </div>
              ))}
            </div>
          </div>
        </a>

        {/* Accesos con imagen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {HOME_NAV_CARDS.map((card, i) => {
            const m = PAGE_META[card.route]
            const Icon = m.icon
            return (
              <a key={card.route} href={`#/${card.route}`}
                className="fade-up group relative rounded-2xl overflow-hidden"
                style={{ aspectRatio:'1', transitionDelay: `${i * 60}ms` }}>
                <img src={card.img} alt={m.label} loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${C.petrol}22 0%, ${C.petrol}E6 100%)` }} />
                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shrink-0" style={{ background: C.sand }}>
                    <Icon size={18} style={{ color: C.petrol }} />
                  </div>
                  <p className="font-outfit font-black text-base sm:text-lg uppercase leading-none" style={{ color: '#fff' }}>{m.label}</p>
                  <p className="text-[11px] sm:text-xs font-nunito mt-1 leading-snug inline-flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Ver más <ChevronRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </p>
                </div>
              </a>
            )
          })}
        </div>

        {/* Vitrina de productos */}
        <div className="text-center mb-8 fade-up">
          <SectionLabel>Catálogo</SectionLabel>
          <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(1.8rem,4.5vw,3rem)', color: C.carbon }}>Productos destacados</h2>
          <p className="font-nunito max-w-md mx-auto text-base" style={{ color: C.stone }}>Una muestra de lo que fabricamos. Personalizamos dimensiones, colores y acabados.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-8">
          {PRODUCTS.slice(0, 3).map((p, i) => <ProductCard key={p.id} p={p} delay={i * 70} />)}
        </div>
        <div className="text-center mb-16 fade-up">
          <SandBtn href="#/catalogo" size="md" className="px-7 py-3.5"><LayoutGrid size={16} /> Ver catálogo completo <ArrowRight size={15} /></SandBtn>
        </div>

        {/* Franja de confianza */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="fade-up rounded-2xl p-5 border" style={{ background: C.gray, borderColor: C.border, transitionDelay: `${i * 60}ms` }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: `${C.sand}18` }}><Icon size={20} style={{ color: C.sand }} /></div>
                <h3 className="font-nunito font-extrabold text-sm mb-1.5 leading-snug" style={{ color: C.carbon }}>{item.title}</h3>
                <p className="text-xs font-nunito leading-relaxed" style={{ color: C.stone }}>{item.desc}</p>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

/* ── carrito flotante + modal de pedido ── */
function CartFab() {
  const C = useContext(ThemeCtx)
  const { totalQty, setOpen } = useCart()
  if (totalQty <= 0) return null
  return (
    <button onClick={() => setOpen(true)} aria-label="Ver mi pedido"
      className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2.5 pl-3.5 pr-5 py-3 rounded-full shadow-2xl active:scale-95 transition-transform"
      style={{ background: C.petrol, border: `2px solid ${C.sand}` }}>
      <span className="relative inline-flex">
        <ShoppingBag size={20} style={{ color: C.sand }} />
        <span className="absolute -top-2.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center" style={{ background: C.sand, color: C.petrol }}>{totalQty}</span>
      </span>
      <span className="font-nunito font-black text-sm" style={{ color: '#fff' }}>Mi pedido</span>
    </button>
  )
}

function CartModal() {
  const C = useContext(ThemeCtx)
  const { cart, inc, dec, remove, clear, totalQty, open, setOpen } = useCart()
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  if (!open) return null
  const entries = Object.entries(cart)
  const send = () => {
    const lines = entries.map(([, i]) => `• ${i.name} ×${i.qty}`).join('\n')
    const intro = name ? `Hola, soy ${name}.` : 'Hola.'
    const tel   = phone ? ` Mi número: ${phone}.` : ''
    const body  = entries.length ? `Quiero cotizar este pedido:\n${lines}` : 'Quisiera una cotización.'
    window.open(wa(`${intro}${tel}\n\n${body}\n\n¿Me confirman precio, disponibilidad y tiempo de entrega? Gracias.`), '_blank', 'noopener')
  }
  const inputCls = 'rounded-xl border px-3 py-2.5 text-sm font-nunito w-full outline-none'
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setOpen(false)}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col" style={{ background: C.ivory, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: C.petrol }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} style={{ color: C.sand }} />
            <p className="font-outfit font-black text-base uppercase" style={{ color: C.onDark }}>Mi pedido {totalQty > 0 && `(${totalQty})`}</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Cerrar"><X size={18} style={{ color: C.sand }} /></button>
        </div>
        {/* lista */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {entries.length === 0
            ? <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: `${C.sand}15` }}><ShoppingBag size={26} style={{ color: C.sand }} /></div>
                <p className="font-nunito font-bold text-sm mb-1" style={{ color: C.carbon }}>Tu pedido está vacío</p>
                <p className="text-xs font-nunito" style={{ color: C.stone }}>Agrega productos desde el catálogo o el configurador.</p>
              </div>
            : <div className="flex flex-col gap-2">
                {entries.map(([k, i]) => (
                  <div key={k} className="flex items-center gap-2.5 rounded-xl border p-2.5" style={{ borderColor: C.border }}>
                    <p className="flex-1 min-w-0 font-nunito font-bold text-sm leading-snug" style={{ color: C.carbon }}>{i.name}</p>
                    <div className="flex items-center gap-1 rounded-lg p-0.5 shrink-0" style={{ background: C.gray }}>
                      <button onClick={() => dec(k)} className="w-7 h-7 rounded-md flex items-center justify-center font-bold active:scale-90" style={{ background: C.ivory, color: C.carbon, border: `1px solid ${C.border}` }}>−</button>
                      <span className="w-6 text-center font-outfit font-black text-sm" style={{ color: C.carbon }}>{i.qty}</span>
                      <button onClick={() => inc(k)} className="w-7 h-7 rounded-md flex items-center justify-center font-bold active:scale-90" style={{ background: C.sand, color: C.petrol }}>+</button>
                    </div>
                    <button onClick={() => remove(k)} aria-label="Quitar" className="shrink-0 p-1"><Trash2 size={15} style={{ color: C.stone }} /></button>
                  </div>
                ))}
              </div>}
        </div>
        {/* footer */}
        {entries.length > 0 && (
          <div className="px-4 py-4 border-t shrink-0" style={{ borderColor: C.border }}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" className={inputCls} style={{ borderColor: C.border, background: C.ivory, color: C.carbon }} />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WhatsApp / teléfono" className={inputCls} style={{ borderColor: C.border, background: C.ivory, color: C.carbon }} />
            </div>
            <SandBtn onClick={send} className="w-full justify-center py-3.5"><WhatsAppIcon size={16} /> Enviar pedido por WhatsApp</SandBtn>
            <button onClick={clear} className="w-full mt-2 text-xs font-nunito font-bold py-2 transition-colors" style={{ color: C.stone }}>Vaciar pedido</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── franja de confianza (entrega · pago · garantía · comprobante) ── */
const TRUST = [
  { icon: Clock,      title: 'Entrega 7–15 días',      desc: 'Plazo estándar; te confirmamos la fecha al cotizar.' },
  { icon: CreditCard, title: 'Yape · Plin · Transfer.', desc: 'Pago flexible. Adelanto y saldo contra entrega.' },
  { icon: Award,      title: 'Garantía de fábrica',     desc: 'Cubrimos soldadura, pintura y tapizado.' },
  { icon: FileText,   title: 'Empresa formal',          desc: 'Emitimos boleta y factura electrónica (RUC).' },
]
function TrustBand() {
  const C = useContext(ThemeCtx)
  return (
    <section className="px-4 sm:px-6 py-10" style={{ background: C.ivory, borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TRUST.map((t, i) => {
          const Icon = t.icon
          return (
            <div key={t.title} className="fade-up flex items-start gap-3" style={{ transitionDelay: `${i * 60}ms` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.sand}15` }}><Icon size={18} style={{ color: C.sand }} /></div>
              <div>
                <p className="font-nunito font-extrabold text-sm leading-snug" style={{ color: C.carbon }}>{t.title}</p>
                <p className="text-xs font-nunito leading-snug mt-0.5" style={{ color: C.stone }}>{t.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function HomeLocation() {
  const C = useContext(ThemeCtx)
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=Villa+El+Salvador%2C+Lima%2C+Peru'
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.gray }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 fade-up">
          <SectionLabel>Ubicación</SectionLabel>
          <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Visítanos en fábrica</h2>
          <p className="font-nunito max-w-md mx-auto text-base" style={{ color: C.stone }}>Estamos en Villa El Salvador, Lima. Atendemos en planta y enviamos a todo el Perú.</p>
        </div>
        <div className="fade-up rounded-2xl overflow-hidden border grid grid-cols-1 lg:grid-cols-5" style={{ borderColor: C.border, background: C.ivory, boxShadow: '0 2px 8px rgba(22,16,16,0.06)' }}>
          <div className="lg:col-span-2 p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.petrol}10` }}><MapPin size={19} style={{ color: C.petrol }} /></div>
              <div>
                <p className="font-nunito font-extrabold text-sm" style={{ color: C.carbon }}>Industrias Korbax</p>
                <p className="text-sm font-nunito leading-relaxed" style={{ color: C.stone }}>Villa El Salvador, Lima — Perú</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.sand}15` }}><Truck size={19} style={{ color: C.sand }} /></div>
              <div>
                <p className="font-nunito font-extrabold text-sm" style={{ color: C.carbon }}>Envíos a todo el Perú</p>
                <p className="text-sm font-nunito leading-relaxed" style={{ color: C.stone }}>Coordinamos el despacho con embalaje seguro a cualquier región.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 mt-auto pt-2">
              <SandBtn href={mapsUrl} size="md" className="justify-center py-3"><MapPin size={16} /> Cómo llegar</SandBtn>
              <OutlineBtn href={wa('Hola, quisiera coordinar una visita a su fábrica en Villa El Salvador.')} className="justify-center"><MessageCircle size={15} /> Coordinar visita</OutlineBtn>
            </div>
          </div>
          <div className="lg:col-span-3 min-h-[320px]">
            <iframe src="https://maps.google.com/maps?q=Villa+El+Salvador%2C+Lima%2C+Peru&output=embed"
              className="w-full h-full" style={{ border: 0, display: 'block', minHeight: '320px' }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              title="Fábrica Industrias Korbax — Villa El Salvador, Lima" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const [darkMode,    setDarkMode]    = useState(false)
  const C = darkMode ? DARK_C : LIGHT_C
  const route = useRoute()

  useScrollReveal(route)
  const progress = useScrollProgress()
  const [loading,     setLoading]     = useState(true)
  const [showTop,     setShowTop]     = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [modal,       setModal]       = useState(null)
  const [showCatalog, setShowCatalog] = useState(false)
  const [catFilter,   setCatFilter]   = useState('Todos')
  const [catSearch,   setCatSearch]   = useState('')
  const cartApi = useCartState()

  useEffect(() => {
    const update = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-dark', darkMode ? 'true' : 'false')
    document.body.style.background = C.ivory
  }, [darkMode, C.ivory])

  const visibleProducts = (catFilter === 'Todos' ? PRODUCTS : PRODUCTS.filter(p => p.tag === catFilter))
    .filter(p => p.name.toLowerCase().includes(catSearch.trim().toLowerCase()))

  return (
    <ThemeCtx.Provider value={C}>
    <CartCtx.Provider value={cartApi}>
    <div className="min-h-screen font-nunito overflow-x-hidden" style={{ background: C.ivory, color: C.carbon }}>

      {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      <ScrollProgressBar progress={progress} />
      <WhatsAppFAB />
      <CartFab />
      <CartModal />

      {/* Volver arriba */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300"
        style={{ bottom: '5.5rem', right: '1.5rem', background: C.petrol, border: `2px solid ${C.sand}35`,
                 opacity: showTop ? 1 : 0, transform: showTop ? 'scale(1)' : 'scale(0.6)', pointerEvents: showTop ? 'auto' : 'none' }}
        aria-label="Volver arriba">
        <ArrowUp size={17} style={{ color: C.sand }} />
      </button>

      {modal === 'privacy' && <PolicyModal title="Política de Privacidad" text={PRIVACY} onClose={() => setModal(null)} />}
      {modal === 'terms'   && <PolicyModal title="Términos de Uso"        text={TERMS}   onClose={() => setModal(null)} />}
      {showCatalog && <CatalogPage onClose={() => setShowCatalog(false)} />}

      {/* ════════ NAV ════════ */}
      <nav className="fixed top-0 inset-x-0 z-40 theme-transition" style={{ background: C.petrol, borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="#/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.jpg" alt="Industrias Korbax" className="h-10 w-10 rounded-xl object-cover" />
            <div className="leading-tight">
              <p className="font-outfit font-black text-[1.15rem] uppercase tracking-wide leading-none" style={{ color: C.onDark }}>Korbax</p>
              <p className="text-[9px] font-nunito leading-none tracking-[0.2em] uppercase" style={{ color: C.mist }}>Industrias</p>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-6 text-sm font-nunito font-semibold" style={{ color: C.mist }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="relative py-1 transition-colors duration-200 hover:text-white group"
                style={{ color: route === l.route ? '#fff' : C.mist }}>
                {l.label}
                <span className="absolute bottom-0 left-0 right-0 h-px transition-transform duration-200 origin-left group-hover:scale-x-100"
                  style={{ background: C.sand, transform: route === l.route ? 'scaleX(1)' : 'scaleX(0)' }} />
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={() => setDarkMode(d => !d)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
              style={{ background: `${C.sand}18`, color: C.sand }}
              aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}>
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <SandBtn href={wa(DEFAULT_MSG)} size="sm" className="px-5 py-2.5">
              <MessageCircle size={14} /> Cotizar ahora
            </SandBtn>
          </div>
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <span className={`block w-5 h-0.5 rounded transition-all origin-center duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} style={{ background: C.onDark }} />
            <span className={`block w-5 h-0.5 rounded transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} style={{ background: C.onDark }} />
            <span className={`block w-5 h-0.5 rounded transition-all origin-center duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} style={{ background: C.onDark }} />
          </button>
        </div>
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-96' : 'max-h-0'}`}
          style={{ borderTop: menuOpen ? `1px solid rgba(255,255,255,0.07)` : 'none', background: C.petrol }}>
          <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className="py-3 px-2 font-nunito font-semibold text-sm border-b transition-colors duration-200 hover:text-white"
                style={{ color: C.mist, borderColor: 'rgba(255,255,255,0.06)' }}>{l.label}</a>
            ))}
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setDarkMode(d => !d); setMenuOpen(false) }}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-nunito font-bold border transition-all duration-200"
                style={{ borderColor: `${C.sand}30`, color: C.sand, background: `${C.sand}10` }}>
                {darkMode ? <><Sun size={15} /> Modo claro</> : <><Moon size={15} /> Modo oscuro</>}
              </button>
            </div>
            <SandBtn href={wa(DEFAULT_MSG)} className="w-full mt-1 justify-center py-3.5"><MessageCircle size={15} /> Cotizar por WhatsApp</SandBtn>
          </div>
        </div>
      </nav>

      {/* Barra "volver al inicio" en páginas internas */}
      {route !== 'home' && <BackBar route={route} />}

      {/* ════════ HERO ════════ */}
      {route === 'home' && (<>
      <section className="hero-grid relative min-h-screen flex items-center overflow-hidden pt-16" style={{ background: C.ivory }}>
        <Particles />
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="hero-shape-1 absolute top-16 right-[4%] w-80 h-80 rounded-full blur-3xl opacity-60" style={{ background: `${C.sand}20` }} />
          <div className="hero-shape-2 absolute bottom-16 right-[22%] w-72 h-72 rounded-full blur-3xl opacity-40" style={{ background: `${C.petrol}12` }} />
          <div className="hero-shape-3 absolute top-48 left-[2%] w-56 h-56 rounded-full blur-2xl opacity-50" style={{ background: `${C.sand}12` }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full min-w-0 py-10 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          <div className="min-w-0 order-2 lg:order-1">
            <div className="anim-1 inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl mb-7 font-nunito border leading-snug text-left"
              style={{ color: C.petrol, background: `${C.sand}1f`, borderColor: `${C.sand}66` }}>
              <Sparkles size={14} style={{ color: C.sand }} className="animate-pulse shrink-0" />
              Nuevo · Mira tu mobiliario en tu local con Realidad Aumentada
            </div>
            <h1 className="anim-2 font-outfit font-black uppercase leading-[0.95] mb-5 break-words"
              style={{ fontSize: 'clamp(2.3rem, 7.5vw, 5.2rem)', color: C.carbon }}>
              Sillas y mesas
              <span className="block">
                <span className="text-gradient"><TypedText texts={HERO_TEXTS} /></span>
                <span className="inline-block align-middle ml-1 rounded-sm typing-cursor" style={{ width: '3px', height: '0.82em', background: C.sand }} />
              </span>
            </h1>
            <p className="anim-3 text-base sm:text-lg leading-relaxed mb-8 max-w-md font-nunito" style={{ color: C.stone }}>
              Fabricamos mobiliario comercial de alta calidad para{' '}
              <strong style={{ color: C.carbon, fontWeight: 800 }}>restaurantes, oficinas, hoteles, colegios, clínicas, eventos y más.</strong>
            </p>
            <div className="anim-4 flex flex-col sm:flex-row gap-3 mb-4">
              <SandBtn href="#/configurador" size="lg" className="shadow-xl rounded-2xl justify-center w-full sm:w-auto">
                <Sparkles size={20} /> Diseña tu local en 3D + AR
              </SandBtn>
              <a href={wa(DEFAULT_MSG)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 font-bold font-nunito rounded-2xl px-8 py-4 text-base transition-all duration-200 hover:opacity-90 active:scale-[0.97] w-full sm:w-auto"
                style={{ background: C.petrol, color: C.onDark }}>
                <MessageCircle size={20} /> Cotizar por WhatsApp
              </a>
            </div>
            <p className="anim-4 text-xs sm:text-sm font-nunito mb-6 max-w-md" style={{ color: C.stone }}>
              Elige tus muebles, ponles <strong style={{ color: C.carbon }}>tu logo y colores</strong> y míralos a tamaño real en tu local — sin instalar nada.
            </p>
            <a href="#/catalogo"
              className="anim-4 inline-flex items-center gap-2 text-sm font-nunito font-bold transition-all duration-200"
              style={{ color: C.stone }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Ver catálogo completo <ChevronRight size={16} />
            </a>
            <div className="anim-4 flex items-center gap-4 pt-6 border-t" style={{ borderColor: C.border }}>
              <div className="flex -space-x-2.5">
                {[C.petrol, '#2a4a4d', '#163035', '#1a3a3d'].map((bg, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold font-nunito"
                    style={{ background: bg, borderColor: C.onDark, color: C.sand }}>
                    {['O', 'R', 'H', 'C'][i]}
                  </div>
                ))}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-0.5 mb-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={13} style={{ fill: C.sand, color: C.sand }} />)}</div>
                <p className="text-xs font-nunito font-semibold" style={{ color: C.stone }}>Más de <strong style={{ color: C.carbon }}>500 empresas</strong> equipadas en todo el Perú</p>
              </div>
            </div>
          </div>
          <div className="anim-right relative flex items-center justify-center py-2 lg:py-8 order-1 lg:order-2">
            <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-[2.5rem] rotate-6 border" style={{ background: `${C.petrol}07`, borderColor: `${C.petrol}12` }} />
            <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-[2.5rem] -rotate-3" style={{ background: `${C.sand}05` }} />
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl border-2 pulse-ring" style={{ borderColor: `${C.sand}35` }} />
                <div className="absolute inset-0 rounded-3xl border pulse-ring" style={{ borderColor: `${C.petrol}25`, animationDelay: '1.4s' }} />
                <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden relative border-4"
                  style={{ borderColor: C.onDark, boxShadow: `0 20px 60px ${C.carbon}22` }}>
                  <img src="/logo.jpg" alt="Industrias Korbax" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${C.petrol}, ${C.sand})` }} />
                </div>
                <div className="absolute -top-3 -right-3 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: C.sand, border: `3px solid ${C.onDark}` }}>
                  <BadgeCheck size={20} style={{ color: C.petrol }} />
                </div>
              </div>
              <div className="rounded-2xl px-5 py-3 border text-center shadow-md" style={{ background: C.ivory, borderColor: C.border }}>
                <p className="font-outfit font-black text-base uppercase tracking-wide leading-none" style={{ color: C.carbon }}>Industrias Korbax</p>
                <p className="text-xs font-nunito font-semibold mt-1" style={{ color: C.sand }}>Villa El Salvador · Lima, Perú</p>
              </div>
            </div>
            <div className="hero-shape-2 hidden sm:flex absolute bottom-2 -left-4 rounded-2xl shadow-lg px-3.5 py-2.5 items-center gap-2.5 border" style={{ background: C.ivory, borderColor: C.border }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.sand}15` }}><ShieldCheck size={15} style={{ color: C.sand }} /></div>
              <div><p className="text-xs font-bold font-nunito leading-none" style={{ color: C.carbon }}>Alta calidad</p><p className="text-[10px] font-nunito mt-0.5" style={{ color: C.stone }}>Garantizada</p></div>
            </div>
            <div className="hero-shape-3 hidden sm:flex absolute top-2 -left-4 rounded-2xl shadow-lg px-3.5 py-2.5 items-center gap-2.5 border" style={{ background: C.ivory, borderColor: C.border }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.sand}15` }}><Award size={15} style={{ color: C.sand }} /></div>
              <div><p className="text-xs font-bold font-nunito leading-none" style={{ color: C.carbon }}>Precios de Fábrica</p><p className="text-[10px] font-nunito mt-0.5" style={{ color: C.stone }}>Sin intermediarios</p></div>
            </div>
            <div className="hero-shape-4 hidden sm:flex absolute top-2 -right-4 rounded-2xl shadow-lg px-3.5 py-2.5 items-center gap-2.5 border" style={{ background: C.ivory, borderColor: C.border }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.sand}15` }}><Truck size={15} style={{ color: C.sand }} /></div>
              <div><p className="text-xs font-bold font-nunito leading-none" style={{ color: C.carbon }}>Envíos</p><p className="text-[10px] font-nunito mt-0.5" style={{ color: C.stone }}>A todo el Perú</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section style={{ background: C.petrol, borderTop: `1px solid ${C.sand}18`, borderBottom: `1px solid ${C.sand}18` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
            {STATS.map((s, i) => (
              <div key={s.label} className="fade-up text-center px-4 sm:px-8 py-2" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <p className="font-outfit font-black leading-none" style={{ fontSize: 'clamp(2.4rem,5vw,3.2rem)', color: C.sand }}><Counter target={s.value} suffix={s.suffix} /></p>
                <p className="text-xs sm:text-sm font-nunito mt-2 whitespace-pre-line leading-tight" style={{ color: C.mist }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SECTORES MARQUEE ════════ */}
      <section style={{ background: C.gray, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-2">
          <p className="text-center text-xs font-nunito font-bold uppercase tracking-[0.18em] mb-6" style={{ color: C.mist }}>Equipamos empresas de todos los rubros</p>
        </div>
        <div className="marquee-pause relative overflow-hidden pb-8">
          <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(90deg, ${C.gray}, transparent)` }} />
          <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: `linear-gradient(270deg, ${C.gray}, transparent)` }} />
          <div className="overflow-hidden mb-2.5">
            <div className="flex gap-2.5 whitespace-nowrap marquee-ltr">
              {MARQUEE_ROW1.map((s, i) => (
                <span key={i} className="inline-flex shrink-0 text-xs font-nunito font-semibold px-4 py-2 rounded-full border cursor-default"
                  style={{ color: C.carbon, borderColor: C.border, background: C.ivory }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.sand; e.currentTarget.style.color = C.petrol; e.currentTarget.style.borderColor = C.sand }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.ivory; e.currentTarget.style.color = C.carbon; e.currentTarget.style.borderColor = C.border }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="flex gap-2.5 whitespace-nowrap marquee-rtl">
              {MARQUEE_ROW2.map((s, i) => (
                <span key={i} className="inline-flex shrink-0 text-xs font-nunito font-semibold px-4 py-2 rounded-full border cursor-default"
                  style={{ color: C.carbon, borderColor: C.border, background: C.ivory }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.sand; e.currentTarget.style.color = C.petrol; e.currentTarget.style.borderColor = C.sand }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.ivory; e.currentTarget.style.color = C.carbon; e.currentTarget.style.borderColor = C.border }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Franja de confianza */}
      <TrustBand />

      {/* Resumen / accesos rápidos del inicio */}
      <HomeSummary />

      {/* Lo que dicen nuestros clientes */}
      <Testimonials />

      {/* Ubicación */}
      <HomeLocation />
      </>)}

      {/* ════════ CATÁLOGO ════════ */}
      {route === 'catalogo' && (<>
      <section id="catálogo" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.ivory }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 fade-up">
            <SectionLabel>Catálogo</SectionLabel>
            <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Nuestros productos</h2>
            <p className="font-nunito max-w-md mx-auto text-base" style={{ color: C.stone }}>Fabricados en Villa El Salvador. Personalizamos dimensiones, colores y acabados.</p>
          </div>
          <div className="max-w-md mx-auto mb-6 fade-up relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.stone }} />
            <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder="Buscar producto…"
              className="w-full rounded-full border pl-11 pr-4 py-3 text-sm font-nunito outline-none transition-colors"
              style={{ borderColor: C.border, background: C.ivory, color: C.carbon }} />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-8 fade-up">
            {CAT_TABS.map(tab => (
              <button key={tab} onClick={() => setCatFilter(tab)}
                className="text-xs font-nunito font-bold px-5 py-2 rounded-full border transition-all duration-200"
                style={{ background: catFilter === tab ? C.sand : 'transparent', color: catFilter === tab ? C.petrol : C.stone, borderColor: catFilter === tab ? C.sand : C.border }}>
                {tab}
              </button>
            ))}
          </div>
          {visibleProducts.length > 0
            ? <div key={catFilter + catSearch} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {visibleProducts.map((p, i) => <ProductCard key={p.id} p={p} delay={i * 70} />)}
              </div>
            : <p className="text-center font-nunito text-sm py-10" style={{ color: C.stone }}>No encontramos productos para “{catSearch}”. Prueba otra palabra o escríbenos por WhatsApp.</p>}
          <div className="text-center mt-10 fade-up">
            <OutlineBtn onClick={() => setShowCatalog(true)} className="gap-2"><LayoutGrid size={16} /> Ver todos los modelos</OutlineBtn>
          </div>
        </div>
      </section>

      </>)}

      {/* ════════ CONFIGURADOR 3D (página) ════════ */}
      {route === 'configurador' && <ConfiguradorSection />}

      {/* ════════ GALERÍA ════════ */}
      {route === 'galeria' && (<>
      <section id="galeria" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.ivory }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <SectionLabel>Galería</SectionLabel>
            <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Nuestro trabajo</h2>
            <p className="font-nunito max-w-md mx-auto text-base" style={{ color: C.stone }}>Clic en cualquier imagen para ampliarla.</p>
          </div>
          <div className="fade-up grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div className="h-52 sm:h-60 md:col-span-1"><GalleryCard item={GALLERY[0]} /></div>
            <div className="h-52 sm:h-60 md:col-span-2"><GalleryCard item={GALLERY[1]} /></div>
          </div>
          <div className="fade-up grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div className="h-52 sm:h-60 md:col-span-2"><GalleryCard item={GALLERY[2]} /></div>
            <div className="h-52 sm:h-60 md:col-span-1"><GalleryCard item={GALLERY[3]} /></div>
          </div>
          <div className="fade-up grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="h-44 sm:h-52"><GalleryCard item={GALLERY[4]} /></div>
            <div className="h-44 sm:h-52"><GalleryCard item={GALLERY[5]} /></div>
            <div className="h-44 sm:h-52"><GalleryCard item={GALLERY[6]} /></div>
          </div>
          <div className="text-center mt-10 fade-up">
            <OutlineBtn href={wa('Hola, me gustaría ver más fotos de sus trabajos. ¿Pueden enviarme su portafolio?')} className="gap-2"><Camera size={15} /> Ver más fotos por WhatsApp</OutlineBtn>
          </div>
        </div>
      </section>

      </>)}

      {/* ════════ NOSOTROS (por qué · proceso · antes/después · testimonios) ════════ */}
      {route === 'nosotros' && (<>
      {/* ════════ POR QUÉ KORBAX ════════ */}
      <section id="nosotros" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.petrol }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="fade-up">
              <SectionLabel>¿Por qué elegirnos?</SectionLabel>
              <h2 className="font-outfit font-black uppercase leading-none mb-5" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.onDark }}>Fabricantes directos en Lima</h2>
              <p className="font-nunito leading-relaxed mb-8 text-base" style={{ color: C.mist }}>Somos una empresa peruana con fábrica propia en Villa El Salvador. Controlamos cada etapa — desde la selección de materiales hasta la entrega — sin intermediarios.</p>
              <SandBtn href={wa(DEFAULT_MSG)} size="md" className="px-7 py-3.5"><MessageCircle size={16} /> Cotizar sin compromiso <ArrowRight size={15} /></SandBtn>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WHY.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="fade-up rounded-2xl p-6 border transition-all duration-300"
                    style={{ background: `${C.carbon}35`, borderColor: 'rgba(255,255,255,0.07)', transitionDelay: `${i * 80}ms` }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${C.sand}40`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${C.sand}15` }}><Icon size={22} style={{ color: C.sand }} /></div>
                    <h3 className="font-nunito font-extrabold text-sm mb-2 leading-snug" style={{ color: C.onDark }}>{item.title}</h3>
                    <p className="text-xs font-nunito leading-relaxed" style={{ color: C.mist }}>{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PROCESO ════════ */}
      <ProcessTimeline />

      {/* ════════ ANTES / DESPUÉS ════════ */}
      <BeforeAfterSlider />

      {/* ════════ TESTIMONIOS ════════ */}
      <Testimonials />
      </>)}

      {/* ════════ CTA BANNER (inicio) ════════ */}
      {route === 'home' && (<>
      <section className="relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.sand }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full blur-2xl" style={{ background: 'rgba(22,16,16,0.08)' }} />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10 fade-up">
          <h2 className="font-outfit font-black uppercase leading-none mb-4" style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', color: C.petrol }}>¿Listo para equipar tu empresa?</h2>
          <p className="font-nunito text-base sm:text-lg mb-8" style={{ color: `${C.petrol}90` }}>Cuéntanos qué necesitas y te enviamos una cotización sin compromiso.</p>
          <a href={wa(DEFAULT_MSG)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-3 font-nunito font-black text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl transition-all duration-200 hover:scale-[1.03] shadow-2xl"
            style={{ background: '#161010', color: C.sand, boxShadow: `0 16px 48px rgba(22,16,16,0.35)` }}>
            <MessageCircle size={20} /> Cotizar por WhatsApp
          </a>
        </div>
      </section>

      </>)}

      {/* ════════ CONTACTO (con FAQ) ════════ */}
      {route === 'contacto' && (<>
      {/* ════════ CONTACTO ════════ */}
      <section id="contacto" className="py-16 sm:py-20 px-4 sm:px-6" style={{ background: C.gray }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <SectionLabel>Contacto</SectionLabel>
            <h2 className="font-outfit font-black uppercase leading-none mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: C.carbon }}>Hablemos</h2>
            <p className="font-nunito max-w-sm mx-auto text-base" style={{ color: C.stone }}>Escríbenos por WhatsApp o completa el formulario. Respondemos en menos de 24 horas.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            <div className="lg:col-span-2 fade-up space-y-3">
              {[
                { href: wa(DEFAULT_MSG), icon: MessageCircle, label: 'WhatsApp', value: '+51 936 020 199', badge: 'Respuesta rápida' },
                { href: `mailto:${EMAIL}`, icon: Mail,         label: 'Correo electrónico', value: EMAIL },
                { href: `tel:+${WA}`,     icon: Phone,        label: 'Llamadas',           value: '+51 936 020 199' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200"
                    style={{ background: C.ivory, borderColor: C.border, boxShadow: '0 1px 4px rgba(22,16,16,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.sand; e.currentTarget.style.boxShadow = `0 4px 16px ${C.sand}20` }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 1px 4px rgba(22,16,16,0.05)' }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.sand}15`, color: C.sand }}><Icon size={19} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-nunito font-semibold flex items-center gap-2" style={{ color: C.stone }}>
                        {item.label}
                        {item.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${C.sand}20`, color: C.sandDim }}>{item.badge}</span>}
                      </p>
                      <p className="font-nunito font-bold text-sm truncate mt-0.5" style={{ color: C.carbon }}>{item.value}</p>
                    </div>
                  </a>
                )
              })}
              <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: C.ivory, borderColor: C.border }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.petrol}10`, color: C.petrol }}><MapPin size={19} /></div>
                <div>
                  <p className="text-xs font-nunito font-semibold" style={{ color: C.stone }}>Fábrica</p>
                  <p className="font-nunito font-bold text-sm" style={{ color: C.carbon }}>Villa El Salvador, Lima</p>
                  <p className="text-xs font-nunito" style={{ color: C.stone }}>Envíos a todo el Perú</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-3 fade-up rounded-2xl border p-6 sm:p-8" style={{ background: C.ivory, borderColor: C.border, boxShadow: '0 2px 8px rgba(22,16,16,0.06)' }}>
              <h3 className="font-outfit font-black text-xl uppercase tracking-wide mb-6" style={{ color: C.carbon }}>Envíanos un mensaje</h3>
              <ContactForm onOpenPrivacy={() => setModal('privacy')} />
            </div>
          </div>
          <div className="mt-8 fade-up rounded-2xl overflow-hidden border" style={{ borderColor: C.border, boxShadow: '0 2px 8px rgba(22,16,16,0.06)' }}>
            <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ background: C.ivory, borderColor: C.border }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${C.petrol}10` }}><MapPin size={17} style={{ color: C.petrol }} /></div>
              <div>
                <p className="font-nunito font-bold text-sm" style={{ color: C.carbon }}>Fábrica — Villa El Salvador, Lima</p>
                <p className="text-xs font-nunito" style={{ color: C.stone }}>Atendemos en planta y coordinamos envíos a todo el Perú</p>
              </div>
            </div>
            <iframe src="https://maps.google.com/maps?q=Villa+El+Salvador%2C+Lima%2C+Peru&output=embed"
              width="100%" height="300" style={{ border: 0, display: 'block' }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              title="Fábrica Industrias Korbax — Villa El Salvador, Lima" />
          </div>
        </div>
      </section>

      {/* ════════ FAQ (al final de Contacto) ════════ */}
      <FAQ />
      </>)}

      {/* ════════ FOOTER ════════ */}
      <footer style={{ background: C.petrol, borderTop: `1px solid ${C.sand}12` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.jpg" alt="Industrias Korbax" className="h-11 w-11 rounded-xl object-cover" />
                <div>
                  <p className="font-outfit font-black uppercase text-base leading-none" style={{ color: C.onDark }}>Industrias Korbax</p>
                  <p className="text-xs font-nunito mt-0.5" style={{ color: C.stone }}>Villa El Salvador, Lima</p>
                </div>
              </div>
              <p className="text-sm font-nunito leading-relaxed mb-5" style={{ color: C.mist }}>Fabricamos sillas y mesas de alta calidad para toda empresa del Perú. Sin intermediarios.</p>
              <SandBtn href={wa(DEFAULT_MSG)} size="sm" className="px-5 py-2.5"><MessageCircle size={14} /> Cotizar ahora</SandBtn>
            </div>
            <div>
              <p className="text-xs font-nunito font-bold uppercase tracking-widest mb-4" style={{ color: C.stone }}>Navegación</p>
              <ul className="space-y-2.5">
                {[
                  { label:'Catálogo de productos', href:'#/catalogo' }, { label:'Galería de trabajos', href:'#/galeria' },
                  { label:'Sobre nosotros', href:'#/nosotros' }, { label:'Contacto', href:'#/contacto' },
                  { label:'Ver todos los modelos', onClick: () => setShowCatalog(true) },
                ].map(l => (
                  l.href
                    ? <li key={l.label}><a href={l.href} className="text-sm font-nunito transition-colors duration-200" style={{ color: C.mist }}
                        onMouseEnter={e => e.currentTarget.style.color = C.sand}
                        onMouseLeave={e => e.currentTarget.style.color = C.mist}>{l.label}</a></li>
                    : <li key={l.label}><button onClick={l.onClick} className="text-sm font-nunito transition-colors duration-200" style={{ color: C.mist }}
                        onMouseEnter={e => e.currentTarget.style.color = C.sand}
                        onMouseLeave={e => e.currentTarget.style.color = C.mist}>{l.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-nunito font-bold uppercase tracking-widest mb-4" style={{ color: C.stone }}>Contacto directo</p>
              <ul className="space-y-3">
                {[
                  { icon: MessageCircle, text: '+51 936 020 199', sub: 'WhatsApp', href: wa(DEFAULT_MSG) },
                  { icon: Mail,          text: EMAIL,             sub: 'Email',    href: `mailto:${EMAIL}` },
                  { icon: MapPin,        text: 'Villa El Salvador, Lima', sub: 'Fábrica', href: null },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <li key={item.sub}>
                      {item.href
                        ? <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-start gap-3 group">
                            <Icon size={15} className="mt-0.5 shrink-0" style={{ color: C.sand }} />
                            <div>
                              <p className="text-sm font-nunito font-semibold transition-colors group-hover:text-white" style={{ color: C.mist }}>{item.text}</p>
                              <p className="text-xs font-nunito" style={{ color: C.stone }}>{item.sub}</p>
                            </div>
                          </a>
                        : <div className="flex items-start gap-3">
                            <Icon size={15} className="mt-0.5 shrink-0" style={{ color: C.sand }} />
                            <div>
                              <p className="text-sm font-nunito font-semibold" style={{ color: C.mist }}>{item.text}</p>
                              <p className="text-xs font-nunito" style={{ color: C.stone }}>{item.sub}</p>
                            </div>
                          </div>
                      }
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div className="py-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-nunito" style={{ color: C.stone }}>© {new Date().getFullYear()} Industrias Korbax. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4 text-xs font-nunito" style={{ color: C.stone }}>
              <button onClick={() => setModal('privacy')} className="transition-colors"
                onMouseEnter={e => e.currentTarget.style.color = C.sand} onMouseLeave={e => e.currentTarget.style.color = C.stone}>Política de Privacidad</button>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <button onClick={() => setModal('terms')} className="transition-colors"
                onMouseEnter={e => e.currentTarget.style.color = C.sand} onMouseLeave={e => e.currentTarget.style.color = C.stone}>Términos de Uso</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </CartCtx.Provider>
    </ThemeCtx.Provider>
  )
}
