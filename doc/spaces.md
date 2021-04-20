# spaces

## Usage

```bash
$ ezmesure-admin spaces --help
```

## Commands

| Name | Description |
| --- | --- |
| [add](#add) <space> | Create new space |
| [delete](#delete) [spaces...] | Delete space(s) |
| [get](#get) <space> | Get and display role informations |
| [list](#list) [role] | List all spaces |
| [reporting](#reporting) <command> | Manage reporting |

## Commands details

### add

#### Usage
```bash
$ ezmesure-admin spaces add --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -c, --color | String | Space color |
| -d, --description | String | Space description |
| -i, --initials | String | Space initials |
| --it, --interactive | Boolean | Interactive mode |

Example :
```bash
$ ezmesure-admin spaces add --color "#CCCCC" --description "My Space" --initials "ms"
```

### delete

#### Usage
```bash
$ ezmesure-admin spaces delete --help
```

Example :
```bash
$ ezmesure-admin spaces delete mySpace
```

### get

#### Usage
```bash
$ ezmesure-admin spaces get --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Display data in json |
| -a, --all | Boolean | Display all data in table |


Example :
```bash
$ ezmesure-admin spaces get mySpace --json
```
### list

#### Usage
```bash
$ ezmesure-admin spaces list --help
```
#### Options
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Display data in json |
| -a, --all | Boolean | Display all data in table |

Example :
```bash
$ ezmesure-admin spaces list --all
```

### reporting

#### Usage
```bash
$ ezmesure-admin spaces reporting --help
```

### Commands

| Name | Description |
| --- | --- |
| [delete](#delete) [space] | Delete reporting on space |
| [list](#list) [space] | List reporting on space |

### Commands details

#### reporting delete

#### Usage
```bash
$ ezmesure-admin spaces reporting delete --help
```

Example :
```bash
$ ezmesure-admin spaces reporting delete mySpace
```

#### reporting list

#### Usage
```bash
$ ezmesure-admin spaces reporting list --help
```

Example :
```bash
$ ezmesure-admin spaces reporting list mySpace
```