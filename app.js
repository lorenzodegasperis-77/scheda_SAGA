// SAGA — Scheda personaggio · tappa 3
// Novità: talenti scelti da lista (select) con nome+descrizione+costo Energia; ottimizzazione spazi di stampa;
// rimosso il clipping "altezza fissa + overflow:hidden" su .sheet in stampa, che su Chrome genera la seconda
// pagina con i soli elementi in eccedenza invece di troncare correttamente (bug noto grid+overflow in print).
// Regole: manuale v0.9. Schema di export compatibile con i personaggi dell'app SAGA (chiavi vig/ins/min, cVig..., hpMax...).
const O={
  h:[['Nomade',1,0,-1],['Popolare',-1,1,0],['Discendente',0,-1,1],['Militare',1,-1,0],['Dotto',-1,0,1],['Marginale',0,1,-1]],
  c:[['Rigorosa',0,-1,2],['Vita di strada',-1,2,0],['Adottato',0,2,-1],['Isolato',2,0,-1],['Protetto',-1,0,2],['Cresciuto in guerra',2,-1,0]],
  p:[['Esploratore',0,2,0],['Mercenario',2,0,0],['Erudito',0,0,2],['Furfante',0,1,1],['Guaritore',1,1,0],['Artigiano/Inventore',1,0,1]]
};
const K=['vig','ins','min'],LB={vig:'VIG',ins:'IST',min:'MEN'},FLD={h:'heritage',c:'childhood',p:'profession'};
const KEY='saga-sheet-chars',ACT='saga-sheet-active';
const RS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
const LOGO='<svg viewBox="0 0 100 100" aria-label="SAGA"><rect x="6" y="28" width="88" height="34" fill="none" stroke="#fff" stroke-width="1.5"/><text x="50" y="54" text-anchor="middle" font-family="Courier New,monospace" font-weight="900" font-size="30" fill="#fff">SAGA</text><g fill="#fff" font-family="Courier New,monospace" font-size="6.2" text-anchor="middle"><text x="50" y="72">ADAPTABLE RPG</text><text x="50" y="80">SOLO / GROUP</text><text x="50" y="88">NO-DM OPTION</text></g></svg>';

// ── Equipaggiamento di base (manuale v0.9) ──
const WEAPONS=[['Arma semplice',2,15,'1 slot'],['Arma letale',3,25,'2 slot'],['Armi a distanza leggere',1,20,'1 slot'],['Armi a distanza medie',2,35,'2 slot'],['Armi a distanza pesanti',4,70,'3 slot']];
const ARMORS=[['Protezione leggera',1,20,'1 slot'],['Protezione media',2,50,'2 slot'],['Protezione pesante',3,100,'3 slot'],['Protezione secondaria',1,40,'1 slot']];
const SPECIAL=[['Accendino antivento',5,'5 = 1 slot'],['Ampolla incendiaria',70,'2 = 1 slot'],['Antitossina',10,'2 = 1 slot'],['Barretta energetica',10,'5 = 1 slot'],['Binocolo',45,'1 slot'],['Bussola/GPS',30,'1 slot'],['Calmante',20,'2 = 1 slot'],['Calzari silenziosi',60,'1 slot'],['Catena',20,'1 slot'],['Cavo dati/link',25,'1 slot'],['Corda (10m)',10,'1 slot'],['Corno',5,'1 slot'],['Cunei di ferro',10,'3 = 1 slot'],['Dose di adrenalina',100,'2 = 1 slot'],['Fascette stringicavo',5,'10 = 1 slot'],['Fischietto acuto',5,'1 slot'],['Gessetti colorati',5,'5 = 1 slot'],['Granata stordente',85,'2 = 1 slot'],['Grimaldello',5,'3 = 1 slot'],['Incensiere',40,'1 slot'],['Kit da scrittura',35,'1 slot'],['Lanterna',30,'1 slot'],['Mantello cerato',20,'1 slot'],['Mantice (1 uso)',5,'1 slot'],['Maschera filtrante',40,'1 slot'],['Medicina',40,'2 = 1 slot'],['Coltellino svizzero',15,'1 slot'],['Olio infiammabile',20,'2 = 1 slot'],['Olio per lanterna (1 dose)',5,'5 = 1 slot'],['Piede di porco',10,'1 slot'],['Polvere fluorescente',40,'2 = 1 slot'],['Polvere irritante',35,'2 = 1 slot'],['Rampino',25,'1 slot'],['Razione',5,'0 slot'],['Rete',20,'1 slot'],['Sabbia del sonno',80,'2 = 1 slot'],['Sacchetto di biglie',15,'3 = 1 slot'],['Sacco',15,'0 slot'],['Sali rinvenenti',25,'3 = 1 slot'],['Scanner portatile',90,'1 slot'],["Specchio d'acciaio",10,'1 slot'],['Spray tracciante',10,'2 = 1 slot'],['Tablet hacker',35,'1 slot'],['Talismano protettivo',70,'1 slot'],['Tenda (1 uso)',30,'2 slot'],['Tonico',35,'2 = 1 slot'],['Torcia',5,'3 = 1 slot'],['Unguento curativo',40,'2 = 1 slot'],['Zaino',60,'0 slot']];
const WPN={};WEAPONS.forEach(w=>WPN[w[0]]=w[1]);
const ARM={};ARMORS.forEach(a=>ARM[a[0]]=a[1]);
const ITEMS={};
WEAPONS.forEach(w=>ITEMS[w[0]]={c:w[2],s:w[3]});
ARMORS.forEach(a=>ITEMS[a[0]]={c:a[2],s:a[3]});
SPECIAL.forEach(x=>ITEMS[x[0]]={c:x[1],s:x[2]});
const NO_OFFHAND=['Arma letale','Armi a distanza medie','Armi a distanza pesanti'];
const EQ_REQ={'Arma letale':['Combattente brutale',1],'Armi a distanza medie':['Tiratore scelto',1],'Armi a distanza pesanti':['Tiratore scelto',2],'Protezione media':['Protezioni agili',1],'Protezione pesante':['Maestro di protezioni',1]};

// ── Talenti (manuale v0.9) ── [car, nome, costo('-'/'2'/'4'), req, max, descrizione]
// NB per Lorenzo: questo è l'unico punto da modificare per aggiornare/estendere la lista talenti scelta dalla scheda.
const TALENTS=[
  ['VIG','Combattente esperto','-',{},3,"Ottieni un bonus di Danno pari a n quando attacchi con un'arma."],
  ['VIG','Salute ferrea','-',{tal:'Immunità'},1,"La tua Salute aumenta permanentemente di un ammontare pari a due volte il tuo livello. Si applica anche ai successivi aumenti di livello."],
  ['VIG','Maestro di protezioni','-',{tal:'Protezioni agili'},1,"Puoi equipaggiare protezioni pesanti."],
  ['VIG','Combattente brutale','-',{},1,"Puoi equipaggiare armi letali."],
  ['VIG','Immunità','-',{lvl:2},1,"Hai sviluppato un fisico avvezzo alla resistenza. Ottieni vantaggio alle prove per resistere agli effetti dei veleni e delle malattie."],
  ['VIG','Presenza minacciosa','2',{},1,"Nel tuo turno scegli un PNG che vedi. Finché non supera una prova di IST, subisce una condizione di grado 2 al VIG se attacca bersagli diversi da te."],
  ['VIG','Scudo di carne','2',{},1,"Nel tuo turno aumenti per due turni la Protezione di un valore pari a metà del VIG (appr. per difetto). Poi il tuo VIG è ridotto dello stesso valore per due turni."],
  ['VIG','Colpo devastante','2',{lvl:4},2,"Quando colpisci con un'arma semplice o letale, puoi aumentare il Danno di n+2. Se lo fai, subisci una condizione di grado n al VIG fino alla fine del tuo prossimo turno."],
  ['VIG','Resilienza Feroce','2',{lvl:4},1,"Quando subisci Danno, puoi ridurlo di metà del tuo VIG (appr. per difetto). Nel tuo prossimo turno non puoi muoverti né attaccare."],
  ['VIG','Difesa impenetrabile','2',{},1,"Quando subisci Danno da un attacco mentre usi uno scudo, puoi aumentare la tua Protezione di 2. L'effetto termina dopo aver subito Danno."],
  ['VIG','Rigenerazione rapida','2',{lvl:4},1,"Una volta per combattimento, puoi recuperare punti Salute pari a metà del tuo VIG (appr. per difetto)."],
  ['VIG','Furia cieca','4',{vig:8},1,"Quando hai meno di metà Salute, puoi aumentare il tuo VIG di 2 fino alla fine del combattimento riducendo la tua Protezione a 0. Non puoi usare abilità speciali."],
  ['VIG','Combattimento con armi letali','4',{vig:8},1,"Quando attacchi con un'arma letale puoi aumentare il tuo VIG di 1 per il tiro per colpire. Se lo fai il Danno inflitto aumenta di 2."],
  ['VIG','Colpo multiplo','4',{lvl:6},1,"Quando attacchi con un'arma semplice o letale puoi rinunciare alla seconda azione per attaccare più nemici: scegli fino a 5 bersagli vicini ed effettua un attacco per ognuno."],
  ['VIG','Colpo stordente','4',{},1,"Quando attacchi con un'arma semplice o letale, puoi sottrarre 2 al tuo VIG. Se l'attacco va a segno infligge 6 danni aggiuntivi e una condizione di grado 2 a VIG o IST del PNG colpito."],
  ['IST','Maestro artigiano','-',{},1,"Hai vantaggio alla prova di IST quando tenti di riparare un oggetto o capirne il funzionamento."],
  ['IST','Combattere con due armi','-',{ist:8},1,"Quando attacchi con un'arma semplice per mano, aggiungi 1 al tuo VIG e al Danno."],
  ['IST','Tiratore scelto','-',{},2,"Puoi equipaggiare armi a distanza medie. Con n pari a 2 puoi equipaggiare anche armi a distanza pesanti."],
  ['IST','Esperto di armi a distanza','-',{lvl:6},1,"Puoi utilizzare armi a distanza pesanti senza subire la diminuzione all'IST."],
  ['IST','Sopravvivenza','-',{},1,"Hai vantaggio alla prova di IST quando tenti di avvistare oggetti lontani, cercare cibo, acqua o luoghi nascosti."],
  ['IST','Protezioni agili','-',{},1,"Puoi equipaggiare protezioni medie."],
  ['IST','Acrobata','2',{},1,"Hai vantaggio alla prova di IST quando esegui acrobazie ardite, come camminare su una corda o saltare da un tetto all'altro."],
  ['IST','Colpo mirato','2',{lvl:6},1,"Una volta per turno puoi avere vantaggio a tutti i tuoi tiri per colpire durante il tuo turno (non richiede un'azione)."],
  ['IST','Escapista','2',{lvl:6},1,"Una volta per round quando un PNG ti colpisce puoi effettuare un tiro di IST. Se lo superi, neghi totalmente il danno ricevuto."],
  ['IST','Mani veloci','2',{},1,"Hai vantaggio alla prova di IST quando tenti di borseggiare o manipolare piccoli oggetti."],
  ['IST','Passare inosservato','2',{},1,"Hai vantaggio alla prova di IST quando effettui una prova per agire furtivamente."],
  ['IST','Assassino delle ombre','4',{lvl:6},1,"Quando sei nascosto e colpisci un bersaglio con un'arma semplice o armi a distanza leggera/media, raddoppia i danni inflitti."],
  ['IST','Esperto duelista','4',{lvl:8},1,"Quando usi un'arma per mano infliggi Danno aggiuntivo pari a metà del tuo IST (appr. per difetto). Se il bersaglio è già ferito, aggiungi 1 al Danno di ogni attacco."],
  ['IST','Riflessi rapidi','4',{ist:8},1,"Ottieni un bonus di +1 alla tua IST quando è necessario determinare l'ordine di combattimento."],
  ['IST','Tiro Preciso','4',{},1,"Quando attacchi con armi a distanza hai vantaggio alla prova IST."],
  ['MEN','Abile nella psiche','-',{},Infinity,"Scegli 2 abilità speciali istantanee dalla lista. Può essere scelto più volte."],
  ['MEN','Abilità temporale - Primordiale','-',{},1,"Puoi eseguire abilità speciali temporali i cui effetti rientrino nella disciplina di Primordiale."],
  ['MEN','Abilità temporale - Materiale','-',{},1,"Puoi eseguire abilità speciali temporali i cui effetti rientrino nella disciplina di Materiale."],
  ['MEN','Abilità temporale - Spirituale','-',{},1,"Puoi eseguire abilità speciali temporali i cui effetti rientrino nella disciplina di Spirituale."],
  ['MEN','Meditazione profonda','-',{lvl:4},3,"Permette di recuperare 3×n punti Energia extra durante un Riposo Giornaliero."],
  ['MEN','Poliglotta','-',{},1,"Hai vantaggio alla prova di MEN quando tenti di comprendere o parlare lingue sconosciute."],
  ['MEN','Riserva di Energia','-',{lvl:6},1,"La tua Energia aumenta permanentemente di un ammontare pari a due volte il tuo livello. Si applica anche ai successivi aumenti di livello."],
  ['MEN','Abilità sottile','2',{men:8},1,"Quando lanci un'abilità speciale, effettua una prova di IST. Se riesce, puoi lanciarla senza pronunciare parole o compiere gesti vistosi, passando inosservato."],
  ['MEN','Esperienza diplomatica','2',{},1,"Hai vantaggio alla prova di MEN quando provi a persuadere o capire le emozioni altrui."],
  ['MEN','Intuizione Tattica','2',{},1,"Effettua una prova di MEN. Se la superi, un alleato che vedi ottiene vantaggio alla prossima prova di IST o VIG. Non puoi applicarlo a te stesso."],
  ['MEN','Individuazione psichica','2',{lvl:4},1,"Individui tracce di energia nell'ambiente circostante entro 30 metri per 10 minuti. Bloccato da pareti in roccia e metallo sottile."],
  ['MEN','Memoria fotografica','2',{lvl:4},1,"Ricordi perfettamente i dettagli di ciò che hai visto o sentito senza il bisogno di effettuare una prova di MEN."],
  ['MEN','Mente affilata','2',{},1,"Hai vantaggio alla prova di MEN quando provi a decifrare codici e crittogrammi."],
  ['MEN','Concentrazione profonda','4',{},1,"Quando vieni colpito durante il lancio di un'Abilità Temporale, ottieni vantaggio alla prova di VIG."],
  ['MEN','Focalizzazione mentale','4',{lvl:6},1,"Una volta al giorno, permette di ripetere una prova di MEN fallita."]
].map(t=>({car:t[0],n:t[1],cost:t[2],req:t[3],max:t[4],desc:t[5]}));
const TAL_BY_NAME={};TALENTS.forEach(t=>TAL_BY_NAME[t.n]=t);
const talCostExport=v=>v==='-'?'Passivo':(v==='2'||v==='4')?v+' Energia':(v||'Passivo');

const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const rows=(n,f)=>Array.from({length:n},f);
const uid=()=>'PG-'+Math.random().toString(36).slice(2,11).toUpperCase();
function parseSlot(s){
  if(!s)return 0;
  let m=String(s).match(/^(\d+)\s*=\s*1/i);if(m)return 1/parseInt(m[1]);
  m=String(s).match(/^([\d.]+)/);if(m)return parseFloat(m[1]);
  return 0;
}
const fmtSlot=n=>n%1===0?String(n):n.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
const blank=()=>({id:uid(),name:'',sex:'',setting:null,level:1,exp:0,heritage:'',childhood:'',profession:'',
  lv:{vig:0,ins:0,min:0},cond:{vig:0,ins:0,min:0},hpCurr:null,enCurr:null,raz:0,credits:0,noSpecial:false,ov:{},
  eq:{mainHand:'',offHand:'',body:'',slot1:'',slot2:'',slot3:''},
  tal:rows(8,()=>''),inv:rows(9,()=>({n:'',q:'',s:''})),abi:rows(12,()=>'')});
let chars=[],cur=null;

// ── Persistenza ──
function save(){try{localStorage.setItem(KEY,JSON.stringify(chars));localStorage.setItem(ACT,cur.id)}catch(e){}}
function migrateChar(c){
  // compatibilità con salvataggi della tappa precedente, dove i talenti erano {n,e} invece di stringhe
  if(c.tal&&c.tal.length&&typeof c.tal[0]==='object'&&c.tal[0]!==null)c.tal=c.tal.map(t=>t.n||'');
  if(!Array.isArray(c.tal))c.tal=[];
  while(c.tal.length<8)c.tal.push('');
  return c;
}
function loadAll(){
  let act=null;
  try{chars=JSON.parse(localStorage.getItem(KEY)||'[]');act=localStorage.getItem(ACT)}
  catch(e){chars=[]}
  finally{
    if(!Array.isArray(chars)||!chars.length)chars=[blank()];
    chars=chars.map(migrateChar);
    cur=chars.find(c=>c.id===act)||chars[0];
  }
}

// ── Calcoli (manuale v0.9) ──
function talCount(c){const m={};c.tal.forEach(n=>{if(n)m[n]=(m[n]||0)+1});return m}
function combatCalc(c,tc){
  const zones=[c.eq.mainHand,c.eq.offHand,c.eq.body,c.eq.slot1,c.eq.slot2,c.eq.slot3];
  let dmg=1,prot=0,hasWeapon=false;
  zones.forEach(n=>{if(WPN[n]!=null){dmg+=WPN[n];hasWeapon=true}if(ARM[n]!=null)prot+=ARM[n]});
  if(hasWeapon)dmg+=Math.min(3,tc['Combattente esperto']||0);
  let vigPenalty=0,dmgBonus=0;
  if(c.eq.offHand){
    if((tc['Combattere con due armi']||0)&&c.eq.mainHand==='Arma semplice'&&c.eq.offHand==='Arma semplice')dmgBonus=1;
    else vigPenalty=1;
  }
  dmg+=dmgBonus;
  return{dmg,prot,vigPenalty,dmgBonus,hasWeapon};
}
function calc(c){
  const o=(t,i)=>{const r=O[t].find(x=>x[0]===c[FLD[t]]);return r?r[i+1]:0};
  const base={};K.forEach((k,i)=>base[k]=5+o('h',i)+o('c',i)+o('p',i)+c.lv[k]);
  const n=c.level,ns=c.noSpecial?n:0,tc=talCount(c),cb=combatCalc(c,tc);
  const a={hpMax:2*base.vig+2*(n-1)+ns,enMax:2*base.min+2*(n-1)+ns,slot:2*base.vig,razMax:Math.ceil(base.vig/2),dmg:cb.dmg,prot:cb.prot};
  const v={};for(const k in a)v[k]=c.ov[k]!=null?c.ov[k]:a[k];
  const used=c.inv.reduce((s,x)=>s+(x.n?(parseSlot(x.s))*(parseInt(x.q)||1):0),0);
  return{base,a,v,used,tc,cb,lvAllowed:[3,6,9].filter(x=>x<=n).length,talAllowed:3+(c.noSpecial?1:0)+Math.floor(n/2)};
}
const cv=(c,m,f)=>{const mx=m.v[f==='hpCurr'?'hpMax':'enMax'];return Math.min(c[f]==null?mx:c[f],mx)};

// ── Setter ──
function S(p,v){const a=p.split('.');let o=cur;while(a.length>1)o=o[a.shift()];o[a[0]]=v;save()}
function NUM(p,v,lo,hi){S(p,Math.max(lo,Math.min(hi,parseInt(v)||0)));R()}
function OV(k,v){if(v==='')delete cur.ov[k];else cur.ov[k]=Math.max(0,parseInt(v)||0);save();R()}
function CD(k,g){cur.cond[k]=cur.cond[k]>=g?g-1:g;save();R()}
function ADJ(f,d){const m=calc(cur);S(f,Math.max(0,Math.min(m.v[f==='hpCurr'?'hpMax':'enMax'],cv(cur,m,f)+d)));R()}
function talSel(i,v){cur.tal[i]=v;save();R()}
function newChar(){cur=blank();chars.push(cur);save();R()}
function pick(id){cur=chars.find(x=>x.id===id)||cur;save();R()}
function delChar(){
  if(!confirm('Eliminare questo personaggio?'))return;
  chars=chars.filter(x=>x!==cur);if(!chars.length)chars=[blank()];cur=chars[0];save();R();
}
function addToInv(name){
  const info=ITEMS[name];if(!info)return;
  const empty=cur.inv.find(x=>!x.n);
  if(!empty){alert('Inventario pieno: libera una riga prima di aggiungere.');return}
  empty.n=name;empty.q=empty.q||1;empty.s=info.s;save();R();
}

// ── Import / export (schema app SAGA) ──
function toApp(c){
  const m=calc(c);
  return Object.assign({id:c.id,name:c.name,sex:c.sex,setting:c.setting,level:c.level,exp:c.exp,
    vig:m.base.vig,ins:m.base.ins,min:m.base.min,cVig:c.cond.vig,cIns:c.cond.ins,cMin:c.cond.min,
    hpMax:m.v.hpMax,hpCurr:cv(c,m,'hpCurr'),enMax:m.v.enMax,enCurr:cv(c,m,'enCurr'),damage:m.v.dmg,protection:m.v.prot,
    heritage:c.heritage,childhood:c.childhood,profession:c.profession,credits:c.credits,
    inventory:c.inv.filter(x=>x.n).map(x=>({item:x.n,description:'',quantity:parseInt(x.q)||1,slot:x.s||'0'})),
    talents:c.tal.filter(Boolean).map(n=>{const t=TAL_BY_NAME[n];return{talent_name:n,talent_description:t?t.desc:'',talent_cost:t?talCostExport(t.cost):'Passivo'}}),
    abilities:c.abi.filter(Boolean).map(a=>({ability_name:a,ability_description:'',ability_cost:''}))},c.eq);
}
function fromApp(o){
  const c=blank();
  Object.assign(c,{name:o.name||'',sex:o.sex||'',setting:o.setting||null,level:Math.min(10,Math.max(1,parseInt(o.level)||1)),exp:o.exp||0,
    heritage:o.heritage||'',childhood:o.childhood||'',profession:o.profession||'',credits:o.credits||0});
  const m0=calc(c);
  K.forEach(k=>{c.lv[k]=Math.max(0,(o[k]||m0.base[k])-m0.base[k])});
  c.cond={vig:o.cVig||0,ins:o.cIns||0,min:o.cMin||0};
  Object.keys(c.eq).forEach(k=>{
    let v=o[k]||'';
    if(v==='Protezione a mano')v='Protezione secondaria'; // alias compatibilità app principale
    c.eq[k]=v;
  });
  (o.inventory||[]).slice(0,9).forEach((x,i)=>{c.inv[i]={n:x.item||'',q:x.quantity||'',s:x.slot||''}});
  (o.talents||[]).slice(0,8).forEach((x,i)=>{c.tal[i]=x.talent_name||''});
  (o.abilities||[]).slice(0,12).forEach((x,i)=>{c.abi[i]=x.ability_name||''});
  const a=calc(c).a;
  if(o.hpMax!=null&&o.hpMax!==a.hpMax)c.ov.hpMax=o.hpMax;
  if(o.enMax!=null&&o.enMax!==a.enMax)c.ov.enMax=o.enMax;
  if(o.damage!=null&&o.damage!==a.dmg)c.ov.dmg=o.damage;
  if(o.protection!=null&&o.protection!==a.prot)c.ov.prot=o.protection;
  c.hpCurr=o.hpCurr==null?null:o.hpCurr;c.enCurr=o.enCurr==null?null:o.enCurr;
  return c;
}
function exportJ(){
  const b=new Blob([JSON.stringify(toApp(cur),null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download=(cur.name||'personaggio').replace(/\W+/g,'_')+'.saga-char.json';a.click();URL.revokeObjectURL(a.href);
}
function importJ(ev){
  const f=ev.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{const d=JSON.parse(r.result);(Array.isArray(d)?d:[d]).forEach(o=>{cur=fromApp(o);chars.push(cur)});save();R()}
    catch(e){alert('File non valido: '+e.message)}
    finally{ev.target.value=''}
  };
  r.readAsText(f);
}

// ── Render ──
const fb=r=>K.map((k,i)=>r[i+1]?(r[i+1]>0?'+':'−')+Math.abs(r[i+1])+' '+LB[k]:'').filter(Boolean).join(' ');
function talentSelectHtml(i,selName){
  const groups={VIG:[],IST:[],MEN:[]};
  TALENTS.forEach(t=>groups[t.car].push(t));
  let h=`<select onchange="talSel(${i},this.value)"><option value="">— nessuno —</option>`;
  ['VIG','IST','MEN'].forEach(cat=>{
    h+=`<optgroup label="${cat}">`+groups[cat].map(t=>`<option value="${esc(t.n)}" ${t.n===selName?'selected':''}>${esc(t.n)}</option>`).join('')+'</optgroup>';
  });
  return h+'</select>';
}
function R(){
  const c=cur,m=calc(c),o=k=>c.ov[k]!=null;
  const ovIn=k=>`<input class="n ${o(k)?'ovr':''}" type="number" min="0" value="${m.v[k]}" onchange="OV('${k}',this.value)">`+
    (o(k)?`<i class="rs noprint" title="Torna al calcolo automatico" onclick="OV('${k}','')">${RS}</i>`:'');
  const orig=(t,lab)=>{
    const cs=c[FLD[t]],r=O[t].find(x=>x[0]===cs);
    return `<div class="r"><label>${lab}</label><select onchange="S('${FLD[t]}',this.value);R()"><option value="">—</option>${O[t].map(x=>`<option ${x[0]===cs?'selected':''}>${x[0]}</option>`).join('')}</select><small>${r?fb(r):''}</small></div>`;
  };
  const stat=k=>{
    const pen=k==='vig'?m.cb.vigPenalty:0,e=m.base[k]-c.cond[k]-pen;
    return `<div class="sr"><b>${LB[k]}</b><div class="ci ${(c.cond[k]||pen)?'x':''}">${e}</div>${[1,2].map(g=>`<button class="bx ${c.cond[k]>=g?'on':''}" title="Condizione grado ${g}" onclick="CD('${k}',${g})"></button>`).join('')}${pen?'<small class="s">(−1 mano sec.)</small>':''}</div>`;
  };
  const pool=(f,mk,lab)=>`<div class="r"><label>${lab}</label><span class="s">Max</span>${ovIn(mk)}<span class="s">Att.</span>`+
    `<button class="pm noprint" onclick="ADJ('${f}',-1)">−</button><input class="n" type="number" value="${cv(c,m,f)}" onchange="NUM('${f}',this.value,0,${m.v[mk]})"><button class="pm noprint" onclick="ADJ('${f}',1)">+</button></div>`;

  // avvisi
  const w=[],ls=K.reduce((s,k)=>s+c.lv[k],0);
  if(ls>m.lvAllowed)w.push(`Aumenti di Caratteristica assegnati (${ls}) superiori a quelli disponibili (${m.lvAllowed}).`);
  else if(ls<m.lvAllowed)w.push(`Hai ${m.lvAllowed-ls} aumento/i di Caratteristica da assegnare (livelli 3, 6, 9).`);
  K.forEach(k=>{if(m.base[k]>10)w.push(`${LB[k]} supera 10 (massimo consentito).`)});
  const nt=c.tal.filter(Boolean).length;
  if(nt>m.talAllowed)w.push(`Talenti scelti (${nt}) oltre il limite per questo livello (${m.talAllowed}).`);
  if(m.used>m.v.slot)w.push(`Ingombrato: slot occupati ${fmtSlot(m.used)} su ${m.v.slot}.`);
  if(c.raz>m.v.razMax)w.push(`Razioni oltre il massimo (${m.v.razMax}).`);
  Object.keys(m.tc).forEach(name=>{
    const t=TAL_BY_NAME[name];if(!t)return;
    if(m.tc[name]>t.max)w.push(`"${name}" scelto ${m.tc[name]} volte, massimo ${t.max===Infinity?'illimitato':t.max}.`);
    const base=K.find(k=>LB[k]===t.car),bv=m.base[base];
    if(bv<6)w.push(`"${name}" richiede ${t.car} ≥ 6 (hai ${bv}).`);
    const r=t.req||{};
    if(r.lvl&&c.level<r.lvl)w.push(`"${name}" richiede livello ${r.lvl}.`);
    if(r.vig&&m.base.vig<r.vig)w.push(`"${name}" richiede VIG ${r.vig}.`);
    if(r.ist&&m.base.ins<r.ist)w.push(`"${name}" richiede IST ${r.ist}.`);
    if(r.men&&m.base.min<r.men)w.push(`"${name}" richiede MEN ${r.men}.`);
    if(r.tal&&!m.tc[r.tal])w.push(`"${name}" richiede il talento "${r.tal}".`);
  });
  [c.eq.mainHand,c.eq.offHand,c.eq.body,c.eq.slot1,c.eq.slot2,c.eq.slot3].forEach(n=>{
    const req=EQ_REQ[n];if(req&&(m.tc[req[0]]||0)<req[1])w.push(`"${n}" richiede il talento "${req[0]}"${req[1]>1?` (×${req[1]})`:''}.`);
  });
  if(NO_OFFHAND.includes(c.eq.offHand))w.push(`"${c.eq.offHand}" non può essere usata nella mano secondaria.`);
  document.getElementById('wn').innerHTML=w.length?`<div class="warn noprint">${w.map(x=>`<div>${esc(x)}</div>`).join('')}</div>`:'';

  document.getElementById('bar').innerHTML=
    `<select onchange="pick(this.value)">${chars.map(x=>`<option value="${x.id}" ${x===c?'selected':''}>${esc(x.name||'Senza nome')}</option>`).join('')}</select>`+
    `<button onclick="newChar()">+ Nuovo</button><button onclick="delChar()">Elimina</button><button class="p" onclick="print()">Stampa</button>`+
    `<button onclick="exportJ()">Esporta JSON</button><label class="b">Importa JSON<input type="file" accept=".json" hidden onchange="importJ(event)"></label>`+
    `<label><input type="checkbox" ${c.noSpecial?'checked':''} onchange="S('noSpecial',this.checked);R()"> Senza abilità speciali</label>`;

  const eqz=[['Mano princ','mainHand'],['Mano sec','offHand'],['Corpo','body'],['Zona 1','slot1'],['Zona 2','slot2'],['Zona 3','slot3']];
  const eqNote=n=>{
    if(!n||!ITEMS[n])return'';
    const bits=[];if(WPN[n]!=null)bits.push('+'+WPN[n]+' Danno');if(ARM[n]!=null)bits.push('+'+ARM[n]+' Prot');
    bits.push(ITEMS[n].s.replace(' slot',' sl'));bits.push(ITEMS[n].c+' cr');
    return `<div class="en"><small class="s">✓ ${bits.join(' · ')}</small><button class="ab noprint" title="Aggiungi a Inventario" onclick="addToInv('${esc(n)}')">➜inv</button></div>`;
  };

  document.getElementById('sheet').innerHTML=
  `<svg class="c c1"><use href="#cn"/></svg><svg class="c c2"><use href="#cn"/></svg><svg class="c c3"><use href="#cn"/></svg><svg class="c c4"><use href="#cn"/></svg>
  <div>
    <div class="logo">${LOGO}</div>
    <div class="pn"><h3>Caratteristiche</h3>
      <div class="sr h"><span></span><span></span><span>1</span><span>2</span></div>
      ${K.map(stat).join('')}
      <div class="lvb noprint">Aumenti livello: ${K.map(k=>`${LB[k]}<input class="n" type="number" min="0" max="3" value="${c.lv[k]}" onchange="NUM('lv.${k}',this.value,0,3)">`).join('')}</div>
    </div>
    <div class="pn">
      <div class="r"><label>Livello</label><input class="n" type="number" min="1" max="10" value="${c.level}" onchange="NUM('level',this.value,1,10)"><span class="s">Esperienza</span><input class="n" type="number" min="0" value="${c.exp}" onchange="NUM('exp',this.value,0,999)"></div>
      <div class="r"><label>Razioni</label><span class="s">Max</span>${ovIn('razMax')}<span class="s">Att.</span><input class="n" type="number" min="0" value="${c.raz}" onchange="NUM('raz',this.value,0,99)"></div>
    </div>
    <div class="pn"><h3>Combattimento</h3>
      ${pool('hpCurr','hpMax','Salute')}${pool('enCurr','enMax','Energia')}
      <div class="r"><label>Danno</label>${ovIn('dmg')}${m.cb.dmgBonus?'<small class="s">(+1 due armi)</small>':''}</div>
      <div class="r"><label>Protezione</label>${ovIn('prot')}</div>
    </div>
    <table class="tb"><tr><th>LV</th><th>Danno</th><th>Costo</th></tr><tr><td>1</td><td>2</td><td>2 Energia</td></tr><tr><td>2</td><td>3</td><td>4 Energia</td></tr><tr><td>3</td><td>4</td><td>6 Energia</td></tr></table>
  </div>
  <div>
    <div class="pn"><h3>Origini</h3>
      <div class="r"><label>Nome</label><input value="${esc(c.name)}" oninput="S('name',this.value)"><label style="min-width:40px">Sesso</label><select style="flex:1" onchange="S('sex',this.value);R()"><option value="">—</option>${['Maschio','Femmina','Altro'].map(x=>`<option ${c.sex===x?'selected':''}>${x}</option>`).join('')}</select></div>
      ${orig('h','Lignaggio')}${orig('c','Giovinezza')}${orig('p','Professione')}
    </div>
    <div class="pn"><h3>Equipaggiamento</h3>
      <div class="g3">${eqz.map(([l,k])=>`<div><label>${l}</label><input list="item-dl" value="${esc(c.eq[k])}" oninput="S('eq.${k}',this.value)" onchange="R()">${eqNote(c.eq[k])}</div>`).join('')}</div>
    </div>
    <div class="pn"><h3>Talenti <small class="s">${nt}/${m.talAllowed}</small></h3>
      ${c.tal.map((n,i)=>{
        const t=TAL_BY_NAME[n],cost=t?(t.cost==='-'?'Passivo':t.cost+' En.'):'';
        return `<div class="tr2">${talentSelectHtml(i,n)}<span class="cost">${cost}</span></div>${t?`<div class="tdesc">${esc(t.desc)}</div>`:''}`;
      }).join('')}
    </div>
    <div class="pn"><h3>Inventario</h3>
      <div class="ir h"><span>Crediti</span><span>Qt.</span><span>Slot</span></div>
      <div class="ir"><span></span><input class="n" type="number" min="0" value="${c.credits}" onchange="NUM('credits',this.value,0,99999)" style="width:100%"><span class="s" style="text-align:center">N/A</span></div>
      ${c.inv.map((x,i)=>`<div class="ir"><input list="item-dl" value="${esc(x.n)}" oninput="S('inv.${i}.n',this.value)" onchange="R()"><input value="${esc(x.q)}" oninput="S('inv.${i}.q',this.value)" onchange="R()" style="text-align:center"><input value="${esc(x.s)}" oninput="S('inv.${i}.s',this.value)" onchange="R()" style="text-align:center"></div>`).join('')}
      <div class="r"><label style="font-style:italic;min-width:0">Trasporto massimo</label><span class="s">(VIG×2)</span>${ovIn('slot')}<span class="s">usati ${fmtSlot(m.used)}</span></div>
    </div>
  </div>
  <div style="grid-column:1/-1"><div class="pn"><h3>Abilità speciali</h3>
    <div class="g2">${c.abi.map((a,i)=>`<input value="${esc(a)}" oninput="S('abi.${i}',this.value)">`).join('')}</div>
  </div></div>
  <datalist id="item-dl">${Object.keys(ITEMS).map(n=>`<option value="${esc(n)}">`).join('')}</datalist>`;
}

loadAll();
R();
