export const MAX_CHARS = 2000000;
export function parseCSV(input) {
  const text = String(input).replace(/^\uFEFF/, '');
  if (text.length > MAX_CHARS) throw new Error('Use a CSV smaller than 2 MB. Filter or split the official export first.');
  const rows = [];
  let row = [], cell = '', quoted = false, closed = false;
  const field = () => { row.push(cell); cell = ''; closed = false; };
  const line = () => {
    field();
    if (row.some(value => value.trim() !== '')) rows.push(row);
    row = [];
    if (rows.length > 10001) throw new Error('Use at most 10,000 source rows per review.');
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === ',') field();
    else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i++; line(); }
    else if (c === '"') {
      if (cell || closed) throw new Error('Malformed CSV quotation. Paste a comma-separated CSV export, including its header.');
      quoted = true;
    } else if (closed) {
      if (!/\s/.test(c)) throw new Error('Unexpected text after a closing CSV quote.');
    } else cell += c;
  }
  if (quoted) throw new Error('The CSV ends inside a quoted field. Paste the complete export.');
  if (cell || row.length || closed) line();
  return rows;
}
export function normalizedHeader(value) { return value.toLowerCase().replace(/[^a-z0-9]/g, ''); }
export function isoDay(value) {
  const s = String(value || '').trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/.exec(s);
  if (!m) {
    const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:$|\s)/.exec(s);
    if (us) m = [us[0], us[3], us[1].padStart(2, '0'), us[2].padStart(2, '0')];
  }
  if (!m) return '';
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]), date = new Date(Date.UTC(y, mo - 1, d));
  return y >= 1900 && y <= 2200 && date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? m[1] + '-' + m[2] + '-' + m[3] : '';
}
export function hasEquipmentWording(description) {
  return /\bkitchen\b|\bhood\b|walk[- ]in\s+(cooler|freezer)|\bequipment\s+(plan|schedule|layout)\b/i.test(description);
}
export const SCOPE_MODES = ['all', 'equipment', 'hood', 'refrigeration', 'coffee'];
export function hasFoodServiceWording(description) {
  return /\brestaurant\b|\bcoffee\s+(shop|bar)\b|\bcaf[eé]\b|\bfood[- ]service\b|\bfood\s+prep(?:aration)?\b|\bbeverage\s+bar\b|\bcommercial\s+kitchen\b|walk[- ]in\s+(cooler|freezer)/i.test(description);
}
export function matchesScope(description, mode) {
  if (!hasFoodServiceWording(description)) return false;
  if (mode === 'all') return true;
  if (scopeReview(description).startsWith('Cabinet')) return false;
  if (mode === 'equipment') return hasEquipmentWording(description);
  if (mode === 'hood') return /\bhood\b|\bgrease\s+duct\b|\bmake[- ]?up\s+air\b|\bkitchen\s+(exhaust|ventilation)\b/i.test(description);
  if (mode === 'refrigeration') return /walk[- ]in\s+(cooler|freezer)|reach[- ]in\s+(cooler|freezer)|\brefrigerat(?:ion|or|ors|ed)\b|\bcold\s+storage\b/i.test(description);
  if (mode === 'coffee') return /\bcoffee\b|\bespresso\b|\btea\b/i.test(description);
  return false;
}
export function scopeMatchNote(description, mode) {
  if (mode === 'hood') return 'Hood / kitchen-ventilation context — does not establish a new or replacement hood order';
  if (mode === 'refrigeration') return 'Refrigeration wording — check installation versus removal and present procurement';
  if (mode === 'coffee') return 'Coffee / tea context — a machine purchase is not established';
  return scopeReview(description);
}
export function scopeReview(description) {
  if (/\bcabinets?\b/i.test(description) && /no food|no plumbing|no electrical/i.test(description)) return 'Cabinet wording — inspect; equipment need not established';
  if (hasEquipmentWording(description)) return 'Kitchen, hood, walk-in or equipment-plan wording — inspect original scope';
  return 'Food-service wording — equipment need not established';
}
export function referenceCandidates(description, ownPermit) {
  return [...new Set(Array.from(description.matchAll(/(?:ref(?:erence)?\.?(?:\s+(?:pa|permit|application))?|pa|permit|application)[\s:#.\-]*(20\d{10})\b/gi), m => m[1]).filter(id => id !== ownPermit))];
}
export function sourceLink(permit) {
  return 'https://data.sf.gov/resource/i98e-djp9.json?permit_number=' + encodeURIComponent(permit) + '&primary_address_flag=Y';
}
export function reviewCSV(input, { since = '', mode = 'all' } = {}) {
  if (!SCOPE_MODES.includes(mode)) throw new Error('Choose a supported scope filter.');
  if (since && isoDay(since) !== since) throw new Error('Choose a valid filed-on-or-after date.');
  const table = parseCSV(input);
  if (table.length < 2) throw new Error('Paste the header and at least one data row.');
  const header = table[0].map(normalizedHeader);
  const index = (...aliases) => {
    const found = aliases.map(a => header.indexOf(a)).find(i => i >= 0);
    return found === undefined ? -1 : found;
  };
  const columns = {
    permit: index('permitnumber'), description: index('description'), filed: index('fileddate'),
    address: index('address', 'businessaddress'), number: index('streetnumber'), numberSuffix: index('streetnumbersuffix'),
    street: index('streetname'), suffix: index('streetsuffix'), status: index('status', 'currentstatus'),
    statusDate: index('statusdate', 'currentstatusdate'), asOf: index('dataasof'), primary: index('primaryaddressflag')
  };
  if ([columns.permit, columns.description, columns.filed].some(i => i < 0)) throw new Error('Required columns: Permit Number, Description and Filed Date. API-style headers such as permit_number also work.');
  if (new Set(header).size !== header.length) throw new Error('The CSV has duplicate column names. Use one unmodified DataSF export.');
  const warnings = [];
  if (columns.primary < 0) warnings.push('No Primary Address Flag column: address-primary status was not checked.');
  if (columns.asOf < 0) warnings.push('No Data As Of column: source freshness is unknown.');
  const stats = { sourceRows: table.length - 1, duplicateRows: 0, secondaryRows: 0, missingPermitRows: 0, unparsedFiledDates: 0 };
  const permits = new Map();
  for (const raw of table.slice(1)) {
    if (raw.length !== header.length) throw new Error('A data row has a different number of columns from the header. Check the CSV export.');
    const get = key => columns[key] < 0 ? '' : String(raw[columns[key]] || '').trim();
    if (columns.primary >= 0 && /^(n|no|false|0)$/i.test(get('primary'))) { stats.secondaryRows++; continue; }
    const id = get('permit');
    if (!id) { stats.missingPermitRows++; continue; }
    const address = get('address') || [get('number') + get('numberSuffix'), get('street'), get('suffix')].filter(Boolean).join(' ');
    const r = {
      permit_number: id, address, filed_date: isoDay(get('filed')), status: get('status'),
      status_date: isoDay(get('statusDate')), data_as_of: isoDay(get('asOf')), description: get('description'),
      duplicate_source_rows: 0, address_conflict: false, primary_address_verified: /^y(?:es)?$/i.test(get('primary'))
    };
    if (!r.filed_date) stats.unparsedFiledDates++;
    if (permits.has(id)) {
      const existing = permits.get(id);
      existing.duplicate_source_rows++; stats.duplicateRows++;
      if (existing.address !== address) existing.address_conflict = true;
      continue;
    }
    permits.set(id, r);
  }
  if (stats.duplicateRows) warnings.push('Duplicate permit IDs were collapsed to their first retained row. Compare conflicting versions in the source.');
  if (stats.unparsedFiledDates) warnings.push('Some filed dates could not be parsed; a date filter excludes those rows.');
  const rows = [...permits.values()].filter(r => {
    if (!matchesScope(r.description, mode)) return false;
    if (since && (!r.filed_date || r.filed_date < since)) return false;
    return true;
  }).map(r => ({
    ...r, scope_review: scopeMatchNote(r.description, mode), scope_filter: mode, reference_permit_candidates: referenceCandidates(r.description, r.permit_number),
    purchasing_status: 'UNVERIFIED', official_permit_url: sourceLink(r.permit_number)
  })).sort((a, b) => b.filed_date.localeCompare(a.filed_date) || a.permit_number.localeCompare(b.permit_number));
  return { rows, stats, warnings, since, mode };
}
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function exportCSV(result, exportedAt) {
  const keys = ['permit_number', 'address', 'filed_date', 'status', 'status_date', 'data_as_of', 'scope_review', 'reference_permit_candidates', 'duplicate_source_rows', 'address_conflict', 'primary_address_verified', 'purchasing_status', 'official_permit_url', 'description', 'scope_filter', 'exported_at_utc'];
  const records = result.rows.map(row => keys.map(key => key === 'exported_at_utc' ? exportedAt : Array.isArray(row[key]) ? row[key].join(' | ') : row[key]));
  return '\uFEFF' + [keys, ...records].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
