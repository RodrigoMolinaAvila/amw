/* =========================================================================
   MANDO · Xbox, one-handed, same grip and orientation as the thesis deck.

   The controller is held rotated 90°: what the system reports as ← points
   up from the hand. That is why 14 is "up" and 12 is "right" below.

     buttons  0 A · 1 B · 2 X · 3 Y · 4 LB · 5 RB · 6 LT · 7 RT
              8 View · 9 Menu · 10 L3 · 11 R3
              12 ↑ · 13 ↓ · 14 ← · 15 → · 16 Xbox · 17 Share
     axes     0 left X · 1 left Y · 2 right X · 3 right Y
   ========================================================================= */

const MAPEO = {
  botones: {
    14: 'propAnterior',    // reported ← = up in hand   · previous query
    15: 'propSiguiente',   // reported → = down in hand · next query
    12: 'beatSiguiente',   // reported ↑ = right in hand · advance
    13: 'beatAnterior',    // reported ↓ = left in hand  · go back

    0:  'beatSiguiente',   // A
    1:  'beatAnterior',    // B
    2:  'slideAnterior',   // X · previous slide
    11: 'cicloOrden',      // R3 · pause / resume orbit
    17: 'cicloViz',        // Share · edges on / off
    8:  'tabla',           // View · example result table
    9:  'indice'           // Menu · index
  },
  repetibles: new Set([12, 13, 14, 15]),
  IGNORAR: new Set([4, 5, 6, 7]),
  MENU_BOTONES: {
    4: 'focoAnterior',
    5: 'focoSiguiente',
    0: 'entrarFoco',
    1: 'cerrarIndice',
    9: 'indice'
  },
  MENU_REPETIBLES: new Set([4, 5])
};

const MANDO = {
  UMBRAL: .55,
  REPETIR: 420,
  _ultimo: {}, _botonPrev: {},
  activo: false,
  EJE_INDICE: { ejeIzqX:0, ejeIzqY:1, ejeDerX:2, ejeDerY:3 },
  SIGNO_3D: { girar: +1, inclinar: +1 },
  ZONA_MUERTA_3D: .14,

  stick3D(gp){
    const zm = v => Math.abs(v) < this.ZONA_MUERTA_3D ? 0 : v;
    const rx = zm(gp.axes[2] || 0);
    const ry = zm(gp.axes[3] || 0);
    const vertical = -rx;
    const horizontal = -ry;
    return {
      girar: this.SIGNO_3D.girar * horizontal,
      inclinar: this.SIGNO_3D.inclinar * vertical
    };
  },

  ui(){
    if(window.SCHEMA_UI && SCHEMA_UI.activo()) return SCHEMA_UI;
    if(window.TOPIC_UI && TOPIC_UI.activo()) return TOPIC_UI;
    if(window.TOPICS_UI && TOPICS_UI.activo()) return TOPICS_UI;
    return null;
  },

  acciones: {
    beatSiguiente: () => Deck.next(),
    beatAnterior: () => Deck.prev(),
    slideAnterior: () => Deck.go(Deck.i - 1, Deck.jumpBeat(Deck.i - 1)),
    propSiguiente: () => { const u = MANDO.ui(); u && u.prop && u.prop(+1); },
    propAnterior:  () => { const u = MANDO.ui(); u && u.prop && u.prop(-1); },
    cicloOrden:    () => { const u = MANDO.ui();
                           if(u && u.orbit) u.orbit();
                           else if(window.VIEW3D && VIEW3D.toggleOrbit) VIEW3D.toggleOrbit();
                           else if(window.VIEW3D) VIEW3D.auto = !VIEW3D.auto; },
    cicloViz:      () => { const u = MANDO.ui();
                           if(u && u.edges) u.edges();
                           else if(window.VIEW3D && VIEW3D.toggleEdges) VIEW3D.toggleEdges();
                           else if(window.VIEW3D) VIEW3D.showEdges = !VIEW3D.showEdges; },
    tabla:         () => {
      if(window.SCHEMA_UI && SCHEMA_UI.activo()) SCHEMA_UI.tabla();
      else if(window.TOPIC_UI && TOPIC_UI.activo()) TOPIC_UI.tabla();
    },
    cicloEje:      () => { const u = MANDO.ui();
                           if(u && u.view) u.view();
                           else if(window.VIEW3D && VIEW3D.toggleLabels) VIEW3D.toggleLabels();
                           else if(window.VIEW3D) VIEW3D.showLabels = !VIEW3D.showLabels; },
    indice:        () => Deck.indice(),
    focoAnterior:  () => Deck.moverFoco(-1),
    focoSiguiente: () => Deck.moverFoco(+1),
    entrarFoco:    () => Deck.entrarFoco(),
    cerrarIndice:  () => Deck.indice(false)
  },

  disparar(clave, accion){
    const t = performance.now();
    if(this._ultimo[clave] && t - this._ultimo[clave] < this.REPETIR) return;
    this._ultimo[clave] = t;
    const f = this.acciones[accion];
    if(f) f();
  },

  eje(nombre, valor, def){
    if(valor < -this.UMBRAL)      this.disparar(nombre, def.neg);
    else if(valor > this.UMBRAL)  this.disparar(nombre, def.pos);
    else delete this._ultimo[nombre];
  },

  sondear(){
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for(const g of gps) if(g && g.connected){ gp = g; break; }

    if(gp){
      if(!this.activo){ this.activo = true; this.avisar(true); }

      const menu = Deck.indiceAbierto();
      const s = document.querySelector('.slide.active');
      const in3D = !menu && s && ['graph', 'topics', 'community', 'future'].includes(s.dataset.slide) && window.VIEW3D;
      if(in3D){
        const s3 = this.stick3D(gp);
        if(s3.girar || s3.inclinar) VIEW3D.rotate(s3.girar * .035, s3.inclinar * .028);
      }

      const tabla = menu ? MAPEO.MENU_BOTONES : MAPEO.botones;
      Object.entries(tabla).forEach(([i, accion]) => {
        const n = +i;
        if(!menu && MAPEO.IGNORAR.has(n)) return;
        const b = gp.buttons[n];
        const p = !!(b && b.pressed);
        const repite = menu ? MAPEO.MENU_REPETIBLES.has(n) : MAPEO.repetibles.has(n);
        if(p && !this._botonPrev[n]){
          this._ultimo['b' + n] = 0;
          this.disparar('b' + n, accion);
        } else if(p && repite){
          this.disparar('b' + n, accion);
        } else if(!p){
          delete this._ultimo['b' + n];
        }
        this._botonPrev[n] = p;
      });
    } else if(this.activo){
      this.activo = false;
      this.avisar(false);
    }

    requestAnimationFrame(() => this.sondear());
  },

  avisar(on){
    const el = document.getElementById('mando-luz');
    if(el) el.classList.toggle('on', on);
  },

  init(){
    window.addEventListener('gamepadconnected', () => this.avisar(true));
    window.addEventListener('gamepaddisconnected', () => this.avisar(false));
    requestAnimationFrame(() => this.sondear());
  }
};

window.addEventListener('DOMContentLoaded', () => MANDO.init());
