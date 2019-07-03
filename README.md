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
| [space-del \<spaces...>](#space-del) | Delete a KIBANA space(s) |
| [objects-find \<type>](#objects-find) | Find KIBANA objects |
| [dashboard-export \<dashboardId>](#dashboard-export) | Export dashboard by Id |
| [dashboard-move-in-space \<space> [dashboards...]](#dashboard-move-in-space) | Move dashboard(s) in another space |
| [users [user...]](#users) | List all users or \[user\] user |
| [roles [role...]](#roles) | List all roles or \[role\] roles |
| [user-roles](#user-roles) | Add or remove one or more roles to one or more users |
| [add-role <role> <usernames...>](#add-role) | Add role to user(s) |
| [del-role <role> <usernames...>](#del-role) | Delete role to user(s) |
| [create-role <role>](#create-role) | Create a role |

## Commands details

### spaces

| Name | Type | Description |
| --- | --- | --- |
| -a, --all | Boolean | Print spaces informations in totally |
| -j, --json | Boolean | Print spaces informations in JSON format |

Examples:

```bash
$ ezmesure-admin spaces -a
```

Example of result :

| ID | Name | Description | Initials | Color |
| --- | --- | --- | --- | --- |
| default | Default space | This is my default space | DS | <span style="color: #fff; background-color: #80bf85; padding: 0 10px;">#80bf85<span> |

```bash
$ ezmesure-admin spaces -j

[
  {
    "id": "default",
    "name": "Default space",
    "description": "This is my default space",
    "color": "#80bf85",
    "initials": "DS"
  }
]
```

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
| -s, --space | String | Target space |
| -t, --title | String | Title of object, is a key word (ex: univ-lorraine) |
| -j, --json | Boolean | Print object informations in JSON format |

Available objects:

- visualization
- dashboard
- search
- index-pattern
- config
- timelion-sheet

Example:

```bash
$ ezmesure-admin objects-find dashboard
```

Example of result :

| ID | Title | Description |
| --- | --- | --- |
| edf44fe0-e1a0-11e7-b6c7-4dc382af7f5b | Default dashboard | This is my default dashboard |

```bash
$ ezmesure-admin objects-find dashboard -j

{
    "type": "dashboard",
    "id": "edf44fe0-e1a0-11e7-b6c7-4dc382af7f5b",
    "attributes": {
      "title": "Default dashboard",
      "hits": 0,
      "description": "This is my default dashboard",
      "panelsJSON": "[{ ... }]",
      "optionsJSON": "{"darkTheme":false,"hidePanelTitles":false,"useMargins":true}",
      "version": 1,
      "timeRestore": true,
      "timeTo": "now",
      "timeFrom": "now-7d",
      "refreshInterval": {
        "pause": false,
        "value": 900000
      },
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{"query":{"language":"lucene","query":""},"filter":[]}"
      }
    },
    "updated_at": "2019-02-12T16:43:46.631Z",
    "version": "WzNxLDVa"
  }
]
```

### dashboard-export

| Name | Type | Description |
| --- | --- | --- |
| -s, --space | String | Name of target space |

### dashboard-move-in-space

| Name | Type | Description |
| --- | --- | --- |
| -t, --title | String | list dashboard(s) by title contains key word (ex: univ-lorraine) |
| -n, --new | Boolean | Create new space |

Example of result :
```bash
$ ezmesure-admin dashboard-move-in-space univ-lorraine -t univ-lorraine

? univ-lorraine dashboards (Press <space> to select, <a> to toggle all, <i> to invert selection)
> () univ-lorraine:default
  () univ-lorraine:metrics
```

### users

| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Print users informations in JSON format |

Example:

```bash
$ ezmesure-admin users
```

Example of result :

| Full name | username | roles | email |
| --- | --- | --- | --- |
| John Doe | john.doe | superuser | john@doe.com |

```bash
$ ezmesure-admin users -j

{
  "john.doe": {
    "username": "john.doe",
    "roles": [
      "superuser"
    ],
    "full_name": "DOE John",
    "email": "john@doe.com",
    "metadata": { ... },
    "enabled": true
  }
}
```

### roles

| Name | Type | Description |
| --- | --- | --- |
| -j, --json | Boolean | Print roles informations in JSON format |

### add-role
> No options for this command

### del-role
> No options for this command

### user-roles
<p>Select one or more users to add or remove one or more roles.
<br />
To add a role you have to select it from the list and to delete it you just have to deselect it.</p>
