# ezmesure-admin

> Tools for ezMESURE administration

# Global options
| Name | Type | Description |
| --- | --- | --- |
| -v, --version | Boolean | Print the version number |
| -h, --help | Boolean | Show some help |

You can get help for any command by typing ezmesure-admin <command> --help.

# Commands
| Name | Description |
| --- | --- |
| [spaces [space]\(optional)](#spaces) | List all KIBANA spaces or [space] space attributes |
| [space-add \<space>](#space-add) | Add a KIBANA space with default attributes |
| [space-del \<space>](#space-del) | Delete a KIBANA space |
| [objects-find \<space>](#objects-find) | Find KIBANA objects |
| [dasboard-export \<dasboardId>](#dasboard-export) | Find KIBANA objects |
| [dashboard-move-in-space \<dasboardId> \<space>](#dashboard-move-in-space) | Move dashboard by Id in another space |

# Commands details
#### spaces
| Name | Type | Description |
| --- | --- | --- |
| -i, --id | Boolean | Print id of space(s) |
| -n, --name | Boolean | Print name of space(s) |

#### space-add
| Name | Type | Description |
| --- | --- | --- |
| -i, --id | String | Name of space |
| -d, --desc | String | Description of space |

#### space-del
> No options for this command

#### objects-find
| Name | Type | Description |
| --- | --- | --- |
| -i, --id | Boolean | Print id of object(s) |
| -n, --name | Boolean | Print name of object(s) |

#### dashboard-export
> No options for this command

#### dashboard-move-in-space
> No options for this command
