import { parseCSV, normalizedHeader, isoDay, csvCell, sourceLink } from './finder-core.mjs';

const ALIASES = {
  permit_number: ['permitnumber'], status: ['status', 'currentstatus'],
  status_date: ['statusdate', 'currentstatusdate'], filed_date: ['fileddate'],
  data_as_of: ['dataasof'], description: ['description'],
  address: ['address', 'businessaddress'], number: ['streetnumber'],
  number_suffix: ['streetnumbersuffix'], street: ['streetname'], suffix: ['streetsuffix'],
  primary: ['primaryaddressflag']
};
const COMPARE_FIELDS = ['status', 'status_date', 'filed_date', 'description', 'address'];
const DATE_FIELDS = new Set(['status_date', 'filed_date']);
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const comparable = (key, value) => DATE_FIELDS.has(key) ? (isoDay(value) || clean(value)) : key === 'status' ? clean(value).toLowerCase() : clean(value);

export function readSnapshot(csv, label) {
  const table = parseCSV(csv);
  if (!table.length) throw new Error(label + ': paste a CSV including its header.');
  const headers = table[0].map(normalizedHeader);
  if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error(label + ': empty or duplicate column names.');
  const cols = {};
  for (const [key, aliases] of Object.entries(ALIASES)) {
    const matches = headers.map((h, i) => aliases.includes(h) ? i : -1).filter(i => i >= 0);
    if (matches.length > 1) throw new Error(label + ': more than one column represents ' + key + '. Keep one source column.');
    cols[key] = matches[0] ?? -1;
  }
  if (cols.permit_number < 0 || cols.status < 0) throw new Error(label + ': required columns are Permit Number and Status (or Current Status).');
  const present = new Set(Object.keys(cols).filter(k => cols[k] >= 0));
  if (cols.address >= 0 || (cols.number >= 0 && cols.street >= 0)) present.add('address');
  const warnings = [], records = new Map();
  const stats = { sourceRows: table.length - 1, secondaryRows: 0, missingIdRows: 0, duplicateRows: 0, ambiguousPermits: 0, unknownPrimaryRows: 0 };
  if (cols.primary < 0) warnings.push(label + ': no Primary Address Flag column; primary addresses could not be verified.');
  if (cols.data_as_of < 0) warnings.push(label + ': no Data As Of column; source freshness is unknown.');
  for (const values of table.slice(1)) {
    if (values.length !== headers.length) throw new Error(label + ': a data row has a different number of cells from the header.');
    const get = key => cols[key] < 0 ? '' : String(values[cols[key]] ?? '').trim();
    if (/^(n|no|false|0)$/i.test(get('primary'))) { stats.secondaryRows++; continue; }
    if (cols.primary >= 0 && !/^(y|yes|true|1)$/i.test(get('primary'))) stats.unknownPrimaryRows++;
    const id = get('permit_number');
    if (!id) { stats.missingIdRows++; continue; }
    const address = get('address') || [get('number') + get('number_suffix'), get('street'), get('suffix')].filter(Boolean).join(' ');
    const record = { permit_number: id, address, status: get('status'), status_date: get('status_date'), filed_date: get('filed_date'), description: get('description'), data_as_of: get('data_as_of'), duplicate_rows: 0, ambiguous: false };
    if (records.has(id)) {
      const previous = records.get(id);
      previous.duplicate_rows++; stats.duplicateRows++;
      // Never pick a winner between conflicting versions of the same permit.
      if ([...COMPARE_FIELDS, 'data_as_of'].some(k => comparable(k, previous[k]) !== comparable(k, record[k]))) previous.ambiguous = true;
    } else records.set(id, record);
  }
  stats.ambiguousPermits = [...records.values()].filter(r => r.ambiguous).length;
  if (stats.missingIdRows) warnings.push(label + ': ' + stats.missingIdRows + ' rows without permit IDs were excluded; they cannot be matched.');
  if (stats.duplicateRows) warnings.push(label + ': ' + stats.duplicateRows + ' duplicate rows collapsed. Conflicting versions are marked ambiguous, not treated as a reliable change.');
  if (stats.unknownPrimaryRows) warnings.push(label + ': ' + stats.unknownPrimaryRows + ' rows have an unknown primary-address flag and were retained.');
  return { records, present, warnings, stats };
}

export function compareSnapshots(earlierCSV, laterCSV) {
  const earlier = readSnapshot(earlierCSV, 'Earlier export'), later = readSnapshot(laterCSV, 'Later export');
  const fields = COMPARE_FIELDS.filter(k => earlier.present.has(k) && later.present.has(k));
  const warnings = [...earlier.warnings, ...later.warnings];
  const missing = COMPARE_FIELDS.filter(k => !fields.includes(k));
  if (missing.length) warnings.push('Not compared because a column is absent in at least one export: ' + missing.join(', ') + '.');
  const counts = { only_later: 0, only_earlier: 0, changed: 0, unchanged: 0, ambiguous: 0 };
  let reversedSourceDates = 0;
  const rows = [...new Set([...earlier.records.keys(), ...later.records.keys()])].sort().map(id => {
    const before = earlier.records.get(id), after = later.records.get(id);
    let kind = 'unchanged', changedFields = [];
    if (before?.ambiguous || after?.ambiguous) kind = 'ambiguous';
    else if (!before) kind = 'only_later';
    else if (!after) kind = 'only_earlier';
    else {
      changedFields = fields.filter(k => comparable(k, before[k]) !== comparable(k, after[k]));
      if (changedFields.length) kind = 'changed';
      const a = isoDay(before.data_as_of), b = isoDay(after.data_as_of);
      if (a && b && b < a) reversedSourceDates++;
    }
    counts[kind]++;
    return { permit_number: id, address: after?.address || before?.address || '', kind, changed_fields: changedFields, before: before || null, after: after || null, purchasing_status: 'UNVERIFIED', official_permit_url: sourceLink(id) };
  });
  if (reversedSourceDates) warnings.push(reversedSourceDates + ' matched permits have an older Data As Of date in the later input. Check export order and filters; no chronological update is established.');
  return { rows, counts, fields, warnings, earlier_stats: earlier.stats, later_stats: later.stats };
}

export function selectComparisonRows(result, view = 'changes') {
  if (view === 'all') return result.rows;
  if (view === 'changes') return result.rows.filter(r => r.kind !== 'unchanged');
  if (!['only_later', 'only_earlier', 'changed', 'unchanged', 'ambiguous'].includes(view)) throw new Error('Choose a supported comparison view.');
  return result.rows.filter(r => r.kind === view);
}

export function comparisonCSV(rows, exportedAt) {
  const fields = ['permit_number', 'address', 'comparison_result', 'changed_fields', 'earlier_status', 'later_status', 'earlier_status_date', 'later_status_date', 'earlier_filed_date', 'later_filed_date', 'earlier_data_as_of', 'later_data_as_of', 'earlier_description', 'later_description', 'earlier_duplicate_rows', 'later_duplicate_rows', 'purchasing_status', 'official_permit_url', 'exported_at_utc'];
  const records = rows.map(r => [r.permit_number, r.address, r.kind, r.changed_fields.join(' | '), r.before?.status, r.after?.status, r.before?.status_date, r.after?.status_date, r.before?.filed_date, r.after?.filed_date, r.before?.data_as_of, r.after?.data_as_of, r.before?.description, r.after?.description, r.before?.duplicate_rows, r.after?.duplicate_rows, r.purchasing_status, r.official_permit_url, exportedAt]);
  return '\uFEFF' + [fields, ...records].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
