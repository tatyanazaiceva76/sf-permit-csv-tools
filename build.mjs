import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(name, import.meta.url), 'utf8');
const write = (name, text) => fs.writeFileSync(new URL(name, import.meta.url), text);
const unexport = text => text.replace(/^export /gm, '');
const literal = text => JSON.stringify(text).replaceAll('<', '\\u003c');
const ascii = text => text.replace(/[^\x00-\x7f]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
const script = text => '<script type="module">\n' + ascii(text) + '\n</script>';
const base = unexport(read('finder-core.mjs'));

const filterCode = base + '\nconst EXAMPLE_CSV = ' + JSON.stringify(read('filter-examples.csv')) + ';\nconst EQUIPMENT_CSV = ' + JSON.stringify(read('equipment-examples.csv')) + ';\n' + read('filter-client.js');
const filter = read('filter-template.html').replace('<!-- SCRIPT -->', script(filterCode));
write('filter.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SF restaurant permit CSV trade filters</title></head><body style="max-width:1050px;margin:32px auto;padding:0 16px;font:17px/1.65 system-ui,sans-serif"><h1>SF restaurant permit CSV trade filters</h1>' + filter + '</body></html>');

const compareCore = unexport(read('compare-core.mjs').replace(/^import .*;\n/m, ''));
const compareCode = base + '\n' + compareCore + '\nconst EARLIER_EXAMPLE = ' + literal(read('earlier-example.csv')) + ';\nconst LATER_EXAMPLE = ' + literal(read('later-example.csv')) + ';\n' + read('compare-client.js');
const compare = read('compare-template.html').replace('<!-- SCRIPT -->', script(compareCode));
write('compare.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Free SF permit CSV snapshot comparison</title></head><body style="max-width:1100px;margin:32px auto;padding:0 16px;font:17px/1.65 system-ui,sans-serif"><h1>Free SF permit CSV snapshot comparison</h1>' + compare + '</body></html>');

console.log('Built filter.html and compare.html from local source and example files.');
