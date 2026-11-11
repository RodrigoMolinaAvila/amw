/* =========================================================================
   TOPICS · BERTopic pipeline (inherited from the thesis deck) + result tables.
   The 3D point cloud is the same corpus through eight representations.
   After the pipeline, three table states explore the 237 topics.
   ========================================================================= */

const PIPE = BT_PASOS;
const PIPE_N = PIPE.length;
const TABLE_N = 3;

const TOPIC_QUERIES = [
  {
    label:'Largest topics',
    headline:'Largest topics',
    path:'(Publication) → (Topic)',
    table(){
      return {
        head:['Topic', 'Pubs', 'Female'],
        rows: BT_TOPICOS.slice(0, 5).map(r => [
          r[1].split(',').slice(0, 3).join(','),
          r[2].toLocaleString('en-US'),
          r[3].toFixed(1) + '%'
        ])
      };
    }
  },
  {
    label:'Who writes it',
    headline:'Who writes topic 0?',
    path:'(Fellow) → (Author) → (Publication) → (Topic)',
    table(){
      const g = BT_PERFIL[0].g, total = g.reduce((a, b) => a + b, 0);
      const labels = ['High', 'Upper-middle', 'Middle', 'Low', 'Abroad', 'Unknown'];
      return {
        head:['GSE', 'Share'],
        rows: g.map((v, i) => [labels[i], (v / total * 100).toFixed(1) + '%'])
      };
    }
  },
  {
    label:'Where published',
    headline:'Where is topic 0 published?',
    path:'(Publication) → (Topic) → (Journal)',
    table(){
      const c = BT_PERFIL[0].c, total = c.reduce((a, b) => a + b, 0);
      const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'No data'];
      return {
        head:['Quartile', 'Share'],
        rows: c.map((v, i) => [labels[i], (v / total * 100).toFixed(1) + '%'])
      };
    }
  }
];


/* Explore reuses the s3 schema interface, but every query must touch Topic. */
const TOPIC_SCHEMA_QUERIES = [
  {
    label:'Topic', icon:'fa-hashtag',
    headline:'What is the topic?',
    result:'237', unit:'topics',
    pattern:'MATCH (p:Publication)-[:HAS_TOPIC]->(t:Topic)\n'
          + 'RETURN t',
    nodes:['Publication','Topic'],
    links:['HAS_TOPIC']
  },
  {
    label:'Journals', icon:'fa-book-open',
    headline:'Where do topics publish?',
    result:'21,456', unit:'topic–journal paths',
    pattern:'MATCH (p:Publication)-[:HAS_TOPIC]->(t:Topic)\n'
          + 'MATCH (p)-[:IS_PUBLISHED_IN]->(j:Journal)\n'
          + 'RETURN p, t, j',
    nodes:['Publication','Topic','Journal'],
    links:['HAS_TOPIC','IS_PUBLISHED_IN']
  },
  {
    label:'Authors', icon:'fa-user-group',
    headline:'Who writes the topics?',
    result:'27,860', unit:'author–topic paths',
    pattern:'MATCH (f:Fellow)-[:HAS_SCOPUS_PROFILE]->(a:Author)\n'
          + '      -[:AUTHORED]->(p:Publication)\n'
          + '      -[:HAS_TOPIC]->(t:Topic)\n'
          + 'RETURN f, a, p, t',
    nodes:['Fellow','Author','Publication','Topic'],
    links:['HAS_SCOPUS_PROFILE','AUTHORED','HAS_TOPIC']
  },
  {
    label:'Fields', icon:'fa-layer-group',
    headline:'Which fields host the topics?',
    result:'45,404', unit:'topic–field paths',
    pattern:'MATCH (p:Publication)-[:HAS_TOPIC]->(t:Topic)\n'
          + 'MATCH (p)-[:IN_FIELD]->(fd:Field)\n'
          + 'RETURN p, t, fd',
    nodes:['Publication','Topic','Field'],
    links:['HAS_TOPIC','IN_FIELD']
  },
  {
    label:'Coauthors', icon:'fa-users',
    headline:'Who co-authors the topics?',
    result:'2,860,493', unit:'topic–coauthor paths',
    pattern:'MATCH (p:Publication)-[:HAS_TOPIC]->(t:Topic)\n'
          + 'MATCH (p)-[:COAUTHORED]->(c:Coauthor)\n'
          + 'RETURN p, t, c',
    nodes:['Publication','Topic','Coauthor'],
    links:['HAS_TOPIC','COAUTHORED']
  },
  {
    label:'Disciplines', icon:'fa-shapes',
    headline:'Which disciplines do topics cross?',
    result:'67,829', unit:'topic–discipline paths',
    pattern:'MATCH (a:Author)-[:AUTHORED]->(p:Publication)\n'
          + '      -[:HAS_TOPIC]->(t:Topic)\n'
          + 'MATCH (p)-[:IN_DISCIPLINE]->(pd:PubDiscipline)\n'
          + 'MATCH (a)-[:HAS_DISCIPLINE]->(ad:AuthorDiscipline)\n'
          + 'RETURN a, p, t, pd, ad',
    nodes:['Author','Publication','Topic','PubDiscipline','AuthorDiscipline'],
    links:['AUTHORED','HAS_TOPIC','IN_DISCIPLINE','HAS_DISCIPLINE']
  },
  {
    label:'Fellows', icon:'fa-user-graduate',
    headline:'Which fellows carry the topics?',
    result:'2,617', unit:'fellows with topics',
    pattern:'MATCH (f:Fellow)-[:HAS_SCOPUS_PROFILE]->(a:Author)\n'
          + '      -[:AUTHORED]->(p:Publication)\n'
          + '      -[:HAS_TOPIC]->(t:Topic)\n'
          + 'RETURN f, a, p, t',
    nodes:['Fellow','Author','Publication','Topic'],
    links:['HAS_SCOPUS_PROFILE','AUTHORED','HAS_TOPIC']
  },
  {
    label:'Territory', icon:'fa-location-dot',
    headline:'Where do topic authors come from?',
    result:'2,617', unit:'fellows with a school',
    pattern:'MATCH (h:HighSchool)<-[:STUDIED_SECONDARY_AT]-(f:Fellow)\n'
          + '      -[:HAS_SCOPUS_PROFILE]->(a:Author)\n'
          + '      -[:AUTHORED]->(p:Publication)\n'
          + '      -[:HAS_TOPIC]->(t:Topic)\n'
          + 'RETURN h, f, a, p, t',
    nodes:['HighSchool','Fellow','Author','Publication','Topic'],
    links:['STUDIED_SECONDARY_AT','HAS_SCOPUS_PROFILE','AUTHORED','HAS_TOPIC']
  }
];

let TOPIC_SCENE = null;
let BT_VIEW = null;
let topicIdx = 0;

function buildTopicSchemaMenu(){
  const host = document.getElementById('topic-schema-menu');
  if(!host || host.dataset.built) return;
  host.dataset.built = '1';
  TOPIC_SCHEMA_QUERIES.forEach((q, i) => {
    const el = document.createElement('div');
    el.className = 'mi';
    el.innerHTML = '<span class="mb"></span><i class="fa-solid ' + q.icon + ' ic" aria-hidden="true"></i><span class="ml"></span>';
    el.querySelector('.ml').textContent = q.label;
    el.addEventListener('click', () => Deck.setBeat(PIPE_N + i + 1));
    host.appendChild(el);
  });
}

function renderTopicSchemaTable(i){
  const q = TOPIC_SCHEMA_QUERIES[i];
  const ex = window.TOPIC_SCHEMA_EXAMPLES && q && window.TOPIC_SCHEMA_EXAMPLES[q.label];
  const title = document.getElementById('topic-table-title');
  const count = document.getElementById('topic-table-count');
  const table = document.getElementById('topic-table-grid');
  const panel = document.getElementById('topic-table');
  const profile = !!(q && q.label === 'Topic');
  if(!title || !table) return;
  if(panel) panel.classList.toggle('profile', profile);
  title.textContent = q ? q.label : '';
  table.replaceChildren();
  if(!ex) return;
  let source = ex.rows;
  if(profile && window.TOPIC_TOPIC_SEGMENTS && window.TABLE_FILTER_UI){
    const f = TABLE_FILTER_UI.state;
    const active = f.gender !== 'All' || f.class !== 'All' || f.territory !== 'All';
    if(active){
      const agg = new Map();
      for(const [topic, list] of Object.entries(window.TOPIC_TOPIC_SEGMENTS)){
        for(const seg of list){
          if(TABLE_FILTER_UI.matches(seg.meta)){
            agg.set(topic, (agg.get(topic) || 0) + seg.publications);
          }
        }
      }
      source = ex.rows.filter(r => agg.has(r[0]))
        .map(r => [r[0], r[1], agg.get(r[0])]);
    }
  }
  let data = source.map((row, k) => ({ row, meta: (profile ? null : (ex.meta && ex.meta[k])) }))
    .filter(x => !window.TABLE_FILTER_UI || profile || TABLE_FILTER_UI.matches(x.meta));
  if(window.TABLE_SORT_UI) data = TABLE_SORT_UI.sortData('topic', data);
  if(count) count.textContent = data.length.toLocaleString('en-US') + (profile ? ' topics' : ' rows');
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  const head = ex.head.slice();
  if(profile && head[head.length - 1] === 'Coherence') head.pop();
  if(ex.meta) head.splice(1, 0, 'Territory');
  const sorted = window.TABLE_SORT && TABLE_SORT.topic;
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
      TABLE_SORT_UI.toggleSort('topic', idx);
      if(window.TOPIC_UI) TOPIC_UI.refresh();
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
    const values = row.slice();
    if(profile && values.length > 3) values.pop();
    if(ex.meta) values.splice(1, 0, (meta && meta[2]) || 'Unknown');
    values.forEach(v => {
      const td=document.createElement('td'); const text=v==null?'':String(v);
      td.textContent=text; td.title=text; tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
}

function renderTopicSchemaQuery(i){
  topicIdx = i;
  if(window.TABLE_SORT) TABLE_SORT.topic = null;
  const q = TOPIC_SCHEMA_QUERIES[i];
  if(!q) return;
  document.getElementById('topic-schema-tax').textContent = String(i + 1).padStart(2, '0');
  document.getElementById('topic-schema-headline').textContent = q.headline;
  document.getElementById('topic-schema-result').innerHTML = q.result + '<small>' + q.unit + '</small>';
  document.getElementById('topic-schema-pattern').textContent = q.pattern;
  document.querySelectorAll('#topic-schema-menu .mi').forEach((el, k) => el.classList.toggle('on', k === i));
  if(window.Schema3D && Schema3D.active) Schema3D.active.setPath(q.nodes, q.links);
  renderTopicSchemaTable(i);
}

function showTopicSchema(s){
  if(s.classList.contains('topic-mode')) return;
  s.classList.add('topic-mode');
  document.getElementById('topic-schema').setAttribute('aria-hidden', 'false');
  buildTopicSchemaMenu();
  TOPIC_SCENE = window.Schema3D.mount(document.getElementById('topic-schema'));
  document.getElementById('topic-table').classList.remove('open');
  document.getElementById('topic-table').setAttribute('aria-hidden', 'true');
  if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(false);
  window.VIEW3D = {
    rotate(girar, inclinar){ if(window.Schema3D && Schema3D.active) Schema3D.active.nudge(girar * .018, inclinar * .015); },
    toggleOrbit(){ if(window.Schema3D && Schema3D.active) Schema3D.active.toggleOrbit(); },
    toggleEdges(){ if(window.Schema3D && Schema3D.active) Schema3D.active.toggleEdges(); },
    toggleLabels(){ if(window.Schema3D && Schema3D.active) Schema3D.active.toggleLabels(); }
  };
}

function hideTopicSchema(s){
  if(!s.classList.contains('topic-mode')) return;
  s.classList.remove('topic-mode');
  document.getElementById('topic-schema').setAttribute('aria-hidden', 'true');
  document.getElementById('topic-table').classList.remove('open');
  document.getElementById('topic-table').setAttribute('aria-hidden', 'true');
  if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(false);
  if(TOPIC_SCENE){ TOPIC_SCENE.destroy(); TOPIC_SCENE = null; }
  if(BT_VIEW) window.VIEW3D = BT_VIEW;
}

window.TOPIC_UI = {
  activo(){
    const s = document.querySelector('.slide.active[data-slide="topics"]');
    return !!s && s.classList.contains('topic-mode') && !Deck.indiceAbierto();
  },
  tabla(){
    const panel = document.getElementById('topic-table');
    if(!panel) return false;
    const open = !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.show(open);
    return open;
  },
  refresh(){ renderTopicSchemaTable(topicIdx); },
  prop(d){ if(this.activo()) Deck.query(d); }
};

function buildBtRail(s){
  const rail = s.querySelector('.bt-riel');
  if(!rail || rail.dataset.built) return;
  rail.dataset.built = '1';
  const items = PIPE.map(p => ({ label:p.corto, i:p }));
  items.push({ label:'Explore', table:true });
  rail.style.gridTemplateColumns = 'repeat(' + items.length + ',1fr)';
  rail.innerHTML = items.map((it, i) =>
    '<div class="bt-hito" data-i="' + i + '"><span class="bt-hk">'
    + (it.table ? '09' : it.i.k) + '</span><span class="bt-ht">'
    + it.label + '</span></div>').join('');
  rail.querySelectorAll('.bt-hito').forEach((h, i) => {
    h.addEventListener('click', () => Deck.setBeat(i < PIPE_N ? i + 1 : PIPE_N + 1));
  });
}

function buildTopicMenu(){
  const host = document.getElementById('tp-menu');
  if(!host || host.dataset.built) return;
  host.dataset.built = '1';
  TOPIC_QUERIES.forEach((q, i) => {
    const el = document.createElement('div');
    el.className = 'mi';
    el.innerHTML = '<span class="mb"></span><span class="ml"></span>';
    el.querySelector('.ml').textContent = q.label;
    el.addEventListener('click', () => Deck.setBeat(PIPE_N + i + 1));
    host.appendChild(el);
  });
}

function renderTopicTable(i){
  const q = TOPIC_QUERIES[i];
  if(!q) return;
  const data = q.table();
  document.getElementById('tp-headline').textContent = q.headline;
  document.getElementById('tp-path').textContent = q.path;
  document.querySelectorAll('#tp-menu .mi').forEach((el, k) => el.classList.toggle('on', k === i));

  if(i === 0){
    const sum = BT_TOPICOS.slice(0, 5).reduce((a, r) => a + r[2], 0);
    document.getElementById('tp-foot').textContent =
      sum.toLocaleString('en-US') + ' publications · ' +
      (sum / BT_CORPUS.publicaciones * 100).toFixed(1) + '% of the corpus';
  } else {
    const gi = i === 1 ? BT_PERFIL[0].g : BT_PERFIL[0].c;
    document.getElementById('tp-foot').textContent =
      gi.reduce((a, b) => a + b, 0).toLocaleString('en-US') +
      (i === 1 ? ' fellows with a recorded GSE' : ' publications with a quartile');
  }

  const table = document.getElementById('tp-table');
  table.innerHTML = '<thead><tr>' + data.head.map(h => '<th>' + h + '</th>').join('') + '</tr></thead>' +
    '<tbody>' + data.rows.map(r => '<tr>' + r.map((c, j) =>
      '<td' + (j ? ' class="num"' : '') + '>' + c + '</td>').join('') + '</tr>').join('') + '</tbody>';
}

function paintRail(s, active){
  s.querySelectorAll('.bt-hito').forEach((h, i) => {
    h.classList.toggle('on', i === active);
    h.classList.toggle('hecho', i < active);
  });
}

function renderPipeline(s, i){
  const paso = PIPE[i];
  if(!paso) return;
  s.classList.remove('modo-tabla');
  BT.arrancar(s.querySelector('#bt-lienzo'));
  BT.ir(paso.escena);
  BT.reencuadrar();
  BT.corrimiento = 0;

  s.querySelector('.bt-k').textContent = paso.k;
  s.querySelector('.bt-t').textContent = paso.t;
  s.querySelector('.bt-sub').textContent = paso.sub;

  const ec = s.querySelector('.bt-formula');
  ec.innerHTML = paso.formula || '';
  ec.classList.toggle('vacia', !paso.formula);
  s.querySelector('.bt-pie').innerHTML = paso.pie || '';
  s.querySelector('.bt-params').innerHTML = (BT_PANEL[paso.id] || (() => ''))();

  if(window.renderMathInElement){
    renderMathInElement(s.querySelector('.bt-ficha'), {
      delimiters:[{ left:'$$', right:'$$', display:true },
                  { left:'\\(', right:'\\)', display:false }],
      throwOnError:false
    });
  }
  /* Scale the formula to the column instead of clipping it. */
  ec.style.fontSize = '';
  const box = ec.clientWidth - 8;
  let max = ec.scrollWidth;
  ec.querySelectorAll('.katex-display').forEach(el => {
    const w = Math.max(el.scrollWidth, el.firstElementChild
      ? el.firstElementChild.getBoundingClientRect().width : 0);
    if(w > max) max = w;
  });
  if(max > box && box > 0) ec.style.fontSize = Math.max(.65, box / max).toFixed(3) + 'em';

  paintRail(s, i);
}

function renderTable(s, i){
  s.classList.add('modo-tabla');
  BT.arrancar(s.querySelector('#bt-lienzo'));
  BT.ir('topicos');
  BT.reencuadrar();
  BT.corrimiento = 0;
  renderTopicTable(i);
  paintRail(s, PIPE_N);
}

window.TOPICS_UI = {
  activo(){
    const s = document.querySelector('.slide.active[data-slide="topics"]');
    return !!s && !Deck.indiceAbierto();
  },
  prop(d){ if(this.activo()) Deck.query(d); }
};

let _topicsResize = null;

window.SCENES['topics'] = {
  mount(s){
    buildBtRail(s);
    buildTopicMenu();
    const cv = s.querySelector('#bt-lienzo');
    BT.arrancar(cv);
    _topicsResize = () => BT.dimensionar();
    window.addEventListener('resize', _topicsResize);
    BT_VIEW = {
      rotate(girar, inclinar){ BT.rotar(girar * .02, inclinar * .016); }
    };
    window.VIEW3D = BT_VIEW;
    const n = Math.max(1, Deck.beat);
    if(n <= PIPE_N) renderPipeline(s, n - 1);
    else {
      showTopicSchema(s);
      renderTopicSchemaQuery(n - PIPE_N - 1);
    }
  },
  beat(n, s){
    if(n <= PIPE_N){
      hideTopicSchema(s);
      renderPipeline(s, n - 1);
    } else {
      showTopicSchema(s);
      renderTopicSchemaQuery(n - PIPE_N - 1);
    }
  },
  destroy(){
    const active = document.querySelector('.slide[data-slide="topics"]');
    if(active) hideTopicSchema(active);
    BT.parar();
    if(_topicsResize){ window.removeEventListener('resize', _topicsResize); _topicsResize = null; }
    if(window.VIEW3D) window.VIEW3D = null;
  }
};
