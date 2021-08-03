# institutions

## Usage

```bash
$ ezmesure-admin institutions --help
```

## Commands

| Name | Description |
| --- | --- |
| [get](#get) [institutions...] | Get institution(s) informations |
| [export](#export) [institutions...] |Export institution(s) |
| [import](#import) | Import institution(s) |

## Commands details

### get

#### Usage

```bash
$ ezmesure-admin institutions get --help
```
#### Options
| Name | Type | Description |
| --- | --- | --- |
| -a, --all | String | Export all institutions |
| -j, --json | Boolean | Print result(s) in json |

Example :

```bash
$ ezmesure-admin institutions get MyInstitution # with insitution(s) name

╔══════════════════╤═══════════╤═════════════════════════════════╤═════════╤═══════════╤═══════════╤════════════════╤════════════════╤═════════════════════╗
║ Name             │ City      │ Website                         │ Domains │ Auto      │ Validate  │ Index prefix   │ Role           │ Contact             ║
╟──────────────────┼───────────┼─────────────────────────────────┼─────────┼───────────┼───────────┼────────────────┼────────────────┼─────────────────────╢
║ MyInstitution 1  │ Paris     │ https://www.my-institution.fr/  │         │ ezPAARSE  │ Validated │ my_institution │ my_institution │ Doc : DOC Contact   ║
║                  │           │                                 │         │ ezMESURE  │           │                │                │ Tech : TECH Contact ║
║                  │           │                                 │         │ Reporting │           │                │                │                     ║
╚══════════════════╧═══════════╧═════════════════════════════════╧═════════╧═══════════╧═══════════╧════════════════╧════════════════╧═════════════════════╝
```

or 

```bash
$ ezmesure-admin institutions get

? Institutions : 
❯◯ MyInstitution
 ◯ MyInstitution 2

╔══════════════════╤═══════════╤═════════════════════════════════╤═════════╤═══════════╤═══════════╤════════════════╤════════════════╤═════════════════════╗
║ Name             │ City      │ Website                         │ Domains │ Auto      │ Validate  │ Index prefix   │ Role           │ Contact             ║
╟──────────────────┼───────────┼─────────────────────────────────┼─────────┼───────────┼───────────┼────────────────┼────────────────┼─────────────────────╢
║ MyInstitution 1  │ Paris     │ https://www.my-institution.fr/  │         │ ezPAARSE  │ Validated │ my_institution │ my_institution │ Doc : DOC Contact   ║
║                  │           │                                 │         │ ezMESURE  │           │                │                │ Tech : TECH Contact ║
║                  │           │                                 │         │ Reporting │           │                │                │                     ║
╚══════════════════╧═══════════╧═════════════════════════════════╧═════════╧═══════════╧═══════════╧════════════════╧════════════════╧═════════════════════╝
```

### export

#### Usage

```bash
$ ezmesure-admin institutions export --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -a, --all | String | Export all institutions |

Example :

```bash
$ ezmesure-admin institutions export ~/Documents/exports

? Institutions : 
❯◯ MyInstitution
 ◯ MyInstitution 2

institution [MyInstitution] exported successfully
```

or

```bash
$ ezmesure-admin institutions export ~/Documents/exports --all

institution [MyInstitution] exported successfully
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
