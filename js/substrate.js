/* =========================================================================
   SUBSTRATE · animated schema + five complex query paths.
   The scene is schema3d.js; this file binds the real network, the official
   source logos, the query menu, and the highlighted path of each query.
   ========================================================================= */

const FIELD_OF = {
  'CIENCIAS NATURALES': 0,
  'CIENCIAS AGRICOLAS': 1,
  'CIENCIAS MEDICAS Y DE SALUD': 2,
  'INGENIERÍA Y TECNOLOGÍA': 3,
  'CIENCIAS SOCIALES': 4,
  'HUMANIDADES': 5
};

const SCHEMA_QUERIES = [
  {
    label: 'Trajectory', icon: 'fa-route',
    headline: 'Reconstruct a career.',
    result: '3,143', unit: 'careers',
    pattern: 'MATCH (h:HighSchool)<-[:STUDIED_SECONDARY_AT]-(f:Fellow)\n'
           + '      -[:STUDIED_UNDERGRAD_AT]->(u:UndergradInstitution),\n'
           + '      (f)-[:STUDIED_GRADUATE_AT]->(g:GradInstitution),\n'
           + '      (f)-[:HAS_SCOPUS_PROFILE]->(a:Author)\n'
           + '      -[:AUTHORED]->(p:Publication)\n'
           + '      -[:IS_PUBLISHED_IN]->(j:Journal)\n'
           + 'RETURN h, f, u, g, a, p, j',
    nodes: ['Fellow', 'HighSchool', 'Undergrad', 'Grad', 'Author', 'Publication', 'Journal'],
    links: ['STUDIED_SECONDARY_AT', 'STUDIED_UNDERGRAD_AT', 'STUDIED_GRADUATE_AT',
            'HAS_SCOPUS_PROFILE', 'AUTHORED', 'IS_PUBLISHED_IN']
  },
  {
    label: 'Origin', icon: 'fa-location-dot',
    headline: 'Where does the cohort come from?',
    result: '322', unit: 'of 797 schools',
    pattern: 'MATCH (h:HighSchool)<-[:STUDIED_SECONDARY_AT]-(f:Fellow)\n'
           + '      -[:STUDIED_UNDERGRAD_AT]->(u:UndergradInstitution)\n'
           + '      -[:HAS_QUALITY]->(q:Quality)\n'
           + 'RETURN h, f, u, q',
    nodes: ['Fellow', 'HighSchool', 'Undergrad', 'Quality'],
    links: ['STUDIED_SECONDARY_AT', 'STUDIED_UNDERGRAD_AT', 'HAS_QUALITY']
  },
  {
    label: 'Collaboration', icon: 'fa-people-group',
    headline: 'Who publishes together?',
    result: '496', unit: 'in the giant component',
    pattern: 'MATCH (f:Fellow)-[:HAS_SCOPUS_PROFILE]->(a:Author)\n'
           + '      -[:AUTHORED]->(p:Publication)\n'
           + '      -[:COAUTHORED]->(c:Coauthor)\n'
           + 'RETURN f, a, p, c',
    nodes: ['Fellow', 'Author', 'Publication', 'Coauthor'],
    links: ['HAS_SCOPUS_PROFILE', 'AUTHORED', 'COAUTHORED']
  },
  {
    label: 'Funding', icon: 'fa-hand-holding-dollar',
    headline: 'What came after the PhD?',
    result: '1,031', unit: 'Fondecyt projects',
    pattern: 'MATCH (g:GradInstitution)<-[:STUDIED_GRADUATE_AT]-(f:Fellow)\n'
           + '      -[:HAS_FONDECYT]->(x:Fondecyt)\n'
           + 'RETURN g, f, x',
    nodes: ['Fellow', 'Grad', 'Fondecyt'],
    links: ['STUDIED_GRADUATE_AT', 'HAS_FONDECYT']
  },
  {
    label: 'Prestige', icon: 'fa-ranking-star',
    headline: 'Which institutions carry the career?',
    result: '597', unit: 'QS-ranked graduate institutions',
    pattern: 'MATCH (f:Fellow)-[:STUDIED_GRADUATE_AT]->(g:GradInstitution)\n'
           + '      -[:HAS_QS_PRESTIGE]->(qs:QSRank),\n'
           + '      (g)-[:HAS_SHANGHAI_PRESTIGE]->(sh:ShanghaiRank)\n'
           + 'RETURN f, g, qs, sh',
    nodes: ['Fellow', 'Grad', 'QS', 'Shanghai'],
    links: ['STUDIED_GRADUATE_AT', 'HAS_QS_PRESTIGE', 'HAS_SHANGHAI_PRESTIGE']
  },
  {
    label: 'Disciplines', icon: 'fa-shapes',
    headline: 'How do people and papers divide?',
    result: '2,655', unit: 'author disciplines',
    pattern: 'MATCH (f:Fellow)-[:HAS_SCOPUS_PROFILE]->(a:Author)\n'
           + '      -[:AUTHORED]->(p:Publication)\n'
           + '      -[:IN_DISCIPLINE]->(pd:PubDiscipline),\n'
           + '      (a)-[:HAS_DISCIPLINE]->(ad:AuthorDiscipline)\n'
           + 'RETURN f, a, p, pd, ad',
    nodes: ['Fellow', 'Author', 'Publication', 'PubDiscipline', 'AuthorDiscipline'],
    links: ['HAS_SCOPUS_PROFILE', 'AUTHORED', 'IN_DISCIPLINE', 'HAS_DISCIPLINE']
  },
  {
    label: 'Fields', icon: 'fa-layer-group',
    headline: 'Which fields absorb the publications?',
    result: '46,706', unit: 'field links',
    pattern: 'MATCH (a:Author)-[:AUTHORED]->(p:Publication)\n'
           + '      -[:IN_FIELD]->(fd:Field)\n'
           + 'RETURN a, p, fd',
    nodes: ['Author', 'Publication', 'Field'],
    links: ['AUTHORED', 'IN_FIELD']
  }
];

window.Schema3D.config.network = { nodes: RED, edges: RED_ARISTAS };
window.Schema3D.config.camera = { yaw: -.18, pitch: .2, dist: 5.5, cx: .39, cy: .48, scale: .27 };
window.Schema3D.config.handoff.beat = 99;
window.Schema3D.config.edgeLabels = 'all';
window.Schema3D.config.groups = false;
window.Schema3D.config.bubble.plateFill = true;
window.Schema3D.config.bubble.plate = .82;
window.Schema3D.config.bubble.r = .155;
window.Schema3D.config.bubble.rFellow = .215;
window.Schema3D.config.bubble.icon = 1.08;

const SRC = 'logos/fuentes/';
window.Schema3D.config.logos = {
  Fellow:          SRC + 'anid.png',
  HighSchool:      SRC + 'mineduc.png',
  Undergrad:       SRC + 'anid.png',
  Grad:            SRC + 'anid.png',
  Quality:         SRC + 'cna.png',
  QS:              SRC + 'qs.png',
  Shanghai:        SRC + 'arwu.png',
  Author:          SRC + 'elsevier-tree.svg',
  Publication:     SRC + 'elsevier-tree.svg',
  Journal:         SRC + 'sjr.png',
  Coauthor:        SRC + 'elsevier-tree.svg',
  Topic:           SRC + 'bertopic.png',
  PubDiscipline:   SRC + 'elsevier-tree.svg',
  AuthorDiscipline:SRC + 'elsevier-tree.svg',
  Field:           SRC + 'elsevier-tree.svg',
  Fondecyt:        SRC + 'anid.png'
};

const SCHEMA_PROPERTIES = [
  { node:'Fellow',           props:['doctoral_field','program','is_female','fellowship_duration_months'] },
  { node:'HighSchool',       props:['school_name','school_commune','school_region','school_gse'] },
  { node:'Undergrad',        props:['undergraduate_institution','undergraduate_region','elite'] },
  { node:'Grad',             props:['graduate_university','graduate_program','graduate_country'] },
  { node:'Quality',          props:['accreditation_level','accreditation_years'] },
  { node:'QS',               props:['qs_university','qs_rank_2025','qs_country'] },
  { node:'Shanghai',         props:['shanghai_university','shanghai_rank','shanghai_top_100','shanghai_country'] },
  { node:'Author',           props:['indexed_name','affiliation_name','h_index','cited_by_count','document_count'] },
  { node:'Publication',      props:['title','year','citation_count','keywords','abstract'] },
  { node:'Journal',          props:['title','publisher','country','sjr','open_access'] },
  { node:'Coauthor',         props:['coauthor_id','is_fellow_author'] },
  { node:'Topic',            note:'More later in the presentation' },
  { node:'PubDiscipline',    props:['discipline_name','discipline_id'] },
  { node:'AuthorDiscipline', props:['label','author_disc_id'] },
  { node:'Field',            props:['field_name','field_id'] },
  { node:'Fondecyt',         props:['project_name','instrument','oecd_area','program'] },
];

const SOURCES = [
  { id:'anid',      label:'ANID',      logo:SRC+'anid.png',            nodes:['Fellow','Undergrad','Grad','Fondecyt'] },
  { id:'mineduc',   label:'MINEDUC',   logo:SRC+'mineduc.png',         nodes:['HighSchool'] },
  { id:'cna',       label:'CNA',       logo:SRC+'cna.png',             nodes:['Quality'] },
  { id:'qs',        label:'QS',        logo:SRC+'qs.png',              nodes:['QS'] },
  { id:'arwu',      label:'ARWU',      logo:SRC+'arwu.png',            nodes:['Shanghai'] },
  { id:'elsevier',  label:'Elsevier',  logo:SRC+'elsevier-tree.svg',   nodes:['Author','Publication','Coauthor','PubDiscipline','AuthorDiscipline','Field'] },
  { id:'sjr',       label:'SJR',       logo:SRC+'sjr.png',             nodes:['Journal'] },
  { id:'bertopic',  label:'BERTopic',  logo:SRC+'bertopic.png',        nodes:['Topic'] },
];


let schemaIdx = 0;
let sourcesTransferred = false;

function renderSchemaTable(i){
  const q = SCHEMA_QUERIES[i];
  const ex = window.SCHEMA_EXAMPLES && q && window.SCHEMA_EXAMPLES[q.label];
  const title = document.getElementById('st-table-title');
  const count = document.getElementById('st-table-count');
  const table = document.getElementById('st-table');
  if(!title || !table) return;
  title.textContent = q ? q.label : '';
  table.replaceChildren();
  if(!ex) return;

  let data = ex.rows.map((row, k) => ({ row, meta: ex.meta && ex.meta[k] }))
    .filter(x => !window.TABLE_FILTER_UI || TABLE_FILTER_UI.matches(x.meta));
  if(window.TABLE_SORT_UI) data = TABLE_SORT_UI.sortData('s3', data);
  if(count) count.textContent = data.length.toLocaleString('en-US') + ' rows';

  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  const head = ex.meta ? ex.head.slice() : ex.head.slice();
  if(ex.meta) head.splice(1, 0, 'Territory');
  const sorted = window.TABLE_SORT && TABLE_SORT.s3;
  head.forEach((h, idx) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.tabIndex = 0;
    th.setAttribute('role', 'button');
    if(sorted && sorted.col === idx){
      th.classList.add('sorted');
      th.setAttribute('aria-sort', sorted.dir > 0 ? 'ascending' : 'descending');
      const ar = document.createElement('span');
      ar.className = 'sort-arrow';
      ar.textContent = sorted.dir > 0 ? '▲' : '▼';
      th.appendChild(ar);
    }
    const doSort = () => {
      if(!window.TABLE_SORT_UI) return;
      TABLE_SORT_UI.toggleSort('s3', idx);
      if(window.SCHEMA_UI) SCHEMA_UI.refresh();
    };
    th.addEventListener('click', doSort);
    th.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); doSort(); }
    });
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  const tbody = document.createElement('tbody');
  data.forEach(({ row, meta }) => {
    const tr = document.createElement('tr');
    const values = ex.meta ? row.slice() : row.slice();
    if(ex.meta) values.splice(1, 0, (meta && meta[2]) || 'Unknown');
    values.forEach(v => {
      const td = document.createElement('td');
      const text = v == null ? '' : String(v);
      td.textContent = text;
      td.title = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
}

function buildSchemaMenu(){
  const host = document.getElementById('schema-menu');
  if(!host || host.dataset.built) return;
  host.dataset.built = '1';
  SCHEMA_QUERIES.forEach((q, i) => {
    const el = document.createElement('div');
    el.className = 'mi';
    el.innerHTML = '<span class="mb"></span><i class="fa-solid ' + q.icon + ' ic" aria-hidden="true"></i><span class="ml"></span>';
    el.querySelector('.ml').textContent = q.label;
    el.addEventListener('click', () => Deck.setBeat(i + 2));
    host.appendChild(el);
  });
}

function buildSourceStrip(){
  const host = document.getElementById('source-strip');
  if(!host || host.dataset.built) return;
  host.dataset.built = '1';
  SOURCES.forEach(source => {
    const item = document.createElement('div');
    item.className = 'src';
    item.dataset.source = source.id;
    const img = document.createElement('img');
    img.src = source.logo; img.alt = source.label;
    const label = document.createElement('span');
    label.textContent = source.label;
    item.append(img, label);
    host.appendChild(item);
  });
}

function sourceRects(){
  return SOURCES.map(source => {
    const img = document.querySelector('#source-strip [data-source="' + source.id + '"] img');
    if(!img) return null;
    return Object.assign({}, source, { rect: img.getBoundingClientRect() });
  }).filter(Boolean);
}

function transferSources(rects){
  const active = window.Schema3D && Schema3D.active;
  if(!active || !rects || !rects.length) { if(active) active.setSourceLogos(true); return; }
  const jobs = []; let max = 0;
  rects.forEach(source => {
    source.nodes.forEach(node => {
      const target = active.nodeScreen(node);
      if(!target) return;
      const x = source.rect.left + source.rect.width / 2;
      const y = source.rect.top + source.rect.height / 2;
      const el = document.createElement('div');
      el.className = 'source-fly';
      el.style.left = x + 'px'; el.style.top = y + 'px';
      const img = document.createElement('img');
      img.src = source.logo; img.alt = '';
      el.appendChild(img);
      document.body.appendChild(el);
      const dx = target.x - x, dy = target.y - y;
      const delay = jobs.length * 28;
      max = Math.max(max, delay + 900);
      if(el.animate){
        el.animate([
          { transform:'translate(-50%,-50%) scale(1)', opacity:1 },
          { transform:'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.38)', opacity:1, offset:.82 },
          { transform:'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.28)', opacity:0 }
        ], { duration:850, delay, easing:'cubic-bezier(.2,.8,.2,1)', fill:'forwards' });
      } else {
        el.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.3)';
      }
      jobs.push(el);
    });
  });
  setTimeout(() => { if(window.Schema3D && Schema3D.active) Schema3D.active.setSourceLogos(true); }, Math.min(650, Math.max(0, max - 200)));
  setTimeout(() => jobs.forEach(el => el.remove()), max + 100);
}

function renderSchemaIntro(s){
  if(!s) s = document.querySelector('.s-graph');
  if(!s) return;
  s.classList.add('intro');
  closeSchemaProperties();
  sourcesTransferred = false;
  if(window.Schema3D && Schema3D.active) { Schema3D.active.setPath([], []); Schema3D.active.setSourceLogos(false); }
  const panel = document.getElementById('schema-table');
  if(panel){ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); }
  if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(false);
}

function renderSchemaQuery(i){
  const s = document.querySelector('.s-graph');
  const wasIntro = !!s && s.classList.contains('intro');
  if(wasIntro) closeSchemaProperties();
  const rects = wasIntro ? sourceRects() : null;
  if(s) s.classList.remove('intro');
  const q = SCHEMA_QUERIES[i];
  schemaIdx = i;
  if(window.TABLE_SORT) TABLE_SORT.s3 = null;
  if(!q) return;
  document.getElementById('schema-tax').textContent = String(i + 1).padStart(2, '0');
  document.getElementById('schema-headline').textContent = q.headline;
  document.getElementById('schema-result').innerHTML = q.result + '<small>' + q.unit + '</small>';
  document.getElementById('schema-pattern').textContent = q.pattern;
  document.querySelectorAll('#schema-menu .mi').forEach((el, k) => el.classList.toggle('on', k === i));
  renderSchemaTable(i);
  if(wasIntro && !sourcesTransferred){
    sourcesTransferred = true;
    requestAnimationFrame(() => requestAnimationFrame(() => transferSources(rects)));
  } else if(window.Schema3D && Schema3D.active) {
    Schema3D.active.setSourceLogos(true);
  }
  if(window.Schema3D && Schema3D.active) Schema3D.active.setPath(q.nodes, q.links);
}

let PROPS_RAF = 0;
let PROPS_CARDS = [];

const NODE_PROP_COLORS = ['#1b4dff','#0f9b8c','#e07a1f','#6b5dd3','#2a788e','#7a8b99',
  '#d1495b','#e6a23c','#5b8c5a','#9d7bb5','#3b9ab2','#c75b12','#4c78a8','#f58518',
  '#54a24b','#b279a2'];

function nodePropCard(row, index){
  const card = document.createElement('div');
  card.className = 'node-prop';
  card.dataset.node = row.node;
  card.style.setProperty('--np-color', NODE_PROP_COLORS[index % NODE_PROP_COLORS.length]);
  const head = document.createElement('div');
  head.className = 'np-head';
  head.innerHTML = '<i></i>';
  head.append(document.createTextNode(row.node));
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  if(row.note){
    const tr = document.createElement('tr'), td = document.createElement('td');
    td.className = 'np-note'; td.textContent = row.note; tr.appendChild(td); tbody.appendChild(tr);
  } else {
    (row.props || []).forEach(prop => {
      const tr = document.createElement('tr'), td = document.createElement('td');
      td.textContent = prop; tr.appendChild(td); tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);
  card.append(head, table);
  return card;
}

function nodePropFrame(){
  if(!PROPS_RAF) return;
  const layer = document.getElementById('schema-props-layer');
  if(!layer || !layer.classList.contains('open')){ PROPS_RAF = 0; return; }
  const stage = document.getElementById('stage');
  const sr = stage.getBoundingClientRect();
  const zoom = (sr.width / 1600) || 1;
  const W = 1600, H = sr.height / zoom;
  const svg = document.getElementById('schema-props-lines');
  if(svg && (svg.getAttribute('viewBox') !== '0 0 ' + W + ' ' + H)) svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  const active = window.Schema3D && Schema3D.active;
  if(!active){ PROPS_RAF = 0; return; }
  PROPS_CARDS.forEach(card => {
    const p = active.nodeScreen(card.dataset.node);
    if(!p) return;
    const nx = (p.x - sr.left) / zoom, ny = (p.y - sr.top) / zoom, nr = (p.r || 0) / zoom;
    const w = card._w, h = card._h;
    let x = 8, y = 8;
    if(card._side === 'left'){ x = nx - nr - 18 - w; y = ny - h / 2; }
    else if(card._side === 'top'){ x = nx - w / 2; y = ny - nr - 18 - h; }
    else if(card._side === 'bottom'){ x = nx - w / 2; y = ny + nr + 18; }
    else { x = nx + nr + 18; y = ny - h / 2; }
    x = Math.max(8, Math.min(W - w - 8, x));
    y = Math.max(8, Math.min(H - h - 8, y));
    card.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    const line = card._line;
    if(line){
      let x2 = x + w / 2, y2 = y + h / 2;
      if(card._side === 'left'){ x2 = x + w; y2 = y + h / 2; }
      else if(card._side === 'right'){ x2 = x; y2 = y + h / 2; }
      else if(card._side === 'top'){ x2 = x + w / 2; y2 = y + h; }
      else { x2 = x + w / 2; y2 = y; }
      line.setAttribute('x1', nx.toFixed(1)); line.setAttribute('y1', ny.toFixed(1));
      line.setAttribute('x2', x2.toFixed(1)); line.setAttribute('y2', y2.toFixed(1));
    }
  });
  PROPS_RAF = requestAnimationFrame(nodePropFrame);
}

function placeNodePropCards(){
  const stage = document.getElementById('stage');
  const sr = stage.getBoundingClientRect();
  const zoom = (sr.width / 1600) || 1;
  const W = 1600, H = sr.height / zoom;
  const active = window.Schema3D && Schema3D.active;
  if(!active) return;
  const nodes = SCHEMA_PROPERTIES.map(row => {
    const p = active.nodeScreen(row.node);
    return p ? { x:(p.x - sr.left)/zoom, y:(p.y - sr.top)/zoom, r:(p.r||0)/zoom } : null;
  }).filter(Boolean);
  const placed = [];
  PROPS_CARDS.forEach(card => {
    const p = active.nodeScreen(card.dataset.node);
    if(!p) return;
    const nx = (p.x - sr.left) / zoom, ny = (p.y - sr.top) / zoom, nr = (p.r || 0) / zoom;
    const w = card._w, h = card._h;
    const candidates = [
      ['right',  nx + nr + 18,      ny - h / 2],
      ['left',   nx - nr - 18 - w,  ny - h / 2],
      ['bottom', nx - w / 2,        ny + nr + 18],
      ['top',    nx - w / 2,        ny - nr - 18 - h]
    ];
    let best = null, bestScore = Infinity;
    for(const [side, rawX, rawY] of candidates){
      const x = Math.max(8, Math.min(W - w - 8, rawX));
      const y = Math.max(8, Math.min(H - h - 8, rawY));
      let score = (x !== rawX || y !== rawY ? 250 : 0);
      const r = { x, y, w, h };
      for(const q of placed) score += overlapArea(r, q) * 5;
      for(const q of nodes){
        const nodeRect = { x:q.x - q.r, y:q.y - q.r, w:q.r * 2, h:q.r * 2 };
        score += overlapArea(r, nodeRect) * 1.4;
      }
      if(score < bestScore){ bestScore = score; best = { side, x, y }; }
    }
    if(!best) best = { side:'right', x:8, y:8 };
    card._side = best.side;
    card.style.transform = 'translate3d(' + best.x.toFixed(1) + 'px,' + best.y.toFixed(1) + 'px,0)';
    placed.push({ x:best.x, y:best.y, w, h });
  });
}

function overlapArea(a, b){
  const dx = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const dy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return dx * dy;
}

function openSchemaProperties(){
  const layer = document.getElementById('schema-props-layer');
  const slide = document.querySelector('.slide.active[data-slide="graph"]');
  if(!layer) return;
  if(layer.classList.contains('open')) return;
  const svg = document.getElementById('schema-props-lines');
  layer.querySelectorAll('.node-prop').forEach(el => el.remove());
  if(svg) svg.replaceChildren();
  layer.classList.add('open');
  layer.setAttribute('aria-hidden', 'false');
  PROPS_CARDS = SCHEMA_PROPERTIES.map((row, index) => {
    const card = nodePropCard(row, index);
    layer.appendChild(card);
    card._w = card.offsetWidth; card._h = card.offsetHeight;
    if(svg){
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(line); card._line = line;
    }
    return card;
  });
  if(slide) slide.classList.add('props-open');
  placeNodePropCards();
  PROPS_RAF = requestAnimationFrame(nodePropFrame);
}

function closeSchemaProperties(){
  cancelAnimationFrame(PROPS_RAF); PROPS_RAF = 0;
  const layer = document.getElementById('schema-props-layer');
  if(layer){
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden', 'true');
    layer.querySelectorAll('.node-prop').forEach(el => el.remove());
  }
  const svg = document.getElementById('schema-props-lines');
  if(svg) svg.replaceChildren();
  PROPS_CARDS = [];
  const slide = document.querySelector('.slide.active[data-slide="graph"]');
  if(slide) slide.classList.remove('props-open');
}

function toggleSchemaProperties(){
  const layer = document.getElementById('schema-props-layer');
  if(!layer) return false;
  if(layer.classList.contains('open')){ closeSchemaProperties(); return false; }
  const table = document.getElementById('schema-table');
  if(table){ table.classList.remove('open'); table.setAttribute('aria-hidden','true'); }
  if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(false);
  openSchemaProperties();
  return true;
}

window.SCHEMA_UI = {
  activo(){
    const s = document.querySelector('.slide.active[data-slide="graph"]');
    return !!s && !Deck.indiceAbierto();
  },
  prop(d){ if(this.activo()) Deck.query(d); },
  tabla(){
    const slide = document.querySelector('.slide.active[data-slide="graph"]');
    if(slide && slide.classList.contains('intro')) return toggleSchemaProperties();
    closeSchemaProperties();
    const panel = document.getElementById('schema-table');
    if(!panel) return false;
    const open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(open);
    return open;
  },
  closeProperties: closeSchemaProperties,
  refresh(){ renderSchemaTable(schemaIdx); }
};

const SUB = window.SCENES['substrate'];
window.SCENES['graph'] = {
  mount(el){
    SUB.mount(el);
    buildSourceStrip();
    buildSchemaMenu();
    const tabla = document.getElementById('schema-table');
    if(tabla){ tabla.classList.remove('open'); tabla.setAttribute('aria-hidden','true'); }
    if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(false);
    if(Deck.beat <= 1) renderSchemaIntro(el); else renderSchemaQuery(Deck.beat - 2);
    window.VIEW3D = {
      rotate(girar, inclinar){
        if(window.Schema3D && Schema3D.active) Schema3D.active.nudge(girar * .018, inclinar * .015);
      },
      toggleLabels(){ if(window.Schema3D && Schema3D.active) Schema3D.active.toggleLabels(); },
      toggleEdges(){ if(window.Schema3D && Schema3D.active) Schema3D.active.toggleEdges(); },
      toggleOrbit(){ if(window.Schema3D && Schema3D.active) Schema3D.active.toggleOrbit(); }
    };
  },
  beat(n,s){ if(n <= 1) renderSchemaIntro(s); else renderSchemaQuery(n - 2); },
  destroy(){
    const ref = window.VIEW3D;
    document.querySelectorAll('.source-fly').forEach(el => el.remove());
    if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(false);
    SUB.destroy();
    if(window.VIEW3D === ref) window.VIEW3D = null;
  }
};
