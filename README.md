# ezmesure-admin

> Tools for ezMESURE administration

# Global options
| Name | Type | Description |
| --- | --- | --- |
| -V, --version | Boolean | Print the version number |
| -h, --help | Boolean | Show some help |

You can get help for any command by typing ezmesure-admin <command> --help.

# Commands
| Name | Description |
| --- | --- |
| [spaces [space]\(optional)](#spaces) | List all KIBANA spaces or [space] space attributes |
| [space-add \<space>](#space-add) | Add a KIBANA space with default attributes |
| [space-del \<space>](#space-del) | Delete a KIBANA space |
| [objects-find \<space>](#objects-find) | Find KIBANA objects |
| [dasboard-export \<dasboardId>](#dasboard-export) | Export dashboard by Id |
| [dashboard-move-in-space \<dasboardId> \<space>](#dashboard-move-in-space) | Move dashboard by Id in another space |

# Commands details
#### spaces
| Name | Type | Description |
| --- | --- | --- |
| -a, --all | Boolean | Print spaces informations in totally |
| -j, --json | Boolean | Print spaces informations in JSON format |

#### space-add
| Name | Type | Description |
| --- | --- | --- |
| -c, --color | String | Color of space |
| -d, --desc | String | Description of space |
| -i, --initials | String | Initials of space |

#### space-del
> No options for this command

#### objects-find
| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Print object informations in JSON format |
| -s, --space | String | Name of target space |

Available objects:
- visualization
- dashboard
- search
- index-pattern
- config
- timelion-sheet

#### dashboard-export
| Name | Type | Description |
| --- | --- | --- |
| -s, --space | String | Name of target space |

#### dashboard-move-in-space
| Name | Type | Description |
| --- | --- | --- |
| -n, --new | String | create new space |

