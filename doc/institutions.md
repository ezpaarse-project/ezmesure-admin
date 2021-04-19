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
║ MyInstitution 1  │ Paris     │ https://www.my-institution.fr/  │         │ <span color="green">ezPAARSE</span>  │ <span color="green">Validated</span> │ my_institution │ my_institution │ Doc : DOC Contact   ║
║                  │           │                                 │         │ <span color="green">ezMESURE</span>  │           │                │                │ Tech : TECH Contact ║
║                  │           │                                 │         │ <span color="red">Reporting</span> │           │                │                │                     ║
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
║ MyInstitution 1  │ Paris     │ https://www.my-institution.fr/  │         │ <span color="green">ezPAARSE</span>  │ <span color="green">Validated</span> │ my_institution │ my_institution │ Doc : DOC Contact   ║
║                  │           │                                 │         │ <span color="green">ezMESURE</span>  │           │                │                │ Tech : TECH Contact ║
║                  │           │                                 │         │ <span color="red">Reporting</span> │           │                │                │                     ║
╚══════════════════╧═══════════╧═════════════════════════════════╧═════════╧═══════════╧═══════════╧════════════════╧════════════════╧═════════════════════╝
```