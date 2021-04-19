# institutions

## Usage

```bash
$ ezmesure-admin institutions --help
```

## Commands

| Name | Description |
| --- | --- |
| [get](#get) [institutions...] | Get institution(s) informations |
| [list](#list) | List all institutions |
| [export](#export) [institutions...] |Export institution(s) |
| [import](#import) | Import institution(s) |

## Commands details

### get

#### Usage

```bash
$ ezmesure-admin institutions get --help
```

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

### list

#### Usage

```bash
$ ezmesure-admin institutions list --help
```

Example :

```bash
$ ezmesure-admin institutions list

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
| -o, --output | Output path |

Example :

```bash
$ ezmesure-admin institutions export -o ~/Documents/exports

? Institutions : 
❯◯ MyInstitution
 ◯ MyInstitution 2

institution [MyInstitution] exported successfully
```

or

```bash
$ ezmesure-admin institutions export MyInstitution s-o ~/Documents/exports

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
| -f, --files | Files path |

Example :

```bash
$ ezmesure-admin institutions import -f ~/Documents/import/*.json

Successfully imported institution(s).
