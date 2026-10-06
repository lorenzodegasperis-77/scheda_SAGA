const storageKey = 'saga-character-sheet-v1';
const saveState = document.querySelector('#save-state');
const importJsonInput = document.querySelector('#import-json-input');
let saveTimer;

function getSerializedSheetState() {
  return Object.fromEntries([...document.querySelectorAll('[data-field], [data-stat-name], [data-stat-score]')].map((field) => {
    const key = field.dataset.field || field.dataset.statName || field.dataset.statScore;
    return [key, field.value];
  }));
}

function clearSheetFields() {
  for (const row of [...document.querySelectorAll('[data-talent-row]')].slice(1)) row.remove();
  for (const row of [...document.querySelectorAll('[data-ability-row]')].slice(1)) row.remove();
  for (const row of document.querySelectorAll('[data-inventory-row]')) row.remove();
  for (const field of document.querySelectorAll('[data-field], [data-stat-name], [data-stat-score]')) {
    if (field.dataset.statName) {
      field.value = field.dataset.statName.toUpperCase();
      continue;
    }
    if (field.dataset.statPenalty) {
      field.value = '0';
      field.classList.remove('is-active');
      field.setAttribute('aria-pressed', 'false');
      continue;
    }
    field.value = '';
  }
}

function exportSheetJson() {
  const payload = getSerializedSheetState();
  const fileName = 'scheda-saga.json';
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  saveState.textContent = 'JSON esportato';
  window.clearTimeout(saveTimer);
  return payload;
}

async function importSheetJson(file) {
  if (!file) return null;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Formato JSON non valido');
    }
    clearSheetFields();
    localStorage.setItem(storageKey, JSON.stringify(parsed));
    restoreForm();
    saveState.textContent = 'JSON importato';
    return parsed;
  } catch {
    saveState.textContent = 'File JSON non valido';
    return null;
  }
}

const originBonuses = {
  Nomade: { vig: 1, men: -1 }, Popolare: { ist: 1, vig: -1 }, Discendente: { men: 1, ist: -1 },
  Militare: { vig: 1, ist: -1 }, Dotto: { men: 1, vig: -1 }, Marginale: { ist: 1, men: -1 },
  Rigorosa: { ist: -1, men: 2 }, 'Vita di strada': { vig: -1, ist: 2 }, Adottato: { ist: 2, men: -1 },
  Isolato: { vig: 2, men: -1 }, Protetto: { vig: -1,men: 2 }, 'Cresciuto in guerra': { vig: 2, ist: -1 },
  Esploratore: { ist: 2 }, Mercenario: { vig: 2 }, Erudito: { men: 2 },
  Furfante: { ist: 1, men: 1 }, Guaritore: { vig: 1, ist: 1 }, 'Artigiano/Inventore': { vig: 1, men: 1 },
};

const abilityDescriptions = {
  Groviglio: 'Rallenta un bersaglio visibile: la sua IST diminuisce in base al livello abilita finche non supera una prova di VIG.',
  'Attacco speciale': 'Supera una prova di MEN per infliggere 2 + livello abilita di Danno a un bersaglio visibile.',
  Blocco: 'Riduce il VIG di una creatura visibile in base al livello abilita finche non supera una prova di IST.',
  Comando: 'Fino a livello abilita bersagli che ti sentono obbediscono a un comando di tre parole se falliscono una prova di MEN.',
  Confusione: 'Una creatura visibile e frastornata e subisce una riduzione di VIG finche non supera una prova di MEN.',
  Scudo: 'La Protezione di un alleato aumenta del livello abilita per 1 round. L effetto non e cumulabile.',
  'Cura Ferite': 'Ristora (1d6 + 1) x livello abilita di Salute a una creatura che puoi toccare.',
  Paura: 'Una creatura vicina e terrorizzata e subisce una riduzione di MEN finche non supera una prova di VIG.',
  'Duplice immagine': 'Crea livello abilita duplicati illusori. Ogni attacco contro di te puo colpire un immagine invece del bersaglio reale.',
  Velocita: 'Una creatura toccata possiede un azione in piu per i prossimi livelli abilita turni.',
  'Arma potenziata': 'Puoi potenziare un arma che tocchi. Il Danno dell arma aumenta del livello della abilità per 2 turni.',
  'Nube di Nebbia': 'Crea una nube densa con spigolo di 3 x livello abilita metri che rende difficile vedere.',
  Pacificare: 'Una creatura vicina evita la violenza e non vuole combattere per livello abilita turni.',
  Luce: 'Un oggetto toccato emette luce intensa in un raggio di 3 metri x livello abilita.',
  Ragnatela: 'Ragnatele spesse intrappolano un bersaglio, riducendone IST finche non supera una prova di MEN.',
  Illusione: 'Crea un immagine, suono, odore o piccolo oggetto illusorio che non puo infliggere Danno.',
  Sonno: 'Una creatura visibile cade in un sonno leggero e subisce una riduzione di MEN finche non supera una prova di IST.',
  Telecinesi: 'Muovi un oggetto visibile fino a 20 kg x livello abilita entro 10 metri x livello abilita.',
  Telepatia: 'Due creature visibili condividono i pensieri per 1 minuto x livello abilita.',
  Trauma: 'Un bersaglio toccato o colpito subisce Danno pari al livello abilita all inizio del turno per livello abilita + 1 turni.',
};

const inventoryCatalog = [
  ['Accendino antivento', 'Produce una piccola fiamma costante anche in condizioni avverse. +1 VIG per accendere fuochi o bruciare materiali sottili.', .2],
  ['Ampolla incendiaria', 'Con 2 azioni, infliggi 3 Danno e Condizione di Grado 1 a VIG e IST a un bersaglio.', .5],
  ['Antitossina', 'Con 1 azione, rimuove 1 Grado di condizione negativa sul VIG.', .5],
  ['Barretta energetica', 'Fornisce energia immediata. Se consumata durante un turno (1 azione), fornisce vantaggio alla prossima prova di VIG effettuata entro 1 ora.', .2],
  ['Binocolo', 'Permette di vedere chiaramente a grande distanza. Vantaggio alle prove di IST per avvistamento.', 1],
  ['Bussola/GPS', 'Non puoi smarrire la strada in ambienti aperti. Vantaggio alle prove di IST per orientamento.', 1],
  ['Calmante', 'Con 1 azione, rimuove 1 Grado di condizione su MEN.', .5],
  ['Calzari silenziosi', 'Hai vantaggio nelle prove di IST per rimanere nascosto.', 1],
  ['Catena', 'Con 1 prova di IST impone la Condizione di Grado 2 al VIG di una creatura (dura 1 turno).', 1],
  ['Cavo dati/link', 'Permette di collegarsi a terminali remoti. +1 a MEN nelle prove che includono hacking o software.', 1],
  ['Corda (10m)', 'Una corda resistente può essere usata per legare. Ha 10 Salute.', 1],
  ['Corno', 'Suono udibile a circa 1 km di distanza.', 1],
  ['Cunei di ferro', 'Bloccano una porta o creano un appiglio. Richiede una prova di VIG con malus per essere rimossi.', 1 / 3],
  ['Dose di adrenalina', 'Uso immediato, acquisisci 2 Azioni extra in questo turno, ma subisci 1 Grado condizione negativa a VIG e IST nel prossimo.', .5],
  ['Fascette stringicavo', 'Possono essere usate per legare mani o oggetti. Hanno 3 Salute e richiedono una prova di VIG con svantaggio per essere spezzate.', .1],
  ['Fischietto acuto', 'Udibile fino a 2 km, gli animali sensibili (cani, gatti, ecc.) devono superare una prova IST o si agitano.', 1],
  ['Gessetti colorati', 'Utili per segnare il percorso o lasciare messaggi in codice. Vantaggio prove MEN per non perdersi.', .2],
  ['Granata stordente', 'Con 1 azione IST, impone Condizione Grado 2 a IST a tutti i bersagli in un raggio ravvicinato.', .5],
  ['Grimaldello', 'Consente di scassinare una serratura, si rompe con l uso.', 1 / 3],
  ['Incensiere', 'Emana un fumo che calma gli animi. +1 a MEN per le prove di diplomazia o interazione sociale.', 1],
  ['Kit da scrittura', 'Permette di redigere documenti ufficiali, falsificare scritture con prove MEN con vantaggio.', 1],
  ['Lanterna', 'Luce stabile che dura circa 6 ore.', 1],
  ['Mantello cerato', '+1 VIG contro condizioni da freddo o pioggia e riduce i malus ambientali.', 1],
  ['Mantice (1 uso)', 'Ravviva un fuoco o spegne piccole fiamme.', 1],
  ['Maschera filtrante', 'Protegge da fumi, gas o polveri tossiche. +1 VIG contro veleni respiratori.', 1],
  ['Kit medico', 'Un applicazione ripristina 5 Salute.', .5],
  ['Coltellino svizzero', 'Un piccolo strumento con pinze e cacciaviti. Permette di riparare o manomettere piccoli oggetti meccanici. La prova di IST ha vantaggio. (un uso)', 1],
  ['Olio infiammabile', 'Può essere sparso su una superficie. Se incendiato, infligge 2 danni a chiunque vi passi sopra.', .5],
  ['Olio per lanterna (1 dose)', 'Combustibile per lanterna.', .2],
  ['Piede di porco', '+1 VIG per forzare oggetti o sfondare porte.', 1],
  ['Polvere fluorescente', 'Lanciata con 1 azione rivela creature invisibili o tracce nascoste.', .5],
  ['Polvere irritante', 'Con 1 azione di IST impone la Condizione di Grado 2 a MEN di una creatura (dura 1 turno).', .5],
  ['Rampino', 'Vantaggio alle prove di VIG per scalare.', 1],
  ['Razione', 'Fornisce un giorno di razioni.', 0],
  ['Rete', 'Con 1 prova di IST impone la Condizione di Grado 2 a IST di una creatura (dura 1 turno).', 1],
  ['Sabbia del sonno', 'Con 1 azione, se il bersaglio fallisce prova su MEN, salta il prossimo turno.', .5],
  ['Sacchetto di biglie', 'Può essere sparso sul terreno (azione): i nemici devono superare una prova di IST per muoversi nel prossimo turno.', 1 / 3],
  ['Sacco', '+1 Slot inventario.', 0, 1],
  ['Sali rinvenenti', 'Rimuove immediatamente lo stato "Svenuto" o "Confuso" (Grado 1 MEN).', 1 / 3],
  ['Scanner portatile', 'Con 1 azione, rivela la posizione di nemici o trappole entro 20m (Prova MEN con vantaggio).', 1],
  ['Specchio d acciaio', 'Permette di guardare dietro gli angoli o riflettere un segnale luminoso.', 1],
  ['Spray tracciante', 'Bomboletta di vernice rapida. Utile per marcare percorsi o, se spruzzata negli occhi (prova IST), impone Condizione Grado 1 a IST per 1 turno.', .5],
  ['Tablet hacker', 'Permette di redigere documenti ufficiali, falsificare scritture con prove MEN con vantaggio.', 1],
  ['Talismano protettivo', 'Una volta al giorno riduce di 2 il Danno subito.', 1],
  ['Tenda (1 uso)', 'Permette di effettuare riposi all esterno senza effettuare prove di VIG.', 2],
  ['Tonico', 'Rimuove 1 Grado di una condizione a scelta.', .5],
  ['Torcia', 'Emette luce intensa per circa 1 ora.', 1 / 3],
  ['Unguento curativo', 'Un applicazione ripristina 5 Salute.', .5],
  ['Zaino', '+4 Slot inventario.', 0, 4],
  ['Arma semplice', '+2 Danno.', 1],
  ['Arma letale', '+3 Danno.', 2],
  ['Arma a distanza leggera', '+1 Danno.', 1],
  ['Arma a distanza medie', '+2 Danno.', 2],
  ['Arma a distanza pesante', '+4 Danno.', 3],
  ['Protezione leggera', '+1 Protezione.', 1],
  ['Protezione media', '+2 Protezione.', 2],
  ['Protezione pesante', '+3 Protezione.', 3],
  ['Protezione secondaria', '+1 Protezione.', 1],
];

const inventoryByName = new Map(inventoryCatalog.map(([name, description, slot, capacityBonus = 0]) => [name, { name, description, slot, capacityBonus }]));

function readForm() {
  return getSerializedSheetState();
}

function parseNumericValue(value) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function refreshCharacteristics() {
  const bonuses = { vig: 0, ist: 0, men: 0 };
  for (const select of document.querySelectorAll('.origin-select')) {
    const originBonus = originBonuses[select.value] || {};
    for (const stat of Object.keys(bonuses)) bonuses[stat] += originBonus[stat] || 0;
  }
  const scores = {};
  for (const stat of Object.keys(bonuses)) {
    const penalties = document.querySelectorAll(`[data-stat-penalty="${stat}"].is-active`).length;
    scores[stat] = Math.min(10, 5 + bonuses[stat] - penalties);
  }
  const level = parseNumericValue(document.querySelector('[data-field="Livello"]').value);
  for (const select of document.querySelectorAll('[data-level-up]')) {
    const requiredLevel = Number(select.dataset.levelUp);
    const unlocked = level !== null && level >= requiredLevel;
    const stat = select.value;
    select.disabled = !unlocked;
    for (const option of select.options) {
      if (option.value) option.disabled = !unlocked || (scores[option.value] >= 10 && option.value !== stat);
    }
    const status = document.querySelector(`[data-level-up-status="${requiredLevel}"]`);
    if (!unlocked) status.textContent = `Disponibile dal livello ${requiredLevel}`;
    else if (!stat) status.textContent = 'Scegli una caratteristica';
    else if (scores[stat] >= 10) status.textContent = 'Caratteristica al massimo';
    else {
      scores[stat] += 1;
      status.textContent = 'Incremento assegnato';
    }
  }
  for (const stat of Object.keys(scores)) {
    document.querySelector(`[data-stat-score="${stat}"]`).value = String(scores[stat]);
  }
}

function refreshCapacities() {
  refreshCharacteristics();
  const vigorName = 'VIG';
  const vigor = parseNumericValue(document.querySelector('[data-stat-score="vig"]').value);
  const hasVigor = vigor !== null && vigor >= 0;
  for (const label of document.querySelectorAll('[data-vig-label]')) label.textContent = vigorName;
  const slotMax = hasVigor ? vigor * 2 : null;
  document.querySelector('#rations-max').textContent = hasVigor ? String(vigor / 2) : '-';
  document.querySelector('#slot-max').textContent = slotMax === null ? '-' : String(slotMax);

  const inventoryRows = [...document.querySelectorAll('[data-inventory-row]')];
  const usedSlots = Math.floor(inventoryRows.reduce((total, row) => {
    const item = inventoryByName.get(row.querySelector('[data-inventory-select]').value);
    const quantity = parseNumericValue(row.querySelector('[data-inventory-quantity]').value);
    return !item || quantity === null ? total : total + quantity * item.slot;
  }, 0));
  const capacityBonus = inventoryRows.reduce((total, row) => {
    const item = inventoryByName.get(row.querySelector('[data-inventory-select]').value);
    const quantity = parseNumericValue(row.querySelector('[data-inventory-quantity]').value);
    return !item || quantity === null ? total : total + quantity * item.capacityBonus;
  }, 0);
  const totalSlotMax = slotMax === null ? null : slotMax + capacityBonus;
  document.querySelector('#slot-used').textContent = String(usedSlots);
  const slotSummary = document.querySelector('#slot-summary');
  slotSummary.classList.remove('slot-warning', 'slot-over');
  document.querySelector('#slot-max').textContent = totalSlotMax === null ? '-' : String(totalSlotMax);
  if (totalSlotMax !== null && usedSlots > totalSlotMax) slotSummary.classList.add('slot-over');
  else if (totalSlotMax !== null && usedSlots >= totalSlotMax * .8) slotSummary.classList.add('slot-warning');
}

function scheduleSave() {
  saveState.textContent = 'Salvataggio...';
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(readForm()));
      saveState.textContent = 'Salvato in questo browser';
    } catch {
      saveState.textContent = 'Salvataggio non disponibile';
    }
  }, 250);
  refreshCapacities();
}

function bindField(field) {
  if (field.dataset.bound) return;
  field.dataset.bound = 'true';
  field.addEventListener('input', scheduleSave);
  field.addEventListener('change', scheduleSave);
}

function addTalentRow() {
  const list = document.querySelector('#talent-list');
  const index = list.querySelectorAll('[data-talent-row]').length + 1;
  const row = document.createElement('div');
  row.className = 'talent-row';
  row.dataset.talentRow = '';
  row.innerHTML = `<input data-field="Talento ${index} nome" type="text" aria-label="Nome talento ${index}" placeholder="Nome talento"><input data-field="Talento ${index} effetto" type="text" aria-label="Effetto talento ${index}" placeholder="Effetto o descrizione"><button class="remove-entry" type="button" data-remove-talent aria-label="Rimuovi talento ${index}">Rimuovi</button>`;
  list.append(row);
  row.querySelectorAll('[data-field]').forEach(bindField);
}

function renderAbilityDescription(select) {
  const description = select.closest('[data-ability-row]').querySelector('.ability-description');
  description.textContent = abilityDescriptions[select.value] || 'Seleziona un\'abilita per visualizzarne l\'effetto.';
}

function bindAbilitySelect(select) {
  bindField(select);
  if (select.dataset.descriptionBound) return;
  select.dataset.descriptionBound = 'true';
  select.addEventListener('change', () => renderAbilityDescription(select));
}

function addAbilityRow() {
  const list = document.querySelector('#ability-list');
  const index = list.querySelectorAll('[data-ability-row]').length + 1;
  const firstSelect = list.querySelector('[data-ability-select]');
  const row = document.createElement('div');
  row.className = 'ability-row';
  row.dataset.abilityRow = '';
  row.innerHTML = `<select data-field="Abilita speciale ${index}" data-ability-select class="ability-select" aria-label="Scegli abilita speciale ${index}">${firstSelect.innerHTML}</select><p class="ability-description">Seleziona un'abilita per visualizzarne l'effetto.</p><button class="remove-entry" type="button" data-remove-ability aria-label="Rimuovi abilita ${index}">Rimuovi</button>`;
  list.append(row);
  bindAbilitySelect(row.querySelector('[data-ability-select]'));
}

function updateInventoryRow(row) {
  const item = inventoryByName.get(row.querySelector('[data-inventory-select]').value);
  const description = row.querySelector('[data-inventory-description]');
  const quantity = parseNumericValue(row.querySelector('[data-inventory-quantity]').value);
  description.textContent = item ? item.description : 'Scegli un oggetto per visualizzarne la descrizione.';
  row.querySelector('[data-inventory-slots]').textContent = item && quantity !== null ? String(quantity * item.slot) : '-';
}

function addInventoryRow() {
  const list = document.querySelector('#inventory-list');
  const index = list.querySelectorAll('[data-inventory-row]').length + 1;
  const row = document.createElement('div');
  row.className = 'inventory-row';
  row.dataset.inventoryRow = '';
  const options = inventoryCatalog.map(([name]) => `<option value="${name}">${name}</option>`).join('');
  row.innerHTML = `<select data-field="Inventario ${index} oggetto" data-inventory-select aria-label="Oggetto inventario ${index}"><option value="">Scegli oggetto</option>${options}</select><label class="inventory-quantity"><small>Qt.</small><input data-field="Inventario ${index} quantita" data-inventory-quantity type="text" inputmode="numeric" value="1" aria-label="Quantita oggetto ${index}"></label><span class="inventory-weight"><small>Peso</small><output data-inventory-slots aria-label="Peso in slot oggetto ${index}">-</output></span><p data-inventory-description>Scegli un oggetto per visualizzarne la descrizione.</p><button class="remove-entry" type="button" data-remove-inventory aria-label="Rimuovi oggetto ${index}">Rimuovi</button>`;
  list.append(row);
  row.querySelectorAll('[data-field]').forEach(bindField);
  row.querySelector('[data-inventory-select]').addEventListener('change', () => { updateInventoryRow(row); scheduleSave(); });
  row.querySelector('[data-inventory-quantity]').addEventListener('input', () => { updateInventoryRow(row); scheduleSave(); });
  updateInventoryRow(row);
}

function restoreForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved['Abilita speciali'] && !saved['Abilita speciale 1']) saved['Abilita speciale 1'] = saved['Abilita speciali'];
    const talentIndexes = Object.keys(saved).map((key) => key.match(/^Talento (\d+) /)?.[1]).filter(Boolean).map(Number);
    const talentCount = Math.max(1, ...talentIndexes);
    for (let index = 1; index < talentCount; index += 1) addTalentRow();
    const abilityIndexes = Object.keys(saved).map((key) => key.match(/^Abilita speciale (\d+)$/)?.[1]).filter(Boolean).map(Number);
    const abilityCount = Math.max(1, ...abilityIndexes);
    for (let index = 1; index < abilityCount; index += 1) addAbilityRow();
    const inventoryIndexes = Object.keys(saved).map((key) => key.match(/^Inventario (\d+) oggetto$/)?.[1]).filter(Boolean).map(Number);
    for (let index = 0; index < Math.max(0, ...inventoryIndexes); index += 1) addInventoryRow();
    for (const field of document.querySelectorAll('[data-field], [data-stat-name], [data-stat-score]')) {
      const key = field.dataset.field || field.dataset.statName || field.dataset.statScore;
      if (Object.hasOwn(saved, key)) field.value = saved[key];
    }
    document.querySelectorAll('[data-stat-penalty]').forEach((dot) => {
      const active = dot.value === '1';
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-inventory-row]').forEach(updateInventoryRow);
    saveState.textContent = Object.keys(saved).length ? 'Scheda ripristinata' : 'Pronto';
  } catch {
    saveState.textContent = 'Pronto';
  }
  document.querySelectorAll('[data-ability-select]').forEach(renderAbilityDescription);
  refreshCapacities();
}

document.querySelectorAll('[data-field], [data-stat-name], [data-stat-score]').forEach(bindField);
document.querySelectorAll('[data-ability-select]').forEach(bindAbilitySelect);
document.querySelectorAll('[data-stat-penalty]').forEach((dot) => {
  dot.addEventListener('click', () => {
    const active = dot.value !== '1';
    dot.value = active ? '1' : '0';
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-pressed', String(active));
    scheduleSave();
  });
});
document.querySelector('#add-talent').addEventListener('click', () => {
  addTalentRow();
  scheduleSave();
});
document.querySelector('#add-ability').addEventListener('click', () => {
  addAbilityRow();
  scheduleSave();
});
document.querySelector('#add-inventory').addEventListener('click', () => {
  addInventoryRow();
  scheduleSave();
});
document.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove-talent], [data-remove-ability], [data-remove-inventory]');
  if (!removeButton) return;
  removeButton.closest('[data-talent-row], [data-ability-row], [data-inventory-row]').remove();
  scheduleSave();
});
document.querySelector('#export-json').addEventListener('click', exportSheetJson);
document.querySelector('#import-json').addEventListener('click', () => importJsonInput.click());
importJsonInput.addEventListener('change', (event) => {
  const [file] = event.target.files || [];
  importSheetJson(file);
  event.target.value = '';
});
document.querySelector('#print-sheet').addEventListener('click', () => window.print());
document.querySelector('#clear-sheet').addEventListener('click', () => {
  if (!window.confirm('Vuoi svuotare tutti i campi della scheda?')) return;
  clearSheetFields();
  localStorage.removeItem(storageKey);
  saveState.textContent = 'Scheda svuotata';
  refreshCapacities();
});

restoreForm();
