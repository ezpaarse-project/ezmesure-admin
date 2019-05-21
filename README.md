# ezmesure-admin

> Tools for ezMESURE administration

## Global options

| Name | Type | Description |
| --- | --- | --- |
| -V, --version | Boolean | Print the version number |
| -h, --help | Boolean | Show some help |

You can get help for any command by typing `ezmesure-admin <command> --help`.

## Commands

| Name | Description |
| --- | --- |
| [spaces [space]\(optional)](#spaces) | List all KIBANA spaces or [space] space attributes |
| [space-add \<space>](#space-add) | Add a KIBANA space with default attributes |
| [space-del \<space>](#space-del) | Delete a KIBANA space |
| [objects-find \<space>](#objects-find) | Find KIBANA objects |
| [dashboard-export \<dashboardId>](#dashboard-export) | Export dashboard by Id |
| [dashboard-move-in-space \<dashboardId> \<space>](#dashboard-move-in-space) | Move dashboard by Id in another space |

## Commands details

### spaces

| Name | Type | Description |
| --- | --- | --- |
| -a, --all | Boolean | Print spaces informations in totally |
| -j, --json | Boolean | Print spaces informations in JSON format |

### space-add

| Name | Type | Description | Details |
| --- | --- | --- | --- |
| -c, --color | String | Color of space | Color must be composed of **#** and six hexadecimal characters (ex: #80bf85)  |
| -d, --desc | String | Description of space |
| -i, --initials | String | Initials of space (| Must contain 1 or 2 characters ex: AB) |
> `ezmesure-admin space-add my-space -c "#80bf85" -d "This is my space" -i "MS"`

### space-del

> No options for this command

### objects-find

| Name | Type | Description |
| --- | --- | --- |
| -t, --title | String | Search objects by name |
| -j, --json | Boolean | Print object informations in JSON format |
| -s, --space | String | Name of target space |

Available objects:

- visualization
- dashboard
- search
- index-pattern
- config
- timelion-sheet

### dashboard-export

| Name | Type | Description |
| --- | --- | --- |
| -s, --space | String | Name of target space |

### dashboard-move-in-space

| Name | Type | Description |
| --- | --- | --- |
| -n, --new | Boolean | Create new space |