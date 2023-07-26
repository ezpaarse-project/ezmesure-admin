# institutions

## Usage

```bash
$ ezmesure-admin institutions --help
```

## Commands

| Name | Description |
| --- | --- |
| [Add](#add) [institutions...] | Add institution |
| [get](#get) [institutions...] | Get institution(s) informations |
| [import](#import) | Import institution(s) |

## Commands details

### Add

#### Usage

```bash
$ ezmesure-admin institutions add --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --namespace | String | namespace of institution |
| --type | String | type of institution |
| --acronym | String | acronym of institution |
| --validated | Boolean | if institution is validated |
| --spaces | String | spaces of institution |

### get

#### Usage

```bash
$ ezmesure-admin institutions get --help
```
#### Options
| Name | Type | Description |
| --- | --- | --- |
| -it, --interactive | String | Display a institutions selector |
| --no-contact | Boolean | filter by institutions with no contact |
| --no-validated | Boolean | filter by institutions not validate |
| -j, --json | Boolean | Print result(s) in json |
| -n, --ndjson | boolean | Output newline delimited JSON file |

Example :

```bash
$ ezmesure-admin institutions get <name>

╔══════╤══════╤═════════╤═════════╤═══════════╤═══════════════╤═══════════════════════════════╗
║ Name │ City │ Website │ Domains │ Auto      │ Validate      │ Contact                       ║
╟──────┼──────┼─────────┼─────────┼───────────┼───────────────┼───────────────────────────────╢
║ Test │      │         │         │ ezPAARSE  │ validated     │ Doc contact : ezmesure-admin  ║
║      │      │         │         │ ezMESURE  │               │ Tech contact : ezmesure-admin ║
║      │      │         │         │ reporting │               │                               ║
╚══════╧══════╧═════════╧═════════╧═══════════╧═══════════════╧═══════════════════════════════╝
```

or 

```bash
$ ezmesure-admin institutions get --interactive

? Institutions : 
❯◯ Test
 ◯ Test2

╔═══════╤══════╤═════════╤═════════╤═══════════╤═══════════════╤═══════════════════════════════╗
║ Name  │ City │ Website │ Domains │ Auto      │ Validate      │ Contact                       ║
╟───────┼──────┼─────────┼─────────┼───────────┼───────────────┼───────────────────────────────╢
║ Test  │      │         │         │ ezPAARSE  │ validated     │ Doc contact : ezmesure-admin  ║
║       │      │         │         │ ezMESURE  │               │ Tech contact : ezmesure-admin ║
║       │      │         │         │ reporting │               │                               ║
╟───────┼──────┼─────────┼─────────┼───────────┼───────────────┼───────────────────────────────╢
║ Test2 │      │         │         │ ezPAARSE  │ Not validated │ Doc contact : ezmesure-admin  ║
║       │      │         │         │ ezMESURE  │               │ Tech contact : ezmesure-admin ║
║       │      │         │         │ reporting │               │                               ║
╚═══════╧══════╧═════════╧═════════╧═══════════╧═══════════════╧═══════════════════════════════╝
```

### import

#### Usage

```bash
$ ezmesure-admin institutions import --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -f, --files | String | Files path |

Example :

```bash
$ ezmesure-admin institutions import -f ~/Documents/import/*.json

Successfully imported institution(s).
