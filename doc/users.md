# users

## Usage

```bash
$ ezmesure-admin users --help
```

## Commands

| Name | Description |
| --- | --- |
| [get](#get) [users...] | Get one or more users |
| [roles](#roles) <command> | Manage users roles |

## Commands details

### get

#### Usage
```bash
$ ezmesure-admin users get --help
$ ezmesure-admin users get [users...]
```
> If no user is specified, the command takes ten first users

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -i, --interactive | Boolean | Interactive mode |
| -a, --all | Boolean | Retrieve all users |
| -s, --size | Number | Number of users to recover (default: 10) |
| -d, --fields | String | Fields we want to retrieve separated by a comma (full_name,username,email,roles by default) |
| -j, --json | Boolean | Print result(s) in json |
| -n, --ndjson | boolean | Output newline delimited JSON file |

> :warning: The parameter ``fields`` is not used for display in table mode but for ``json`` and ``ndjson`` output, the information displayed in the table is ``username``, ``full_name``, ``email`` and ``roles``

Example :
```bash
$ ezmesure-admin users get elastic

╔══════════╤═══════════╤═══════╤═══════════╗
║ Username │ Full name │ email │ roles     ║
╟──────────┼───────────┼───────┼───────────╢
║ elastic  │           │       │ superuser ║
╚══════════╧═══════════╧═══════╧═══════════╝
```
### roles

#### Usage
```bash
$ ezmesure-admin users roles --help
```

#### Commands

| Name | Description |
| --- | --- |
| [add](#add) [users...] | Add role |

#### add

#### Usage
```bash
$ ezmesure-admin users role add --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -r, --roles | Array | Roles name |
| --it, --interactive | Boolean | Interactive mode |

Example :
```bash
$ ezmesure-admin sushi add john.doe --roles anonymous
```