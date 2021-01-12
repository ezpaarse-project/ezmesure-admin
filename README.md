# ezmesure-admin

> Tools for ezMESURE administration

## Global options

| Name | Type | Description |
| --- | --- | --- |
| -V, --version | Boolean | Print the version number |
| -h, --help | Boolean | Show some help |

You can get help for any command by typing `ezmesure-admin <command> --help`.

## Configuration
| Env. var | Description |
| --- | --- |
| ELASTICSEARCH_URL | Elasticsearh url |
| ELASTICSEARCH_USERNAME | Elasticsearh admin username |
| ELASTICSEARCH_PASSWORD | Elasticsearh admin password |
| KIBANA_URL | Kibana url |
| TIMEOUT | Timeout for queries |
| DEFAULT_TEMPLATE | Name of default template |
| TEMPLATE_SPACE | Name of template space |

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
| [user-del-role <role> <usernames...>](#del-role) | Delete role to user(s) |
| [create-role <role>](#create-role) | Create a role |
| [delete-role <role>](#delete-role) | Delete a role |
| [reporting <emails...>](#reporting) | Send reporting to target emails |
| [counter4 \<JR1File>](#counter4) | Load JR1 Counter 4 file into KIBANA |
| [counter5 \<counter5file>](#counter5) | Load a COUNTER 5 Report file into KIBANA or only output a JSON file |
| [sushi5 \<sushiFile>](#sushi5) | Download a COUNTER 5 Report from sushi endpoint into KIBANA or only download the report JSON file |
| [institutions [institution]](#institutions) | List all institutions or [institution] |
| [institutions-add](#institutions-add) | Add an institution |
| [institutions-del](#institutions-del) | Remove one or more institution(s) |
| [sushi-add <credentialsFile...>](#sushi-add) | Add sushi crendentials for one or more institution(s) |
| [sushi-del](#sushi-del) | Delete sushi crendentials for one institution |

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
| -i, --initials | String | Initials of space | Must contain 1 or 2 characters ex: AB) |
| -t, --template | String | default template to use |
> `ezmesure-admin space-add my-space -c "#80bf85" -d "This is my space" -i "MS" -t homepage`

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

### user-del-role
> No options for this command

### create-role
> No options for this command

### delete-role
> No options for this command

### user-roles
<p>Select one or more users to add or remove one or more roles.
<br />
To add a role you have to select it from the list and to delete it you just have to deselect it.</p>

### counter4

Sub command usage: counter4 [options] \<JR1file\>

output an expanded JSON file or load a COUNTER 4 JR1 file into ezMESURE / KIBANA (bluk)

| Name | Type | Description |
| --- | --- | --- |
| no-option | boolean | only output JSON file |
| -b, --bulk | boolean | bulk index JR1 data (try to guess JR1 package form filename _\_JR1package\__ or take -p option ) |
| -p, --package | string | \<JR1package\> JR1 package (do not try to guess from file name) |
| -n, --ndjson | boolean | only output newline delimited JSON file |
| -h, --help | output usage information |

Example:

```bash
$ ezmesure-admin counter4 ../data/JR1_Nature_INSHS_TT2018.csv -i
```

### counter5

Sub command usage: counter5 [options] \<counter5file\>

output an expanded JSON file or load a COUNTER 5 Report file into ezMESURE / KIBANA (bulk)

| Name | Type | Description |
| --- | --- | --- |
|  -b, --bulk| boolean | bulk index COUNTER 5 data |
|  -c, --counter-package| string | package (if you have more than one subscription for one publisher)
|  -d, --depositor | string | <depositor> index prefix name for ezmesure publisher index (default: "local")
|  -n, --ndjson | boolean | only output newline delimited JSON file (default)
|  -h, --help | output usage information

Example:

```bash
$ ezmesure-admin counter5 -d couperin ../data/couperin/Couperin-Wiley-2019_usages-Counter-5-TR_J4.csv -c Consortium -b
```

### sushi5

Sub command usage: sushi5 [options] \<sushiFile\>

download the JSON COUNTER 5 Report from sushi endpoint or load index data into ezMESURE / KIBANA (bulk)

| Name | Type | Description |
| --- | --- | --- |
|  -b, --bulk| boolean | bulk index COUNTER 5 data|
|  -c, --counter-package| string | package (if you have more than one subscription for one publisher)
|  -d, --depositor | string | <depositor> index prefix name for ezmesure publisher index (default: "local")
|  -n, --ndjson | boolean | only output newline delimited JSON file
|  -h, --help | output usage information

Example:

```bash
$ ezmesure-admin counter5 -d couperin ../data/couperin/Couperin-Wiley-2019_usages-Counter-5-TR_J4.csv -c Consortium -b
```

### institutions

> No options for this command

Examples:

```bash
$ ezmesure-admin institutions
```
Example of result :

| Name | Acronym | Site | City | Type | Automatisation | Domains | Members |
| --- | --- | --- | --- | --- | --- | --- | --- |
| My institution | Institution | https://my-institution.org/ | Paris | University | ezPAARSE: OK<br>ezMESURE: OK<br>Reporting: - | my-institution.org | firstname.lastname (user) |

Example of result :

```bash
$ ezmesure-admin institutions My institution
```

<pre>
<b>Name</b>: My institution
<b>Acronym</b>: institution
<b>Site</b>: https://my-institution.org/
<b>City</b>: Paris
<b>Type</b>: University 
<b>Automatisation</b>:
  - <b>ezPAARSE</b>: OK
  - <b>ezMESURE</b>: OK
  - <b>Reporting</b>: -
<b>Domains</b>:
  - my-institution.org
<b>Members</b>:
  - <b>User</b>: firstname.lastname
  - <b>Type</b>: user
</pre>

### institutions-add

> No options for this command

Examples:

```bash
$ ezmesure-admin institutions-add
```
Example of result :

<pre>
? <b>Institution name</b> My institution
? <b>Acronym</b> Institution 
? <b>Website</b> https://my-institution.org/
? <b>City</b> Paris
? <b>Type</b> University
? <b>UAI</b> 
? <b>Domains (e.g.: my-institution.org,institution.org)</b> my-institution.org
? <b>Index</b> my-institution
? <b>Automatisation</b> 
❯◉ ezPAARSE
 ◯ ezMESURE
 ◯ Reporting
</pre>

### institutions-del

> No options for this command

Examples:

```bash
$ ezmesure-admin institutions-del
```
Example of result :

<pre>
? <b>Institutions</b>
 ◉ My institution
❯◉ My organisation
 ◯ An other institution
 ...
</pre>

### sushi-add

> No options for this command

Examples:

```bash
$ ezmesure-admin sushi-add ~/Documents/sushi/my-insitution/*.json
```
Example of result :

<pre>
? <b>Institutions</b>
❯◉ My institution
 ◯ My organisation
 ◯ An other institution
 ...
</pre>

### sushi-dell

> No options for this command

Examples:

```bash
$ ezmesure-admin sushi-del
```
Example of result :

<pre>
? <b>Select an institution</b> (Use arrow keys or type to search)
❯ My institution
  My organisation
  An other institution
 ...
</pre>

### cluster-settings

Show cluster settings.

> No options for this command

Example:

```bash
$ ezmesure-admin cluster-settings
```

### cluster-flush

Flush all indices in the cluster.

> No options for this command

Examples:

```bash
$ ezmesure-admin cluster-flush
```

### cluster-shard-allocation <enabledShards>

Set shard allocation policy, where `enabledShards` can be either of : `all`, `primaries`, `new_primaries`, `none` or `null`.

```bash
$ ezmesure-admin cluster-shard-allocation primaries
```
