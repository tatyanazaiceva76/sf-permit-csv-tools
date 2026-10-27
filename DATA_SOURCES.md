# Data sources and example dates

The CSV examples reproduce selected records from the City and County of San Francisco's [Building Permits dataset](https://data.sf.gov/Housing-and-Buildings/Building-Permits/i98e-djp9/about_data), dataset ID `i98e-djp9`. They retain the source's descriptions, including abbreviations and spelling. The files are small teaching examples, not an export of every permit or a list of verified buyers.

`data_as_of` is the date supplied with an individual source row. It can differ across rows within a saved export. File names and the tool's download timestamp do not change that source date. These examples were assembled on October 26, 2026 from previously saved records; they do not report current status after their listed dates.

## Filter examples

`filter-examples.csv` contains four rows collected on October 26, 2026, with individual source dates shown below. They illustrate a referenced permit, cabinet-only scope, equipment context and unrelated HVAC equipment-room wording. Use **Load 4 dated examples** in the filter to inspect them.

| Permit | Source date |
| --- | --- |
| [202610229781](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202610229781&primary_address_flag=Y) | 2026-10-24 |
| [202610229747](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202610229747&primary_address_flag=Y) | 2026-10-24 |
| [202610199583](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202610199583&primary_address_flag=Y) | 2026-10-21 |
| [202610159474](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202610159474&primary_address_flag=Y) | 2026-10-24 |

`equipment-examples.csv` contains these three older records. Scope labels describe wording, not orders or purchasing intent.

| Permit | Address | Source date | Scope context |
| --- | --- | --- | --- |
| [202609148084](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202609148084&primary_address_flag=Y) | 1114 Bryant St | 2026-10-01 | Walk-in cooler and hand sink in an existing restaurant |
| [202609037630](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202609037630&primary_address_flag=Y) | 2031 Chestnut St | 2026-10-11 | Equipment under an existing hood; a replacement hood is not established |
| [202608196841](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202608196841&primary_address_flag=Y) | 1850 Polk St | 2026-10-20 | Coffee and tea preparation, with no cooking |

## Comparison examples

The earlier rows were retained in a saved October 11, 2026 selection. The later rows were retained in a saved October 20 selection. Individual `data_as_of` values, shown below, determine their freshness.

| Permit | Earlier source date | Later source date | Result in these examples |
| --- | --- | --- | --- |
| 202608196841 | 2026-10-10 | 2026-10-20 | Status changed from filed to issued; later status date is October 19 |
| [202610079164](https://data.sf.gov/resource/i98e-djp9.json?permit_number=202610079164&primary_address_flag=Y) | 2026-10-09 | 2026-10-20 | Description gained a power-door-operator sentence; status remained filed |
| 202609148084 | 2026-10-01 | 2026-10-01 | Unchanged in compared fields |

Official links may show a newer state than these fixtures. Compare the displayed source dates before relying on a result.

## Data license

The dataset metadata saved with the original source records lists license ID `PDDL`, the Open Data Commons Public Domain Dedication and License, and links to [PDDL 1.0](https://opendatacommons.org/licenses/pddl/1-0/). That attribution describes the captured source metadata; it is not a new license lookup for today's dataset.

The software license in this repository applies to the original code and documentation. It does not replace the source data's PDDL dedication, create ownership of government records, or grant rights to third-party materials merely linked from a source record. No City endorsement is implied.

## PermitSF format and coverage (checked October 27, 2026 UTC)

The official [legacy electrical dataset](https://data.sf.gov/Housing-and-Buildings/Electrical-Permits-legacy-system-/ftty-kx6y) and [legacy plumbing/mechanical dataset](https://data.sf.gov/Housing-and-Buildings/Plumbing-Permits-legacy-system-/a6aw-rudh) direct readers to [PermitSF Permitting Data, tyz3-vt28](https://data.sf.gov/Housing-and-Buildings/PermitSF-Permitting-Data/tyz3-vt28/about_data) for permits submitted through PermitSF from September 14, 2026 onward. Legacy exceptions remain. The PermitSF catalog includes electrical and plumbing/mechanical permits without plans and other specified types; it does not replace all Building Permits categories.

The live catalog confirmed the field names used by the filter, including `recordno`, `submitted_date`, `status_detail`, `permit_issued_date`, `streetno`, `streetname`, `unit` and `data_as_of`. This is a format/coverage check, not a newly downloaded set of project rows or evidence of procurement. The source metadata lists PDDL. Existing CSV example files and their source dates are unchanged. New unit-test rows containing `TEST` are original synthetic fixtures, not government records.
