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
| [update](#update) <role> | Update role informations |

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

### get

#### Usage
```bash
$ ezmesure-admin roles get --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -a, --all | String | Display all data in table |
| -j, --json | Boolean | Display data in json |
| --nd | Boolean | Display data in nd |

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

### update

#### Usage
```bash
$ ezmesure-admin roles update --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --space-add | String | Add space with privileges |
| --space-remove | String | Remove space(s) |
| --index-add | String | Add index with privileges |
| --index-remove | String | Remove index(ces) |

> :warning: ``--space-add`` or ``--index-add`` adds a new space/index but is also used to update space and index privileges.
<br>
The update does not add the new privileges to the old ones, so remember to put them back when you use the command if you need to keep them.

Examples :

##### Add space(s)

```bash
$ ezmesure-admin roles update myRole --space-add <spaceName>:<privileges>
```

| Privileges |
| --- |
| all |
| read |
| custom |

```bash
$ ezmesure-admin roles update myRole --space-add my-space:all

role [myRole] updated successfully
```

If you want to use custom privileges, the name of the feature kibana and the privileges on the feature are separated by a dash, the syntax is as follows

```bash
$ ezmesure-admin roles update myRole --space-add my-space:<feature>-<privileges>
```

#### Features

<ul>
  <li>discover</li>
  <li>visualize</li>
  <li>dashboard</li>
  <li>dev_tools</li>
  <li>advancedSettings</li>
  <li>indexPatterns</li>
  <li>savedObjectsManagement</li>
  <li>graph</li>
  <li>monitoring</li>
  <li>ml</li>
  <li>apm</li>
  <li>maps</li>
  <li>canvas</li>
  <li>infrastructure</li>
  <li>logs</li>
  <li>siem</li>
  <li>uptime</li>
  <li>ezreporting</li>
  <li>discover</li>
  <li>visualize</li>
  <li>dashboard</li>
  <li>dev_tools</li>
  <li>advancedSettings</li>
  <li>indexPatterns</li>
  <li>savedObjectsManagement</li>
  <li>graph</li>
  <li>monitoring</li>
  <li>ml</li>
  <li>apm</li>
  <li>maps</li>
  <li>canvas</li>
  <li>infrastructure</li>
  <li>logs</li>
  <li>siem</li>
  <li>uptime</li>
  <li>ezreporting</li>
</ul>

#### Example

```bash
$ ezmesure-admin roles update myRole --space-add my-space:discover-all

role [myRole] updated successfully
```

The Kibana feature privileges are separated by a comma, as follows

```bash
$ ezmesure-admin roles update myRole --space-add my-space:discover-all,dashboard:read

role [myRole] updated successfully
```

##### Remove space(s)

> Spaces must be separated by a comma.

```bash
$ ezmesure-admin roles update myRole --space-remove my-space,my-other-space

role [myRole] updated successfully
```

##### Remove index(ces)

> Indices must be separated by a comma.

```bash
$ ezmesure-admin roles update myRole --index-remove my-index,my-other-index

role [myRole] updated successfully
```

##### Add index(ces)

```bash
$ ezmesure-admin roles update myRole --index-add <indexName>:<privileges>
```

| Privileges |
| --- |
| all |
| read |
| custom<br><ul><li>``create``</li><li>``create_index``</li><li>``delete``</li><li>``delete_index``</li><li>``index``</li><li>``manage``</li><li>``manage_follow_index``</li><li>``manage_ilm``</li><li>``manage_leader_index``</li><li>``monitor``</li><li>``read_cross_cluster``</li><li>``view_index_metadata``</li><li>``write``</li></ul> |

```bash
$ ezmesure-admin roles update myRole --index-add my-index:all

role [myRole] updated successfully
```
