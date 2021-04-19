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