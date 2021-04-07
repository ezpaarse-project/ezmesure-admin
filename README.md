# ezmesure-admin

## Install

```sh
$ npm i ezmesure-admin -g
```

## Usage

```sh
$ ezmesure-admin --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

## Available commands

* [cluster](#cluster)
* [](#)
* [config](#config)
* [](#)
* [counter4](#counter4)
* [](#)
* [](#)
* [dashboard](#dashboard)
* [](#)
* [institutions](#institutions)
* [](#)
* [reporting](#reporting)
* [](#)
* [roles](#roles)
* [](#)
* [spaces](#spaces)
* [](#)
* [sushi](#sushi)
* [](#)
* [users](#users)
* [](#)

### cluster

```sh
$ ezmesure-admin cluster --help
```

Help output:

```
ezmesure-admin cluster <command>

Manage cluster <command>: settings, flush, shard

Commands:
  ezmesure-admin cluster flush            Flush all data streams and indices in
                                          the cluster
  ezmesure-admin cluster settings         Show cluster settings
  ezmesure-admin cluster shard <command>  Manage shards <command>: allocation

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### config

```sh
$ ezmesure-admin config --help
```

Help output:

```
ezmesure-admin config <command>

Manage config with a <command>: get, set, delete, view or edit

Commands:
  ezmesure-admin config delete <key>       Delete a key in the config
  ezmesure-admin config edit               Edit configuration
  ezmesure-admin config get <key>          Get the value of a key in the config
  ezmesure-admin config set <key> <value>  Set the value of a key in the config
  ezmesure-admin config view               View current configuration

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### counter4

```sh
$ ezmesure-admin counter4 --help
```

Help output:

```
ezmesure-admin counter4 <files...>

output an expanded JSON file or load a COUNTER 4 JR1 file into ezMESURE / KIBANA
(bulk)

Positionals:
  files  JR1 files                              [array] [required] [default: []]

Options:
      --version    Show version number                                 [boolean]
  -t, --timeout    Request timeout in milliseconds                      [number]
      --help       Show help                                           [boolean]
  -p, --package    JR1 package                                          [string]
  -b, --bulk       bulk index JR1 data                                 [boolean]
  -d, --depositor  Index prefix name for publisher index                [string]
  -n, --ndjson     only output newline delimited JSON file             [boolean]
  -j, --json       Save in JSON file                                   [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### dashboard

```sh
$ ezmesure-admin dashboard --help
```

Help output:

```
ezmesure-admin dashboard <command>

Manage dashboard with a <command>: import, export

Commands:
  ezmesure-admin dashboard export [space]  Export sushi data
  ezmesure-admin dashboard import [space]  Import dashboard(s)

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### institutions

```sh
$ ezmesure-admin institutions --help
```

Help output:

```
ezmesure-admin institutions <command>

Manage roles <command>: list, get, export, import

Commands:
  ezmesure-admin institutions export        Export institution(s)
  [institutions...]
  ezmesure-admin institutions get           Get institution(s) informations
  [institutions...]
  ezmesure-admin institutions import        Import institution(s)
  ezmesure-admin institutions list          List all institutions

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### reporting

```sh
$ ezmesure-admin reporting --help
```

Help output:

```
ezmesure-admin reporting <command>

Manage reporting <command>: list, report

Commands:
  ezmesure-admin reporting info  Get report
  ezmesure-admin reporting list  List all reporting tasks

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### roles

```sh
$ ezmesure-admin roles --help
```

Help output:

```
ezmesure-admin roles <command>

Manage roles <command>: get, add, edit, delete, list

Commands:
  ezmesure-admin roles add <role>         Create new role
  ezmesure-admin roles delete [roles...]  Delete role(s)
  ezmesure-admin roles edit [role]        Edit role
  ezmesure-admin roles get <role>         Get and display role informations
  ezmesure-admin roles list               List all roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### spaces

```sh
$ ezmesure-admin spaces --help
```

Help output:

```
ezmesure-admin spaces <command>

Manage spaces <command>: get, add, edit, delete, list

Commands:
  ezmesure-admin spaces add <space>         Create new space
  ezmesure-admin spaces delete [spaces..]   Delete space (s)
  ezmesure-admin spaces get <space>         Display information for one space
  ezmesure-admin spaces list                List all spaces
  ezmesure-admin spaces reporting           Manage reporting <command>: list,
  <command>                                 delete

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### sushi

```sh
$ ezmesure-admin sushi --help
```

Help output:

```
ezmesure-admin sushi <command>

Manage sushi <command>: add, delete, list, info, test, export, import

Commands:
  ezmesure-admin sushi add                  Create new sushi
  ezmesure-admin sushi delete               Delete a sushi
  ezmesure-admin sushi export               Export sushi data
  [institutions...]
  ezmesure-admin sushi import               Import sushi(s)
  [institution]
  ezmesure-admin sushi info [institution]   Get SUSHI informations
  ezmesure-admin sushi list                 List SUSHI informations of
                                            institutions
  ezmesure-admin sushi test [institution]   Test SUSHI informations of
                                            institutions

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### users

```sh
$ ezmesure-admin users --help
```

Help output:

```
ezmesure-admin users <command>

Manage users <command>: list, get, roles

Commands:
  ezmesure-admin users get [users...]   Get one or more users
  ezmesure-admin users list             List users
  ezmesure-admin users roles <command>  Manage spaces <command>: add, delete,
                                        list

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### 

```sh
$ ezmesure-admin  --help
```

Help output:

```
ezmesure-admin <command>

Commands:
  ezmesure-admin cluster <command>       Manage cluster <command>: settings,
                                         flush, shard
  ezmesure-admin config <command>        Manage config with a <command>: get,
                                         set, delete, view or edit
  ezmesure-admin counter4 <files...>     output an expanded JSON file or load a
                                         COUNTER 4 JR1 file into ezMESURE /
                                         KIBANA (bulk)
  ezmesure-admin dashboard <command>     Manage dashboard with a <command>:
                                         import, export
  ezmesure-admin institutions <command>  Manage roles <command>: list, get,
                                         export, import
  ezmesure-admin reporting <command>     Manage reporting <command>: list,
                                         report
  ezmesure-admin roles <command>         Manage roles <command>: get, add, edit,
                                         delete, list
  ezmesure-admin spaces <command>        Manage spaces <command>: get, add,
                                         edit, delete, list
  ezmesure-admin sushi <command>         Manage sushi <command>: add, delete,
                                         list, info, test, export, import
  ezmesure-admin users <command>         Manage users <command>: list, get,
                                         roles

Options:
      --version  Show version number                                   [boolean]
  -t, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

## License

MIT.