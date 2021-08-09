# sushi

## Usage

```bash
$ ezmesure-admin sushi --help
```

## Commands

| Name | Description |
| --- | --- |
| [add](#add) | Create new sushi |
| [delete](#delete) | Delete a shushi |
| [export](#export) [institutions...] | Export sushi data |
| [import](#import) [institution] | Import sushi(s) |
| [info](#info) [institution] | Get SUSHI informations |
| [list](#list) | List SUSHI informations of institutions |
| [test](#test) [institution] | Test SUSHI informations of institutions |

## Commands details

### add

#### Usage
```bash
$ ezmesure-admin sushi add --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -f, --file | String | Files path (json) |

Example :
```bash
$ ezmesure-admin sushi add ~/Documents/sushi/*.json
```

### delete

#### Usage
```bash
$ ezmesure-admin sushi delete --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -f, --file | String | Files path (json) |

Example :
```bash
$ ezmesure-admin sushi delete

? Institutions (enter: select institution) (Use arrow keys or type to search)
❯ My Institution
  Institution two
  Institution three

? Sushi vendor (space to select item) 
❯◯ Sushi vendor one
 ◯ Sushi vendor two
```

### export

#### Usage
```bash
$ ezmesure-admin sushi export --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -o, --output | String | Output type : json or csv |
| -a, --all | Boolean | Export all sushi data for all institutions |
| -d, --destination | String | Destination path |

Example :
```bash
$ ezmesure-admin sushi export -o json ~/Documents/sushi/exports

? Institutions : 
❯◯ Institution one
 ◯ Institution two
 ◯ Institution three

Sushi exported successfully, ~/Documents/sushi/exports/export_sushi_my-institution_2021_04_20_13_35_35.json
```

### import

#### Usage
```bash
$ ezmesure-admin sushi import --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -f, --files | String | Files path |

Example :
```bash
$ ezmesure-admin sushi import -o json ~/Documents/sushi/imports/*.json
```

### info

#### Usage
```bash
$ ezmesure-admin sushi info --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --token | String | ezMESURE token |
| -e, --export | String | Export format (json, csv) |
| -o, --output | String | Output path |

Example :
```bash
$ ezmesure-admin sushi info myInstitution ~/Documents/sushi/info
```

### list

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Print result(s) in json |
| -n, --ndjson | boolean | Output newline delimited JSON file |

#### Usage
```bash
$ ezmesure-admin sushi list --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --token | String | ezMESURE token |

Example :
```bash
$ ezmesure-admin sushi list

? Institutions (enter: select institution) (Use arrow keys or type to search)
❯ Institution one
  Institution two
  Institution three

? Sushi vendor (space to select item) 
❯◯ Sushi vendor one
 ◯ Sushi vendor two

╔═══════════╤══════════╤═════════════════════════════╤═════════════╤═════════════╤════════════════════════════════════════════╤═════════╗
║ package   │ vendor   │ endpoint                    │ customerId  │ requestorId │ apiKey                                     │ comment ║
╟───────────┼───────── ┼─────────────────────────────┼─────────────┼─────────────┼────────────────────────────────────────────┼─────────╢
║ MyPackage │ MyVendor │ https://my-package/endpoint │ SW_8854000  │             │ myvendor::11097a7fadc5faf1b2f054d62e0bd31e │         ║
╚═══════════╧══════════╧═════════════════════════════╧═════════════╧═════════════╧════════════════════════════════════════════╧═════════╝
```

### test

#### Usage
```bash
$ ezmesure-admin sushi test --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --token | String | ezMESURE token |
| -a, --all | Boolean | Test all platforms for once institution |
| -j, --json | Boolean | Print result(s) in json |
| -n, --ndjson | boolean | Output newline delimited JSON file |
| -o, --output | Boolean | Output path |

Example :
```bash
$ ezmesure-admin sushi test

? Institutions (enter: select institution) (Use arrow keys or type to search)
❯ Institution one
  Institution two
  Institution three

? Sushi vendor (space to select item) 
❯◯ Sushi vendor one
 ◯ Sushi vendor two

╔══════════╤════════════╤══════════╤═══════════════╤══════════════╤═════════════════════════════╤══════════════╗
║ vendor   │ package    │ status   │ duration (ms) │ message      │ endpoint                    │ reports      ║
╟──────────┼────────────┼──────────┼───────────────┼──────────────┼─────────────────────────────┼──────────────╢
║ MyVendor │ MyPackage  │ success  │ 692           │              │ https://my-package/endpoint │ TR_J1, TR_J2 ║
╚══════════╧════════════╧══════════╧═══════════════╧══════════════╧═════════════════════════════╧══════════════╝
```