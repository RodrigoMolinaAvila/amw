/*! schema3d.js — AMW 2026 · lámina "The substrate"
 *
 *  16 tipos de nodo como burbujas de vidrio 3D con un ícono (o logo) en el centro,
 *  relaciones dirigidas con su tipo rotulado sobre la arista,
 *  construcción por traversal desde Fellow y handoff (beat 2) que revienta
 *  la burbuja Fellow en las 496 instancias reales y las deposita en el
 *  layout "field" con la cámara exacta con la que arranca Query Studio.
 *
 *  Canvas 2D, proyección manual idéntica a GraphScene. Sin dependencias.
 *  Registra window.SCENES.substrate = { mount, beat, destroy }.
 *  Configuración: window.Schema3D.config (antes de montar).
 */
(function () {
  'use strict';

  /* ───────────── math ───────────── */
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const sat = (x) => clamp(x, 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const span = (x, a, b) => sat((x - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - sat(t), 3);
  const easeInOut = (t) => { t = sat(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const norm3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const INK = [10, 16, 32];
  const ACCENT = [27, 77, 255];

  /* ───────────── configuración ───────────── */
  const config = {
    slug: 'substrate',
    fonts: { sans: '"Space Grotesk", sans-serif', mono: '"JetBrains Mono", monospace' },
    camera: { yaw: -0.18, pitch: 0.2, dist: 5.5, cx: 0.585, cy: 0.5, scale: 0.25 },
    sway: { amp: 0.16, rate: 0.055 },            // rate = velocidad angular pico (rad/s)
    bubble: { r: 0.135, rFellow: 0.19, sprite: 512, plate: 0.7, plateFill: false, icon: 1.56 },
    build: { stepMs: 240, growMs: 560 },
    labels: true,
    edges: true,
    groups: true,
    edgeLabels: 'unique',   // 'unique' = cada tipo de relación se rotula una vez · 'all' · 'none'
    handoff: {
      beat: 2,
      duration: 2600,
      // cámara inicial de la escena Studio (§4.3 y §4.5 del prompt maestro)
      camera: { yaw: -0.56, pitch: 0.42, dist: 3.15, cx: 0.36, cy: 0.42, scale: 0.3 },
      ringRadius: 1.08,
      ringPhase: -Math.PI / 2,
      fieldOf: null,     // (node) => 0..5 (posición en el anillo) | -1
      layout: null,      // (nodes) => [{x,y,z}] — pasar el layout field de GraphScene para aterrizaje exacto
      nodeColor: null,   // (node) => color CSS
      edgeColor: 'rgba(10,16,32,.10)',
      fieldLabels: ['Natural sciences', 'Agricultural sciences', 'Health sciences',
        'Engineering & tech.', 'Social sciences', 'Humanities'],
    },
    network: null,       // { nodes, edges }; por defecto window.RED | window.RED_DATA | window.NETWORK
    logos: {},           // { Fellow: 'logos/nodes/fellow.png', … }
    onProgress: null,    // (p) => void — progreso del handoff 0..1
  };

  /* ───────────── esquema: 16 tipos ─────────────
     count: solo cifras de §1.1. null = no se dibuja cifra (copiar del SVG actual).
     lab: lado de la etiqueta del nodo, elegido para no cruzar sus aristas. */
  const TYPES = [
    // id                 grupo   posición mundo            marca  count   lab
    ['Fellow',           'core', [0.00, 0.00, 0.00],      'F',   3143,   'below'],
    ['HighSchool',       'edu',  [-0.74, 0.66, 0.04],     'HS',  797,    'above'],
    ['Undergrad',        'edu',  [-1.00, 0.00, 0.08],     'UG',  253,    'above'],
    ['Grad',             'edu',  [-0.74, -0.66, 0.02],    'GR',  null,   'below'],
    ['Quality',          'edu',  [-1.86, 0.50, -0.06],    'Q',   null,   'below'],
    ['QS',               'edu',  [-1.82, -0.04, 0.04],    'QS',  null,   'below'],
    ['Shanghai',         'edu',  [-1.72, -0.66, -0.06],   'SH',  null,   'below'],
    ['Author',           'out',  [0.86, 0.00, 0.06],      'AU',  2703,   'above'],
    ['Publication',      'out',  [1.64, 0.00, 0.00],      'P',   26071,  'below'],
    ['Journal',          'out',  [2.12, 0.70, -0.04],     'J',   5488,   'right'],
    ['Coauthor',         'out',  [2.36, 0.16, 0.06],      'CA',  113221, 'below'],
    ['Topic',            'out',  [2.24, -0.54, -0.04],    'T',   237,    'below'],
    ['PubDiscipline',    'out',  [1.22, 0.80, -0.06],     'PD',  325,    'above'],
    ['AuthorDiscipline', 'out',  [1.10, -0.94, 0.06],     'AD',  233,    'below'],
    ['Field',            'core', [1.56, -0.92, -0.04],      'FD',  null,   'right'],
    ['Fondecyt',         'fund', [0.50, -0.84, -0.04],    'FN',  1031,   'below'],
  ].map(([id, group, p, mark, count, lab]) => ({ id, group, p, mark, count, lab }));

  /* Relaciones dirigidas [origen, destino, tipo], con los nombres reales del
     esquema de la tesis (15 tipos de relación en el grafo completo). */
  const LINKS = [
    ['Fellow', 'HighSchool', 'STUDIED_SECONDARY_AT'],
    ['Fellow', 'Undergrad', 'STUDIED_UNDERGRAD_AT'],
    ['Fellow', 'Grad', 'STUDIED_GRADUATE_AT'],
    ['Undergrad', 'Quality', 'HAS_QUALITY'],
    ['Grad', 'QS', 'HAS_QS_PRESTIGE'],
    ['Grad', 'Shanghai', 'HAS_SHANGHAI_PRESTIGE'],
    ['Fellow', 'Author', 'HAS_SCOPUS_PROFILE'],
    ['Author', 'Publication', 'AUTHORED'],
    ['Publication', 'Journal', 'IS_PUBLISHED_IN'],
    ['Publication', 'Coauthor', 'COAUTHORED'],
    ['Publication', 'Topic', 'HAS_TOPIC'],
    ['Publication', 'PubDiscipline', 'IN_DISCIPLINE'],
    ['Author', 'AuthorDiscipline', 'HAS_DISCIPLINE'],
    ['Publication', 'Field', 'IN_FIELD'],
    ['Fellow', 'Fondecyt', 'HAS_FONDECYT'],
  ];

  /* etiquetas de grupo, ancladas a un miembro: [texto, tipo ancla, lado] */
  const GROUPS = [
    ['Education', 'Quality', 'above'],
    ['People / output', 'Journal', 'above'],
    ['Funding', 'Fondecyt', 'left'],
  ];

  /* ───────────── íconos de línea por tipo (originales, caja 100×100, trazo 5.2) ─────────────
     ['s', d] = trazo · ['f', d] = relleno. Un logo en config.logos reemplaza al ícono. */
  const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const seal = (() => {   // sello festoneado de 20 lóbulos
    let d = '';
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 21.5 : 25;
      d += (k ? 'L' : 'M') + (50 + r * Math.cos(a)).toFixed(2) + ' ' + (40 + r * Math.sin(a)).toFixed(2);
    }
    return d + 'Z';
  })();
  const pill = (x, y, w) => `M${x} ${y}h${w}a7 7 0 0 1 0 14h${-w}a7 7 0 0 1 0-14Z`;
  const ICONS = {
    Fellow: [['s', circ(50, 47, 12)], ['s', 'M24 88Q24 66 50 66Q76 66 76 88'],
      ['f', 'M27 31L50 20L73 31L50 42Z'], ['s', 'M67 34V46']],
    HighSchool: [['s', 'M20 52V86H80V52'], ['s', 'M12 54L50 31L88 54'], ['s', 'M43 86V70H57V86'],
      ['s', 'M27 60h10v9h-10Z M63 60h10v9h-10Z'], ['s', 'M50 31V12'], ['f', 'M50 11L64 16L50 21Z']],
    Undergrad: [['s', 'M14 38L50 17L86 38Z'], ['s', 'M18 44H82'],
      ['s', 'M27 50V76 M42 50V76 M58 50V76 M73 50V76'], ['s', 'M16 81H84 M12 88H88']],
    Grad: [['s', 'M10 42L50 25L90 42L50 59Z'], ['s', 'M28 51V67Q50 80 72 67V51'],
      ['s', 'M83 45V66'], ['f', circ(83, 69, 3.6)]],
    Quality: [['s', seal], ['s', 'M39 41L47 49L62 33'],
      ['s', 'M38 61L32 87L41 82L47 88L49 66'], ['s', 'M62 61L68 87L59 82L53 88L51 66']],
    QS: [['s', 'M16 84V60H38V84 M38 84V44H62V84 M62 84V68H84V84 M10 84H90'], ['s', 'M46 56L51 52V74'],
      ['f', 'M50 15l3.5 7.2 7.9 1.1-5.7 5.6 1.4 7.9-7.1-3.7-7.1 3.7 1.4-7.9-5.7-5.6 7.9-1.1z']],
    Shanghai: [['s', 'M32 16H68V33Q68 56 50 58Q32 56 32 33Z'],
      ['s', 'M32 23H24Q17 23 18 31Q20 44 33 45 M68 23H76Q83 23 82 31Q80 44 67 45'],
      ['s', 'M50 58V71'], ['s', 'M37 86H63L59 71H41Z']],
    Author: [['s', 'M40 12H60L72 44L50 88L28 44Z'], ['s', 'M40 21H60'], ['s', circ(50, 50, 5)], ['s', 'M50 56V86']],
    Publication: [['s', 'M26 10H62L76 24V90H26Z'], ['s', 'M62 10V24H76'],
      ['s', 'M36 42H66 M36 54H66 M36 66H66 M36 78H54']],
    Journal: [['s', 'M16 18h17v70h-17Z M37 18h17v70h-17Z'], ['s', 'M16 31h17 M37 31h17 M16 75h17 M37 75h17'],
      ['s', 'M60 25l15-4 16 64-15 4Z'], ['s', 'M63 37l15-4']],
    Coauthor: [['s', circ(64, 33, 10)], ['s', 'M57 53Q61 50 64 50Q85 50 85 72'],
      ['s', circ(40, 46, 11)], ['s', 'M16 88Q16 64 40 64Q64 64 64 88']],
    Topic: [['s', pill(24, 22, 40)], ['s', pill(42, 44, 36)], ['s', pill(22, 66, 26)],
      ['f', circ(25, 29, 2.6)], ['f', circ(43, 51, 2.6)], ['f', circ(23, 73, 2.6)]],
    Field: [['s', 'M37 12H63 M43 12V40L22 78Q19 86 28 86H72Q81 86 78 78L57 40V12'], ['s', 'M30 64H70'],
      ['f', circ(47, 75, 3.2)], ['f', circ(57, 55, 2.4)]],
    PubDiscipline: [['s', 'M24 10H76V90H24Z'], ['f', 'M51 10V41L58.5 35L66 41V10Z'],
      ['s', 'M33 54H67 M33 66H67 M33 78H55']],
    AuthorDiscipline: [['s', circ(38, 34, 12)], ['s', 'M14 84Q14 57 38 57Q53 57 60 66'],
      ['s', 'M56 75L66 64H89V86H66Z'], ['f', circ(68, 75, 2.7)]],
    Fondecyt: [['s', 'M18 30a22 7.5 0 1 0 44 0a22 7.5 0 1 0 -44 0'], ['s', 'M18 30V72 M62 30V72'],
      ['s', 'M18 44a22 7.5 0 0 0 44 0 M18 58a22 7.5 0 0 0 44 0 M18 72a22 7.5 0 0 0 44 0'],
      ['s', 'M65 58a11.5 4.5 0 1 0 23 0a11.5 4.5 0 1 0 -23 0'], ['s', 'M65 58V84 M88 58V84'],
      ['s', 'M65 71a11.5 4.5 0 0 0 23 0 M65 84a11.5 4.5 0 0 0 23 0']],
  };
  const PATHS = {};

  /* índices, profundidad BFS y padre (para build y colapso) */
  const TI = new Map(TYPES.map((t, i) => [t.id, i]));
  const L = LINKS.map(([a, b, type]) => [TI.get(a), TI.get(b), type]);
  const LABELLED = LINKS.map((l, i) => LINKS.findIndex((m) => m[2] === l[2]) === i);
  (function bfs() {
    TYPES.forEach((t) => { t.depth = -1; t.parent = -1; });
    const q = [0]; TYPES[0].depth = 0;
    while (q.length) {
      const i = q.shift();
      for (const [a, b] of L) {
        const j = a === i ? b : b === i ? a : -1;
        if (j >= 0 && TYPES[j].depth < 0) { TYPES[j].depth = TYPES[i].depth + 1; TYPES[j].parent = i; q.push(j); }
      }
    }
  })();
  const MAX_DEPTH = Math.max(...TYPES.map((t) => t.depth));

  /* ───────────── vidrio: render por píxel, una vez por tinte ─────────────
     back  = cuerpo de vidrio visto a través (tinte, anillo de refracción, cáustica)
     front = reflexión Fresnel del estudio, contorno, softbox, kicker, rim, reflejo interno
     El logo va entre ambas capas. Luz fija a cámara ⇒ el sprite es invariante a la órbita. */
  const glassCache = new Map();

  function renderGlass(S, tint, accent) {
    const key = S + ':' + tint.join(',');
    if (glassCache.has(key)) return glassCache.get(key);
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
    const back = mk(), front = mk();
    const bI = back.getContext('2d').createImageData(S, S);
    const fI = front.getContext('2d').createImageData(S, S);
    const B = bI.data, F = fI.data;
    const R = S / 2 - 3, C = S / 2;
    const [tr, tg, tb] = tint;

    // softbox principal (arriba-izquierda), marco local
    const K = norm3(-0.78, 0.58, 0.22);
    let e1 = norm3(K[2], 0, -K[0]);                       // ⟂ a K, horizontal
    let e2 = norm3(K[1] * e1[2] - K[2] * e1[1], K[2] * e1[0] - K[0] * e1[2], K[0] * e1[1] - K[1] * e1[0]);
    const H2 = norm3(0.62 + 0, 0.42 + 0, 0.66 + 1);       // half-vector del kicker (arriba-derecha)
    const window_ = (rx, ry, rz) => {
      const d = rx * K[0] + ry * K[1] + rz * K[2];
      if (d <= 0) return 0;
      const a = (rx * e1[0] + ry * e1[1] + rz * e1[2]) / 0.2;
      const b = (rx * e2[0] + ry * e2[1] + rz * e2[2]) / 0.13;
      const q = Math.pow(Math.abs(a), 4) + Math.pow(Math.abs(b), 4);
      let m = 1 - smooth(0.62, 1.0, q);
      m *= 1 - 0.55 * Math.exp(-(a * a) / 0.0016);         // montante vertical
      m *= 1 - 0.35 * Math.exp(-(b * b) / 0.0022);         // travesaño
      return m;
    };
    const env = (rx, ry, rz) => {
      // estudio sobre fondo blanco: casi todo claro; línea de horizonte tinta, piso gris, sala tras cámara
      let l = ry > -0.08 ? 0.97 : 0.8;
      const band = Math.exp(-((ry + 0.03) * (ry + 0.03)) / 0.0016) * smooth(0.55, -0.2, rz);
      l = lerp(l, 0.2, band);
      l = lerp(l, 0.86, smooth(0.5, 0.95, rz));
      return Math.max(l, window_(rx, ry, rz));
    };
    // franja de relleno: alta y angosta, a la derecha (fuente intensa, sin Fresnel)
    const strip = (rx, ry, rz) => {
      if (rz > 0.2) return 0;
      const fx = (rx - 0.84) / 0.06, fy = (ry - 0.08) / 0.4;
      return 1 - smooth(0.55, 1, Math.pow(Math.abs(fx), 4) + Math.pow(Math.abs(fy), 4));
    };

    for (let py = 0; py < S; py++) {
      const v = (C - py - 0.5) / R;
      for (let px = 0; px < S; px++) {
        const u = (px + 0.5 - C) / R;
        const r2 = u * u + v * v;
        const r = Math.sqrt(r2);
        const cov = sat((1 - r) * R + 0.5);
        if (cov <= 0) continue;
        const rc = Math.min(r, 0.9995);
        const nz = Math.sqrt(1 - rc * rc);
        const ux = r > 1e-6 ? u / r : 0, uy = r > 1e-6 ? v / r : 0;
        const nx = ux * rc, ny = uy * rc;
        const o = (py * S + px) * 4;

        /* ── back ── */
        const lower = sat(0.5 - 0.5 * ny);
        const cdx = u - 0.32, cdy = v + 0.46;
        const caus = Math.exp(-(cdx * cdx + cdy * cdy) / 0.04) * (1 - smooth(0.78, 0.92, r));
        let aB = 0.016 + 0.06 * smooth(0.25, 0.9, r) * (0.4 + 0.6 * lower);
        const ring = smooth(0.8, 0.93, r) * (1 - smooth(0.958, 0.99, r));
        aB += 0.24 * ring * (0.45 + 0.55 * lower);
        aB *= 1 - 0.85 * caus;
        if (accent) aB *= 0.85;
        B[o] = tr; B[o + 1] = tg; B[o + 2] = tb; B[o + 3] = Math.round(sat(aB) * cov * 255);

        /* ── front (premultiplicado) ── */
        let cr = 0, cg = 0, cb = 0, ca = 0, a;
        const Rx = 2 * nz * nx, Ry = 2 * nz * ny, Rz = 2 * nz * nz - 1;

        // 1 · reflexión Fresnel del estudio
        const fres = 0.04 + 0.96 * Math.pow(1 - nz, 3.6);
        let lv = env(Rx, Ry, Rz);
        a = sat(fres * 0.9);
        let er = lv, eg = lv, eb = lv;
        if (accent) { er = lerp(lv, ACCENT[0] / 255, 0.16); eg = lerp(lv, ACCENT[1] / 255, 0.16); eb = lerp(lv, ACCENT[2] / 255, 0.16); }
        cr = er * a + cr * (1 - a); cg = eg * a + cg * (1 - a); cb = eb * a + cb * (1 - a); ca = a + ca * (1 - a);

        // 2 · contorno (tinta / acento), más claro del lado iluminado
        const lit = sat(-0.62 * ux + 0.78 * uy);
        a = 0.78 * smooth(0.958, 0.99, r) * (1 - 0.55 * lit * lit);
        const kr = tr / 255, kg = tg / 255, kb = tb / 255;
        cr = kr * a + cr * (1 - a); cg = kg * a + cg * (1 - a); cb = kb * a + cb * (1 - a); ca = a + ca * (1 - a);

        // 3 · softbox (fuente intensa: no se pondera por Fresnel)
        a = 0.94 * window_(Rx, Ry, Rz);
        cr = a + cr * (1 - a); cg = a + cg * (1 - a); cb = a + cb * (1 - a); ca = a + ca * (1 - a);

        // 3b · franja de relleno
        a = 0.62 * strip(Rx, Ry, Rz);
        cr = a + cr * (1 - a); cg = a + cg * (1 - a); cb = a + cb * (1 - a); ca = a + ca * (1 - a);

        // 4 · reflejo interno del softbox (cara posterior), tenue, abajo-derecha
        if (r < 0.86) {
          const s = 1.18, mx = -nx * s, my = -ny * s;
          const m2 = mx * mx + my * my;
          if (m2 < 1) {
            const mz = Math.sqrt(1 - m2);
            a = 0.2 * window_(2 * mz * mx, 2 * mz * my, 2 * mz * mz - 1) * (1 - smooth(0.6, 0.86, r));
            cr = a + cr * (1 - a); cg = a + cg * (1 - a); cb = a + cb * (1 - a); ca = a + ca * (1 - a);
          }
        }

        // 5 · kicker puntual (Blinn, arriba-derecha)
        const hd = nx * H2[0] + ny * H2[1] + nz * H2[2];
        a = 0.92 * Math.pow(Math.max(0, hd), 1400);
        cr = a + cr * (1 - a); cg = a + cg * (1 - a); cb = a + cb * (1 - a); ca = a + ca * (1 - a);

        // 6 · rim light abajo-derecha (luz de recorte)
        const back_ = sat(0.55 * ux - 0.83 * uy);
        a = 0.55 * smooth(0.9, 0.975, r) * (1 - smooth(0.975, 0.996, r)) * back_ * back_ * back_;
        cr = a + cr * (1 - a); cg = a + cg * (1 - a); cb = a + cb * (1 - a); ca = a + ca * (1 - a);

        if (ca > 0) {
          F[o] = Math.round((cr / ca) * 255); F[o + 1] = Math.round((cg / ca) * 255); F[o + 2] = Math.round((cb / ca) * 255);
          F[o + 3] = Math.round(sat(ca) * cov * 255);
        }
      }
    }
    back.getContext('2d').putImageData(bI, 0, 0);
    front.getContext('2d').putImageData(fI, 0, 0);
    const out = { back, front, S, R };
    glassCache.set(key, out);
    return out;
  }

  /* ───────────── placa del logo (o monograma) ─────────────
     Se compone con drawImage: no lee píxeles del logo ⇒ funciona en file:// sin taint. */
  const logoImgs = new Map();   // id -> HTMLImageElement cargada
  const plates = new Map();     // id -> canvas

  function buildPlate(t) {
    const S = config.bubble.sprite, R = S / 2 - 3, C = S / 2, Rp = R * config.bubble.plate;
    const cv = plates.get(t.id) || document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d');
    g.clearRect(0, 0, S, S);
    if (config.bubble.plateFill) {   // disco blanco: útil si los logos traen fondo opaco
      g.beginPath(); g.arc(C, C, Rp, 0, TAU);
      g.fillStyle = '#ffffff'; g.fill();
      g.lineWidth = Math.max(1, S / 300); g.strokeStyle = 'rgba(10,16,32,.14)'; g.stroke();
    }
    g.save(); g.beginPath(); g.arc(C, C, Rp * 0.985, 0, TAU); g.clip();
    const img = logoImgs.get(t.id);
    if (img && img.complete) {
      // máximo rectángulo de la razón del logo inscrito en 0.92·Rp (SVG sin tamaño intrínseco ⇒ 1:1)
      const asp = (img.naturalWidth || 1) / (img.naturalHeight || 1), rr = Rp * (config.bubble.plateFill ? 0.84 : 0.92);
      const th = Math.atan(1 / asp), w = 2 * rr * Math.cos(th), h = w / asp;
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, C - w / 2, C - h / 2, w, h);
    } else if (ICONS[t.id] && typeof Path2D === 'function') {
      const col = t.id === 'Fellow' ? 'rgb(27,77,255)' : 'rgb(10,16,32)', box = Rp * config.bubble.icon;
      g.translate(C - box / 2, C - box / 2); g.scale(box / 100, box / 100);
      g.lineWidth = 5.2; g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = col; g.fillStyle = col;
      const P = PATHS[t.id] || (PATHS[t.id] = ICONS[t.id].map(([m, d]) => [m, new Path2D(d)]));
      for (const [m, path] of P) { if (m === 'f') g.fill(path); else g.stroke(path); }
    } else {
      g.fillStyle = t.id === 'Fellow' ? 'rgb(27,77,255)' : 'rgb(10,16,32)';
      const fs = Rp * (t.mark.length > 1 ? 0.56 : 0.74);
      g.font = '500 ' + fs + 'px ' + config.fonts.mono;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(t.mark, C, C + fs * 0.04);
    }
    g.restore();
    plates.set(t.id, cv);
    return cv;
  }

  function loadLogo(id, src) {
    if (!src) { logoImgs.delete(id); const t = TYPES[TI.get(id)]; if (t) buildPlate(t); return Promise.resolve(); }
    return new Promise((res) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { logoImgs.set(id, img); const t = TYPES[TI.get(id)]; if (t) buildPlate(t); res(); };
      img.onerror = () => { console.warn('[schema3d] logo no cargado:', id, src); res(); };
      img.src = src;
    });
  }

  /* ───────────── red de 496 nodos ───────────── */
  function normalizeNetwork(raw) {
    if (!raw) return null;
    const nodes = raw.nodes || raw.nodos || raw.N;
    const edges = raw.edges || raw.links || raw.aristas || raw.E;
    if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
    const byId = new Map();
    nodes.forEach((n, i) => byId.set(n && n.id !== undefined ? n.id : i, i));
    const res = (x) => {
      if (x && typeof x === 'object') x = x.id;
      if (byId.has(x)) return byId.get(x);
      return Number.isInteger(x) && x >= 0 && x < nodes.length ? x : -1;
    };
    const E = [];
    for (const e of edges) {
      const s = res(Array.isArray(e) ? e[0] : (e.source ?? e.s ?? e.from));
      const t = res(Array.isArray(e) ? e[1] : (e.target ?? e.t ?? e.to));
      if (s >= 0 && t >= 0 && s !== t) E.push([s, t]);
    }
    const deg = new Array(nodes.length).fill(0);
    for (const [s, t] of E) { deg[s]++; deg[t]++; }
    return { nodes, edges: E, deg };
  }

  // anillo en el orden de las etiquetas; OECD FOS: 1 nat, 2 ing, 3 salud, 4 agro, 5 soc, 6 hum
  const OECD_TO_RING = { 1: 0, 2: 3, 3: 2, 4: 1, 5: 4, 6: 5 };
  function defaultFieldOf(n) {
    const v = n.oecd ?? n.field ?? n.area;
    if (typeof v === 'number') return OECD_TO_RING[Math.floor(v)] ?? -1;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      if (/^\d/.test(s)) return OECD_TO_RING[parseInt(s, 10)] ?? -1;
      if (/natur/.test(s)) return 0;
      if (/agr/.test(s)) return 1;
      if (/health|medic|salud|méd|med/.test(s)) return 2;
      if (/engin|tech|ingen|tecn/.test(s)) return 3;
      if (/soci/.test(s)) return 4;
      if (/human/.test(s)) return 5;
    }
    return -1;
  }

  /* layout field según §4.4 (anillo r=1.08, ángulo dorado, rad = .22 + .20·√(n/120)) */
  function fieldLayout(net) {
    const H = config.handoff, fieldOf = H.fieldOf || defaultFieldOf;
    const groups = [[], [], [], [], [], []], loose = [];
    net.nodes.forEach((n, i) => { const k = fieldOf(n); (k >= 0 && k < 6 ? groups[k] : loose).push(i); });
    const pos = new Array(net.nodes.length), centers = [], order = new Array(net.nodes.length);
    const place = (g, cx, cz, k) => {
      g.sort((a, b) => net.deg[b] - net.deg[a]);
      const n = g.length, rad = 0.22 + 0.2 * Math.sqrt(n / 120);
      g.forEach((i, q) => {
        const th = q * 2.39996, rr = Math.sqrt((q + 0.5) / Math.max(1, n)) * rad;
        pos[i] = { x: cx + rr * Math.cos(th), y: 0, z: cz + rr * Math.sin(th) };
        order[i] = { k, q: q / Math.max(1, n - 1) };
      });
      return rad;
    };
    groups.forEach((g, k) => {
      const a = H.ringPhase + (k / 6) * TAU, cx = H.ringRadius * Math.cos(a), cz = H.ringRadius * Math.sin(a);
      const rad = g.length ? place(g, cx, cz, k) : 0;
      centers.push({ x: cx, y: 0, z: cz, rad, n: g.length });
    });
    if (loose.length) place(loose, 0, 0, 6);
    return { pos, centers, order };
  }

  /* ───────────── escena ───────────── */
  function createScene(slide) {
    const cfg = config;
    let canvas = slide.matches && slide.matches('canvas') ? slide : slide.querySelector('canvas[data-schema3d]');
    let ownCanvas = false;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('data-schema3d', '');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;';
      slide.insertBefore(canvas, slide.firstChild);
      ownCanvas = true;
    }
    const host = slide.matches && slide.matches('canvas') ? slide.parentElement : slide;
    const fades = host ? Array.from(host.querySelectorAll('[data-s3d-fade]')) : [];
    const ctx = canvas.getContext('2d');

    const ink = renderGlass(cfg.bubble.sprite, INK, false);
    const acc = renderGlass(cfg.bubble.sprite, ACCENT, true);
    TYPES.forEach((t) => { if (!plates.has(t.id)) buildPlate(t); });
    for (const [id, src] of Object.entries(cfg.logos || {})) if (src && !logoImgs.has(id)) loadLogo(id, src);
    if (document.fonts && document.fonts.load) {
      document.fonts.load('500 40px ' + cfg.fonts.mono).then(() => TYPES.forEach((t) => { if (!logoImgs.has(t.id)) buildPlate(t); })).catch(() => {});
    }

    const net = normalizeNetwork(cfg.network || window.RED || window.RED_DATA || window.NETWORK);
    if (!net) console.warn('[schema3d] sin red de 496 nodos: definir Schema3D.config.network = { nodes, edges }');
    let field = null, jitter = null;
    if (net) {
      field = fieldLayout(net);
      if (typeof cfg.handoff.layout === 'function') {
        const p = cfg.handoff.layout(net.nodes);
        if (Array.isArray(p) && p.length === net.nodes.length) field.pos = p.map((q) => ({ x: q.x, y: q.y || 0, z: q.z || 0 }));
      }
      const R = rng(4961);
      jitter = net.nodes.map(() => {
        let x, y, z; do { x = R() * 2 - 1; y = R() * 2 - 1; z = R() * 2 - 1; } while (x * x + y * y + z * z > 1);
        return { x, y, z, lift: (R() - 0.5) * 2 };
      });
    }

    /* estado */
    const base = Object.assign({}, cfg.camera);
    const cam = Object.assign({}, cfg.camera);
    let userYaw = 0, userPitch = 0, userDist = 0, vYaw = 0, vPitch = 0;
    let phase = 0, orbit = true, pauseUntil = 0;
    let labels = cfg.labels, edges = cfg.edges, sourcesOn = true;
    let pathN = new Set(), pathE = new Set();
    let p = 0, pTarget = 0, camFrom = null;
    let t0 = performance.now(), last = t0, raf = 0, frames = 0, buildDone = false;
    let W = 0, Hh = 0, dpr = 1;
    const screen = TYPES.map(() => ({ x: 0, y: 0, r: 0, z: 0, f: 1, a: 0 }));

    /* entrada */
    let drag = null;
    const toLocal = (e) => { const b = canvas.getBoundingClientRect(); const k = canvas.offsetWidth / (b.width || 1); return [(e.clientX - b.left) * k, (e.clientY - b.top) * k]; };
    const onDown = (e) => { if (p > 0) return; drag = toLocal(e); canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); pauseUntil = performance.now() + 2400; };
    const onMove = (e) => {
      if (!drag) return;
      const q = toLocal(e), dx = q[0] - drag[0], dy = q[1] - drag[1]; drag = q;
      vYaw = dx * 0.006; vPitch = dy * 0.004; userYaw += vYaw; userPitch += vPitch;
      pauseUntil = performance.now() + 2400;
    };
    const onUp = () => { drag = null; };
    const onWheel = (e) => {
      if (p > 0) return; e.preventDefault();
      userDist = clamp(base.dist + userDist + e.deltaY * 0.0015 * base.dist / 3.15, base.dist * 0.7, base.dist * 1.46) - base.dist;
      pauseUntil = performance.now() + 2400;
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    function resize() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      const b = canvas.getBoundingClientRect();
      let k = b.width / (w || 1); if (!isFinite(k) || k < 0.25 || k > 4) k = 1;
      const d = Math.min(2, (window.devicePixelRatio || 1) * k);
      if (w !== W || h !== Hh || d !== dpr) {
        W = w; Hh = h; dpr = d;
        canvas.width = Math.max(1, Math.round(W * dpr)); canvas.height = Math.max(1, Math.round(Hh * dpr));
      }
    }

    /* proyección — idéntica a GraphScene */
    function project(x, y, z, c, out) {
      const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const f = c.dist / (c.dist + z2), sc = Math.min(W, Hh) * c.scale;
      out.x = W * c.cx + x1 * f * sc; out.y = Hh * c.cy - y2 * f * sc; out.z = z2; out.f = f; out.sc = sc;
      return out;
    }

    function fontSans(px, w) { return (w || 400) + ' ' + px + 'px ' + cfg.fonts.sans; }
    function fontMono(px, w) { return (w || 400) + ' ' + px + 'px ' + cfg.fonts.mono; }
    function haloText(txt, x, y, font, color, alpha) {
      if (alpha <= 0.01) return;
      ctx.globalAlpha = alpha; ctx.font = font;
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(251,252,253,.92)';
      ctx.strokeText(txt, x, y); ctx.fillStyle = color; ctx.fillText(txt, x, y);
      ctx.globalAlpha = 1;
    }
    const depthFade = (f) => 0.58 + 0.42 * smooth(0.8, 1.12, f);

    function drawBubble(i, s, scaleMul, alpha, plateAlpha, inside, plateMul) {
      plateMul = plateMul === undefined ? 1 : plateMul;
      const t = TYPES[i], G = i === 0 ? acc : ink;
      const rw = (i === 0 ? cfg.bubble.rFellow : cfg.bubble.r) * scaleMul;
      const rs = rw * s.f * s.sc;
      if (rs < 0.5 || alpha <= 0.005) return;
      const D = 2 * rs * (G.S / 2) / G.R, x = s.x - D / 2, y = s.y - D / 2;
      ctx.globalAlpha = alpha;
      ctx.drawImage(G.back, x, y, D, D);
      if (sourcesOn && plateAlpha > 0.005) { ctx.globalAlpha = Math.min(1, plateMul) * plateAlpha; ctx.drawImage(plates.get(t.id), x, y, D, D); }
      if (inside) inside(rs);
      ctx.globalAlpha = alpha;
      ctx.drawImage(G.front, x, y, D, D);
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; frames++;
      resize();
      if (!W || !Hh) return;

      /* progreso del handoff */
      const H = cfg.handoff;
      if (p !== pTarget) {
        if (p === 0 && pTarget > 0) camFrom = { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, cx: cam.cx, cy: cam.cy, scale: cam.scale };
        p = pTarget > p ? Math.min(pTarget, p + (dt * 1000) / H.duration) : Math.max(pTarget, p - (dt * 1000) / H.duration);
        if (cfg.onProgress) cfg.onProgress(p);
        if (p >= 1) window.SCENE_HANDOFF = Object.assign({ layout: 'field' }, H.camera);
      }

      /* cámara */
      if (p === 0) {
        if (!drag) { userYaw += vYaw; userPitch += vPitch; vYaw *= 0.92; vPitch *= 0.92; }
        if (orbit && now > pauseUntil) phase += (dt * cfg.sway.rate) / Math.max(1e-3, cfg.sway.amp);
        cam.yaw = base.yaw + userYaw + cfg.sway.amp * Math.sin(phase);
        cam.pitch = clamp(base.pitch + userPitch, -1.15, 1.15);
        cam.dist = base.dist + userDist; cam.cx = base.cx; cam.cy = base.cy; cam.scale = base.scale;
      } else {
        const k = easeInOut(span(p, 0.08, 0.62)), T = H.camera;
        for (const key of ['yaw', 'pitch', 'dist', 'cx', 'cy', 'scale']) cam[key] = lerp(camFrom[key], T[key], k);
      }

      /* texto de la lámina */
      const textA = 1 - smooth(0, 0.16, p);
      for (const el of fades) el.style.opacity = textA < 1 ? textA.toFixed(3) : '';

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Hh);
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

      /* build por traversal (solo al entrar en beat 1) */
      const tb = now - t0;
      const reveal = TYPES.map((t) => buildDone ? 1 : easeOut((tb - t.depth * cfg.build.stepMs) / cfg.build.growMs));
      if (!buildDone && reveal.every((r) => r >= 1)) buildDone = true;

      /* posiciones de tipos */
      const wp = TYPES.map((t, i) => {
        let [x, y, z] = t.p;
        if (!buildDone && t.parent >= 0) {
          const pp = TYPES[t.parent].p, k = reveal[i];
          x = lerp(pp[0], x, k); y = lerp(pp[1], y, k); z = lerp(pp[2], z, k);
        }
        if (p > 0 && i > 0) {
          const st = 0.02 + (MAX_DEPTH - t.depth) * 0.07, c = easeInOut(span(p, st, st + 0.22));
          x *= 1 - c; y *= 1 - c; z *= 1 - c;
        }
        return [x, y, z];
      });
      const collapse = TYPES.map((t, i) => {
        if (i === 0 || p === 0) return 0;
        const st = 0.02 + (MAX_DEPTH - t.depth) * 0.07; return easeInOut(span(p, st, st + 0.22));
      });
      TYPES.forEach((t, i) => { project(wp[i][0], wp[i][1], wp[i][2], cam, screen[i]); screen[i].a = depthFade(screen[i].f); });

      /* aristas del esquema: dirigidas, con tipo de relación sobre la línea (estilo Neo4j Browser)
         1) geometría · 2) ubicación de rótulos (evita otros rótulos y otras aristas) · 3) dibujo */
      const edgeJobs = [];
      if (edges) {
        const AH = 9, AW = 4.4, PAD = 12;
        const elAlpha = (labels ? 1 : 0) * (1 - smooth(0, 0.12, p));
        ctx.font = fontMono(12, 500);
        const geo = [];
        L.forEach(([a, b, type], li) => {
          const tree = TYPES[b].parent === a ? b : TYPES[a].parent === b ? a : -1;
          let al = tree >= 0 ? sat(reveal[tree] * 3) : Math.pow(Math.min(reveal[a], reveal[b]), 2);
          al *= (1 - Math.max(collapse[a], collapse[b])) * Math.min(screen[a].a, screen[b].a);
          if (al <= 0.01) return;
          const A = screen[a], Bs = screen[b];
          const ra_ = (a === 0 ? cfg.bubble.rFellow : cfg.bubble.r) * A.f * A.sc * reveal[a] * (1 - collapse[a]) + 3;
          const rb_ = (b === 0 ? cfg.bubble.rFellow : cfg.bubble.r) * Bs.f * Bs.sc * reveal[b] * (1 - collapse[b]) + 3;
          const dx = Bs.x - A.x, dy = Bs.y - A.y, len = Math.hypot(dx, dy);
          if (len <= ra_ + rb_ + 4) return;
          const ux = dx / len, uy = dy / len;
          geo.push({ li, type, al, ux, uy,
            x0: A.x + ux * ra_, y0: A.y + uy * ra_,       // sale de la superficie del origen
            x1: Bs.x - ux * rb_, y1: Bs.y - uy * rb_,     // punta de flecha en la superficie del destino
            seg: len - ra_ - rb_, gap: null });
        });
        // distancia mínima entre dos segmentos (0 si se cruzan)
        const segDist = (ax, ay, bx, by, cx2, cy2, dx2, dy2) => {
          const cr = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
          const d1 = cr(ax, ay, bx, by, cx2, cy2), d2 = cr(ax, ay, bx, by, dx2, dy2);
          const d3 = cr(cx2, cy2, dx2, dy2, ax, ay), d4 = cr(cx2, cy2, dx2, dy2, bx, by);
          if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) return 0;
          const ps = (px, py, sx, sy, ex, ey) => {
            const vx = ex - sx, vy = ey - sy, l2 = vx * vx + vy * vy || 1;
            const t = clamp(((px - sx) * vx + (py - sy) * vy) / l2, 0, 1);
            return Math.hypot(px - sx - t * vx, py - sy - t * vy);
          };
          return Math.min(ps(ax, ay, cx2, cy2, dx2, dy2), ps(bx, by, cx2, cy2, dx2, dy2), ps(cx2, cy2, ax, ay, bx, by), ps(dx2, dy2, ax, ay, bx, by));
        };
        // cajas de las etiquetas de nodo: los rótulos de relación las evitan
        const boxes = [];
        if (labels) TYPES.forEach((t, i) => {
          const sN = screen[i]; if (reveal[i] < 0.75) return;
          const rs = (i === 0 ? cfg.bubble.rFellow : cfg.bubble.r) * sN.f * sN.sc;
          ctx.font = fontSans(18, 500); const wN = ctx.measureText(t.id).width;
          const h = 19;
          if (t.lab === 'right') {
            const top = sN.y + 6 - 14;
            boxes.push({ x0: sN.x + rs + 6, x1: sN.x + rs + 18 + wN, y0: top - 6, y1: top + h + 6 });
            return;
          }
          const top = t.lab === 'above' ? sN.y - rs - 12 - 14 : sN.y + rs + 21 - 14;
          boxes.push({ x0: sN.x - wN / 2 - 6, x1: sN.x + wN / 2 + 6, y0: top - 6, y1: top + h + 6 });
        });
        ctx.font = fontMono(12, 500);
        const hitsBox = (sx, sy, ex, ey) => {
          let n = 0;
          for (const bx of boxes) for (let k = 0; k <= 8; k++) {
            const px = sx + (ex - sx) * k / 8, py = sy + (ey - sy) * k / 8;
            if (px > bx.x0 && px < bx.x1 && py > bx.y0 && py < bx.y1) { n++; break; }
          }
          return n;
        };
        const placed = [];
        const mode = cfg.edgeLabels;
        const wrapLabel = (text, maxW) => {
          if (ctx.measureText(text).width <= maxW) return [text];
          const lines = []; let cur = '';
          for (const part of text.split('_')) {
            const next = cur ? cur + '_' + part : part;
            if (!cur || ctx.measureText(next).width <= maxW) cur = next;
            else { lines.push(cur); cur = part; }
          }
          if (cur) lines.push(cur);
          return lines.length ? lines : [text];
        };
        for (const g of geo) {
          if (mode === 'none' || !(mode === 'all' || LABELLED[g.li]) || elAlpha * g.al <= 0.01) continue;
          const maxW = g.seg - AH - PAD;
          if (maxW < 24) continue;
          const lines = wrapLabel(g.type, maxW);
          const w = Math.max(...lines.map(line => ctx.measureText(line).width)), need = w + PAD;
          if (g.seg - AH <= need) continue;
          const free = g.seg - AH - need;
          let best = null, bestScore = Infinity;
          [0.5, 0.36, 0.64, 0.22, 0.78, 0.1, 0.9].forEach((t, k) => {
            const d = need / 2 + free * t, cx2 = g.x0 + g.ux * d, cy2 = g.y0 + g.uy * d;
            const sx = cx2 - g.ux * w / 2, sy = cy2 - g.uy * w / 2, ex = cx2 + g.ux * w / 2, ey = cy2 + g.uy * w / 2;
            let score = k * 0.01;
            for (const q of placed) if (segDist(sx, sy, ex, ey, q.sx, q.sy, q.ex, q.ey) < 14) score += 10;
            for (const o of geo) if (o !== g && segDist(sx, sy, ex, ey, o.x0, o.y0, o.x1, o.y1) < 7) score += 1;
            score += 4 * hitsBox(sx, sy, ex, ey);
            if (score < bestScore) { bestScore = score; best = { d, x: cx2, y: cy2, sx, sy, ex, ey }; }
          });
          placed.push(best);
          g.gap = [best.d - need / 2, best.d + need / 2];
          let ang = Math.atan2(g.uy, g.ux);
          if (ang > Math.PI / 2) ang -= Math.PI; else if (ang < -Math.PI / 2) ang += Math.PI;
          edgeJobs.push({ lines, x: best.x, y: best.y, ang, a: elAlpha * g.al });
        }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1.2;
        for (const g of geo) {
          const col = 'rgba(10,16,32,' + (0.5 * g.al).toFixed(3) + ')';
          const xe = g.x1 - g.ux * AH * 0.8, ye = g.y1 - g.uy * AH * 0.8;   // la línea muere en la base de la flecha
          ctx.strokeStyle = col;
          ctx.beginPath();
          if (g.gap) {
            ctx.moveTo(g.x0, g.y0); ctx.lineTo(g.x0 + g.ux * g.gap[0], g.y0 + g.uy * g.gap[0]);
            ctx.moveTo(g.x0 + g.ux * g.gap[1], g.y0 + g.uy * g.gap[1]); ctx.lineTo(xe, ye);
          } else { ctx.moveTo(g.x0, g.y0); ctx.lineTo(xe, ye); }
          ctx.stroke();
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(g.x1, g.y1);
          ctx.lineTo(g.x1 - g.ux * AH - g.uy * AW, g.y1 - g.uy * AH + g.ux * AW);
          ctx.lineTo(g.x1 - g.ux * AH + g.uy * AW, g.y1 - g.uy * AH - g.ux * AW);
          ctx.closePath(); ctx.fill();
        }
      }

      /* red: aristas (aparecen al final) */
      const netOn = net && p > 0.25;
      const np = net ? new Array(net.nodes.length) : null;
      if (netOn) {
        const camS = cam;
        const fellowWorld = wp[0], rF = cfg.bubble.rFellow * 0.62;
        for (let i = 0; i < net.nodes.length; i++) {
          const o = field.order[i], d = (o.k / 6) * 0.06 + o.q * 0.08;
          const tt = easeOut(span(p, 0.42 + d, 0.42 + d + 0.38));
          const j = jitter[i], tg = field.pos[i];
          const sx = fellowWorld[0] + j.x * rF, sy = fellowWorld[1] + j.y * rF, sz = fellowWorld[2] + j.z * rF;
          const x = lerp(sx, tg.x, tt), z = lerp(sz, tg.z, tt);
          const y = lerp(sy, tg.y, tt) + Math.sin(Math.PI * tt) * 0.2 * j.lift;
          np[i] = project(x, y, z, camS, { x: 0, y: 0, z: 0, f: 1 });
          np[i].t = tt;
        }
        const ea = smooth(0.8, 1, p);
        if (ea > 0.01 && edges) {
          ctx.strokeStyle = H.edgeColor; ctx.globalAlpha = ea; ctx.lineWidth = 0.9;
          ctx.beginPath();
          for (const [s, t] of net.edges) { ctx.moveTo(np[s].x, np[s].y); ctx.lineTo(np[t].x, np[t].y); }
          ctx.stroke(); ctx.globalAlpha = 1;
        }
      }

      /* query path · thick accent trace before the bubbles */
      if (pathE.size && edges) {
        ctx.save();
        ctx.strokeStyle = 'rgba(27,77,255,.92)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(27,77,255,.38)';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        for (const [a, b, type] of L) {
          if (!pathE.has(type) || !screen[a] || !screen[b]) continue;
          ctx.moveTo(screen[a].x, screen[a].y);
          ctx.lineTo(screen[b].x, screen[b].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      /* burbujas, de atrás hacia adelante */
      const order = TYPES.map((t, i) => i).sort((a, b) => screen[b].z - screen[a].z);
      const burst = easeOut(span(p, 0.4, 0.52));
      const plateOut = 1 - smooth(0.26, 0.4, p);
      const dotsIn = smooth(0.26, 0.4, p);
      const drawDots = (inBubble) => {
        if (!netOn) return;
        const ord = np.map((q, i) => i).sort((a, b) => np[b].z - np[a].z);
        for (const i of ord) {
          const q = np[i], n = net.nodes[i];
          const rF = (2.4 + Math.min(5.4, Math.sqrt(net.deg[i]) * 0.66)) * q.f;
          const rr = lerp(1.3, rF, easeOut(q.t));
          ctx.globalAlpha = (inBubble ? dotsIn : 1) * depthFade(q.f) * (0.85 + 0.15 * q.t);
          ctx.fillStyle = H.nodeColor ? H.nodeColor(n, i) : '#0a1020';
          ctx.beginPath(); ctx.arc(q.x, q.y, rr, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      };
      for (const i of order) {
        const s = screen[i];
        if (i === 0) {
          const inside = p > 0 && p < 0.42 ? () => drawDots(true) : null;
          drawBubble(0, s, (reveal[0]) * (1 + 0.45 * burst), s.a * (1 - burst), plateOut, inside, 1);
        } else {
          drawBubble(i, s, reveal[i] * (1 - collapse[i]), s.a * (1 - collapse[i] * 0.7), 1, null, 1 - collapse[i]);
        }
      }
      if (netOn && p >= 0.42) drawDots(false);

      /* rings around the query path */
      if (pathN.size) {
        ctx.save();
        ctx.strokeStyle = 'rgba(27,77,255,.95)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(27,77,255,.40)';
        ctx.shadowBlur = 12;
        for (const id of pathN) {
          const i = TI.get(id);
          if (i == null) continue;
          const s = screen[i];
          const rs = (i === 0 ? cfg.bubble.rFellow : cfg.bubble.r) * s.f * s.sc * reveal[i] + 6;
          ctx.beginPath();
          ctx.arc(s.x, s.y, rs, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      /* tipos de relación */
      for (const j of edgeJobs) {
        ctx.save(); ctx.translate(j.x, j.y); ctx.rotate(j.ang);
        ctx.textBaseline = 'middle';
        const lh = 12, y0 = -(j.lines.length - 1) * lh / 2;
        j.lines.forEach((line, k) => haloText(line, 0, y0 + k * lh + 0.5, fontMono(12, 500), 'rgba(10,16,32,.72)', j.a));
        ctx.restore();
      }
      ctx.textBaseline = 'alphabetic';

      /* etiquetas de tipo */
      const la = (labels ? 1 : 0) * (1 - smooth(0, 0.12, p));
      if (la > 0.01) {
        for (const i of order) {
          const t = TYPES[i], s = screen[i];
          const a = la * smooth(0.75, 1, reveal[i]) * s.a;
          if (a <= 0.01) continue;
          const rs = (i === 0 ? cfg.bubble.rFellow : cfg.bubble.r) * s.f * s.sc;
          let x = s.x, y = t.lab === 'above' ? s.y - rs - 12 : s.y + rs + 21;
          if (t.lab === 'right') { x = s.x + rs + 12; y = s.y + 6; ctx.textAlign = 'left'; }
          haloText(t.id, x, y, fontSans(18, 500), '#0a1020', a);
          ctx.textAlign = 'center';
        }
        const ga = la * (buildDone ? 1 : smooth(0.6, 1, reveal[MAX_DEPTH === 0 ? 0 : 1]));
        if (cfg.groups) for (const [name, id, side] of GROUPS) {
          const i = TI.get(id), s = screen[i];
          const rs = cfg.bubble.r * s.f * s.sc * reveal[i];
          const a = ga * smooth(0.75, 1, reveal[i]) * s.a;
          if (side === 'left') {
            ctx.textAlign = 'right';
            haloText(name, s.x - rs - 14, s.y + 5, fontSans(16, 400), 'rgba(10,16,32,.70)', a);
            ctx.textAlign = 'center';
          } else {
            haloText(name, s.x, s.y - rs - 16, fontSans(16, 400), 'rgba(10,16,32,.70)', a);
          }
        }
      }

      /* etiquetas de campo (aterrizaje) */
      if (netOn && field && labels) {
        const fa = smooth(0.86, 1, p);
        if (fa > 0.01) H.fieldLabels.forEach((name, k) => {
          const c = field.centers[k]; if (!c || !c.n) return;
          const s = project(c.x, c.y, c.z, cam, {});
          let top = s.y;
          for (let k2 = 0; k2 < 12; k2++) {
            const a2 = (k2 / 12) * TAU, q = project(c.x + c.rad * Math.cos(a2), 0, c.z + c.rad * Math.sin(a2), cam, {});
            if (q.y < top) top = q.y;
          }
          haloText(name, s.x, top - 16, fontSans(16, 500), '#0a1020', fa);
        });
      }

      /* primer frame: si el deck pidió beat 2 de inmediato, aterrizar sin animar */
      if (frames === 1 && pTarget === 1 && p < 1) {
        p = 1; buildDone = true;
        if (cfg.onProgress) cfg.onProgress(1);
        window.SCENE_HANDOFF = Object.assign({ layout: 'field' }, cfg.handoff.camera);
      }
    }

    raf = requestAnimationFrame(frame);

    const scene = {
      beat(n) {
        const target = n >= cfg.handoff.beat ? 1 : 0;
        if (frames === 0 && target === 1) { buildDone = true; }
        pTarget = target;
      },
      nudge(dYaw, dPitch) { if (p > 0) return; userYaw += dYaw || 0; userPitch += dPitch || 0; pauseUntil = performance.now() + 2400; },
      toggleLabels() { labels = !labels; },
      toggleEdges() { edges = !edges; },
      setSourceLogos(on) { sourcesOn = !!on; },
      nodeScreen(id) {
        const i = TI.get(id); if (i == null || !W || !Hh) return null;
        const b = canvas.getBoundingClientRect(), k = b.width / W, s = screen[i];
        return { x: b.left + s.x * k, y: b.top + s.y * k };
      },
      toggleOrbit() { orbit = !orbit; },
      setLogo(id, src) { return loadLogo(id, src); },
      setPath(nodes, links) {
        pathN = new Set(nodes || []);
        pathE = new Set(links || []);
      },
      hitTest(clientX, clientY) {
        const b = canvas.getBoundingClientRect(), k = canvas.offsetWidth / (b.width || 1);
        const x = (clientX - b.left) * k, y = (clientY - b.top) * k;
        let best = null, bd = Infinity;
        TYPES.forEach((t, i) => {
          const s = screen[i], rs = (i === 0 ? cfg.bubble.rFellow : cfg.bubble.r) * s.f * (s.sc || 1);
          const d = Math.hypot(x - s.x, y - s.y);
          if (d < rs * 1.4 && d < bd) { bd = d; best = t.id; }
        });
        return best;
      },
      get progress() { return p; },
      destroy() {
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('wheel', onWheel);
        for (const el of fades) el.style.opacity = '';
        if (ownCanvas) canvas.remove();
        if (api.active === scene) api.active = null;
      },
    };
    return scene;
  }

  /* ───────────── registro en el deck ───────────── */
  let current = null;
  const api = {
    config, TYPES, LINKS, ICONS,
    active: null,
    setLogo(id, src) { config.logos[id] = src; return loadLogo(id, src); },
    setPath(nodes, links) { if(current) current.setPath(nodes, links); },
    setSourceLogos(on) { if(current) current.setSourceLogos(on); },
    nodeScreen(id) { return current ? current.nodeScreen(id) : null; },
    mount(el) { if (current) current.destroy(); current = createScene(el); api.active = current; return current; },
  };
  window.Schema3D = api;
  const warm = () => { renderGlass(config.bubble.sprite, INK, false); renderGlass(config.bubble.sprite, ACCENT, true); };
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 600);
  window.SCENES = window.SCENES || {};
  window.SCENES[config.slug] = {
    mount(el) { api.mount(el); },
    beat(n) { if (current) current.beat(n); },
    destroy() { if (current) { current.destroy(); current = null; } },
  };
})();
