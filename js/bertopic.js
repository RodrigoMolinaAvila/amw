/* =========================================================================
   OE2 · BERTopic · scrollytelling horizontal con escena 3D compartida.

   PRINCIPIO: no hay nueve gráficos distintos. Hay UNA nube de puntos que
   atraviesa el framework completo y se reorganiza en cada paso. Lo que se ve
   moverse entre un paso y el siguiente es el mismo corpus cambiando de
   representación, que es exactamente lo que hace BERTopic.

   El stick derecho rota la cámara de esa escena en los dos ejes.

   FUENTE DE TODO ESTE ARCHIVO: la memoria, capítulos 5.4 y 5.4.1, capítulo
   7.1 y Anexo A.3. Las fórmulas están transcritas literalmente de A.3.1 a
   A.3.5. Ningún número es inventado.

   Lo único esquemático es la GEOMETRÍA de la nube y de la superficie: las
   posiciones de los puntos no son las coordenadas UMAP reales ni los trials
   reales de Optuna. Mientras BT_NUBE y BT_TRIALS estén en null, la escena
   lleva su rótulo en pantalla. Las proporciones sí son reales: el 56,3% de
   ruido de la primera pasada de HDBSCAN es el que reporta la memoria.
   ========================================================================= */

window.VIZ = window.VIZ || {};

/* ---- 1 · corpus · memoria 7.1 y A.3.1 -------------------------------- */

const BT_CORPUS = {
  documentos:    28438,   // corpus completo sobre el que corrió BERTopic
  publicaciones: 26071,   // de ellos, nodos Publication en el grafo
  conTopico:     25183,   // con tópico asignado · relación HAS_TOPIC
  sinAbstract:     888,   // sin abstract, por tanto sin HAS_TOPIC
  topicos:         237,   // K final, tras la fusión semántica
  topicosPrevios:  274,   // antes de la fusión
  minCaracteres:    15
};

/* ---- 2 · hiperparámetros · memoria 5.4.1 y Anexo A.3 ----------------- */

const BT_HP = {
  embed: {
    modelo:    'paraphrase-multilingual-MiniLM-L12-v2',
    familia:   'Sentence-BERT · siamese network on BERT',
    dimension: 384
  },
  umap: {
    n_neighbors:  17,
    min_dist:     0.525,
    n_components: 5,
    metric:       'cosine'
  },
  hdbscan: {
    min_cluster_size:     24,
    min_samples:          15,
    ruidoPrimeraPasada:   56.3,   // % de documentos sin asignar · 5.4.1
    topicosPrimeraPasada: 274
  },
  optuna: {
    muestreador: 'Tree-structured Parzen Estimator (TPE)',
    podador:     'MedianPruner on relative_validity_',
    objetivo:    'coherencia c_v sobre las 10 palabras más representativas',
    mejor:       0.692,
    espacio:     'n_neighbors · min_dist · min_cluster_size · min_samples'
  },
  outliers: {
    estrategia: 'reduce_outliers · estrategia embeddings',
    espacio:    'ℝ³⁸⁴, the original space',
    residual:   0                 // la categoría −1 desaparece del corpus
  },
  ctfidf: {
    top_n_words: 10,
    ngram_range: '(1, 2)',
    min_df:      10,
    stopwords:   'bilingual, enriched with corpus terms'
  },
  fusion: {
    modelo:          'mDeBERTa-v3 · MNLI + XNLI',
    umbralCos:       0.55,
    umbralNLI:       0.60,
    iteraciones:     2,
    paresFusionados: 37
  },
  validacion: {
    silueta:     0.0344,
    siluetaNula: '−0,198 ± 0,016',
    ami:         0.329,
    amiNula:     '0,0001 ± 0,0005',
    p:           '< 0,0001'
  }
};

/* RECONSTRUCCIÓN. Los runs originales están en otro equipo, así que las
   coordenadas UMAP y la traza de Optuna se reconstruyen acá a partir de lo
   que la memoria sí reporta. Lo que es real y lo que es reconstruido:

     real ......... los 237 topics, sus tamaños (Anexo H, suman 25.183),
                    sus palabras c-TF-IDF, el 56,3% de ruido inicial, los
                    hiperparámetros óptimos y c_v = 0.692
     reconstruido . la POSICIÓN de cada punto en el espacio y la POSICIÓN de
                    cada trial en el plano de búsqueda

   La reconstrucción es determinista (semilla fija) y respeta la estructura
   reportada: 237 clústeres de tamaño proporcional al real, separación
   compatible con min_dist = 0,525 y compacidad compatible con
   n_neighbors = 17. El rótulo en pantalla lo declara. */
const BT_RECONSTRUIDO = true;

/* ---- 3 · los nueve pasos del framework -------------------------------
   La memoria describe dos etapas que no estaban en el guion original y que
   son las que explican el resultado: la reasignación de outliers (sin ella
   quedaría un 56,3% sin tópico) y la fusión semántica (sin ella serían 274
   topics y no 237). Van incluidas.                                      */

const BT_PASOS = [
  { id:'datos', k:'01', t:'Data', corto:'Data', escena:'datos',
    sub:'where the text comes from',
    formula:'$$d_i = t_i \\oplus a_i \\oplus k_i$$',
    pie:'Title ⊕ abstract ⊕ keywords. Minimum-length filter \\(|d_i| > 15\\) characters.' },

  { id:'embed', k:'02', t:'Sentence Transformers', corto:'SBERT', escena:'embed',
    sub:'text → dense vector',
    formula:'$$\\varphi : D \\to \\mathbb{R}^{384}, \\qquad \\varphi(d_i) = x_i$$'
          + '$$\\mathrm{sim}(d_i, d_j) = \\frac{x_i \\cdot x_j}{\\lVert x_i \\rVert\\, \\lVert x_j \\rVert}$$',
    pie:'Two documents about the same problem with different wording produce nearby vectors.' },

  { id:'umap', k:'03', t:'UMAP', corto:'UMAP', escena:'umap',
    sub:'dimensionality reduction',
    formula:'$$w(i,j) = \\exp\\!\\left(-\\frac{d(x_i,x_j) - \\rho_i}{\\sigma_i}\\right)$$'
          + '$$\\psi : \\mathbb{R}^{384} \\to \\mathbb{R}^{5}, \\qquad \\psi(x_i) = \\tilde{x}_i$$',
    pie:'\\(d(\\cdot,\\cdot)\\) is cosine distance, \\(\\rho_i\\) the distance to the nearest neighbour and \\(\\sigma_i\\) a local normalisation.' },

  { id:'hdbscan', k:'04', t:'HDBSCAN', corto:'HDBSCAN', escena:'clusters',
    sub:'density, hierarchy and noise',
    formula:'$$d_{\\mathrm{mreach}}(\\tilde{x}_i, \\tilde{x}_j) = \\max\\{\\mathrm{core}_k(\\tilde{x}_i),\\, \\mathrm{core}_k(\\tilde{x}_j),\\, d(\\tilde{x}_i, \\tilde{x}_j)\\}$$'
          + '$$\\tau(\\tilde{x}_i) = \\begin{cases} c_k & \\tilde{x}_i \\in C_k \\\\[2pt] -1 & \\text{noise} \\end{cases}$$',
    pie:'The distance between two points is corrected by neighbourhood density. What falls outside every dense region gets \\(-1\\): 56.3% of the corpus on the first pass.' },

  { id:'optuna', k:'05', t:'Optuna', corto:'Optuna', escena:'valle',
    sub:'hyperparameter search',
    formula:'$$\\theta^{*} = \\arg\\max_{\\theta}\\; c_v(\\theta)$$'
          + '$$\\theta = (\\texttt{n\\_neighbors},\\; \\texttt{min\\_dist},\\; \\texttt{min\\_cluster\\_size},\\; \\texttt{min\\_samples})$$',
    pie:'Two-level pruning: first relative_validity_, then full \\(c_v\\) only for the survivors.' },

  { id:'outliers', k:'06', t:'Reassignment', corto:'Outliers', escena:'reasignacion',
    sub:'the 56.3% left outside',
    formula:'$$\\tau^{*}(x_i) = \\arg\\min_{k \\in T} d_{\\cos}(x_i, \\mu_k), \\qquad \\mu_k = \\frac{1}{|C_k|}\\sum_{x_j \\in C_k} x_j$$',
    pie:'It operates on \\(\\mathbb{R}^{384}\\), the original space, not the reduced one.' },

  { id:'ctfidf', k:'07', t:'c-TF-IDF', corto:'c-TF-IDF', escena:'terminos',
    sub:'what defines each group',
    formula:'$$\\text{c-TF-IDF}(w, C_k) = \\frac{f_{w,k}}{A_k} \\cdot \\log\\!\\left(1 + \\frac{\\bar{A}}{\\sum_j f_{w,j}}\\right)$$',
    pie:'Each topic is a meta-document. The left term normalises local frequency; the log penalises terms spread across many topics.' },

  { id:'fusion', k:'08', t:'Semantic fusion', corto:'Fusion', escena:'fusion',
    sub:'274 topics become 237',
    formula:'$$\\cos(\\mu_i, \\mu_j) > 0{,}55 \\;\\longrightarrow\\; P_{\\text{entail}}(i \\leftrightarrow j) \\geq 0{,}60$$',
    pie:'Cosine similarity between centroids as a filter, bidirectional entailment as the criterion.' }
];

/* =========================================================================
   MOTOR 3D · proyección en perspectiva sobre canvas.
   Sin dependencias: la rotación es una matriz de dos ángulos y la
   profundidad ordena el trazado. Determinista: la misma nube en cada pasada.
   ========================================================================= */

function btRng(semilla){                    // mulberry32
  let a = semilla >>> 0;
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const BT_CAM = { yaw:-0.58, pitch:0.34, dist:3.2, base:{ yaw:-0.58, pitch:0.34 } };

function btProyectar(p, cam, cx, cy, esc){
  const cyw = Math.cos(cam.yaw),   syw = Math.sin(cam.yaw);
  const cpt = Math.cos(cam.pitch), spt = Math.sin(cam.pitch);
  const x1 = p.x * cyw - p.z * syw;
  const z1 = p.x * syw + p.z * cyw;
  const y2 = p.y * cpt - z1 * spt;
  const z2 = p.y * spt + z1 * cpt;
  const f  = cam.dist / (cam.dist + z2);
  return { sx: cx + x1 * f * esc, sy: cy - y2 * f * esc, z: z2, f };
}

const BT_VIR = ['#440154','#482475','#414487','#355f8d','#2a788e',
                '#21918c','#27ad81','#5cc863','#aadc32','#fde725'];
const btColor = t => BT_VIR[Math.max(0, Math.min(9, Math.round(t * 9)))];
const BT_GRIS = '#9aa6b8';

/* =========================================================================
   LAS ESCENAS · cada una asigna a cada punto un destino y un color.
   El punto es siempre el mismo: lo que cambia es dónde está y de qué grupo
   se lo considera. Esa continuidad es el argumento visual.
   ========================================================================= */

const BT_N = 3000;                                          // puntos dibujados

/* Geometría del diagrama del coseno en la escena 02. Vive acá y no dentro de
   la escena porque los rótulos se posicionan con los mismos números. */
/* oy sube de -1,02 a -0,28: a la altura anterior el diagrama del coseno
   quedaba por debajo del borde inferior del lienzo —se veían los vectores
   cortados y el rótulo no aparecía—. ox se corre a la izquierda para que no
   se meta bajo la matriz de componentes. */
const BT_COS = { ox:-0.30, oy:-0.66, L:0.42, a1:1.02, a2:0.34, NV:26, N:78 };
const BT_RUIDO = BT_HP.hdbscan.ruidoPrimeraPasada / 100;    // 0,563 · dato real

/* Reparto de los 3.000 puntos entre los 237 topics, proporcional a su
   tamaño real del Anexo H. Los topics pequeños conservan al menos un punto,
   de modo que los 237 existen en la escena. */
function btCupos(){
  const tot = BT_TOPICOS_N;
  const crudo = BT_TOPICOS.map(t => (t[2] / tot) * (BT_N - BT_TOPICOS.length));
  const cupos = crudo.map(v => 1 + Math.floor(v));
  let resto = BT_N - cupos.reduce((a, b) => a + b, 0);
  const frac = crudo.map((v, i) => [i, v - Math.floor(v)]).sort((a, b) => b[1] - a[1]);
  for(let k = 0; resto > 0; k = (k + 1) % frac.length, resto--) cupos[frac[k][0]]++;
  return cupos;
}

/* Centros de los 237 topics. Se siembran en una esfera y se relajan con
   repulsión: produce el archipiélago típico de una proyección UMAP con
   min_dist alto, sin ser una simulación del algoritmo. */
function btCentros(r){
  const K = BT_TOPICOS.length, C = [];
  for(let k = 0; k < K; k++){
    const u = 2 * r() - 1, a = r() * Math.PI * 2, rad = Math.cbrt(r());
    const sp = Math.sqrt(1 - u * u);
    C.push({ x: rad * sp * Math.cos(a), y: rad * u * .78, z: rad * sp * Math.sin(a) });
  }
  // relajación: min_dist = 0,525 se traduce en clústeres bien despegados
  const SEP = 0.155;
  for(let paso = 0; paso < 60; paso++){
    for(let i = 0; i < K; i++) for(let j = i + 1; j < K; j++){
      const a = C[i], b = C[j];
      let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      let d = Math.hypot(dx, dy, dz) || 1e-6;
      if(d < SEP){
        const f = (SEP - d) / d * .5;
        dx *= f; dy *= f; dz *= f;
        a.x -= dx; a.y -= dy; a.z -= dz;
        b.x += dx; b.y += dy; b.z += dz;
      }
    }
  }
  return C;
}

function btConstruirPuntos(){
  const r = btRng(20260825);
  const K = BT_TOPICOS.length;
  const centros = btCentros(r);
  const cupos = btCupos();
  // los 37 pares fusionados: se toman los 37 pares de centros más cercanos
  const pares = [];
  const usado = new Uint8Array(K);
  const dist = [];
  for(let i = 0; i < K; i++) for(let j = i + 1; j < K; j++)
    dist.push([Math.hypot(centros[j].x - centros[i].x, centros[j].y - centros[i].y,
                          centros[j].z - centros[i].z), i, j]);
  dist.sort((a, b) => a[0] - b[0]);
  for(const [, i, j] of dist){
    if(pares.length >= BT_HP.fusion.paresFusionados) break;
    if(usado[i] || usado[j]) continue;
    usado[i] = usado[j] = 1; pares.push([j, i]);       // j se absorbe en i
  }
  const aDonde = new Int16Array(K); for(let k = 0; k < K; k++) aDonde[k] = k;
  pares.forEach(([de, a]) => { aDonde[de] = a; });

  const pts = [];
  for(let k = 0; k < K; k++){
    const c = centros[k], n = cupos[k], t = BT_TOPICOS[k];
    // compacidad: un tópico grande ocupa más volumen, pero sublinealmente
    const disp = 0.030 + 0.052 * Math.sqrt(t[2] / BT_TOPICOS[0][2]);
    const kf = aDonde[k], cf = centros[kf];
    for(let m = 0; m < n; m++){
      pts.push({
        k, c, cf, disp, topico: t,
        ruido: r() < BT_RUIDO,
        t:  k / (K - 1),
        tFusion: kf / (K - 1),
        x:0, y:0, z:0, dx:0, dy:0, dz:0,
        col:'#355f8d', dcol:'#355f8d', rad:1.6, drad:1.6, alfa:1, dalfa:1,
        a:r(), b:r(), cc:r(), d:r()
      });
    }
  }
  return pts;
}

const _o = { x:0, y:0, z:0 };

/* Coloca un punto alrededor de un centro, con la dispersión dada */
function btAlrededor(p, c, disp){
  const ang = p.a * Math.PI * 2, el = Math.acos(2 * p.cc - 1);
  const rr = Math.cbrt(p.b) * disp;
  _o.x = c.x + rr * Math.sin(el) * Math.cos(ang);
  _o.y = c.y + rr * Math.sin(el) * Math.sin(ang) * .85;
  _o.z = c.z + rr * Math.cos(el);
}

/* Etiquetas de texto que cada escena dibuja en el espacio 3D.
   Se llenan desde la escena y se pintan con la misma proyección. */
let BT_TEXTOS = [];

const BT_ESCENAS = {

  /* 01 · el corpus: documentos apilados en planos paralelos */
  datos(pts){
    BT_TEXTOS = [
      { hud:true, fx:.5, fy:.12, txt:'title \u2295 abstract \u2295 keywords', tam:15, col:'faint', anclaje:'center' },
      /* Los conteos y el filtro salieron de la escena: ya están en el panel
         de la izquierda, y repetirlos encima del dibujo era ruido. */
    ];
    /* PALABRAS EN LA NUBE. Cada punto es un documento —eso no cambia, y
       decir otra cosa sería falso—, pero una nube de puntos azules no se lee
       como texto. Se siembran cuarenta términos reales del corpus, tomados
       de las representaciones c-TF-IDF de los topics mayores, repartidos
       entre los planos de documentos. Giran con la nube porque están
       ancladas en el espacio y no en la pantalla: se ve que el volumen está
       hecho de lenguaje, que es exactamente lo que el paso afirma. */
    (() => {
      const voc = [];
      for(const t of BT_TOPICOS){
        for(const w of t[1].split(',')){
          const x = w.trim();
          if(x && x.length > 3 && !voc.includes(x)) voc.push(x);
          if(voc.length >= 40) break;
        }
        if(voc.length >= 40) break;
      }
      let sd = 4211 >>> 0;
      const rnd = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
      voc.forEach(w => BT_TEXTOS.push({
        txt: w,
        x: (rnd() - .5) * 1.66,
        y: (rnd() - .5) * 1.22,
        z: (rnd() - .5) * .40,
        tam: 11 + rnd() * 5,
        col: 'faint', anclaje: 'center'
      }));
    })();
    const COLS = 40, PLANOS = 2, FIL = Math.ceil(pts.length / PLANOS / COLS);
    pts.forEach((p, i) => {
      const plano = i % PLANOS, j = Math.floor(i / PLANOS);
      p.dx = ((j % COLS) / (COLS - 1) - .5) * 1.6;
      p.dy = (Math.floor(j / COLS) / (FIL - 1) - .5) * 1.2;
      p.dz = (plano - .5) * .36 + (p.a - .5) * .03;
      const sinAbs = p.d < BT_CORPUS.sinAbstract / BT_CORPUS.publicaciones;
      p.dcol  = sinAbs ? BT_GRIS : '#2a788e';
      p.drad  = sinAbs ? 1.2 : 1.9;
      p.dalfa = sinAbs ? .35 : .95;
    });
  },

  /* 02 · SBERT: las palabras se convierten en un vector.
     Izquierda, las palabras reales de un tópico del corpus, una por plano de
     profundidad; derecha, las 384 celdas del vector, 24 × 16, coloreadas por
     el valor de la componente. En el medio, la 512-token window. */
  embed(pts){
    const D = 384, COLS = 24, FILS = 16;          // 24 × 16 = 384 exacto
    const XV = .58, XW = -.92;                    // x del vector y de las palabras
    // un tópico real del corpus como ejemplo
    const ej = BT_TOPICOS[1];                     // segundo por tamaño
    const palabras = ej[1].split(',').map(w => w.trim());

    BT_TEXTOS = palabras.map((w, i) => ({
      txt: w,
      x: XW,
      y: (.5 - i / (palabras.length - 1)) * .76,
      z: 0,
      tam: 21,
      col: '#0a1020',
      anclaje: 'right'
    }));
    BT_TEXTOS.push({ txt:'512-token window', x:XW, y:-.60, z:0, tam:15,
                     col:'faint', anclaje:'right', mono:true });
    BT_TEXTOS.push({ txt:'words in topic ' + ej[0], x:XW, y:.68, z:0, tam:15,
                     col:'faint', anclaje:'right' });
    BT_TEXTOS.push({ txt:'24 × 16 = 384 components', x:XV, y:-.60, z:0, tam:15,
                     col:'faint', anclaje:'center', mono:true });
    BT_TEXTOS.push({ txt:'x\u1d62 \u2208 \u211d\u00b3\u2078\u2074', x:XV, y:.68, z:0, tam:20,
                     col:'ink', anclaje:'center' });
    BT_TEXTOS.push({ txt:'MiniLM-L12-v2 \u00b7 multilingual', x:XV, y:-.76, z:0, tam:14,
                     col:'faint', anclaje:'center', mono:true });
    /* EL COSENO, DIBUJADO. Decir «la cercanía es similitud coseno» en un
       rótulo no muestra nada: el coseno es un ángulo, y un ángulo se dibuja.
       Abajo a la derecha se traza el diagrama de la métrica —dos vectores
       desde un origen común y el arco entre ellos— con puntos del mismo
       sistema, así que gira con la escena. No son datos: es la definición,
       y por eso los vectores se rotulan xᵢ y xⱼ y no con documentos reales. */
    BT_TEXTOS.push({ txt:'x\u1d62', x:BT_COS.ox + Math.cos(BT_COS.a1) * BT_COS.L + .06,
                     y:BT_COS.oy + Math.sin(BT_COS.a1) * BT_COS.L + .04, z:0,
                     tam:17, col:'ink', anclaje:'left' });
    BT_TEXTOS.push({ txt:'x\u2c7c', x:BT_COS.ox + Math.cos(BT_COS.a2) * BT_COS.L + .06,
                     y:BT_COS.oy + Math.sin(BT_COS.a2) * BT_COS.L - .02, z:0,
                     tam:17, col:'ink', anclaje:'left' });
    BT_TEXTOS.push({ txt:'\u03b8', x:BT_COS.ox + Math.cos((BT_COS.a1 + BT_COS.a2) / 2) * .26,
                     y:BT_COS.oy + Math.sin((BT_COS.a1 + BT_COS.a2) / 2) * .26, z:0,
                     tam:16, col:'neg', anclaje:'center' });
    /* El pie del diagrama va anclado al lienzo (hud) y no al espacio: en
       coordenadas de mundo quedaba tapado por la nube de palabras o fuera del
       borde inferior, según dónde estuviera el diagrama. */
    /* El pie del diagrama se eliminó: no hay lugar donde ponerlo sin que lo
       tape la nube de palabras, la matriz de componentes o el borde inferior
       del lienzo. Lo que decía ya está dicho en la columna de la izquierda
       —«dos documentos que abordan el mismo problema con terminología distinta
       producen vectores próximos»— y el dibujo se explica con xᵢ, xⱼ y θ. */

    pts.forEach((p, i) => {
      if(i >= pts.length - BT_COS.N){             // el diagrama del coseno
        const k = i - (pts.length - BT_COS.N);
        const C = BT_COS;
        let ax, ay, col, rad;
        if(k < C.NV){                              // el primer vector
          const u = k / (C.NV - 1);
          ax = C.ox + Math.cos(C.a1) * C.L * u;
          ay = C.oy + Math.sin(C.a1) * C.L * u;
          col = '#21918c'; rad = 2.4;
        } else if(k < C.NV * 2){                   // el segundo
          const u = (k - C.NV) / (C.NV - 1);
          ax = C.ox + Math.cos(C.a2) * C.L * u;
          ay = C.oy + Math.sin(C.a2) * C.L * u;
          col = '#414487'; rad = 2.4;
        } else {                                   // el arco del ángulo
          const u = (k - C.NV * 2) / (C.N - C.NV * 2 - 1);
          const a = C.a2 + (C.a1 - C.a2) * u;
          ax = C.ox + Math.cos(a) * .23;
          ay = C.oy + Math.sin(a) * .23;
          col = '#d0103c'; rad = 1.5;
        }
        p.dx = ax; p.dy = ay; p.dz = 0;
        p.dcol = col; p.drad = rad; p.dalfa = .95; p.fijo = 1;
      }
      else if(i < D){                              // las 384 componentes
        const cx = i % COLS, cy = Math.floor(i / COLS);
        p.dx = XV + (cx / (COLS - 1) - .5) * .62;
        p.dy = (.5 - cy / (FILS - 1)) * .84;
        p.dz = 0;
        // mitad oscura de viridis: a 3-7 m de distancia el extremo claro no se lee
        p.dcol  = btColor(.05 + .58 * p.a);
        p.drad  = 6.0;
        p.dalfa = 1;
        p.fijo  = 1;
      } else {
        /* EL TRAYECTO. Antes el flujo era una banda difusa entre la columna
           de palabras y el vector: se veía que algo iba de izquierda a
           derecha, pero no QUÉ iba ni DESDE DÓNDE. Ahora cada partícula
           pertenece a una palabra concreta, sale exactamente de su altura y
           converge a una componente concreta del vector. La lectura pasa a
           ser la correcta: cada palabra empuja todas las componentes, y el
           vector es el resultado de todas las palabras a la vez.

           El avance es propio de cada partícula y cíclico, así que el cauce
           se mantiene poblado en vez de vaciarse. */
        const j  = i - D;
        const NP = palabras.length;
        const fila = j % NP;                        // de qué palabra sale
        const meta = (j * 7919) % D;                // a qué componente llega
        /* La fase es propia y fija de cada partícula, no del reloj: la
           escena se calcula una vez al entrar al beat y los puntos se
           acomodan solos. Con performance.now() acá el cauce cambiaría de
           forma entre el montaje y el primer repintado. */
        const u  = Math.pow(p.a, .78);

        const y0 = (.5 - fila / (NP - 1)) * .76;    // altura de la palabra
        const mx = XV + ((meta % COLS) / (COLS - 1) - .5) * .62;
        const my = (.5 - Math.floor(meta / COLS) / (FILS - 1)) * .84;

        p.dx = (XW + .26) + u * (mx - XW - .26);
        p.dy = y0 + u * (my - y0);
        // el cauce se abomba en el medio: sin esto son rectas paralelas y no
        // se ve que cada palabra alimenta a todo el vector
        p.dz = Math.sin(u * Math.PI) * ((p.cc - .5) * .52);
        p.dy += Math.sin(u * Math.PI) * (p.b - .5) * .10;

        const cerca = Math.pow(u, 2.2);
        p.dcol  = btColor(.05 + .58 * (meta / D));
        p.drad  = 1.3 + 2.6 * cerca;
        p.dalfa = (.24 + .62 * cerca) * Math.sin(Math.min(1, u * 1.15) * Math.PI) ** .35;
      }
    });
  },

  /* 03 · UMAP: ℝ³⁸⁴ → ℝ⁵. Emerge la variedad, todavía sin etiquetas */
  umap(pts){
    BT_TEXTOS = [
      { hud:true, fx:.5, fy:.05, txt:'\u211d\u00b3\u2078\u2074 \u2192 \u211d\u2075', tam:22, col:'ink', anclaje:'center' },

      { hud:true, fx:.02, fy:.24, txt:'n_neighbors = 17', tam:14, col:'faint', anclaje:'left', mono:true },
      { hud:true, fx:.02, fy:.30, txt:'min_dist = 0.525', tam:14, col:'faint', anclaje:'left', mono:true },
      { hud:true, fx:.02, fy:.36, txt:'metric = cosine',  tam:14, col:'faint', anclaje:'left', mono:true },

    ];
    pts.forEach(p => {
      btAlrededor(p, p.c, p.ruido ? p.disp * 3.4 : p.disp);
      p.dx = _o.x; p.dy = _o.y; p.dz = _o.z;
      p.dcol = '#355f8d'; p.drad = 1.7; p.dalfa = .82;
    });
  },

  /* 04 · HDBSCAN: mismas posiciones, ahora con etiqueta.
     El 56,3% que la memoria reporta como ruido queda en gris. */
  clusters(pts){
    BT_ESCENAS.umap(pts);
    // se rotulan los tres topics mayores, que son los que dominan el corpus
    /* Se rotulan los seis topics mayores. Los rótulos anclados se separan
       solos al proyectarse, así que ya no se pisan al rotar. */
    BT_TEXTOS = BT_TOPICOS.slice(0, 6).map((t, k) => ({
      txt: t[1].split(',').slice(0, 2).join(',') + '  ·  ' + t[2].toLocaleString('en-US'),
      x:0, y:0, z:0, tam:14.5, col:'ink', anclaje:'center', centro:k
    }));
    BT_TEXTOS.push(
      { hud:true, fx:.5, fy:.05, txt:'274 word clusters', tam:22, col:'ink', anclaje:'center' });
    pts.forEach(p => {
      p.dcol  = p.ruido ? BT_GRIS : btColor(p.t);
      p.drad  = p.ruido ? 1.1 : 2.2;
      p.dalfa = p.ruido ? .26 : .96;
    });
  },

  /* 05 · Optuna: la superficie del objetivo sobre el plano de búsqueda.
     c_v se MAXIMIZA, de modo que el óptimo es la cumbre. Ejes reales:
     min_dist de 0 a 0,8 en x y n_neighbors de 10 a 40 en z, como la
     figura 5.1 de la memoria. El óptimo marcado es el reportado. */
  valle(pts){
    const nx = v => ((v - 0.40) / 0.80) * 2.72;        // min_dist   → x
    const nz = v => ((v - 25) / 30) * 2.72;            // n_neighbors → z
    const OX = nx(BT_HP.umap.min_dist), OZ = nz(BT_HP.umap.n_neighbors);
    const f = (x, z) => 0.92 * Math.exp(-((x - OX) ** 2 + (z - OZ) ** 2) / .30)
                      + 0.30 * Math.exp(-((x + .55) ** 2 + (z - .60) ** 2) / .22)
                      - 0.09 * (x * x + z * z)
                      + 0.035 * Math.sin(x * 5.4) * Math.cos(z * 4.8);
    const yOpt = f(OX, OZ) * .95 - .30;
    BT_TEXTOS = [
      { txt:'min_dist 0 \u2192 0.8',    x:0,     y:-.92, z:1.50, tam:15, col:'faint', anclaje:'center', mono:true },
      { txt:'n_neighbors 10 \u2192 40', x:-1.55, y:-.92, z:0,    tam:15, col:'faint', anclaje:'center', mono:true },
      { txt:'c_v = 0.692',              x:OX,    y:yOpt + .30, z:OZ, tam:18, col:'neg', anclaje:'center', mono:true },
      { txt:'n_neighbors 17 \u00b7 min_dist 0.525', x:OX, y:yOpt + .20, z:OZ,
        tam:14, col:'faint', anclaje:'center', mono:true },
      /* Al crecer la superficie la cumbre llega al borde superior, así que
         estos dos rótulos bajan al pie: arriba chocaban con el c_v. */
      /* Se corre a la derecha: al quitar la línea de arriba, ésta quedó sola
         al pie y centrada caía justo sobre la nota de c_v. */
      { hud:true, fx:.74, fy:.96, txt:'grey: pruned by the median', tam:15, col:'faint', anclaje:'center' }
    ];
    /* La superficie se dibujaba en un cuadrado de 1,85 de lado sobre un
       lienzo que admite más del doble: se veía chica y perdida en el centro.
       Sube a 2,72, que es lo que ocupan las demás escenas del pipeline. */
    const AN = 2.72;
    const M = 44, MALLA = M * M;
    /* Los puntos que sobraban de la malla eran más de mil y se apilaban sobre
       la cumbre hasta volverla una gorra negra: dejaba de leerse como una
       nube de evaluaciones. Se dibujan 150 —suficientes para que se vea la
       concentración del TPE alrededor del óptimo— y el resto se esconde. */
    const TRIALS = 150;
    const r = btRng(7717);
    pts.forEach((p, i) => {
      const malla = i < MALLA;
      /* Los trials que sobran se esconden EN EL ORIGEN, no en y = -9. El
         encuadre automático mide el radio de la nube incluyendo todos los
         puntos, así que mandarlos lejos inflaba el radio a 9 y la escena se
         dibujaba cinco veces más chica de lo que corresponde: era eso, y no
         la escala de la superficie, lo que hacía que el valle se viera
         diminuto. En el origen no molestan y no cuentan para el encuadre. */
      if(!malla && i - MALLA >= TRIALS){
        p.dalfa = 0; p.drad = 0; p.dx = 0; p.dy = 0; p.dz = 0; return;
      }
      if(malla){
        const x = ((i % M) / (M - 1) - .5) * AN;
        const z = (Math.floor(i / M) / (M - 1) - .5) * AN;
        const y = f(x, z);
        p.dx = x; p.dz = z; p.dy = y * .95 - .30;
        p.dcol = btColor(Math.max(0, Math.min(1, (y + .35) / 1.30)));
        p.drad = 1.5; p.dalfa = .8;
      } else {
        /* Traza reconstruida del muestreador TPE: las primeras evaluaciones
           se reparten por todo el espacio y las siguientes se concentran
           alrededor del óptimo, que es como se comporta un TPE con
           MedianPruner. Sólo se dibuja la nube de evaluaciones, no se
           afirma un número de trials que la memoria no reporta. */
        const j = i - MALLA;
        const explora = (j % 7) === 0;                 // ~1 de cada 7, exploración
        let x, z;
        if(explora){ x = (r() - .5) * AN; z = (r() - .5) * AN; }
        else {
          /* La varianza se cierra, pero con piso: a .17 los ciento y pico de
             trials caían dentro del mismo centímetro de la cumbre y se fundían
             en una mancha. Con .30 la concentración se sigue leyendo y cada
             evaluación conserva su punto. */
          const sg = .30 + .34 * Math.exp(-j / 60);
          x = OX + (r() + r() + r() - 1.5) * sg;
          z = OZ + (r() + r() + r() - 1.5) * sg;
          x = Math.max(-AN / 2, Math.min(AN / 2, x));
          z = Math.max(-AN / 2, Math.min(AN / 2, z));
        }
        const y = f(x, z);
        p.dx = x; p.dz = z; p.dy = y * .95 - .30 + .035;
        const podado = y < .18;                        // MedianPruner
        p.dcol  = podado ? BT_GRIS : '#0a1020';
        p.drad  = podado ? 1.6 : 2.1;
        p.dalfa = podado ? .40 : .80;
      }
      if(i === MALLA){                                 // el óptimo reportado
        p.dx = OX; p.dz = OZ; p.dy = f(OX, OZ) * .95 - .30 + .07;
        p.dcol = '#d0103c'; p.drad = 7.5; p.dalfa = 1;
      }
    });
  },

  /* 06 · reduce_outliers: el ruido migra al centroide más cercano.
     Es el paso que hace desaparecer la categoría −1 del corpus. */
  reasignacion(pts){
    const reas = Math.round(BT_CORPUS.conTopico * BT_RUIDO);
    BT_TEXTOS = [
      { hud:true, fx:.5, fy:.05, txt:'0 documents without a topic', tam:22, col:'ink', anclaje:'center' },
      { hud:true, fx:.5, fy:.12, txt:'category \u22121 disappears from the corpus', tam:15, col:'faint', anclaje:'center' },
      { hud:true, fx:.5, fy:.88, txt:'\u2248 ' + reas.toLocaleString('en-US') + ' documents reassigned', tam:16, col:'ink', anclaje:'center', mono:true },
      { hud:true, fx:.5, fy:.94, txt:'to the nearest centroid, cosine in \u211d\u00b3\u2078\u2074', tam:15, col:'faint', anclaje:'center' }
    ];
    pts.forEach(p => {
      btAlrededor(p, p.c, p.disp);
      p.dx = _o.x; p.dy = _o.y; p.dz = _o.z;
      p.dcol = btColor(p.t); p.drad = 2.2; p.dalfa = .95;
    });
  },

  /* 07 · c-TF-IDF: the ten largest topics se aplanan en filas de términos,
     ordenadas por peso. Se rotulan sus palabras reales. */
  terminos(pts){
    const TOP = 10;
    const mapa = {};
    for(let k = 0; k < TOP; k++) mapa[k] = k;
    BT_TEXTOS = [
      { hud:true, fx:.5, fy:.05, txt:'the ten largest topics', tam:20, col:'ink', anclaje:'center' },

      { hud:true, fx:.5, fy:.94, txt:'top_n_words = 10 \u00b7 ngram (1, 2) \u00b7 min_df = 10', tam:14, col:'faint', anclaje:'center', mono:true }
    ];
    for(let k = 0; k < TOP; k++){
      const y = (.5 - k / (TOP - 1)) * 1.20;
      /* Tres palabras y no una: el paso trata de qué palabras definen al
         grupo, y con una sola el rótulo no mostraba el efecto del peso, que
         es justamente por qué esas tres y no otras. */
      BT_TEXTOS.push({ txt: BT_TOPICOS[k][1].split(',').slice(0, 3)
                              .map(w => w.trim()).join('  \u00b7  '),
                       x:-1.02, y, z:0, tam:15, col:'ink', anclaje:'right' });
      BT_TEXTOS.push({ txt: BT_TOPICOS[k][2].toLocaleString('en-US'),
                       x: 1.02, y, z:0, tam:14, col:'faint', anclaje:'left', mono:true });
    }
    const cuenta = {}, visto = {};
    pts.forEach(p => { const g = p.k % TOP; cuenta[g] = (cuenta[g] || 0) + 1; });
    pts.forEach(p => {
      const g = p.k % TOP;
      visto[g] = (visto[g] || 0) + 1;
      const u = visto[g] / cuenta[g], w = 1 - u;
      p.dy = (.5 - g / (TOP - 1)) * 1.20;
      p.dx = (u - .5) * 1.82;
      p.dz = (p.b - .5) * .035;
      p.dcol = btColor(g / (TOP - 1));
      p.drad = 1.0 + 3.0 * w * w;
      p.dalfa = .28 + .66 * w;
    });
  },

  /* 08 · fusión semántica: los 37 pares con entailment mutuo colapsan */
  fusion(pts){
    /* La escena mostraba la nube sin nombres: se veía que algo se juntaba,
       pero no QUÉ. Se rotulan los cincuenta topics mayores con su primera
       palabra, ancladas a su centro, para que el colapso de 274 a 237 pase
       sobre un mapa legible y no sobre puntos de color. */
    BT_TEXTOS = BT_TOPICOS.slice(0, 50).map((t, k) => ({
      txt: t[1].split(',')[0].trim(),
      x:0, y:0, z:0, tam: k < 8 ? 13.5 : 11.5, col: k < 8 ? 'ink' : 'faint',
      anclaje:'center', centro:k
    }));
    BT_TEXTOS.push(
      { hud:true, fx:.5, fy:.05, txt: BT_CORPUS.topicosPrevios + ' \u2192 ' + BT_CORPUS.topicos + ' topics', tam:22, col:'ink', anclaje:'center' },

      { hud:true, fx:.02, fy:.88, txt:'cos(\u03bc\u1d62, \u03bc\u2c7c) > 0.55', tam:15, col:'faint', anclaje:'left', mono:true },

      { hud:true, fx:.5, fy:.94, txt:'mDeBERTa-v3 \u00b7 MNLI + XNLI', tam:14, col:'faint', anclaje:'center', mono:true }
    );
    pts.forEach(p => {
      btAlrededor(p, p.cf, p.cf === p.c ? p.disp : p.disp * 1.25);
      p.dx = _o.x; p.dy = _o.y; p.dz = _o.z;
      p.dcol = btColor(p.tFusion); p.drad = 2.2; p.dalfa = .95;
    });
  },

  /* 09 · los 237 topics finales, cada uno con su tamaño real */
  topicos(pts){
    BT_TEXTOS = [];
    pts.forEach(p => {
      const c = p.cf;
      btAlrededor(p, { x:c.x * 1.06, y:c.y * 1.06, z:c.z * 1.06 }, p.disp * .82);
      p.dx = _o.x; p.dy = _o.y; p.dz = _o.z;
      p.dcol = btColor(p.tFusion); p.drad = 2.4; p.dalfa = .97;
    });
  }
};

/* =========================================================================
   RENDER
   ========================================================================= */

const BT = {
  pts:null, cv:null, ctx:null, raf:null, escena:null,
  girando:0, girandoY:0, vivo:false, radio:1, corrimiento:0,
  ultimoInput:0, DERIVA:0.00055,       // rad por cuadro, hacia la izquierda
                                       // ~2 min por vuelta completa

  dimensionar(){
    const cv = this.cv; if(!cv) return;
    const r = cv.getBoundingClientRect();
    if(!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width  = Math.round(r.width  * dpr);
    cv.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width; this.h = r.height;
  },

  ir(escena){
    if(!this.pts) return;
    const f = BT_ESCENAS[escena]; if(!f) return;
    this.escena = escena;
    for(const p of this.pts) p.fijo = null;
    f(this.pts);
    // una etiqueta puede pedir anclarse al centroide de un tópico
    BT_TEXTOS.forEach(t => {
      if(t.centro === undefined) return;
      const c = (this.pts.find(p => p.k === t.centro) || {}).c;
      if(c){ t.x = c.x; t.y = c.y + .19; t.z = c.z; }
    });
    // encuadre automático: cada escena se centra y se escala a su radio
    let sx = 0, sy = 0, sz = 0;
    for(const p of this.pts){ sx += p.dx; sy += p.dy; sz += p.dz; }
    const n = this.pts.length; sx /= n; sy /= n; sz /= n;
    let r2 = 0;
    for(const p of this.pts){
      p.dx -= sx; p.dy -= sy; p.dz -= sz;
      const d = p.dx * p.dx + p.dy * p.dy + p.dz * p.dz;
      if(d > r2) r2 = d;
    }
    this.radio = Math.max(.5, Math.sqrt(r2));
    BT_TEXTOS.forEach(t => { if(t.hud) return; t.x -= sx; t.y -= sy; t.z -= sz; });
  },

  cuadro(){
    if(!this.vivo) return;
    const ctx = this.ctx;
    if(!ctx){ this.raf = requestAnimationFrame(() => this.cuadro()); return; }
    if(!this.w) this.dimensionar();

    BT_CAM.yaw   += this.girando  * .035;
    BT_CAM.pitch += this.girandoY * .028;
    BT_CAM.pitch = Math.max(-1.25, Math.min(1.25, BT_CAM.pitch));
    this.girando *= .86; this.girandoY *= .86;

    /* Deriva: tras un segundo sin tocar el stick, la escena empieza a girar
       sola hacia la izquierda, muy lento. Entra con una rampa para que el
       arranque no se note, y se corta apenas hay input. */
    const quieto = performance.now() - this.ultimoInput;
    if(quieto > 1000){
      const rampa = Math.min(1, (quieto - 1000) / 1400);
      BT_CAM.yaw -= this.DERIVA * rampa;
    }

    const w = this.w, h = this.h, cy = h / 2;
    // la escena se corre cuando la nota ocupa la esquina inferior izquierda
    const cx = w / 2 + w * (this.corrimiento || 0);
    const esc = Math.min(w, h) * .56 / (this.radio || 1);
    ctx.clearRect(0, 0, w, h);

    const P = this.pts, n = P.length;
    for(let i = 0; i < n; i++){
      const p = P[i];
      p.x += (p.dx - p.x) * .075;
      p.y += (p.dy - p.y) * .075;
      p.z += (p.dz - p.z) * .075;
      p.rad  += (p.drad  - p.rad)  * .10;
      p.alfa += (p.dalfa - p.alfa) * .10;
      p.col = p.dcol;
      const q = btProyectar(p, BT_CAM, cx, cy, esc);
      p._sx = q.sx; p._sy = q.sy; p._z = q.z; p._f = q.f;
    }

    const orden = this._orden || (this._orden = new Array(n));
    for(let i = 0; i < n; i++) orden[i] = P[i];
    orden.sort((a, b) => b._z - a._z);

    for(let i = 0; i < n; i++){
      const p = orden[i];
      const r = p.rad * p._f;
      if(r < .2) continue;
      // 'fijo' salta el suavizado y la atenuación por profundidad: lo usan
      // los elementos que tienen que leerse sólidos a 3-7 m (las celdas del
      // vector, por ejemplo), donde una opacidad intermedia los borra
      ctx.globalAlpha = (p.fijo != null) ? p.fijo
                                         : p.alfa * (.45 + .55 * p._f);
      ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p._sx, p._sy, r, 0, 6.2832); ctx.fill();
    }
    // etiquetas de texto en el espacio, con la misma proyección
    if(BT_TEXTOS.length){
      const cs = getComputedStyle(document.documentElement);
      const tinta = cs.getPropertyValue('--ink').trim() || '#0a1020';
      const tenue = cs.getPropertyValue('--mark-neg').trim() || '#d0103c';
      ctx.textBaseline = 'middle';

      /* Separación de rótulos anclados: al rotar, dos etiquetas pegadas a
         centroides vecinos se superponen. Se proyectan primero y se empujan
         en vertical hasta que no se pisen. Los rótulos fijos no se tocan. */
      const anclados = [];
      BT_TEXTOS.forEach(t => {
        if(t.hud){
          // rótulo de interfaz: posición en fracción del lienzo, sin rotar
          t._sx = t.fx * w; t._sy = t.fy * h; t._f = 1;
          return;
        }
        const q = btProyectar(t, BT_CAM, cx, cy, esc);
        t._sx = q.sx; t._sy = q.sy; t._f = q.f;
        if(t.centro !== undefined) anclados.push(t);
      });
      anclados.sort((a, b) => a._sy - b._sy);
      for(let a = 1; a < anclados.length; a++){
        const A = anclados[a - 1], B = anclados[a];
        if(Math.abs(A._sx - B._sx) > 230) continue;
        const min = 24;
        if(B._sy - A._sy < min) B._sy = A._sy + min;
      }

      BT_TEXTOS.forEach(t => {
        const q = { sx: t._sx, sy: t._sy, f: t._f };
        const k = Math.max(.55, q.f);
        ctx.font = (t.mono ? '' : '600 ') + Math.round(t.tam * k * 1.35) + 'px '
                 + (t.mono ? '"JetBrains Mono", monospace' : '"Space Grotesk", sans-serif');
        ctx.textAlign = t.anclaje || 'center';
        ctx.globalAlpha = .35 + .65 * k;
        ctx.fillStyle = t.col === 'neg' ? tenue : tinta;
        if(t.col === 'faint') ctx.globalAlpha *= .58;
        ctx.fillText(t.txt, q.sx, q.sy);
      });
      ctx.globalAlpha = 1;
    }

    this.raf = requestAnimationFrame(() => this.cuadro());
  },

  arrancar(cv){
    if(!cv) return;
    this.cv = cv; this.ctx = cv.getContext('2d');
    if(!this.pts) this.pts = btConstruirPuntos();
    this.dimensionar(); this.vivo = true;
    if(!this.raf) this.raf = requestAnimationFrame(() => this.cuadro());
  },

  parar(){ this.vivo = false; if(this.raf){ cancelAnimationFrame(this.raf); this.raf = null; } },
  rotar(ex, ey){
    if(ex || ey) this.ultimoInput = performance.now();
    this.girando += ex; this.girandoY += ey;
  },
  reencuadrar(){ BT_CAM.yaw = BT_CAM.base.yaw; BT_CAM.pitch = BT_CAM.base.pitch;
                 this.girando = 0; this.girandoY = 0;
                 this.ultimoInput = performance.now(); }
};

window.BT = BT;

/* =========================================================================
   PANELES · los hiperparámetros de cada paso, tal como los declara la
   memoria. Un valor ausente se rotularía «not reported», no se inventa.
   ========================================================================= */

const btNum = v => typeof v === 'number'
  ? v.toLocaleString('en-US', { maximumFractionDigits:4 }) : v;

function btFila(k, v, u){
  const vacio = (v === null || v === undefined || v === '');
  const val = vacio ? '<span class="bt-falta">not reported</span>'
                    : '<b>' + btNum(v) + '</b>'
                      + (u ? ' <span class="bt-u">' + u + '</span>' : '');
  return '<div class="bt-p' + (vacio ? ' vacio' : '') + '"><span class="bt-pk">'
       + k + '</span><span class="bt-pv">' + val + '</span></div>';
}

const BT_PANEL = {
  datos: () => { const C = BT_CORPUS; return ''
    + btFila('source node', 'Publication.title')
    + btFila('', 'Publication.abstract')
    + btFila('', 'Publication.keywords')
    + btFila('Publication nodes', C.publicaciones)
    + btFila('without abstract', C.sinAbstract, 'no HAS_TOPIC')
    + btFila('minimum length', '> ' + C.minCaracteres, 'characters'); },

  embed: () => { const h = BT_HP.embed; return ''
    + btFila('model', h.modelo)
    + btFila('family', h.familia)
    + btFila('dimension', 'ℝ³⁸⁴')
    + btFila('similarity', 'cosine'); },

  umap: () => { const h = BT_HP.umap; return ''
    + btFila('n_neighbors', h.n_neighbors)
    + btFila('min_dist', h.min_dist)
    + btFila('n_components', h.n_components)
    + btFila('metric', h.metric)
    + btFila('projection', 'ℝ³⁸⁴ → ℝ⁵'); },

  hdbscan: () => { const h = BT_HP.hdbscan; return ''
    + btFila('min_cluster_size', h.min_cluster_size)
    + btFila('min_samples', h.min_samples, 'the k of coreₖ')
    + btFila('topics, first pass', h.topicosPrimeraPasada)
    + btFila('documents with τ = −1', h.ruidoPrimeraPasada + ' %'); },

  optuna: () => { const h = BT_HP.optuna; return ''
    + btFila('sampler', h.muestreador)
    + btFila('search space', 'n_neighbors · min_dist · min_cluster_size · min_samples')
    + btFila('pruner', h.podador)
    + btFila('objective', 'c_v on the top 10 terms')
    + btFila('best c_v', h.mejor); },

  outliers: () => { const h = BT_HP.outliers; return ''
    + btFila('procedure', 'reduce_outliers · embeddings')
    + btFila('space', h.espacio)
    + btFila('documents reassigned', BT_HP.hdbscan.ruidoPrimeraPasada + ' %')
    + btFila('residual −1', h.residual, 'gone from the corpus'); },

  ctfidf: () => { const h = BT_HP.ctfidf; return ''
    + btFila('top_n_words', h.top_n_words)
    + btFila('ngram_range', h.ngram_range)
    + btFila('min_df', h.min_df)
    + btFila('stopwords', 'bilingual, enriched with corpus terms'); },

  fusion: () => { const h = BT_HP.fusion, C = BT_CORPUS; return ''
    + btFila('NLI model', h.modelo)
    + btFila('cosine threshold', h.umbralCos)
    + btFila('entailment threshold', h.umbralNLI)
    + btFila('iterations', h.iteraciones)
    + btFila('merged pairs', h.paresFusionados,
             C.topicosPrevios + ' → ' + C.topicos); }
};

/* =========================================================================
   VIZ · el hook de la slide
   ========================================================================= */

window.VIZ['bertopic'] = {
  mount(s){
    BT.arrancar(s.querySelector('#bt-lienzo'));

    const riel = s.querySelector('.bt-riel');
    if(riel && !riel.childElementCount){
      riel.style.gridTemplateColumns = 'repeat(' + BT_PASOS.length + ',1fr)';
      riel.innerHTML = BT_PASOS.map((p, i) =>
        '<div class="bt-hito" data-i="' + i + '"><span class="bt-hk">' + p.k
        + '</span><span class="bt-ht">' + p.corto + '</span></div>').join('');
    }

    this._rs = () => BT.dimensionar();
    window.addEventListener('resize', this._rs);

    /* Arrastre con el puntero, para ensayar sin el mando.
       Va en document y en fase de captura: las zonas de navegación del deck
       cubren media pantalla con z-index propio, así que un listener sobre el
       canvas nunca recibiría el evento. Acá se comprueba a mano el impacto. */
    if(!document._btArrastre){
      document._btArrastre = true;
      let px = 0, py = 0, on = false, movido = 0;
      const dentro = e => {
        const c = document.querySelector('.slide.active[data-slide="bertopic"] #bt-lienzo');
        if(!c) return false;
        const r = c.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right &&
               e.clientY >= r.top  && e.clientY <= r.bottom;
      };
      document.addEventListener('pointerdown', e => {
        if(!dentro(e)) return;
        on = true; movido = 0; px = e.clientX; py = e.clientY;
      }, true);
      document.addEventListener('pointermove', e => {
        if(!on) return;
        const dx = e.clientX - px, dy = e.clientY - py;
        movido += Math.abs(dx) + Math.abs(dy);
        BT.rotar(dx * .012, dy * .012);
        px = e.clientX; py = e.clientY;
      }, true);
      document.addEventListener('pointerup', () => {
        if(!on) return;
        on = false;
        if(movido > 5) document.addEventListener('click',
          ev => { ev.stopPropagation(); ev.preventDefault(); },
          { capture:true, once:true });
      }, true);
    }
  },

  beat(n, s){
    const i = n - 1;
    const paso = BT_PASOS[i];
    s.classList.toggle('modo-paso', !!paso);
    s.classList.toggle('modo-tablero', !!(paso && paso.tablero));
    if(!paso) return;

    // el paso 09 deja la escena 3D y abre el explorador del nodo Topic
    if(paso.tablero){
      BT.parar();
      const riel = s.querySelector('.bt-riel');
      if(riel) riel.querySelectorAll('.bt-hito').forEach((h, j) => {
        h.classList.toggle('on', j === i); h.classList.toggle('hecho', j < i);
      });
      if(window.TABLERO) TABLERO.repintar();
      return;
    }
    BT.arrancar(s.querySelector('#bt-lienzo'));
    BT.ir(paso.escena);
    BT.reencuadrar();

    const riel = s.querySelector('.bt-riel');
    if(riel) riel.querySelectorAll('.bt-hito').forEach((h, j) => {
      h.classList.toggle('on',    j === i);
      h.classList.toggle('hecho', j <  i);
    });

    s.querySelector('.bt-k').textContent   = paso.k;
    s.querySelector('.bt-t').textContent   = paso.t;
    s.querySelector('.bt-sub').textContent = paso.sub;

    const ec = s.querySelector('.bt-formula');
    ec.innerHTML = paso.formula || '';
    ec.classList.toggle('vacia', !paso.formula);
    s.querySelector('.bt-pie').innerHTML    = paso.pie || '';
    const nt = s.querySelector('.bt-nota');
    nt.innerHTML = paso.nota || '';
    nt.classList.toggle('vacia', !paso.nota);
    BT.corrimiento = paso.nota ? 0.15 : 0;
    s.querySelector('.bt-params').innerHTML = (BT_PANEL[paso.id] || (() => ''))();

    // KaTeX: el motor ya había renderizado la slide antes de esta inyección
    if(window.renderMathInElement) [s.querySelector('.bt-ficha'), nt].forEach(el => renderMathInElement(el, {
      delimiters:[{ left:'$$', right:'$$', display:true },
                  { left:'\\(', right:'\\)', display:false }],
      throwOnError:false
    }));

    /* Ajuste de la fórmula al ancho de la columna: algunas expresiones del
       Anexo A.3 son más anchas que la caja. Se miden ya renderizadas y se
       escalan, en vez de recortarlas con un scroll que nadie va a usar
       proyectando. */
    ec.style.fontSize = '';
    const caja = ec.clientWidth - 8;
    let anchoMax = ec.scrollWidth;
    ec.querySelectorAll('.katex-display').forEach(e => {
      const w = Math.max(e.scrollWidth, e.firstElementChild
        ? e.firstElementChild.getBoundingClientRect().width : 0);
      if(w > anchoMax) anchoMax = w;
    });
    if(anchoMax > caja && caja > 0)
      ec.style.fontSize = Math.max(.58, caja / anchoMax).toFixed(3) + 'em';

  },

  destroy(){ BT.parar(); window.removeEventListener('resize', this._rs); }
};
