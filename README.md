# SF permit CSV tools

Two small browser tools for reviewing San Francisco Building Permits CSV exports: a restaurant scope filter and a comparison of two saved exports. They help researchers inspect permit wording, source dates and changed fields. A permit record does not establish an equipment purchase or a verified buyer.

Start with the [free tools and worked guides](https://sfkitchenfieldnotes.blogspot.com/p/start-here-free-sf-restaurant-permit.html). Choose a tool by task, read the six free permit examples, or follow the official-record and business-source checks. No account or purchase is needed.

Download the repository and open `filter.html` or `compare.html` in a browser with JavaScript enabled. Each file includes its code and examples; no installation, API key or account is needed. CSV processing runs in the page without uploading or storing your pasted input. Official record links and project links open external websites when followed.

| Tool | Local file | Hosted version |
| --- | --- | --- |
| Restaurant scope filter | [filter.html](filter.html) | [Use the free filter](https://sfkitchenfieldnotes.blogspot.com/2026/10/free-sf-restaurant-permit-csv-filter.html) |
| Snapshot comparison | [compare.html](compare.html) | [Compare two CSV exports](https://sfkitchenfieldnotes.blogspot.com/2026/10/blog-post.html#sf-permit-csv-compare) |

## Filter an export

Paste a comma-separated export including its header, choose a scope and an optional filed-on-or-after date, then select **Review CSV**. The scope choices cover food-service wording, equipment context, hoods and ventilation, refrigeration, and coffee or tea. These are text filters; inspect each original scope before drawing conclusions about the work.

Required columns are `permit_number`, `description` and `filed_date`. Display-style headers such as `Permit Number` also work. Keep `primary_address_flag` and `data_as_of` when available: the tool excludes rows explicitly marked as secondary addresses and warns when those columns are missing.

The filter keeps the first retained row for duplicate permit IDs and warns about duplicates and address conflicts. It does not resolve competing versions. Downloaded rows retain source dates, reference permit candidates, filter choice and `UNVERIFIED` purchasing status. Share links contain only view settings and optional built-in example selection; they open the hosted filter and do not contain pasted CSV data.

## Compare two exports

Paste the earlier and later exports, then select **Compare exports**. Match by permit number and inspect rows classified as changed, only in one export, unchanged, or ambiguous. Required columns are `permit_number` and `status` or `current_status`. Status dates, filed dates, descriptions and addresses are compared only when both exports supply them.

Dates are compared at calendar-day precision. A change to `data_as_of` alone is not a changed permit. Conflicting duplicates within either export are ambiguous; the tool does not choose a winner. A row present only in the later export is not necessarily a new filing, and a missing row is not proof of cancellation. Different export filters can produce either result.

Choose a result view before downloading. The table shows up to 200 selected rows; its CSV includes all selected rows, both supplied versions and source dates. An export timestamp records the download time, not a refresh of the official records.

## Dated examples and limits

The included examples are saved public records, not a live feed. The comparison example contains three permits: two changed in the compared fields and one remained unchanged. One record's status changed from filed to issued; another gained a description sentence. Neither observation establishes current procurement. See [Data sources and example dates](DATA_SOURCES.md) for the individual dates and source links.

Each input is limited to 2,000,000 characters and 10,000 source rows. Filter larger official exports first. Preserve permit IDs as text when opening downloaded CSVs in spreadsheet software. Export cells beginning with formula characters are prefixed with an apostrophe.

## Build and test

The checked-in HTML files are ready to open. To regenerate them, use Node.js 20 or later; there are no third-party dependencies and no install step.

```sh
node build.mjs
node --test filter.test.mjs compare.test.mjs
```

The tests cover dated examples, duplicate handling, missing fields, comparison categories, date ordering, scope exclusions, CSV quoting and spreadsheet formula escaping. The build reads only files in this repository and produces `filter.html` and `compare.html`.

## Project and license

This software was developed with Codex for SF Kitchen Pipeline, which publishes free permit-research guides and separately offers a paid research product. Using these tools requires no purchase. The project is independent of the City and County of San Francisco; no government affiliation or endorsement is claimed.

Software and documentation use the [Zero-Clause BSD license](LICENSE). The example permit data comes from DataSF and is covered separately in [Data sources and example dates](DATA_SOURCES.md). The repository contains small public examples rather than the paid research bundle.
