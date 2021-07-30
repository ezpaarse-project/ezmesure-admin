# roles

## Usage

```bash
$ ezmesure-admin roles --help
```

## Commands

| Name | Description |
| --- | --- |
| [add](#add) <role> | Create new role |
| [delete](#delete) [roles...] | Delete role(s) |
| [edit](#edit) [role] | Edit role |
| [get](#get) <role> | Get and display role(s) informations |

## Commands details

### add

#### Usage
```bash
$ ezmesure-admin roles add --help
```

| Name | Type | Description |
| --- | --- | --- |
| -i, --index-pattern | String | Index-pattern name (e.g: my-index, m-y-index*) |
| -s, --space | String | Space name, case sensitive |
| -p, --privileges | String | Privileges (all or read) |
| -r, --read-only | String | Create role with read privileges and _read_only suffix |

Example :

```bash
$ ezmesure-admin roles add my-role --space my-space --index-pattern my-index --privileges read --read-only

role [my-role] created or updated
role [my-role_read_only] created or updated
```

### delete

#### Usage
```bash
$ ezmesure-admin roles delete --help
```

Example :

```bash
$ ezmesure-admin roles delete newRole

role [newRole] deleted succefully
```

### edit

#### Usage
```bash
$ ezmesure-admin roles edit --help
```

Example :

```bash
$ ezmesure-admin roles edit newRole

role [newRole] edited succefully
```

### get

#### Usage
```bash
$ ezmesure-admin roles get --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Display data in json |

Example :

```bash
$ ezmesure-admin roles get apm_system

╔═════════════════════════════╤════════════════════════════════════════════════════════════════════════════════════════╤═════════════════════════════╗
║ role                        │ indices                                                                                │ spaces                      ║
╟─────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────╢
║ apm_system                  │ Names:                                                                                 │ Space:                      ║
║                             │ Privileges:                                                                            │ Privileges:                 ║
╚═════════════════════════════╧════════════════════════════════════════════════════════════════════════════════════════╧═════════════════════════════╝
```
