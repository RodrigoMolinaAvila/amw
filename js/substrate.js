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
  sourcesTransferred = false;
  if(window.Schema3D && Schema3D.active) { Schema3D.active.setPath([], []); Schema3D.active.setSourceLogos(false); }
  const panel = document.getElementById('schema-table');
  if(panel){ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); }
  if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(false);
}

function renderSchemaQuery(i){
  const s = document.querySelector('.s-graph');
  const wasIntro = !!s && s.classList.contains('intro');
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

window.SCHEMA_UI = {
  activo(){
    const s = document.querySelector('.slide.active[data-slide="graph"]');
    return !!s && !Deck.indiceAbierto();
  },
  prop(d){ if(this.activo()) Deck.query(d); },
  tabla(){
    const panel = document.getElementById('schema-table');
    if(!panel) return false;
    const open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(open);
    return open;
  },
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
