/* =========================================================================
   COMMUNITY / FUTURE · the 496-node field and its two later scenes.
   ========================================================================= */

let CS = null;
let FS = null;
let FUTURE_TIMER = null;

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
  },
  beat(n){
    if(!CS) return;
    if(n >= 2) CS.highlightCommunities([0, 1, 2, 3, 4, 5]);
    else CS.highlightCommunities([]);
  },
  destroy(){
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
    FUTURE_TIMER = setTimeout(() => {
      if(FS){
        FS.setLayout('coauthor');
        FS.pitch = .34;
        FS.dist = 3.35;
        const note = document.getElementById('fu-note');
        if(note) note.textContent = 'Schematic: ' +
          FS.sats.length.toLocaleString('en-US') + ' of 113,221 co-authors.';
      }
    }, 420);
  },
  beat(){},
  destroy(){
    if(FUTURE_TIMER){ clearTimeout(FUTURE_TIMER); FUTURE_TIMER = null; }
    const ref = FS;
    if(FS){ FS.destroy(); FS = null; }
    if(window.VIEW3D === ref) window.VIEW3D = null;
  }
};
