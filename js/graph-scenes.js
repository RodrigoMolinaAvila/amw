/* =========================================================================
   COMMUNITY / FUTURE · the 496-node field and its two later scenes.
   ========================================================================= */

let CS = null;
let FS = null;
let FUTURE_TIMER = null;
let CM_SELECTED = 0;
let CM_KEY = null;

function communityActive(){
  const s = document.querySelector('.slide.active[data-slide="community"]');
  return !!s && !Deck.indiceAbierto();
}

function renderCommunityDetail(rank){
  const data = (typeof AMW_COMMUNITIES !== 'undefined') && AMW_COMMUNITIES[rank];
  if(!data) return;
  const kicker = document.getElementById('cm-kicker');
  const name = document.getElementById('cm-name-text');
  const dot = document.getElementById('cm-dot');
  const table = document.getElementById('cm-table');
  if(kicker) kicker.textContent = 'Community ' + String(rank + 1).padStart(2, '0') + ' / ' + AMW_COMMUNITIES.length + ' · Louvain ' + data.id;
  if(name) name.textContent = data.name;
  if(dot) dot.style.background = (typeof COM_COLORS !== 'undefined' ? COM_COLORS[rank] : '#1b4dff');
  if(table){
    const rows = [
      ['Fellows', data.fellows],
      ['Female', data.female.toFixed(1) + '%'],
      ['Q1 publications', data.q1.toFixed(1) + '%'],
      ['High GSE', data.highGse.toFixed(1) + '%'],
      ['Avg. publications', data.pubs.toFixed(1)],
      ['PageRank', data.pagerank.toFixed(3)],
      ['Dominant topic', data.topic]
    ];
    table.innerHTML = '<tbody>' + rows.map((r, i) =>
      '<tr' + (i === 6 ? ' class="topic"' : '') + '><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>'
    ).join('') + '</tbody>';
  }
}

function selectCommunity(rank){
  if(typeof AMW_COMMUNITIES === 'undefined' || !AMW_COMMUNITIES.length) return;
  CM_SELECTED = ((rank % AMW_COMMUNITIES.length) + AMW_COMMUNITIES.length) % AMW_COMMUNITIES.length;
  if(CS) CS.selectCommunity(CM_SELECTED);
  renderCommunityDetail(CM_SELECTED);
}

function onCommunityKey(e){
  if(!communityActive()) return;
  if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  e.preventDefault();
  e.stopPropagation();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  selectCommunity(CM_SELECTED + (e.key === 'ArrowDown' ? 1 : -1));
}

window.COMMUNITY_UI = {
  active: communityActive,
  select: selectCommunity,
  move(d){ if(this.active()){ selectCommunity(CM_SELECTED + d); return true; } return false; },
  prop(d){ return this.move(d); }
};

window.SCENES['community'] = {
  mount(s){
    CS = new GraphScene(s.querySelector('#community-canvas'), {
      mode:'community', query:4, cx:.68, cy:.52, scale:.38, labels:false
    });
    window.VIEW3D = CS;
    const cv = s.querySelector('#community-canvas');
    if(cv){
      cv.addEventListener('animationend', function onMorph(e){
        if(e.animationName !== 'cm-canvas-in') return;
        cv.removeEventListener('animationend', onMorph);
        if(CS) CS.resize();
      });
    }
    CM_KEY = onCommunityKey;
    window.addEventListener('keydown', CM_KEY, true);
    CM_SELECTED = 0;
    selectCommunity(0);
  },
  beat(){},
  destroy(){
    if(CM_KEY){ window.removeEventListener('keydown', CM_KEY, true); CM_KEY = null; }
    const ref = CS;
    if(CS){ CS.destroy(); CS = null; }
    if(window.VIEW3D === ref) window.VIEW3D = null;
  }
};

window.SCENES['future'] = {
  mount(s){
    FS = new GraphScene(s.querySelector('#future-canvas'), {
      mode:'future', query:4, cx:.70, cy:.56, scale:.42, labels:false
    });
    window.VIEW3D = FS;
    setFutureBeat(1);
  },
  beat(n){
    if(FS) setFutureBeat(n);
  },
  destroy(){
    const ref = FS;
    if(FS){ FS.destroy(); FS = null; }
    if(window.VIEW3D === ref) window.VIEW3D = null;
  }
};

const FUTURE_COPY = {
  1: { lead:'From the fellow node: the 21 communities already built.',
       note:'Baseline: fellows and their Leiden communities.',
       layout:'community', global:false, scale:.56, focus:'communities' },
  2: { lead:'Future work: analyze the co-author node and its collaboration network.',
       note:'GNN + causal inference: effects of funding on collaboration and trajectory.',
       layout:'coauthor', global:false, scale:.46, focus:'coauthor' },
  3: { lead:'Future work: analyze OpenAlex and the global collaboration system.',
       note:'Schematic OpenAlex-scale field; proportions are illustrative.',
       layout:'coauthor', global:true, scale:.30, focus:'openalex' },
  4: { lead:'Why do these collaboration structures emerge?',
       note:'ERGM: mechanisms that could unveil the stratification of sciences.',
       layout:'coauthor', global:false, scale:.42, focus:'ergm' }
};

function setFutureBeat(n){
  if(!FS) return;
  const c = FUTURE_COPY[n] || FUTURE_COPY[1];
  const l = document.getElementById('fu-lead');
  const note = document.getElementById('fu-note');
  if(l) l.textContent = c.lead;
  if(note) note.textContent = c.note;
  document.querySelectorAll('#fu-list li').forEach(li => li.classList.toggle('on', +li.dataset.i === n));
  FS.setLayout(c.layout);
  FS.setFutureFocus(c.focus);
  FS.setGlobalField(c.global);
  FS.opts.cx = .70;
  FS.opts.cy = .56;
  FS.opts.scale = c.scale;
  FS.dist = 3.35;
  FS.pitch = .34;
}


/* =========================================================================
   S5 · WHAT NOW? → schema self-loop → Leiden communities + heatmap.
   ========================================================================= */
let METHOD_SCENE = null;
let METHOD_COMMUNITY = null;
let METHOD_LOOP_RAF = 0;
let METHOD_SLIDE = null;
let METHOD_SELECTED = 0;
let METHOD_KEY = null;

const METHOD_HEAT_COLS = [
  ['fellows', 'Size', v => String(v), null],
  ['male', 'Male', v => v.toFixed(1) + '%', 'gender'],
  ['female', 'Female', v => v.toFixed(1) + '%', 'gender'],
  ['q1', 'Q1', v => v.toFixed(1) + '%', null],
  ['gseLow', 'Low GSE', v => v.toFixed(1) + '%', 'gse'],
  ['gseMid', 'Mid GSE', v => v.toFixed(1) + '%', 'gse'],
  ['gseUpper', 'Upper GSE', v => v.toFixed(1) + '%', 'gse'],
  ['gseHigh', 'High GSE', v => v.toFixed(1) + '%', 'gse'],
  ['pubs', 'Pubs avg', v => v.toFixed(1), null],
  ['regional', 'Regional', v => v.toFixed(1) + '%', 'origin'],
  ['center', 'Center', v => v.toFixed(1) + '%', 'origin']
];

function methodCommunityData(){
  if(!METHOD_COMMUNITY) return [];
  const gseKeys = [['Bajo','gseLow'], ['Medio','gseMid'], ['Medio alto','gseUpper'], ['Alto','gseHigh']];
  return METHOD_COMMUNITY.coms.map((c, rank) => {
    const nodes = c.ids.map(i => RED[i]);
    const n = nodes.length;
    const female = 100 * nodes.filter(x => !!x.female).length / n;
    const gseN = nodes.filter(x => gseKeys.some(k => k[0] === x.gse)).length;
    const gse = {};
    gseKeys.forEach(([label,key]) => {
      gse[key] = gseN ? 100 * nodes.filter(x => x.gse === label).length / gseN : 0;
    });
    const regs = nodes.map(x => (typeof RED_REGION !== 'undefined' ? RED_REGION[String(x.id)] : ''))
      .filter(r => r && r !== 'sin_informacion' && !/extranjer/i.test(r));
    const center = regs.length ? 100 * regs.filter(r => /Metropolitana/i.test(r)).length / regs.length : 0;
    const regional = regs.length ? 100 - center : 0;
    const qv = nodes.map(x => Number(x.pct_q1)).filter(x => isFinite(x) && x > 0);
    const pv = nodes.map(x => Number(x.pubs_during)).filter(x => isFinite(x));
    const q1 = qv.length ? qv.reduce((a,b) => a+b, 0) / qv.length : 0;
    const pubs = pv.length ? pv.reduce((a,b) => a+b, 0) / pv.length : 0;
    const tc = new Map();
    nodes.forEach(x => {
      const topic = RED_TOPICO[x.id];
      if(topic) tc.set(topic, (tc.get(topic) || 0) + 1);
    });
    const topics = [...tc.entries()].sort((a,b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
    return { rank, id:c.id, fellows:n, female, q1, pubs, topics, regional, center, gseLow:gse.gseLow, gseMid:gse.gseMid, gseUpper:gse.gseUpper, gseHigh:gse.gseHigh };
  });
}

function renderMethodCommunity(rank){
  const table = document.getElementById('method-table');
  const kicker = document.getElementById('method-kicker');
  const name = document.getElementById('method-community-name');
  const data = methodCommunityData();
  const d = data[rank];
  if(!table || !d) return;
  if(kicker) kicker.textContent = 'Community ' + String(rank + 1).padStart(2, '0') + ' / ' + data.length + ' · Leiden ' + (rank + 1);
  if(name) name.textContent = 'Leiden ' + (rank + 1);
  const genders = data.flatMap(x => [100 - x.female, x.female]);
  const gses = data.flatMap(x => [x.gseLow, x.gseMid, x.gseUpper, x.gseHigh]);
  const origins = data.flatMap(x => [x.regional, x.center]);
  const domains = {
    gender: [Math.min(...genders), Math.max(...genders)],
    gse: [Math.min(...gses), Math.max(...gses)],
    origin: [Math.min(...origins), Math.max(...origins)]
  };
  const head = '<thead><tr><th>Community</th>' + METHOD_HEAT_COLS.map(c => '<th>' + c[1] + '</th>').join('') + '</tr></thead>';
  const cells = METHOD_HEAT_COLS.map(([key, , fmt, heat]) => {
    const v = key === 'male' ? 100 - d.female : Number(d[key]) || 0;
    let style = '', high = '';
    if(heat){
      const [lo, hi] = domains[heat];
      const t = hi === lo ? .5 : (v - lo) / (hi - lo);
      style = ' style="background:rgba(27,77,255,' + (.055 + .925 * t).toFixed(3) + ')"';
      if(t > .58) high = ' heat-high';
    }
    return '<td class="' + high.trim() + '"' + style + ' title="' + key + '">' + fmt(v) + '</td>';
  }).join('');
  table.innerHTML = head + '<tbody><tr><td>Leiden ' + (rank + 1) + '</td>' + cells + '</tr></tbody>';
  const strip = document.getElementById('method-topics-strip');
  if(strip) strip.innerHTML = (d.topics || []).map(t => '<span class="method-topic">' + t + '</span>').join('');
}

function selectMethodCommunity(rank){
  if(!METHOD_COMMUNITY) return;
  const len = METHOD_COMMUNITY.coms.length;
  if(!len) return;
  METHOD_SELECTED = ((rank % len) + len) % len;
  METHOD_COMMUNITY.selectCommunity(METHOD_SELECTED);
  renderMethodCommunity(METHOD_SELECTED);
  if(methodCentralityActive()) renderCentralityPanel(METHOD_COMMUNITY.centralityMode);
}

function methodActive(){
  const s = document.querySelector('.slide.active[data-slide="method"]');
  return !!s && Deck.beat >= 4 && !Deck.indiceAbierto();
}

function methodCentralityActive(){
  const s = document.querySelector('.slide.active[data-slide="method"]');
  return !!s && Deck.beat >= 5 && !Deck.indiceAbierto();
}

function centralityTraits(mode){
  if(!METHOD_COMMUNITY || !METHOD_COMMUNITY.coms[METHOD_SELECTED]) return '';
  const com = METHOD_COMMUNITY.coms[METHOD_SELECTED];
  const nodes = com.ids.map(i => METHOD_COMMUNITY.nodes[i]).filter(p => p.centrality === mode);
  const label = mode === 'betweenness' ? 'betweenness' : 'closeness';
  if(!nodes.length) return 'No high-' + label + ' fellows in Leiden ' + (METHOD_SELECTED + 1) + '.';
  const n = nodes.length;
  const female = 100 * nodes.filter(p => !!p.n.female).length / n;
  const highGse = 100 * nodes.filter(p => p.n.gse === 'Alto').length / n;
  const regs = nodes.map(p => (typeof RED_REGION !== 'undefined' ? RED_REGION[String(p.n.id)] : ''))
    .filter(r => r && r !== 'sin_informacion' && !/extranjer/i.test(r));
  const regional = regs.length ? 100 * regs.filter(r => !/Metropolitana/i.test(r)).length / regs.length : null;
  const q1 = nodes.map(p => Number(p.n.pct_q1)).filter(v => isFinite(v) && v > 0);
  const pubs = nodes.map(p => Number(p.n.pubs_during)).filter(v => isFinite(v));
  const parts = [
    'High ' + label,
    'Leiden ' + (METHOD_SELECTED + 1),
    n + ' fellows',
    Math.round(female) + '% female',
    Math.round(highGse) + '% high GSE'
  ];
  if(regional != null) parts.push(Math.round(regional) + '% regional');
  if(q1.length) parts.push((q1.reduce((a,b) => a+b, 0) / q1.length).toFixed(0) + '% Q1');
  if(pubs.length) parts.push((pubs.reduce((a,b) => a+b, 0) / pubs.length).toFixed(1) + ' pubs');
  return parts.join(' · ');
}

function renderCentralityPanel(mode){
  const panel = document.querySelector('.method-centrality');
  if(panel) panel.dataset.metric = mode || 'betweenness';
  const traits = document.getElementById('centrality-traits');
  if(traits) traits.textContent = centralityTraits(mode || 'betweenness');
}

function setCommunityView(centrality){
  if(!METHOD_COMMUNITY) return;
  METHOD_COMMUNITY.opts.cx = .5;
  METHOD_COMMUNITY.opts.cy = centrality ? .82 : .53;
  METHOD_COMMUNITY.opts.scale = centrality ? .62 : .56;
  METHOD_COMMUNITY.resize();
}

function onMethodKey(e){
  if(!methodActive()) return;
  if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  e.preventDefault(); e.stopPropagation();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  selectMethodCommunity(METHOD_SELECTED + (e.key === 'ArrowDown' ? 1 : -1));
}

function bindMethodKeys(){
  if(METHOD_KEY) return;
  METHOD_KEY = onMethodKey;
  window.addEventListener('keydown', METHOD_KEY, true);
}

function unbindMethodKeys(){
  if(!METHOD_KEY) return;
  window.removeEventListener('keydown', METHOD_KEY, true);
  METHOD_KEY = null;
}

window.METHOD_UI = {
  active: methodActive,
  select: selectMethodCommunity,
  move(d){ if(this.active()){ selectMethodCommunity(METHOD_SELECTED + d); return true; } return false; },
  prop(d){ return this.move(d); },
  toggleCentrality(){
    if(!methodCentralityActive() || !METHOD_COMMUNITY) return false;
    renderCentralityPanel(METHOD_COMMUNITY.toggleCentrality());
    return true;
  }
};

function stopMethodLoop(){
  if(METHOD_LOOP_RAF){ cancelAnimationFrame(METHOD_LOOP_RAF); METHOD_LOOP_RAF = 0; }
}

function methodLoopFrame(){
  if(!METHOD_SCENE){ METHOD_LOOP_RAF = 0; return; }
  const p = METHOD_SCENE.nodeScreen('Fellow');
  const svg = document.getElementById('method-loop-svg');
  const path = document.getElementById('method-loop-path');
  const label = document.querySelector('.method-loop-label');
  if(p && svg && path && label){
    const stage = document.getElementById('stage');
    const sr = stage.getBoundingClientRect();
    const zoom = (sr.width / 1600) || 1;
    const W = 1600, H = sr.height / zoom;
    if(svg.getAttribute('viewBox') !== '0 0 ' + W + ' ' + H) svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const nx = (p.x - sr.left) / zoom, ny = (p.y - sr.top) / zoom;
    const nr = Math.max(18, (p.r || 0) / zoom) + 12;
    const d = 'M ' + (nx - nr * .2) + ' ' + (ny + nr * .9)
      + ' C ' + (nx + nr * 2.5) + ' ' + (ny + nr * 1.2) + ', '
      + (nx + nr * 2.4) + ' ' + (ny - nr * 2.4) + ', '
      + (nx + nr * .4) + ' ' + (ny - nr * .9);
    path.setAttribute('d', d);
    label.style.left = (nx + nr * 1.55).toFixed(1) + 'px';
    label.style.top = (ny - nr * 1.32).toFixed(1) + 'px';
  }
  METHOD_LOOP_RAF = requestAnimationFrame(methodLoopFrame);
}

function ensureMethodSchema(){
  if(METHOD_SCENE) return;
  const cv = document.getElementById('method-schema-canvas');
  if(!cv) return;
  METHOD_SCENE = window.Schema3D.mount(cv);
  METHOD_SCENE.setPath([], []);
  METHOD_SCENE.setSourceLogos(true);
  window.VIEW3D = {
    rotate(girar, inclinar){ if(METHOD_SCENE && METHOD_SCENE.nudge) METHOD_SCENE.nudge(girar * .018, inclinar * .015); },
    toggleOrbit(){ if(METHOD_SCENE && METHOD_SCENE.toggleOrbit) METHOD_SCENE.toggleOrbit(); }
  };
  METHOD_LOOP_RAF = requestAnimationFrame(methodLoopFrame);
}

function destroyMethodSchema(){
  stopMethodLoop();
  if(METHOD_SCENE){ METHOD_SCENE.destroy(); METHOD_SCENE = null; }
}

function ensureMethodCommunity(){
  if(METHOD_COMMUNITY) return;
  const cv = document.getElementById('method-community-canvas');
  if(!cv) return;
  METHOD_COMMUNITY = new GraphScene(cv, {
    mode:'community', communityKey:'leiden', query:4,
    cx:.5, cy:.53, scale:.56, labels:false
  });
  window.VIEW3D = METHOD_COMMUNITY;
  bindMethodKeys();
  METHOD_SELECTED = 0;
  selectMethodCommunity(0);
}

function destroyMethodCommunity(){
  unbindMethodKeys();
  if(METHOD_COMMUNITY){ METHOD_COMMUNITY.destroy(); METHOD_COMMUNITY = null; }
}

window.SCENES['method'] = {
  mount(s){
    METHOD_SLIDE = s;
  },
  beat(n){
    if(n === 3){ destroyMethodCommunity(); ensureMethodSchema(); }
    else if(n === 4){ destroyMethodSchema(); ensureMethodCommunity(); if(METHOD_COMMUNITY){ METHOD_COMMUNITY.showCentrality(false); setCommunityView(false); } }
    else if(n === 5){ destroyMethodSchema(); ensureMethodCommunity(); if(METHOD_COMMUNITY){ setCommunityView(true); renderCentralityPanel(METHOD_COMMUNITY.showCentrality(true, 'betweenness')); } }
    else { destroyMethodSchema(); destroyMethodCommunity(); }
  },
  destroy(){
    destroyMethodSchema();
    destroyMethodCommunity();
    METHOD_SLIDE = null;
    if(window.VIEW3D === METHOD_COMMUNITY) window.VIEW3D = null;
  }
};
