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
| [edit](#edit) [role] | Edit report |
| [get](#get) <role> | Get and display role informations |
| [list](#list) | List all roles |

## Commands details

### add

#### Usage
```bash
$ ezmesure-admin roles add --help
```

Example :

```bash
$ ezmesure-admin roles add newRole

role [newRole] created succefully
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
║ role                        │ indices                                                                                │ applications                ║
╟─────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────╢
║ apm_system                  │ Names:                                                                                 │ Application:                ║
║                             │ Privileges:                                                                            │                             ║
╚═════════════════════════════╧════════════════════════════════════════════════════════════════════════════════════════╧═════════════════════════════╝
```
### list

#### Usage
```bash
$ ezmesure-admin roles list --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Display data in json |

Example :

```bash
$ ezmesure-admin roles list

╔═════════════════════════════╤════════════════════════════════════════════════════════════════════════════════════════╤═════════════════════════════╗
║ role                        │ indices                                                                                │ applications                ║
╟─────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────╢
║ kibana_dashboard_only_user  │ Names:                                                                                 │ Application: kibana-.kibana ║
║                             │ Privileges:                                                                            │                             ║
╟─────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────╢
║ apm_system                  │ Names:                                                                                 │ Application:                ║
║                             │ Privileges:                                                                            │                             ║
╟─────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────╢
║ watcher_admin               │ Names: .watches,.triggered_watches,.watcher-history-*,read                             │ Application:                ║
║                             │ Privileges:                                                                            │                             ║
╟─────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────╢
║ logstash_system             │ Names:                                                                                 │ Application:                ║
║                             │ Privileges:                                                                            │                             ║
╟─────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────╢
║ rollup_user                 │ Names:                                                                                 │ Application:                ║
║                             │ Privileges:                                                                            │                             ║
╚═════════════════════════════╧════════════════════════════════════════════════════════════════════════════════════════╧═════════════════════════════╝
```