# users

## Usage

```bash
$ ezmesure-admin users --help
```

## Commands

| Name | Description |
| --- | --- |
| [get](#get) [users...] | Get one or more users |
| [list](#list) | List users |
| [roles](#roles) <command> | Manage users roles |

## Commands details

### get

#### Usage
```bash
$ ezmesure-admin users get --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Print result(s) in json |

Example :
```bash
$ ezmesure-admin users get elastic

╔══════════╤═══════════╤═══════╤═══════════╤══════════╗
║ Username │ Full name │ email │ roles     │ reserved ║
╟──────────┼───────────┼───────┼───────────┼──────────╢
║ elastic  │           │       │ superuser │ true     ║
╚══════════╧═══════════╧═══════╧═══════════╧══════════╝
```

### list

#### Usage
```bash
$ ezmesure-admin users list --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Print result(s) in json |

Example :
```bash
$ ezmesure-admin users list elastic

╔════════════════════════╤═════════════════════╤══════════════════════════════╤═════════════════════════════════════════════════════════════╤═══════════╗
║ Username               │ Full name           │ email                        │ roles                                                       │ reserved  ║
╟────────────────────────┼─────────────────────┼──────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────╢
║ john.doe               │ DOE John            │ john.doe@email.fr            │ insivible_man anonymous                                     │           ║
╟────────────────────────┼─────────────────────┼──────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────╢
║ elastic                │                     │                              │ superuser                                                   │ true      ║
╟────────────────────────┼─────────────────────┼──────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────╢
║ kibana                 │                     │                              │ kibana_system                                               │ true      ║
╟────────────────────────┼─────────────────────┼──────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────╢
║ logstash_system        │                     │                              │ logstash_system                                             │ true      ║
╟────────────────────────┼─────────────────────┼──────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────╢
║ beats_system           │                     │                              │ beats_system                                                │ true      ║
╟────────────────────────┼─────────────────────┼──────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────╢
║ apm_system             │                     │                              │ apm_system                                                  │ true      ║
╟────────────────────────┼─────────────────────┼──────────────────────────────┼─────────────────────────────────────────────────────────────┼───────────╢
║ remote_monitoring_user │                     │                              │ remote_monitoring_collector remote_monitoring_agent         │ true      ║
╚════════════════════════╧═════════════════════╧══════════════════════════════╧═════════════════════════════════════════════════════════════╧═══════════╝
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
| [delete](#delete) [user] | Delete role |

#### add

#### Usage
```bash
$ ezmesure-admin users role add --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -r, --roles | Array | Roles name |

Example :
```bash
$ ezmesure-admin sushi add john.doe --roles anonymous
```

#### delete

#### Usage
```bash
$ ezmesure-admin users role delete --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -r, --roles | Array | Roles name |

Example :
```bash
$ ezmesure-admin sushi delete john.doe --roles anonymous
```