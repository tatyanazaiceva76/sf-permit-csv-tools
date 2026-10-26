const initializeComparison = () => {
  const root = document.getElementById('sf-permit-csv-compare');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'yes';
  const q = key => root.querySelector('[data-compare="' + key + '"]');
  const labels = { changed: 'Compared fields changed', only_later: 'Only in later export', only_earlier: 'Only in earlier export', unchanged: 'Unchanged in compared fields', ambiguous: 'Ambiguous duplicate versions' };
  let result = null, objectURL = '';
  const message = text => { q('status').textContent = text; };
  const clearResults = () => {
    result = null; q('rows').replaceChildren(); q('warnings').replaceChildren(); q('results').hidden = true; q('download').disabled = true;
    if (objectURL) { URL.revokeObjectURL(objectURL); objectURL = ''; }
  };
  const render = () => {
    q('rows').replaceChildren();
    const rows = selectComparisonRows(result, q('view').value);
    q('download').disabled = rows.length === 0;
    q('display-limit').textContent = rows.length > 200 ? 'Showing the first 200 of ' + rows.length + ' selected records. The CSV includes all selected records.' : rows.length + ' selected records shown.';
    for (const r of rows.slice(0, 200)) {
      const tr = document.createElement('tr');
      const record = document.createElement('td'), link = document.createElement('a');
      link.href = r.official_permit_url; link.textContent = r.permit_number; link.target = '_blank'; link.rel = 'noopener';
      record.append(document.createTextNode(r.address || 'Address unavailable'), document.createElement('br'), link);
      const comparison = document.createElement('td'); comparison.textContent = labels[r.kind];
      if (r.changed_fields.length) { const p = document.createElement('p'); p.textContent = r.changed_fields.join(', '); comparison.append(p); }
      const before = document.createElement('td'), after = document.createElement('td');
      for (const [cell, value] of [[before, r.before], [after, r.after]]) {
        if (!value) { cell.textContent = 'Not in this pasted export'; continue; }
        cell.textContent = 'Status: ' + (value.status || 'unknown') + ' | Status date: ' + (value.status_date || 'unknown') + ' | Data As Of: ' + (value.data_as_of || 'unknown');
        const details = document.createElement('details'), summary = document.createElement('summary'), scope = document.createElement('p');
        summary.textContent = 'Read supplied scope'; scope.textContent = value.description || 'No description supplied'; details.append(summary, scope); cell.append(details);
      }
      tr.append(record, comparison, before, after); q('rows').append(tr);
    }
  };
  const compare = () => {
    clearResults();
    try {
      result = compareSnapshots(q('earlier').value, q('later').value);
      const c = result.counts;
      message(c.changed + ' changed; ' + c.only_later + ' only in later; ' + c.only_earlier + ' only in earlier; ' + c.ambiguous + ' ambiguous; ' + c.unchanged + ' unchanged in compared fields. Purchasing is unverified.');
      for (const text of result.warnings) { const p = document.createElement('p'); p.textContent = text; q('warnings').append(p); }
      q('compared-fields').textContent = 'Compared fields: ' + result.fields.join(', ') + '. Dates are compared at calendar-day precision. Data As Of differences alone are not a permit change.';
      q('source-counts').textContent = 'Source rows: ' + result.earlier_stats.sourceRows + ' earlier / ' + result.later_stats.sourceRows + ' later. Secondary-address rows excluded: ' + result.earlier_stats.secondaryRows + ' / ' + result.later_stats.secondaryRows + '.';
      q('results').hidden = false; render();
    } catch (error) { message(error.message); }
  };
  q('compare').addEventListener('click', compare);
  q('example').addEventListener('click', () => { q('earlier').value = EARLIER_EXAMPLE; q('later').value = LATER_EXAMPLE; q('example-note').hidden = false; q('view').value = 'all'; compare(); });
  for (const key of ['earlier', 'later']) q(key).addEventListener('input', () => { clearResults(); q('example-note').hidden = true; message('Input changed. Select Compare exports to apply both inputs.'); });
  q('view').addEventListener('change', () => { if (result) render(); });
  q('clear').addEventListener('click', () => { q('earlier').value = ''; q('later').value = ''; q('example-note').hidden = true; clearResults(); message('Inputs cleared. Paste two comparable DataSF CSV exports or load the dated example.'); });
  q('download').addEventListener('click', () => {
    if (!result) return;
    const rows = selectComparisonRows(result, q('view').value);
    if (!rows.length) return;
    if (objectURL) URL.revokeObjectURL(objectURL);
    objectURL = URL.createObjectURL(new Blob([comparisonCSV(rows, new Date().toISOString())], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = objectURL; a.download = 'sf-permit-snapshot-comparison.csv'; root.append(a); a.click(); a.remove();
    message(rows.length + ' selected records exported with both source dates and UNVERIFIED purchasing status. Export time is not a source refresh.');
  });
  for (const key of ['compare', 'example', 'clear']) q(key).disabled = false;
  message('Ready. Paste two comparable DataSF CSV exports or load the dated example.');
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeComparison, { once: true }); else initializeComparison();
