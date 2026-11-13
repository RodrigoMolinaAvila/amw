/* =========================================================================
   GRAPH SCENE · canvas 3D, one instance per slide.
   The 496 nodes and 700 edges are the real intra-cohort component of the
   thesis artifact. Layouts are drawing decisions, not new data.
   ========================================================================= */

window.SCENES = window.SCENES || {};

const FIELD_COLORS = {
  'CIENCIAS NATURALES':          '#21918c',
  'CIENCIAS AGRICOLAS':          '#5cc863',
  'CIENCIAS MEDICAS Y DE SALUD': '#2a788e',
  'INGENIERÍA Y TECNOLOGÍA':     '#355f8d',
  'CIENCIAS SOCIALES':           '#414487',
  'HUMANIDADES':                 '#440154'
};
const FIELD_ORDER = [
  ['CIENCIAS NATURALES', 'Natural sciences'],
  ['CIENCIAS AGRICOLAS', 'Agricultural sciences'],
  ['CIENCIAS MEDICAS Y DE SALUD', 'Health sciences'],
  ['INGENIERÍA Y TECNOLOGÍA', 'Engineering & tech.'],
  ['CIENCIAS SOCIALES', 'Social sciences'],
  ['HUMANIDADES', 'Humanities']
];
const COM_COLORS = [
  '#1b4dff', '#0f9b8c', '#e07a1f', '#6b5dd3', '#2a788e', '#7a8b99',
  '#d1495b', '#e6a23c', '#5b8c5a', '#9d7bb5', '#3b9ab2', '#c75b12',
  '#4c78a8', '#f58518', '#54a24b', '#b279a2', '#e45756', '#72b7b2',
  '#eeca3b', '#9d755d', '#b0b0b0', '#7f3c8d', '#11a579', '#3969ac', '#f2b701', '#e73f74', '#80ba5a', '#e68310'
];
const INK = '#0a1020';
const GREY = '#a7b3c2';

const hexRGB = h => {
  const n = parseInt(h.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
};

class GraphScene {
  constructor(canvas, opts = {}){
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({
      mode:'base', interactive:true, cx:.56, cy:.50, scale:.40,
      alpha:1, labels:true
    }, opts);
    this.mode = this.opts.mode;
    this.communityKey = this.opts.communityKey || 'louvain';
    this.query = this.opts.query || 0;
    this.layout = 'base';
    this.yaw = -0.56; this.pitch = 0.42; this.dist = 3.15;
    this.vyaw = 0; this.vpitch = 0;
    this.auto = true; this.lastInput = -1e9;
    this.showEdges = true; this.showLabels = this.opts.labels;
    this.edgeAlpha = .12;
    this.labelA = 0; this.labelTarget = 0;
    this.satA = 0; this.satTarget = 0;
    this.t = 0; this.last = 0; this.raf = null; this.alive = false;
    this.w = 0; this.h = 0; this.dpr = 1;
    this._order = null; this._drag = null;

    this.build();
    this.nodes.forEach(p => { p.lift = 0; p.liftTarget = 0; p.centrality = null; });
    this.centralityMode = 'betweenness';
    this.centralityActive = false;
    this.scaleA = 0; this.scaleTarget = 0;
    this.motes = []; this._moteLastT = 0; this._moteSeed = 20261113;
    this.globalField = false; this.globalPts = []; this.futureFocus = null; this.buildGlobalField();
    this.buildLayouts();
    this.bind();
    this.resize();
    this._rs = () => this.resize();
    window.addEventListener('resize', this._rs);
    if(this.mode === 'cover'){
      this.layout = 'base';
      this.edgeAlpha = .13;
      this.nodes.forEach((p, i) => {
        const t = this.base[i];
        p.tx = t.x; p.ty = 0; p.tz = t.z;
      });
      this.labelTarget = 0;
      this.nodes.forEach(p => { p.x = p.tx; p.y = 0; p.z = p.tz; });
    } else {
      this.applyQuery(this.query, true);
    }
    this.start();
  }

  /* ------------------------------------------------------------- data */
  build(){
    const n = RED.length;
    const ix = new Map(RED.map((x, i) => [x.id, i]));
    const deg = new Float32Array(n);
    this.edges = [];
    RED_ARISTAS.forEach(([a, b]) => {
      const i = ix.get(a), j = ix.get(b);
      if(i == null || j == null) return;
      this.edges.push([i, j]);
      deg[i]++; deg[j]++;
    });

    const xs = RED.map(x => x.x0), ys = RED.map(x => x.y0);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = 2.15 / Math.max(x1 - x0, y1 - y0);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;

    this.base = RED.map((x, i) => ({
      x:(x.x0 - mx) * k, z:(x.y0 - my) * k
    }));

    this.communities = new Map();
    RED.forEach((x, i) => {
      const cid = x[this.communityKey];
      if(!this.communities.has(cid)) this.communities.set(cid, []);
      this.communities.get(cid).push(i);
    });
    this.coms = [...this.communities.entries()]
      .map(([id, ids]) => ({ id, ids, n:ids.length }))
      .sort((a, b) => b.n - a.n);
    this.comRank = new Map(this.coms.map((c, k) => [c.id, k]));

    this.p90 = (() => {
      const v = RED.map(x => x.betweenness).sort((a, b) => a - b);
      return v[Math.floor(v.length * .9)];
    })();
    this.prMax = Math.max(...RED.map(x => x.betweenness)) || 1;

    const c = FIELD_COLORS;
    this.nodes = RED.map((x, i) => {
      const rgb = hexRGB(c[x.oecd] || '#7a8b99');
      return {
        n:x, i, deg:deg[i],
        x:this.base[i].x, y:0, z:this.base[i].z,
        tx:this.base[i].x, ty:0, tz:this.base[i].z,
        cr:rgb[0], cg:rgb[1], cb:rgb[2],
        tr:rgb[0], tg:rgb[1], tb:rgb[2],
        a:1, ta:1, rad:3, trad:3, hl:false, ring:false
      };
    });

    this.fieldIndex = new Map(FIELD_ORDER.map((f, i) => [f[0], i]));
    this.buildSatellites();
  }

  buildGlobalField(){
    let s = 424242 >>> 0;
    const rnd = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    for(let i = 0; i < 3600; i++){
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2;
      const r = 2.15 + Math.cbrt(rnd()) * 1.75;
      const q = Math.sqrt(1 - u * u);
      this.globalPts.push({
        x:Math.cos(th) * q * r,
        y:u * r * .72,
        z:Math.sin(th) * q * r,
        r:.55 + rnd() * 1.15,
        a:.16 + rnd() * .34
      });
    }
  }

  setGlobalField(on){ this.globalField = !!on; }

  drawGlobalField(ctx){
    ctx.save();
    ctx.fillStyle = 'rgba(10,16,32,.42)';
    for(let i = 0; i < this.globalPts.length; i++){
      const p = this.globalPts[i];
      const q = this.project(p);
      if(q.f <= .08 || q.f > 1.8) continue;
      ctx.globalAlpha = p.a * Math.min(1, q.f * .9);
      ctx.beginPath();
      ctx.arc(q.sx, q.sy, Math.min(1.8, p.r * q.f), 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  buildSatellites(){
    let s = 7 >>> 0;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
    const out = [];
    this.nodes.forEach((p, i) => {
      const c = Math.max(1, p.n.coauthors || 1);
      const count = Math.min(80, 30 + Math.floor(Math.sqrt(c) * 2));
      for(let k = 0; k < count; k++){
        const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        const off = .028 + rnd() * .075;
        out.push({
          hub:i,
          ox:Math.cos(th) * r * off,
          oy:u * off * .8,
          oz:Math.sin(th) * r * off,
          a:.22 + rnd() * .42
        });
      }
    });
    this.sats = out;
  }

  /* ---------------------------------------------------------- layouts */
  buildLayouts(){
    const n = this.nodes.length;
    this.byField = FIELD_ORDER.map(() => []);
    this.nodes.forEach((p, i) => {
      const f = this.fieldIndex.has(p.n.oecd) ? this.fieldIndex.get(p.n.oecd) : 5;
      this.byField[f].push(i);
    });

    /* Field layout: six clusters on a ring, each node keeps its local shape. */
    this.field = new Array(n);
    const present = this.byField.map((ids, k) => ({ k, ids })).filter(f => f.ids.length);
    present.forEach((f, j) => {
      const a = (j / present.length) * Math.PI * 2 - Math.PI / 2;
      const R = 1.08;
      const cx = Math.cos(a) * R, cz = Math.sin(a) * R;
      const nf = f.ids.length, rad = .22 + .20 * Math.sqrt(nf / 120);
      f.ids.forEach((i, q) => {
        const ang = q * 2.39996 + j * .7;
        const rr = Math.sqrt((q + .5) / nf) * rad;
        this.field[i] = { x:cx + Math.cos(ang) * rr, y:(q % 3 - 1) * .018, z:cz + Math.sin(ang) * rr };
      });
      f.cx = cx; f.cz = cz; f.rad = rad; f.a = a;
    });
    this.fieldGroups = present;

    /* Community layout: communities on a ring, local KK shape inside each. */
    this.comTargets = new Array(n);
    this.comCenters = new Map();
    const K = this.coms.length;
    this.coms.forEach((c, j) => {
      const a = (j / K) * Math.PI * 2 - Math.PI / 2;
      const R = 1.12;
      const cx = Math.cos(a) * R, cz = Math.sin(a) * R;
      const cy = (j % 3 - 1) * .07;
      const rad = .07 + .20 * Math.sqrt(c.n / this.coms[0].n);
      let bx = 0, bz = 0;
      c.ids.forEach(i => { bx += this.base[i].x; bz += this.base[i].z; });
      bx /= c.n; bz /= c.n;
      c.ids.forEach(i => {
        const dx = this.base[i].x - bx, dz = this.base[i].z - bz;
        const lim = rad / Math.max(1e-6, Math.hypot(dx, dz));
        const sc = Math.min(1, lim);
        this.comTargets[i] = {
          x: cx + dx * sc, y: cy + (this.base[i].x % .03), z: cz + dz * sc
        };
      });
      this.comCenters.set(c.id, { x:cx, y:cy, z:cz, n:c.n, name:this.comName(j) });
    });

    /* Co-authorship layout: a Fibonacci sphere of cohort hubs. */
    this.coTargets = new Array(n);
    let s = 11 >>> 0;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
    this.nodes.forEach((p, i) => {
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const R = .55 + 1.30 * Math.cbrt(rnd());
      this.coTargets[i] = {
        x:Math.cos(th) * r * R,
        y:u * R * .78,
        z:Math.sin(th) * r * R
      };
    });
  }

  comName(j){
    return ['cell biology', 'synthesis', 'salmon genomics',
            'microbiology', 'patient-centred', 'neuroscience'][j] || '';
  }

  /* ----------------------------------------------------------- query */
  setQuery(q){
    if(q === this.query && this._applied) return;
    this.query = q;
    this.applyQuery(q);
  }

  applyQuery(q, instant){
    this._applied = true;
    this.labelTarget = 0;
    this.satTarget = 0;
    this.edgeAlpha = .10;

    /* reset */
    this.nodes.forEach(p => {
      p.hl = false; p.ring = false; p.ta = 1;
      const f = this.fieldIndex.has(p.n.oecd) ? this.fieldIndex.get(p.n.oecd) : 5;
      const rgb = hexRGB(FIELD_COLORS[FIELD_ORDER[f][0]] || GREY);
      p.tr = rgb[0]; p.tg = rgb[1]; p.tb = rgb[2];
    });

    if(q === 0){                                  // statistical · fields
      this.layout = 'field'; this.labelTarget = 1; this.edgeAlpha = .065;
      this.nodes.forEach((p, i) => {
        const t = this.field[i];
        p.tx = t.x; p.ty = t.y; p.tz = t.z;
      });

    } else if(q === 1){                           // causal · centrality relief
      this.layout = 'relief'; this.edgeAlpha = .045;
      this.nodes.forEach((p, i) => {
        const v = p.n.betweenness || 0;
        p.tx = this.base[i].x * 1.06; p.tz = this.base[i].z * 1.06;
        p.ty = Math.pow(v / this.prMax, .55) * 1.02;
        p.hl = v >= this.p90 && v > 0;
        p.ring = p.hl;
        const rgb = p.hl ? [27, 77, 255] : [150, 163, 178];
        p.tr = rgb[0]; p.tg = rgb[1]; p.tb = rgb[2];
        p.ta = p.hl ? 1 : .45;
      });

    } else if(q === 2){                           // demographic · geography
      this.layout = 'base'; this.edgeAlpha = .05;
      this.nodes.forEach((p, i) => {
        p.tx = this.base[i].x * .98; p.ty = 0; p.tz = this.base[i].z * .98;
        p.ta = .18;
        p.tr = 150; p.tg = 163; p.tb = 178;
      });

    } else if(q === 3){                           // institutional · elite origin
      this.layout = 'base'; this.edgeAlpha = .05;
      this.nodes.forEach((p, i) => {
        const elite = p.n.elite_undergrad === '1';
        p.tx = this.base[i].x; p.tz = this.base[i].z;
        p.ty = elite ? .16 : 0;
        p.hl = elite; p.ring = elite;
        const rgb = elite ? [27, 77, 255] : [160, 171, 184];
        p.tr = rgb[0]; p.tg = rgb[1]; p.tb = rgb[2];
        p.ta = elite ? 1 : .32;
      });

    } else if(q === 4){                           // community constellation
      this.layout = 'community'; this.labelTarget = 1; this.edgeAlpha = .20;
      this.nodes.forEach((p, i) => {
        const t = this.comTargets[i];
        p.tx = t.x; p.ty = t.y; p.tz = t.z;
        const cid = p.n[this.communityKey];
        const k = this.comRank.has(cid) ? this.comRank.get(cid) : 99;
        const rgb = hexRGB(COM_COLORS[k] || '#c2cbd6');
        p.tr = rgb[0]; p.tg = rgb[1]; p.tb = rgb[2];
        p.ta = .90; p.hl = false; p.ring = false;
      });
    }

    if(instant){
      this.nodes.forEach(p => {
        p.x = p.tx; p.y = p.ty; p.z = p.tz;
        p.cr = p.tr; p.cg = p.tg; p.cb = p.tb; p.a = p.ta;
      });
      this.labelA = this.labelTarget;
    }
  }

  setLayout(name){
    if(name === 'community'){ this.setQuery(4); return; }
    if(name === 'coauthor'){
      this.layout = 'coauthor';
      this.labelTarget = 0; this.satTarget = 1; this.edgeAlpha = 0;
      this.nodes.forEach((p, i) => {
        const t = this.coTargets[i];
        p.tx = t.x; p.ty = t.y; p.tz = t.z;
        const rgb = hexRGB('#1b4dff');
        p.tr = rgb[0]; p.tg = rgb[1]; p.tb = rgb[2];
        p.ta = .92; p.hl = false; p.ring = false;
      });
    }
  }

  highlightCommunities(ids){
    const set = new Set(ids);
    this.nodes.forEach(p => {
      const cid = p.n[this.communityKey];
        const k = this.comRank.has(cid) ? this.comRank.get(cid) : 99;
      const on = set.size === 0 || set.has(p.n.louvain);
      p.ta = on ? .98 : .07;
      p.hl = on && set.size > 0;
      const rgb = hexRGB(on ? (COM_COLORS[k] || GREY) : '#aeb9c6');
      p.tr = rgb[0]; p.tg = rgb[1]; p.tb = rgb[2];
    });
  }

  selectCommunity(rank){
    const ids = rank != null && this.coms[rank] ? this.coms[rank].ids : null;
    const order = new Map();
    if(ids) ids.forEach((node, j) => order.set(node, j));
    const n = ids ? ids.length : 0;
    this.nodes.forEach((p, i) => {
      const cid = p.n[this.communityKey];
        const k = this.comRank.has(cid) ? this.comRank.get(cid) : 99;
      const on = rank == null || k === rank;
      p.ta = rank == null ? .94 : (on ? .99 : .16);
      p.hl = rank != null && on;
      p.ring = rank != null && on;
      const rgb = hexRGB(COM_COLORS[k] || GREY);
      p.tr = rgb[0]; p.tg = rgb[1]; p.tb = rgb[2];
      if(ids && on){
        const j = order.get(i) || 0;
        const a = j * 2.399963;
        const r = .08 + .42 * Math.sqrt((j + 1) / n);
        p.tx = Math.cos(a) * r;
        p.ty = 0;
        p.tz = Math.sin(a) * r;
      } else {
        const t = this.comTargets[i];
        p.tx = t.x; p.ty = t.y; p.tz = t.z;
      }
    });
  }

  showCentrality(on, metric){
    if(metric) this.centralityMode = metric;
    this.centralityActive = !!on;
    this.scaleTarget = on ? 1 : 0;
    const key = this.centralityMode;
    const vals = this.nodes.map(p => Number(p.n[key]) || 0).sort((a,b) => a-b);
    const q = vals.length ? vals[Math.min(vals.length - 1, Math.floor(vals.length * .9))] : Infinity;
    this.nodes.forEach(p => {
      const v = Number(p.n[key]) || 0;
      const hit = on && v >= q && v > 0;
      p.centrality = hit ? key : null;
      p.liftTarget = hit ? (key === 'betweenness' ? .34 : .22) : 0;
    });
    return this.centralityMode;
  }

  toggleCentrality(){
    return this.showCentrality(true, this.centralityMode === 'betweenness' ? 'closeness' : 'betweenness');
  }

  setFutureFocus(mode){ this.futureFocus = mode || null; }

  drawFutureFocus(ctx){
    const mode = this.futureFocus;
    if(!mode) return;
    const accent = '#1b4dff';
    const chip = (text, x, y, align) => {
      const mono = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'monospace';
      ctx.font = '11px ' + mono;
      ctx.textAlign = align || 'center';
      const w = ctx.measureText(text).width;
      const left = align === 'left' ? x - 5 : align === 'right' ? x - w - 5 : x - w / 2 - 5;
      ctx.fillStyle = 'rgba(251,252,253,.94)';
      ctx.fillRect(left, y - 8, w + 10, 16);
      ctx.fillStyle = 'rgba(10,16,32,.70)';
      ctx.fillText(text, x, y);
    };
    const ring3 = (cx, cy, cz, rad, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for(let i = 0; i <= 48; i++){
        const a = i / 48 * Math.PI * 2;
        const q = this.project({ x:cx + Math.cos(a) * rad, y:cy, z:cz + Math.sin(a) * rad });
        i ? ctx.lineTo(q.sx, q.sy) : ctx.moveTo(q.sx, q.sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    ctx.save();
    ctx.shadowColor = 'rgba(251,252,253,.95)';
    ctx.shadowBlur = 6;
    if(mode === 'communities'){
      const center = this.comCenters ? [...this.comCenters.values()][0] : { x:0, y:0, z:0 };
      const q = this.project({ x:center.x, y:center.y, z:center.z });
      ring3(center.x, center.y, center.z, .18, accent);
      chip('fellow node → communities', q.sx, q.sy - 62, 'center');
    } else if(mode === 'coauthor'){
      const st = this.sats.find(v => v.hub === 0) || this.sats[0];
      const hub = this.nodes[st.hub];
      const q = this.project({ x:hub.x + st.ox, y:hub.y + st.oy, z:hub.z + st.oz });
      ctx.strokeStyle = '#e07a1f';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(q.sx, q.sy, 16, 0, 6.2832); ctx.stroke();
      chip('co-author → network', q.sx, q.sy - 30, 'center');
    } else if(mode === 'openalex'){
      const hub = this.nodes[this.sats.length ? this.sats[0].hub : 0];
      const c = this.project({ x:hub.x, y:hub.y, z:hub.z });
      ring3(hub.x, hub.y, hub.z, .14, accent);
      chip('co-author cluster', c.sx, c.sy - 32, 'center');
      chip('OPENALEX-SCALE', this.w * .70, 86, 'center');
    } else if(mode === 'gnn'){
      chip('GNN · causal paths', this.w * .62, this.h * .18, 'center');
    } else if(mode === 'ergm'){
      chip('mechanisms', this.w * .62, this.h * .18, 'center');
    }
    ctx.restore();
  }

  drawCentralityScale(ctx){
    const A = this.scaleA;
    if(A < .01) return;
    const between = this.centralityMode === 'betweenness';
    const max = between ? this.prMax : 1;
    const H = 1.0, AX = 0, AZ = 0;
    const ticks = between ? [0, 20, 30, 40] : [0, .5, 1];
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'monospace';
    const p0 = this.project({ x:AX, y:0, z:AZ });
    const p1 = this.project({ x:AX, y:H, z:AZ });
    const yOf = v => H * (v / max);
    const pt = (x, y, z) => this.project({ x, y, z });

    ctx.save();
    ctx.globalAlpha = A;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(251,252,253,.96)';
    ctx.shadowBlur = 7;

    /* 3D base ring, so the asset reads as part of the community */
    ctx.strokeStyle = 'rgba(10,16,32,.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i = 0; i <= 40; i++){
      const a = i / 40 * Math.PI * 2;
      const q = pt(AX + Math.cos(a) * .10, 0, AZ + Math.sin(a) * .10);
      i ? ctx.lineTo(q.sx, q.sy) : ctx.moveTo(q.sx, q.sy);
    }
    ctx.stroke();

    const label = (text, x, y, align, color) => {
      ctx.font = '12px ' + mono;
      ctx.textAlign = align;
      const m = ctx.measureText(text).width;
      const left = align === 'center' ? x - m / 2 - 4 : align === 'right' ? x - m - 4 : x - 4;
      ctx.fillStyle = 'rgba(251,252,253,.94)';
      ctx.fillRect(left, y - 8, m + 8, 16);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    /* vertical axis */
    ctx.strokeStyle = 'rgba(251,252,253,.88)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p0.sx, p0.sy);
    ctx.lineTo(p1.sx, p1.sy);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(10,16,32,.30)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p0.sx, p0.sy);
    ctx.lineTo(p1.sx, p1.sy);
    ctx.stroke();

    label(between ? 'BETWEENNESS' : 'CLOSENESS', p1.sx, p1.sy - 18, 'center', 'rgba(10,16,32,.62)');

    ticks.forEach(v => {
      const y = yOf(v);
      const q = pt(AX, y, AZ);
      const h1 = pt(AX - .035, y, AZ), h2 = pt(AX + .035, y, AZ);
      const z1 = pt(AX, y, AZ - .035), z2 = pt(AX, y, AZ + .035);
      ctx.strokeStyle = 'rgba(10,16,32,.30)';
      ctx.beginPath();
      ctx.moveTo(h1.sx, h1.sy); ctx.lineTo(h2.sx, h2.sy);
      ctx.moveTo(z1.sx, z1.sy); ctx.lineTo(z2.sx, z2.sy);
      ctx.stroke();
      label(between ? String(v) : (v === 0 ? '0' : v === 1 ? '1' : '.5'), q.sx + 12, q.sy, 'left', 'rgba(10,16,32,.68)');
    });

    if(between && this.p90){
      const y = yOf(this.p90);
      const a = pt(AX, y, AZ), b = pt(AX + .95, y, AZ);
      ctx.strokeStyle = '#e07a1f';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
      ctx.setLineDash([]);
      label('p90 · ' + Math.round(this.p90), a.sx - 9, a.sy, 'right', '#e07a1f');
    }

    ctx.restore();
  }

  /* ------------------------------------------------------------- loop */
  start(){
    if(this.alive) return;
    this.alive = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(t => this.frame(t));
  }
  stop(){
    this.alive = false;
    if(this.raf){ cancelAnimationFrame(this.raf); this.raf = null; }
  }

  resize(){
    const r = this.cv.getBoundingClientRect();
    if(!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.cv.width = Math.round(r.width * dpr);
    this.cv.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = r.width; this.h = r.height; this.dpr = dpr;
  }

  rotate(dx, dy){
    if(!this.opts.interactive) return;
    this.yaw += dx;
    this.pitch = Math.max(-1.15, Math.min(1.15, this.pitch + dy));
    this.lastInput = performance.now();
  }

  frame(now){
    if(!this.alive) return;
    const dt = Math.min(.05, (now - this.last) / 1000 || .016);
    this.last = now;
    this.t += dt;

    if(this.auto && now - this.lastInput > 2400) this.yaw += dt * (this.mode === 'cover' ? .011 : .022);
    this.yaw += this.vyaw * dt * 60;
    this.pitch += this.vpitch * dt * 60;
    this.pitch = Math.max(-1.15, Math.min(1.15, this.pitch));
    this.vyaw *= .90; this.vpitch *= .90;

    this.draw();
    this.raf = requestAnimationFrame(t => this.frame(t));
  }

  project(p){
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const x1 = p.x * cy - p.z * sy;
    const z1 = p.x * sy + p.z * cy;
    const y2 = p.y * cp - z1 * sp;
    const z2 = p.y * sp + z1 * cp;
    const f = this.dist / (this.dist + z2);
    const sc = Math.min(this.w, this.h) * this.opts.scale;
    return {
      sx: this.w * this.opts.cx + x1 * f * sc,
      sy: this.h * this.opts.cy - y2 * f * sc,
      z: z2, f
    };
  }

  draw(){
    const ctx = this.ctx, w = this.w, h = this.h;
    if(!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const a = 1 - Math.exp(-6 * .016);
    if(this.globalField) this.drawGlobalField(ctx);

    this.labelA += (this.labelTarget - this.labelA) * .07;
    this.satA += (this.satTarget - this.satA) * .05;
    this.scaleA += (this.scaleTarget - this.scaleA) * .09;

    const P = this.nodes;
    for(let i = 0; i < P.length; i++){
      const p = P[i];
      p.x += (p.tx - p.x) * a;
      p.y += (p.ty - p.y) * a;
      p.z += (p.tz - p.z) * a;
      p.cr += (p.tr - p.cr) * .10;
      p.cg += (p.tg - p.cg) * .10;
      p.cb += (p.tb - p.cb) * .10;
      p.a += (p.ta - p.a) * .10;
      p.lift += (p.liftTarget - p.lift) * .09;
      p._ = this.project({ x:p.x, y:p.y + p.lift, z:p.z });
      p._sx = p._.sx; p._sy = p._.sy; p._z = p._.z; p._f = p._.f;
      const baseR = this.mode === 'cover' ? 3.15
                  : this.layout === 'coauthor' ? 1.2
                  : this.layout === 'community' ? 2.7 : 2.4;
      p.trad = this.layout === 'coauthor'
             ? baseR + Math.min(2.2, Math.sqrt(p.deg) * .22)
             : baseR + Math.min(5.4, Math.sqrt(p.deg) * .66);
      p.rad += (p.trad - p.rad) * .10;
    }

    /* ---- edges ---- */
    if(this.showEdges && this.layout !== 'coauthor' && this.satA < .05){
      if(this.layout === 'community'){
        this.drawCommunityEdges(ctx);
      } else {
        this.drawBaseEdges(ctx);
      }
    }

    /* ---- tiny motes travelling along the cover relationships ---- */
    if(this.mode === 'cover' && this.showEdges) this.drawCoverMotes(ctx);

    /* ---- co-author halo ---- */
    if(this.satA > .015) this.drawSatellites(ctx);

    /* ---- nodes ---- */
    const order = this._order || (this._order = new Array(P.length));
    for(let i = 0; i < P.length; i++) order[i] = P[i];
    order.sort((x, y) => y._z - x._z);
    for(let i = 0; i < order.length; i++){
      const p = order[i];
      const r = p.rad * p._f;
      if(r < .25) continue;
      const alpha = Math.min(1, p.a * (.34 + .66 * p._f)) * this.opts.alpha;
      if(alpha < .02) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgb(' + (p.cr | 0) + ',' + (p.cg | 0) + ',' + (p.cb | 0) + ')';
      ctx.beginPath();
      ctx.arc(p._sx, p._sy, r, 0, 6.2832);
      ctx.fill();
      if(p.ring && this.opts.alpha > .5){
        ctx.globalAlpha = .55 * alpha;
        ctx.strokeStyle = '#1b4dff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p._sx, p._sy, r + 2.6, 0, 6.2832);
        ctx.stroke();
      }
      if(p.centrality && p.lift > .012){
        ctx.globalAlpha = Math.min(1, .85 * alpha);
        ctx.strokeStyle = p.centrality === 'betweenness' ? '#1b4dff' : '#e07a1f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p._sx, p._sy, r + 3.2, 0, 6.2832);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    /* ---- labels ---- */
    if(this.showLabels && this.labelA > .04){
      if(this.layout === 'field') this.drawFieldLabels(ctx);
      if(this.layout === 'community') this.drawComLabels(ctx);
    }

    if(this.futureFocus) this.drawFutureFocus(ctx);
    if(this.scaleA > .01) this.drawCentralityScale(ctx);
  }


  drawCoverMotes(ctx){
    const P = this.nodes;
    const now = this.t;
    const dt = Math.min(.05, now - (this._moteLastT || now));
    this._moteLastT = now;
    if(!this.motes.length && this.edges.length){
      for(let i = 0; i < 16; i++){
        this.motes.push({
          e:this.edges[Math.floor(this._randMote() * this.edges.length)],
          t:this._randMote(), speed:.07 + this._randMote() * .09,
          c:i % 3 === 0 ? '15,155,140' : '27,77,255'
        });
      }
    }
    for(let i = 0; i < this.motes.length; i++){
      const m = this.motes[i];
      m.t += m.speed * dt;
      if(m.t > 1){
        m.t -= 1;
        m.e = this.edges[Math.floor(this._randMote() * this.edges.length)];
      }
      const A = P[m.e[0]], B = P[m.e[1]];
      if(!A || !B) continue;
      const x = A._sx + (B._sx - A._sx) * m.t;
      const y = A._sy + (B._sy - A._sy) * m.t;
      const q = Math.max(0, m.t - .045);
      const tx = A._sx + (B._sx - A._sx) * q;
      const ty = A._sy + (B._sy - A._sy) * q;
      const a = Math.min(.42, Math.sin(Math.PI * m.t) * .42);
      ctx.strokeStyle = 'rgba(' + m.c + ',' + (a * .45) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(' + m.c + ',' + a + ')';
      ctx.beginPath();
      ctx.arc(x, y, 1.25, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _randMote(){
    this._moteSeed = (Math.imul(this._moteSeed, 1664525) + 1013904223) >>> 0;
    return this._moteSeed / 4294967296;
  }


  drawBaseEdges(ctx){
    const E = this.edges, P = this.nodes;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(10,16,32,' + this.edgeAlpha + ')';
    ctx.beginPath();
    for(let i = 0; i < E.length; i++){
      const A = P[E[i][0]], B = P[E[i][1]];
      const al = Math.min(A.a, B.a);
      if(al < .06) continue;
      ctx.moveTo(A._sx, A._sy);
      ctx.lineTo(B._sx, B._sy);
    }
    ctx.stroke();

    if(this.layout === 'relief' || this.query === 3){
      ctx.lineWidth = 1.15;
      ctx.strokeStyle = 'rgba(27,77,255,.34)';
      ctx.beginPath();
      for(let i = 0; i < E.length; i++){
        const A = P[E[i][0]], B = P[E[i][1]];
        if(!(A.hl && B.hl)) continue;
        ctx.moveTo(A._sx, A._sy);
        ctx.lineTo(B._sx, B._sy);
      }
      ctx.stroke();
    }
  }

  drawCommunityEdges(ctx){
    const E = this.edges, P = this.nodes;
    for(let i = 0; i < E.length; i++){
      const A = P[E[i][0]], B = P[E[i][1]];
      const same = A.n[this.communityKey] === B.n[this.communityKey];
      const cid = A.n[this.communityKey];
      const k = this.comRank.has(cid) ? this.comRank.get(cid) : 99;
      const on = same && A.hl && B.hl;
      ctx.globalAlpha = same ? (on ? .56 : .08) : .05;
      ctx.strokeStyle = same ? (COM_COLORS[k] || GREY) : 'rgba(10,16,32,.18)';
      ctx.lineWidth = on ? 1.15 : (same ? .95 : .6);
      ctx.beginPath();
      ctx.moveTo(A._sx, A._sy);
      ctx.lineTo(B._sx, B._sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawSatellites(ctx){
    const P = this.nodes;
    const pts = this.sats;
    const fade = Math.min(1, this.satA) * this.opts.alpha;

    /* A thin web: every fourth co-author keeps its tie to the fellow. */
    ctx.globalAlpha = fade * .07;
    ctx.strokeStyle = 'rgb(10,16,32)';
    ctx.lineWidth = .7;
    ctx.beginPath();
    for(let i = 0; i < pts.length; i += 4){
      const s = pts[i], p = P[s.hub];
      const q = this.project({ x:p.x + s.ox, y:p.y + s.oy, z:p.z + s.oz });
      ctx.moveTo(p._sx, p._sy);
      ctx.lineTo(q.sx, q.sy);
    }
    ctx.stroke();

    ctx.globalAlpha = fade * .30;
    ctx.fillStyle = 'rgb(10,16,32)';
    ctx.beginPath();
    for(let i = 0; i < pts.length; i++){
      const s = pts[i], p = P[s.hub];
      const q = this.project({ x:p.x + s.ox, y:p.y + s.oy, z:p.z + s.oz });
      const r = .7 + q.f * .5;
      ctx.rect(q.sx - r / 2, q.sy - r / 2, r, r);
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawFieldLabels(ctx){
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.fieldGroups.forEach(f => {
      const q = this.project({ x:f.cx, y:f.rad + .10, z:f.cz });
      const name = FIELD_ORDER[f.k][1].toUpperCase();
      const al = Math.min(1, this.labelA) * .92;
      ctx.globalAlpha = al;
      ctx.shadowColor = 'rgba(251,252,253,.98)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(10,16,32,.92)';
      ctx.font = '15px ' + mono;
      ctx.fillText(name, q.sx, q.sy - 14);
      ctx.fillStyle = 'rgba(10,16,32,.62)';
      ctx.font = '13px ' + mono;
      ctx.fillText(String(f.ids.length), q.sx, q.sy + 4);
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  drawComLabels(ctx){
    const mono = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.coms.slice(0, 6).forEach((c, j) => {
      const t = this.comCenters.get(c.id);
      if(!t || ![2, 3, 4].includes(j)) return;
      const dy = j === 4 ? 26 : -8;
      const q = this.project({ x:t.x, y:t.y + .32, z:t.z });
      const al = Math.min(1, this.labelA);
      ctx.globalAlpha = al * .95;
      ctx.shadowColor = 'rgba(251,252,253,.98)';
      ctx.shadowBlur = 9;
      ctx.fillStyle = COM_COLORS[j] || GREY;
      ctx.font = '15px ' + mono;
      ctx.fillText(t.name, q.sx, q.sy + dy);
      ctx.fillStyle = 'rgba(10,16,32,.72)';
      ctx.font = '13px ' + mono;
      ctx.fillText(c.n + ' fellows', q.sx, q.sy + dy + 17);
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  /* ---------------------------------------------------------- pointer */
  bind(){
    if(!this.opts.interactive) return;
    const cv = this.cv;
    cv.addEventListener('pointerdown', e => {
      this._drag = { x:e.clientX, y:e.clientY };
      cv.setPointerCapture(e.pointerId);
      this.auto = false;
      this.lastInput = performance.now();
    });
    cv.addEventListener('pointermove', e => {
      if(!this._drag) return;
      const dx = (e.clientX - this._drag.x) * .006;
      const dy = (e.clientY - this._drag.y) * .004;
      this._drag = { x:e.clientX, y:e.clientY };
      this.yaw += dx;
      this.pitch = Math.max(-1.15, Math.min(1.15, this.pitch + dy));
      this.vyaw = dx * .5; this.vpitch = dy * .4;
      this.lastInput = performance.now();
    });
    const up = e => {
      this._drag = null;
      this.auto = true;
      try{ cv.releasePointerCapture(e.pointerId); }catch(_){}
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      this.dist = Math.max(2.2, Math.min(4.6, this.dist + e.deltaY * .0016));
    }, { passive:false });
  }

  destroy(){
    this.stop();
    if(this._rs){ window.removeEventListener('resize', this._rs); this._rs = null; }
  }
}

window.GraphScene = GraphScene;

/* =========================================================================
   Scene hooks
   ========================================================================= */
let COVER = null;

window.SCENES['cover'] = {
  mount(s){
    const cv = s.querySelector('.cover-net');
    COVER = new GraphScene(cv, {
      mode:'cover', interactive:true, cx:.50, cy:.50, scale:.82, alpha:.90, labels:false
    });
    window.VIEW3D = COVER;
  },
  beat(){},
  destroy(){ const ref = COVER; if(COVER){ COVER.destroy(); COVER = null; } if(window.VIEW3D === ref) window.VIEW3D = null; }
};
