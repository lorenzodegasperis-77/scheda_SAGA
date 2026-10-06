'use strict';

/* ============ CONFIG — qui popoli azioni, tratti e costi ============ */
const CONFIG = {
  // punti totali = base + perGrado × Grado ; bonus Salute/Energia = bonus × Grado
  roles: {
    Minion:   { base: 8,  perGrado: 1, bonus: 1 },
    Standard: { base: 12, perGrado: 2, bonus: 2 },
    Boss:     { base: 16, perGrado: 3, bonus: 3 }
  },
  base: { stat: 3, dmg: 1, prot: 0 },   // valori di partenza (gratuiti)
  minStat: 2,                           // minimo per VIG / IST / MEN
  costo: { stat: 1, dmg: 1, prot: 1, hp: 1, en: 1 }, // punti per ogni +1 (−1 rende lo stesso valore)
  maxAzioni: { Minion: 1, Standard: 1, Boss: 2 },     // consigliato: avviso, non blocco
  // costo = punti (1, 2 o 3) · en = costo in Energia mostrato nella scheda
  azioni: [
    { id: 'az-1', nome: 'Azione speciale (1 pt)', costo: 1, en: '2 EN', desc: 'Placeholder: descrivi qui l’effetto.' },
    { id: 'az-2', nome: 'Azione speciale (2 pt)', costo: 2, en: '3 EN', desc: 'Placeholder: descrivi qui l’effetto.' },
    { id: 'az-3', nome: 'Azione speciale (3 pt)', costo: 3, en: '4 EN', desc: 'Placeholder: descrivi qui l’effetto.' }
  ],
  tratti: [
    { id: 'tr-1', nome: 'Tratto (1 pt)', costo: 1, desc: 'Placeholder: descrivi qui l’effetto.' },
    { id: 'tr-2', nome: 'Tratto (2 pt)', costo: 2, desc: 'Placeholder: descrivi qui l’effetto.' },
    { id: 'tr-3', nome: 'Tratto (3 pt)', costo: 3, desc: 'Placeholder: descrivi qui l’effetto.' }
  ]
};

/* ============ Utilità ============ */
const STORE = 'saga-png-generator';
const STATS = [['vig', 'VIG'], ['ist', 'IST'], ['men', 'MEN']];
const KEYS = { vig: 'stat', ist: 'stat', men: 'stat', dmg: 'dmg', prot: 'prot', hpAdj: 'hp', enAdj: 'en' };
const MINV = { vig: CONFIG.minStat, ist: CONFIG.minStat, men: CONFIG.minStat, dmg: CONFIG.base.dmg, prot: CONFIG.base.prot };
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => 'NPC-' + Math.random().toString(36).slice(2, 11).toUpperCase();
const clone = o => JSON.parse(JSON.stringify(o));
const sel = (list, ids) => list.filter(x => ids.includes(x.id));

const I = {
  save: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  up: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  sword: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* ============ Stato e calcoli ============ */
const blank = () => ({ id: uid(), nome: 'Nuovo PNG', grado: 1, ruolo: 'Minion', vig: 3, ist: 3, men: 3, dmg: 1, prot: 0, hpAdj: 0, enAdj: 0, az: [], tr: [], extra: [], p1: '', p2: '' });
let S = blank();
let saved = load();

function calc(p) {
  const r = CONFIG.roles[p.ruolo], b = r.bonus * p.grado;
  return { total: r.base + r.perGrado * p.grado, hp: p.vig * 2 + b + p.hpAdj, en: p.men * 2 + b + p.enAdj };
}
function spent(p) {
  const c = CONFIG.costo, b = CONFIG.base;
  let s = STATS.reduce((a, [k]) => a + (p[k] - b.stat) * c.stat, 0);
  s += (p.dmg - b.dmg) * c.dmg + (p.prot - b.prot) * c.prot + p.hpAdj * c.hp + p.enAdj * c.en;
  return s + sel(CONFIG.azioni, p.az).concat(sel(CONFIG.tratti, p.tr)).reduce((a, x) => a + x.costo, 0);
}
const left = () => calc(S).total - spent(S);

function canStep(k, d) {
  const cost = CONFIG.costo[KEYS[k]], c = calc(S);
  if (d > 0) return left() >= cost;
  if (k === 'hpAdj') return c.hp > 1;
  if (k === 'enAdj') return c.en > 0;
  if (k === 'vig' && c.hp - 2 < 1) return false;
  if (k === 'men' && c.en - 2 < 0) return false;
  return S[k] > MINV[k];
}

/* ============ Azioni dell'interfaccia ============ */
function step(k, d) { if (canStep(k, d)) { S[k] += d; render(); } }
function toggle(key, id) {
  const list = key === 'az' ? CONFIG.azioni : CONFIG.tratti, item = list.find(x => x.id === id);
  const i = S[key].indexOf(id);
  if (i >= 0) S[key].splice(i, 1);
  else if (item && left() >= item.costo) S[key].push(id);
  render();
}
function setRuolo(r) { S.ruolo = r; render(); }
function setGrado(g) { S.grado = g; render(); }
function setText(k, v) { S[k] = v; renderPoints(); renderSheet(); }
function resetPoints() {
  Object.assign(S, { vig: 3, ist: 3, men: 3, dmg: 1, prot: 0, hpAdj: 0, enAdj: 0, az: [], tr: [] });
  render();
}
function newPng() { S = blank(); render(); }

/* ============ Render ============ */
function renderPoints() {
  const c = calc(S), l = c.total - spent(S), max = CONFIG.maxAzioni[S.ruolo];
  const pct = Math.max(0, Math.min(100, (c.total - l) / c.total * 100));
  const warn = [];
  if (l < 0) warn.push(`Hai speso ${-l} punt${-l === 1 ? 'o' : 'i'} in più: togli qualcosa.`);
  if (S.az.length > max) warn.push(`Per un ${S.ruolo} si consiglia al massimo ${max} azion${max === 1 ? 'e speciale' : 'i speciali'}.`);
  $('points').innerHTML =
    `<div class="pt"><span>Punti disponibili</span><b class="${l < 0 ? 'bad' : ''}">${l}</b><span>/ ${c.total}</span>` +
    `<button class="rs" onclick="resetPoints()" title="Riporta tutto ai valori base">${ic('reset')} Azzera</button></div>` +
    `<div class="bar"><i style="width:${pct}%"></i></div>` + warn.map(w => `<p class="warn">${esc(w)}</p>`).join('');
}

const val = k => k === 'hpAdj' ? calc(S).hp : k === 'enAdj' ? calc(S).en : S[k];
const ROWS = [
  ['vig', 'VIG', 'stat', 'Vigore'], ['ist', 'IST', 'stat', 'Istinto'], ['men', 'MEN', 'stat', 'Mente'],
  ['dmg', 'Danno', 'dmg', ''], ['prot', 'Protezione', 'prot', ''],
  ['hpAdj', 'Salute', 'hp', 'VIG×2 + bonus'], ['enAdj', 'Energia', 'en', 'MEN×2 + bonus']
];
const row = ([k, l, c, h]) => {
  const man = (k === 'hpAdj' || k === 'enAdj') && S[k] ? ` · ${S[k] > 0 ? '+' : ''}${S[k]} manuale` : '';
  return `<div class="row"><div class="l">${l}<small>${h ? h + ' · ' : ''}${CONFIG.costo[c]} pt per +1${man}</small></div>` +
    `<div class="ctl"><button aria-label="Diminuisci ${l}" onclick="step('${k}',-1)" ${canStep(k, -1) ? '' : 'disabled'}>${ic('minus')}</button>` +
    `<b>${val(k)}</b>` +
    `<button aria-label="Aumenta ${l}" onclick="step('${k}',1)" ${canStep(k, 1) ? '' : 'disabled'}>${ic('plus')}</button></div></div>`;
};
const pick = (list, key) => list.map(x => {
  const on = S[key].includes(x.id), dis = !on && left() < x.costo;
  return `<label class="opt ${on ? 'on' : ''} ${dis ? 'dis' : ''}">` +
    `<input type="checkbox" ${on ? 'checked' : ''} ${dis ? 'disabled' : ''} onchange="toggle('${key}','${x.id}')">` +
    `<span class="nm">${esc(x.nome)}</span><b class="cost">${x.costo} pt</b><span class="ds">${esc(x.desc)}</span></label>`;
}).join('');

function renderForm() {
  $('form').innerHTML =
    `<label class="fld"><span>Nome</span><input type="text" value="${esc(S.nome)}" oninput="setText('nome',this.value)"></label>` +
    `<div class="fld"><span>Ruolo</span><div class="seg">${Object.keys(CONFIG.roles).map(r => `<button class="${S.ruolo === r ? 'on' : ''}" onclick="setRuolo('${r}')">${r}</button>`).join('')}</div></div>` +
    `<div class="fld"><span>Grado</span><div class="seg">${[1, 2, 3, 4, 5].map(g => `<button class="${S.grado === g ? 'on' : ''}" onclick="setGrado(${g})">${g}</button>`).join('')}</div></div>` +
    `<h2 class="sec">Statistiche</h2>${ROWS.map(row).join('')}` +
    `<h2 class="sec">Bersagli</h2>` +
    `<label class="fld"><span>Priorità I</span><input type="text" value="${esc(S.p1)}" oninput="setText('p1',this.value)"></label>` +
    `<label class="fld"><span>Priorità II (facoltativa)</span><input type="text" value="${esc(S.p2)}" oninput="setText('p2',this.value)"></label>` +
    `<h2 class="sec">Azioni speciali</h2>${pick(CONFIG.azioni, 'az')}` +
    `<h2 class="sec">Tratti</h2>${pick(CONFIG.tratti, 'tr')}`;
}

function renderSheet() {
  const c = calc(S);
  const pips = [1, 2, 3, 4, 5].map(i => `<svg class="pip ${i <= S.grado ? 'on' : ''}" viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="1" width="8" height="8" rx="1"/></svg>`).join('');
  const pri = [['I', S.p1], ['II', S.p2]].filter(([, t]) => t.trim());
  const az = sel(CONFIG.azioni, S.az), tr = sel(CONFIG.tratti, S.tr);
  const li = (n, extra, d) => `<li><b>${esc(n)}</b>${extra ? `<em>${esc(extra)}</em>` : ''}<p>${esc(d)}</p></li>`;
  const azH = az.map(a => li(a.nome, a.en, a.desc)).concat((S.extra || []).map(e => li(e.nome, e.cost, e.desc)));
  $('sheet').innerHTML =
    `<header><h2>${esc(S.nome || 'Senza nome')}</h2><div class="meta"><span>${S.ruolo}</span><span>Grado ${S.grado} ${pips}</span></div></header>` +
    `<div class="stats">${STATS.map(([k, l]) => `<div><small>${l}</small><b>${S[k]}</b></div>`).join('')}</div>` +
    `<div class="combat">${[['heart', 'SALUTE', c.hp], ['bolt', 'ENERGIA', c.en], ['sword', 'DANNO', S.dmg], ['shield', 'PROTEZIONE', S.prot]]
      .map(([i, l, v]) => `<div>${ic(i)}<small>${l}</small><b>${v}</b></div>`).join('')}</div>` +
    `<section class="blk"><h3>BERSAGLI</h3>${pri.length ? `<ol>${pri.map(([n, t]) => `<li><span class="tag">${n}</span>${esc(t)}</li>`).join('')}</ol>` : '<p class="empty">Nessuna priorità indicata.</p>'}</section>` +
    `<section class="blk"><h3>AZIONI SPECIALI</h3>${azH.length ? `<ol>${azH.join('')}</ol>` : '<p class="empty">Nessuna azione speciale.</p>'}</section>` +
    `<section class="blk"><h3>TRATTI</h3>${tr.length ? `<ol>${tr.map(t => li(t.nome, '', t.desc)).join('')}</ol>` : '<p class="empty">Nessun tratto.</p>'}</section>`;
}

function renderList() {
  $('count').textContent = `(${saved.length})`;
  $('list').innerHTML = (saved.length ? saved.map(p => `<div class="item">` +
    `<button class="nmb" onclick="loadPng('${p.id}')" title="Apri nell’editor">${esc(p.nome)}<small>${p.ruolo} · Grado ${p.grado}</small></button>` +
    `<button class="ic-only" onclick="dup('${p.id}')" aria-label="Duplica" title="Duplica">${ic('copy')}</button>` +
    `<button class="ic-only" onclick="exportOne('${p.id}')" aria-label="Esporta JSON" title="Esporta JSON">${ic('down')}</button>` +
    `<button class="ic-only del" onclick="del('${p.id}')" aria-label="Elimina" title="Elimina">${ic('trash')}</button></div>`).join('')
    : '<p class="empty">Nessun PNG salvato. Usa “Salva” per aggiungerlo alla lista.</p>') +
    (saved.length ? `<div class="item"><button onclick="exportAll()">${ic('down')} Esporta tutti</button></div>` : '');
}

function render() { renderPoints(); renderForm(); renderSheet(); renderList(); }

/* ============ Salvataggio locale ============ */
function load() { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; } }
function persist() {
  try { localStorage.setItem(STORE, JSON.stringify(saved)); }
  catch (e) { toast('Salvataggio locale non disponibile'); }
}
function save() {
  const i = saved.findIndex(x => x.id === S.id), c = clone(S);
  if (i < 0) saved.unshift(c); else saved[i] = c;
  persist(); renderList(); toast('PNG salvato');
}
function loadPng(id) { const p = saved.find(x => x.id === id); if (p) { S = clone(p); render(); window.scrollTo(0, 0); } }
function dup(id) {
  const p = saved.find(x => x.id === id); if (!p) return;
  const c = clone(p); c.id = uid(); c.nome += ' (copia)';
  saved.unshift(c); persist(); renderList();
}
function del(id) {
  const p = saved.find(x => x.id === id);
  if (!p || !confirm(`Eliminare “${p.nome}”?`)) return;
  saved = saved.filter(x => x.id !== id); persist(); renderList();
}

/* ============ Export / import JSON (formato database PNG dell'app SAGA) ============ */
function toApp(p) {
  const c = calc(p), A = sel(CONFIG.azioni, p.az), T = sel(CONFIG.tratti, p.tr);
  return {
    id: p.id, nome: p.nome, grado: p.grado, ruolo: p.ruolo,
    vig: p.vig, ist: p.ist, men: p.men,
    hp: c.hp, hpMax: c.hp, en: c.en, enMax: c.en, dmg: p.dmg, prot: p.prot,
    note: '', bersaglio: [p.p1, p.p2].filter(x => x && x.trim()),
    abilita: [
      ...A.map(a => ({ ability_name: a.nome, ability_description: a.desc, ability_cost: a.en || '' })),
      ...T.map(t => ({ ability_name: t.nome, ability_description: t.desc, ability_cost: 'N/A' })),
      ...(p.extra || []).map(e => ({ ability_name: e.nome, ability_description: e.desc, ability_cost: e.cost || 'N/A' }))
    ],
    ambientazioni: [],
    _gen: { hpAdj: p.hpAdj, enAdj: p.enAdj, az: p.az, tr: p.tr, extra: p.extra || [] }
  };
}
function fromApp(n) {
  const p = blank(), g = n._gen;
  Object.assign(p, {
    nome: n.nome, grado: Math.min(5, Math.max(1, n.grado || 1)),
    ruolo: CONFIG.roles[n.ruolo] ? n.ruolo : 'Standard',
    vig: n.vig, ist: n.ist || 3, men: n.men || 3, dmg: n.dmg || 1, prot: n.prot || 0,
    p1: (n.bersaglio || [])[0] || '', p2: (n.bersaglio || [])[1] || ''
  });
  if (g) Object.assign(p, { hpAdj: g.hpAdj || 0, enAdj: g.enAdj || 0, az: g.az || [], tr: g.tr || [], extra: g.extra || [] });
  else {
    const c = calc(p);
    p.hpAdj = (n.hpMax || n.hp || c.hp) - c.hp;
    p.enAdj = (n.enMax || n.en || 0) - c.en;
    p.extra = (n.abilita || []).map(a => ({ nome: a.ability_name, desc: a.ability_description, cost: a.ability_cost }));
  }
  return p;
}
function dl(name, data) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const fname = p => String(p.nome || 'png').replace(/\W+/g, '_') + '.npc.json';
function exportCur() { dl(fname(S), toApp(S)); }
function exportOne(id) { const p = saved.find(x => x.id === id); if (p) dl(fname(p), toApp(p)); }
function exportAll() { dl('png-saga.npc.json', saved.map(toApp)); }
function pickFile() { $('file').click(); }
$('file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result), list = (Array.isArray(data) ? data : [data]).filter(n => n && n.nome && n.vig);
      if (!list.length) throw new Error('nessun PNG valido');
      list.forEach(n => saved.unshift(fromApp(n)));
      persist(); toast(`${list.length} PNG importat${list.length === 1 ? 'o' : 'i'}`);
    } catch (err) { toast('File non valido: ' + err.message); }
    finally { e.target.value = ''; renderList(); }
  };
  r.onerror = () => { toast('Lettura del file non riuscita'); e.target.value = ''; };
  r.readAsText(f);
};

/* ============ Toast e avvio ============ */
let tt;
function toast(m) {
  const t = $('toast'); t.textContent = m; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2000);
}
$('toolbar').innerHTML = [['save', 'Salva', 'save()'], ['plus', 'Nuovo', 'newPng()'], ['down', 'Esporta JSON', 'exportCur()'], ['up', 'Importa', 'pickFile()'], ['print', 'Stampa / PDF', 'window.print()']]
  .map(([i, l, f]) => `<button onclick="${f}">${ic(i)} ${l}</button>`).join('');
render();
