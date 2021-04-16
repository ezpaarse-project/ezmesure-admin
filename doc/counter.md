# counter (deprecated)

## Usage

```bash
$ ezmesure-admin counter4 --help
```

```bash
$ ezmesure-admin counter4 <files...>
```

## Options
| Name | Type | Description |
| --- | --- | --- |
| -p, --package | String | JR1 package |
| -b, --bulk | Boolean | bulk index JR1 data |
| -d, --depositor | String | Index prefix name for publisher index |
| -n, --ndjson | boolean | Output newline delimited JSON file |
| -j, --json | Boolean | Save in JSON file |

Example :

```bash
$ ezmesure-admin counter4 ~/Documents/files/*.csv -p counter --depositor univ-depositor --json
```

Example of result:

```bash
╔═════════════════════╤════════════════════╤═════════╤═══════════╤══════════╤═════════╤═════════╤════════╤═══════╗
║ File                │ Index              │ Package │ Took (ms) │ Inserted │ Updated │ Deleted │ Errors │ Total ║
╟─────────────────────┼────────────────────┼─────────┼───────────┼──────────┼─────────┼─────────┼────────┼───────╢
║ counter4_file1.csv  │ univ-publisher     │ counter │ 621       │ 60       │ 0       │ 0       │ 0      │ 60    ║
╟─────────────────────┼────────────────────┼─────────┼───────────┼──────────┼─────────┼─────────┼────────┼───────╢
║ counter4_file1.csv  │ univ-publisher     │ counter │ 228       │ 365      │ 0       │ 0       │ 0      │ 365   ║
╚═════════════════════╧════════════════════╧═════════╧═══════════╧══════════╧═════════╧═════════╧════════╧═══════╝

2 / 2 files processed
Metrics :
  - Inserted: 425
  - Updated: 0
  - Deleted: 0
  - Errors: 0
  - Total: 425
```