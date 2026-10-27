const initialize = () => {
  const root = document.getElementById('sf-permit-csv-tool');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'yes';
  const q = name => root.querySelector('[data-tool="' + name + '"]');
  let result = null, exportURL = '', exampleSource = '';
  const status = text => { q('status').textContent = text; };
  const updateShareLink = () => {
    const url = new URL('https://sfkitchenfieldnotes.blogspot.com/2026/10/free-sf-restaurant-permit-csv-filter.html');
    if (q('mode').value !== 'all') url.searchParams.set('scope', q('mode').value);
    if (isoDay(q('since').value)) url.searchParams.set('since', q('since').value);
    if (exampleSource) url.searchParams.set('examples', exampleSource);
    url.hash = 'sf-permit-csv-tool';
    q('share').href = url.href;
  };
  const clearResults = () => {
    result = null;
    q('rows').replaceChildren(); q('warnings').replaceChildren(); q('results').hidden = true; q('export').disabled = true;
    if (exportURL) { URL.revokeObjectURL(exportURL); exportURL = ''; }
  };
  const review = () => {
    clearResults();
    try {
      result = reviewCSV(q('input').value, { since: q('since').value, mode: q('mode').value });
      const s = result.stats;
      status(result.rows.length + ' matched permits from ' + s.sourceRows + ' source rows. ' + s.duplicateRows + ' duplicate rows collapsed; ' + s.secondaryRows + ' secondary-address rows skipped. These are research records, not verified buyers.');
      for (const warning of result.warnings) { const p = document.createElement('p'); p.textContent = warning; q('warnings').append(p); }
      for (const row of result.rows) {
        const tr = document.createElement('tr');
        const a = document.createElement('a'); a.href = row.official_permit_url; a.textContent = row.permit_number + (row.source_format === 'permitsf' ? ' (find in official table)' : ''); a.target = '_blank'; a.rel = 'noopener';
        const address = document.createElement('td'); address.append(document.createTextNode((row.address || 'Address unavailable') + ' '), document.createElement('br'), a);
        const dates = document.createElement('td'); dates.textContent = (row.date_basis === 'submitted_date' ? 'Submitted: ' + (row.submitted_date || 'unknown') : 'Filed: ' + (row.filed_date || 'unknown')) + ' · Issued: ' + (row.issued_date || 'unknown') + ' · Status: ' + (row.status || 'unknown') + ' · Status date: ' + (row.status_date || 'unknown') + ' · Data as of: ' + (row.data_as_of || 'unknown');
        const note = document.createElement('td');
        note.append(document.createTextNode(row.scope_review));
        if (row.reference_permit_candidates.length) { const p = document.createElement('p'); p.textContent = 'Reference candidate(s), check source: ' + row.reference_permit_candidates.join(', ') + '. No extra buyer counted.'; note.append(p); }
        if (row.duplicate_source_rows || row.address_conflict) { const p = document.createElement('p'); p.textContent = 'Duplicate source rows: ' + row.duplicate_source_rows + (row.address_conflict ? '; address conflict — inspect source.' : '.'); note.append(p); }
        const details = document.createElement('details'), summary = document.createElement('summary'), scope = document.createElement('p');
        summary.textContent = 'Read scope'; scope.textContent = row.description; details.append(summary, scope); note.append(details);
        tr.append(address, dates, note); q('rows').append(tr);
      }
      q('results').hidden = false; q('export').disabled = result.rows.length === 0;
      if (!result.rows.length) { const p = document.createElement('p'); p.textContent = 'No matches for these filters. This does not establish that no restaurant projects exist. Adjust the date or inspect the official source.'; q('warnings').append(p); }
      updateShareLink();
    } catch (error) { status(error.message); }
  };
  q('review').addEventListener('click', review);
  q('examples').addEventListener('click', () => {
    q('input').value = EXAMPLE_CSV; q('since').value = ''; q('mode').value = 'all'; exampleSource = 'original'; review();
    q('example-note').hidden = false; q('equipment-note').hidden = true;
  });
  q('equipment-examples').addEventListener('click', () => {
    q('input').value = EQUIPMENT_CSV; q('since').value = ''; exampleSource = 'equipment';
    q('example-note').hidden = true; q('equipment-note').hidden = false; review();
  });
  q('clear').addEventListener('click', () => { q('input').value = ''; q('since').value = ''; q('mode').value = 'all'; exampleSource = ''; q('example-note').hidden = true; q('equipment-note').hidden = true; clearResults(); updateShareLink(); status('Paste a DataSF CSV, including its header, or load dated examples.'); });
  for (const name of ['input', 'since', 'mode']) q(name).addEventListener('input', () => {
    if (name === 'input') { exampleSource = ''; q('example-note').hidden = true; q('equipment-note').hidden = true; }
    clearResults(); updateShareLink(); status('Input changed. Choose Review CSV to apply these values.');
  });
  q('export').addEventListener('click', () => {
    if (!result?.rows.length) return;
    if (exportURL) URL.revokeObjectURL(exportURL);
    exportURL = URL.createObjectURL(new Blob([exportCSV(result, new Date().toISOString())], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = exportURL; a.download = 'sf-restaurant-permit-shortlist.csv'; root.append(a); a.click(); a.remove();
    status(result.rows.length + ' permit rows exported. The CSV retains source dates and UNVERIFIED purchasing status; the export timestamp is not a source update.');
  });
  q('review').disabled = false; q('examples').disabled = false; q('equipment-examples').disabled = false; q('clear').disabled = false;
  const requested = new URLSearchParams(window.location.search);
  if (SCOPE_MODES.includes(requested.get('scope'))) q('mode').value = requested.get('scope');
  if (requested.get('since') && isoDay(requested.get('since')) === requested.get('since')) q('since').value = requested.get('since');
  if (['original', 'equipment'].includes(requested.get('examples'))) {
    exampleSource = requested.get('examples');
    q('input').value = exampleSource === 'equipment' ? EQUIPMENT_CSV : EXAMPLE_CSV;
    q('example-note').hidden = exampleSource !== 'original'; q('equipment-note').hidden = exampleSource !== 'equipment'; review();
  } else status('Ready. Paste a DataSF CSV, including its header, or load dated examples.');
  updateShareLink();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true }); else initialize();
