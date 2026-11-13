/* =========================================================================
   DECK · fixed canvas, beats, navigation, index.
   A scene is one object per slide in window.SCENES: { mount, beat, destroy }.
   ========================================================================= */

const DESIGN_W = 1600;

const Deck = {
  slides: [], i: 0, beat: 1, maxBeat: 1, foco: 0,

  fit(){
    const stage = document.getElementById('stage');
    const z = window.innerWidth / DESIGN_W;
    stage.style.zoom = z;
    stage.style.width = DESIGN_W + 'px';
    stage.style.height = (window.innerHeight / z) + 'px';
    if(this.slides.length) this.placeAMW();
  },

  /* The single AMW mark lives outside the slides. On the cover it parks in
     the slot between authors and affiliations; elsewhere it returns to the
     corner and the move is a CSS transition. */
  placeAMW(){
    const el = document.getElementById('amw-corner');
    const s = this.slides[this.i];
    if(!el || !s || !s.classList.contains('active')) return;
    const isFinal = s.dataset.slide === 'close' && this.beat === this.maxBeat;
    if(!isFinal) el.classList.remove('final');
    if(s.dataset.slide !== 'cover' && !isFinal){ el.classList.remove('cover'); return; }
    const slot = document.getElementById(isFinal ? 'amw-final-slot' : 'amw-slot');
    if(!slot) return;
    const z = window.innerWidth / DESIGN_W;
    const sr = slot.getBoundingClientRect();
    const st = document.getElementById('stage').getBoundingClientRect();
    el.style.setProperty('--amw-x', ((sr.left + sr.width / 2 - st.left) / z).toFixed(2) + 'px');
    el.style.setProperty('--amw-y', ((sr.top - st.top) / z).toFixed(2) + 'px');
    el.classList.toggle('cover', s.dataset.slide === 'cover');
    el.classList.toggle('final', isFinal);
  },

  init(){
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.fit();
    window.addEventListener('resize', () => this.fit());
    this.buildIndex();
    this.bind();
    const h = this.hashIndex();
    this.go(h !== null ? h : 0, 1);
    document.body.classList.add('deck-ready');
    if(document.fonts && document.fonts.ready){
      document.fonts.ready.then(() => this.placeAMW());
    }
  },

  hashIndex(){
    const m = /^#s(\d+)$/.exec(location.hash);
    if(!m) return null;
    const n = parseInt(m[1], 10) - 1;
    return (n >= 0 && n < this.slides.length) ? n : null;
  },

  buildIndex(){
    const ix = document.getElementById('index');
    ix.innerHTML = '<h4>Index · ' + this.slides.length + ' slides</h4><div class="ix-grid"></div>';
    const grid = ix.querySelector('.ix-grid');
    this.slides.forEach((s, idx) => {
      const it = document.createElement('div');
      it.className = 'ix-item';
      it.dataset.idx = idx;
      it.innerHTML = '<span class="n">' + String(idx + 1).padStart(2, '0') + '</span>' +
                     '<span class="t"></span><span class="s"></span>';
      it.querySelector('.t').textContent = s.dataset.title || s.dataset.slide;
      it.querySelector('.s').textContent = s.dataset.sub || '';
      it.addEventListener('click', e => {
        e.stopPropagation();
        this.indice(false);
        this.go(idx, this.jumpBeat(idx));
      });
      grid.appendChild(it);
    });
    document.querySelector('#pager-n .tot').textContent = this.slides.length;
  },

  paintIndex(){
    document.querySelectorAll('#index .ix-item').forEach(it => {
      const idx = +it.dataset.idx;
      it.classList.toggle('on', idx === this.i);
      it.classList.toggle('foco', idx === this.foco);
    });
    const cur = document.querySelector('#pager-n .cur');
    if(cur) cur.textContent = this.i + 1;
    const pf = document.getElementById('progress-fill');
    if(pf){
      const pct = this.slides.length > 1 ? this.i / (this.slides.length - 1) * 100 : 100;
      pf.style.width = pct + '%';
    }
  },

  /* ---------- beats ---------- */
  maxBeatOf(s){
    let m = 1;
    s.querySelectorAll('[data-beat]').forEach(el => {
      const b = parseInt(el.dataset.beat, 10);
      if(b > m) m = b;
    });
    return m;
  },

  jumpBeat(idx){
    const s = this.slides[idx];
    const d = s ? parseInt(s.dataset.jump, 10) : NaN;
    return isNaN(d) ? 'end' : d;
  },

  applyBeats(){
    const s = this.slides[this.i];
    s.dataset.currentBeat = this.beat;
    s.querySelectorAll('[data-beat]').forEach(el => {
      const b = parseInt(el.dataset.beat, 10);
      el.classList.remove('beat-on', 'beat-dim', 'beat-hidden');
      if(b === 0 || b === this.beat) el.classList.add('beat-on');
      else if(b < this.beat) el.classList.add('beat-dim');
      else el.classList.add('beat-hidden');
    });
    const sc = window.SCENES && window.SCENES[s.dataset.slide];
    if(sc && sc.beat) sc.beat(this.beat, s);
    this.paintIndex();
    if(window.renderMathInElement){
      renderMathInElement(s, {
        delimiters:[{left:'$$',right:'$$',display:true},{left:'\\(',right:'\\)',display:false}],
        throwOnError:false
      });
    }
  },

  setBeat(n){
    this.beat = Math.max(1, Math.min(n, this.maxBeat));
    this.applyBeats();
    this.placeAMW();
  },

  /* ---------- navigation ---------- */
  go(idx, beat){
    if(idx < 0 || idx >= this.slides.length) return;
    const prev = this.slides[this.i];
    const same = !!prev && prev.classList.contains('active') && this.slides[idx] === prev;
    if(prev && !same){
      const ps = window.SCENES && window.SCENES[prev.dataset.slide];
      if(ps && ps.destroy) ps.destroy(prev);
      prev.classList.remove('active');
    }
    this.i = idx;
    const s = this.slides[idx];
    s.classList.add('active');
    if(window.TABLE_FILTER_UI) TABLE_FILTER_UI.closeAll();
    this.maxBeat = this.maxBeatOf(s);
    this.beat = (beat === 'end') ? this.maxBeat
             : Math.max(1, Math.min(beat || 1, this.maxBeat));
    history.replaceState(null, '', '#s' + (idx + 1));
    const sc = window.SCENES && window.SCENES[s.dataset.slide];
    if(!same && sc && sc.mount) sc.mount(s);
    this.applyBeats();
    this.placeAMW();
  },

  next(){
    if(this.beat < this.maxBeat){ this.setBeat(this.beat + 1); }
    else this.go(this.i + 1, 1);
  },
  prev(){
    if(this.beat > 1){ this.setBeat(this.beat - 1); }
    else this.go(this.i - 1, 'end');
  },

  /* ---------- index ---------- */
  indiceAbierto(){ return document.getElementById('index').classList.contains('open'); },
  indice(abrir){
    const ix = document.getElementById('index');
    const now = (abrir === undefined) ? !ix.classList.contains('open') : !!abrir;
    ix.classList.toggle('open', now);
    if(now){ this.foco = this.i; this.paintIndex(); }
  },
  moverFoco(paso){
    if(!this.indiceAbierto()) return;
    const n = this.slides.length;
    this.foco = ((this.foco === undefined ? this.i : this.foco) + paso + n) % n;
    this.paintIndex();
  },
  entrarFoco(){
    if(!this.indiceAbierto()) return false;
    const idx = this.foco === undefined ? this.i : this.foco;
    this.indice(false);
    this.go(idx, this.jumpBeat(idx));
    return true;
  },

  /* ---------- input ---------- */
  bind(){
    document.addEventListener('keydown', e => {
      if(this.indiceAbierto()){
        if(e.key === 'Escape' || e.key === 'm' || e.key === 'M'){ this.indice(false); e.preventDefault(); return; }
        if(e.key === 'ArrowDown' || e.key === 'ArrowRight'){ this.moverFoco(+1); e.preventDefault(); return; }
        if(e.key === 'ArrowUp' || e.key === 'ArrowLeft'){ this.moverFoco(-1); e.preventDefault(); return; }
        if(e.key === 'Enter'){ this.entrarFoco(); e.preventDefault(); return; }
      }
      if(e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown'){ e.preventDefault(); this.next(); }
      else if(e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); this.prev(); }
      else if(e.key === 'ArrowDown'){ e.preventDefault(); this.query(+1); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); this.query(-1); }
      else if(e.key === 'm' || e.key === 'M'){
        if(window.METHOD_UI && METHOD_UI.toggleCentrality && METHOD_UI.toggleCentrality()){ e.preventDefault(); return; }
        if(window.SCHEMA_UI && SCHEMA_UI.activo()) SCHEMA_UI.tabla();
        else if(window.TOPIC_UI && TOPIC_UI.activo()) TOPIC_UI.tabla();
        else this.indice();
      }
      else if(e.key === 'Escape'){ this.indice(); }
      else if(e.key === 'Home'){ this.go(0, 1); }
      else if(e.key === 'End'){ this.go(this.slides.length - 1, 'end'); }
    });

    document.querySelector('.navzone.right').addEventListener('click', () => this.next());
    document.querySelector('.navzone.left').addEventListener('click', () => this.prev());

    let tx = 0, ty = 0;
    document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, {passive:true});
    document.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? this.next() : this.prev();
    }, {passive:true});

    window.addEventListener('hashchange', () => {
      const n = this.hashIndex();
      if(n !== null && n !== this.i) this.go(n, 1);
    });
  },

  query(dir){
    const s = this.slides[this.i];
    if(s && ['graph', 'topics'].includes(s.dataset.slide)) this.setBeat(this.beat + dir);
  }
};

window.addEventListener('DOMContentLoaded', () => Deck.init());
