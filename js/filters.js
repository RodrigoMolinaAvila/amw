/* Shared filters for the example tables (s3 and Topic Explore). */
(function(){
  const state = window.TABLE_FILTERS = { gender:'All', class:'All', territory:'All' };
  const panel = document.getElementById('schema-filters');

  function matches(meta){
    if(!meta) return true;
    if(state.gender !== 'All' && meta[0] !== state.gender) return false;
    if(state.class === 'Other'){
      if(['Alto','Medio alto','Medio','Bajo'].includes(meta[1])) return false;
    } else if(state.class !== 'All' && meta[1] !== state.class) return false;
    if(state.territory === 'Other'){
      if(['Metropolitan','Regions'].includes(meta[2])) return false;
    } else if(state.territory !== 'All' && meta[2] !== state.territory) return false;
    return true;
  }

  function apply(){
    const s3 = document.querySelector('.slide.active[data-slide="graph"]');
    const topic = document.querySelector('.slide.active[data-slide="topics"].topic-mode');
    if(topic && window.TOPIC_UI && TOPIC_UI.refresh) TOPIC_UI.refresh();
    else if(s3 && window.SCHEMA_UI && SCHEMA_UI.refresh) SCHEMA_UI.refresh();
  }

  function show(open){
    if(!panel) return;
    panel.classList.toggle('open', !!open);
    panel.setAttribute('aria-hidden', String(!open));
  }

  function closeAll(){
    const a = document.getElementById('schema-table');
    const b = document.getElementById('topic-table');
    if(a){ a.classList.remove('open'); a.setAttribute('aria-hidden','true'); }
    if(b){ b.classList.remove('open'); b.setAttribute('aria-hidden','true'); }
    show(false);
  }

  document.querySelectorAll('#schema-filters .sf-group').forEach(group => {
    const key = group.dataset.group;
    group.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        state[key] = btn.dataset.value;
        group.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === btn));
        apply();
      });
    });
  });

  const sort = window.TABLE_SORT = { s3:null, topic:null };

  function sortData(which, data){
    const s = sort[which];
    if(!s) return data;
    const dir = s.dir;
    const norm = v => {
      if(v == null || v === '') return null;
      if(typeof v === 'number') return v;
      const t = String(v).trim();
      const n = Number(t.replace(/,/g, ''));
      return t !== '' && !Number.isNaN(n) ? n : t;
    };
    return data.slice().sort((a, b) => {
      const av = norm(a.row[s.col]), bv = norm(b.row[s.col]);
      if(av === null && bv === null) return 0;
      if(av === null) return 1;
      if(bv === null) return -1;
      if(typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'en', { numeric:true, sensitivity:'base' }) * dir;
    });
  }

  function toggleSort(which, col){
    const cur = sort[which];
    if(cur && cur.col === col) cur.dir *= -1;
    else sort[which] = { col, dir:1 };
  }

  window.TABLE_SORT_UI = { sort, sortData, toggleSort };
  window.TABLE_FILTER_UI = { state, matches, apply, show, closeAll };
})();
