# dashboard

## Usage

```bash
$ ezmesure-admin dashboard --help
```
## Commands

| Name | Description |
| --- | --- |
| [export](#export) [space] | Export dashboard(s) |
| [import](#import) [space] | Import dashboard(s) |

## Commands details

### export

#### Usage
```bash
$ ezmesure-admin dashboard export --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -a, --all | Boolean | Export all dashboards |
| --it, --interactive | Boolean | Interactive mode |
| -o, --output | String | Output path |

```bash
$ ezmesure-admin dashboard export org-template
```

Examples :

```bash
$ ezmesure-admin dashboard export -o ~/Documents/exports

? Spaces (enter: select space) (Use arrow keys or type to search)
❯ Default 
  My SPace

? Dashboard (space to select, enter to valid) : 
❯◯ default
 ◯ my dashboard

dashboard [default:dashboard:49aff500-9133-11eb-b738-8bb313f943aa] exported successfully
```

or

```bash
$ ezmesure-admin dashboard export org-template -o ~/Documents/exports # with space name

? Dashboard (space to select, enter to valid) : 
❯◯ default
 ◯ my dashboard

dashboard [default:dashboard:49aff500-9133-11eb-b738-8bb313f943aa] exported successfully
```

### import

#### Usage
```bash
$ ezmesure-admin dashboard import --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -i, --index-pattern | String | Index pattern name |
| -o, --overwrite | Boolean | Overwrite conflicts |
| --it, --interactive | Boolean | Interactive mode |
| -f, --files | Boolean | Files path |

```bash
$ ezmesure-admin dashboard import [space]
```

Examples :

```bash
$ ezmesure-admin dashboard import mySpace --index-pattern myIndex --files ~/Documents/exports
```

### bulk-import

Import a set of dashboards into a given list of spaces. If no space is provided, the command prompts the user for a suffix, and imports dashboards into all spaces that belong to an institution and match the given suffix. If no JSON files are provided, the command fetches dashboards from the reference repository (ezmesure-templates), and lets the user choose from them.

#### Usage
```bash
$ ezmesure-admin dashboard bulk-import --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -s, --spaces            | Array   | Space names, case sensitive. If not provided, will import in all institution spaces with a given suffix. |
| --ignore-missing-spaces | Boolean | Ignore missing spaces |
| --ignore-conflicts      | Boolean | Ignore object conflicts |
| -o, --overwrite         | Boolean | Overwrite conflicts |
| -f, --files             | Boolean | Files path. If not provided, will fetch dashboards from the remote reference repository. |


Examples :

To import dashboards from the reference repository into spaces of all institutions, and ignore spaces that does not exist, run :

```bash
$ ezmesure-admin dashboard bulk-import --ignore-missing-spaces
```

To import dashboards from the reference repository into a given list of spaces, run :

```bash
$ ezmesure-admin dashboard bulk-import --spaces foo-publisher,bar-publisher
```

