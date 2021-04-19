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
| -f, --frequencies | Array | Report frequency (weekly, monthly, quarterly, semi-annual, annual) |

Example :

```bash
$ ezmesure-admin reporting list

╔═════════════════════════════════════╤═══════════╤════════════════════════╤═══════╤═════════╗
║ Dashboard                           │ Frequency │ Emails                 │ Print │ Sent at ║
╟─────────────────────────────────────┼───────────┼────────────────────────┼───────┼─────────╢
║ my Dashboard for reporting          │ 1w        │ john.doe@email.fr, ... │ true  │         ║
╚═════════════════════════════════════╧═══════════╧════════════════════════╧═══════╧═════════╝
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
| -e, --export | String | Export format (json) |
| -o, --output | String | Output path |

Example :

```bash
$ ezmesure-admin reporting info -e json -o ~/Documents/exports

Data exported successfully at /home/wilmouth/Téléchargements/reporting_info_2021_04_19_14_5_59.json
```