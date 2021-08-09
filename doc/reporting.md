# reporting

## Usage

```bash
$ ezmesure-admin reporting --help
```

## Commands

| Name | Description |
| --- | --- |
| [list](#list) | List all reporting tasks |
| [info](#info) | Get report |

## Commands details

### list

#### Usage
```bash
$ ezmesure-admin reporting list --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -s, --status | Array | Reporting status: ongoing, completed, error |
| -f, --frequencies | Array | Report frequency (weekly, monthly, quarterly, semi-annual, annual) |
| -j, --json | Boolean | Print result(s) in json |
| -n, --ndjson | boolean | Output newline delimited JSON file |

Example :

```bash
$ ezmesure-admin reporting list my-space

╔══════════╤═════════════════════════════════════╤═══════════╤════════════════════════╤═══════╤═════════╗
║ Space    │ Dashboard                           │ Frequency │ Emails                 │ Print │ Sent at ║
╟──────────┼─────────────────────────────────────┼───────────┼────────────────────────┼───────┼─────────╢
║ my-space │ my Dashboard for reporting          │ 1w        │ john.doe@email.fr, ... │ true  │         ║
╚══════════╧═════════════════════════════════════╧═══════════╧════════════════════════╧═══════╧═════════╝
```

### info

#### Usage
```bash
$ ezmesure-admin reporting info --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -s, --status | Array | Reporting status: ongoing, completed, error |
| -o, --output | String | Output path |
| --ndjson | boolean | Output newline delimited JSON file |

Example :

```bash
$ ezmesure-admin reporting info -o ~/Documents/exports

Data exported successfully at /home/user/Téléchargements/reporting_info_2021_04_19_14_5_59.json
```