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
  ezmesure-admin cluster <command>    Manage cluster <command>: settings, flush,
                                      shard
  ezmesure-admin reporting <command>  Manage reporting <command>: list, report
  ezmesure-admin roles <command>      Manage roles <command>: get, add, delete,
                                      list
  ezmesure-admin spaces <command>     Manage spaces <command>: get, add, edit,
                                      delete, list
  ezmesure-admin sushi <command>      Manage roles <command>: add, delete, list,
                                      report, test
  ezmesure-admin users <command>      Manage users <command>: list, roles

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

## Available commands

* [cluster](#cluster)
* [reporting](#reporting)
* [roles](#roles)
* [spaces](#spaces)
* [sushi](#sushi)
* [users](#users)

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
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
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
  ezmesure-admin cluster <command>    Manage cluster <command>: settings, flush,
                                      shard
  ezmesure-admin reporting <command>  Manage reporting <command>: list, report
  ezmesure-admin roles <command>      Manage roles <command>: get, add, delete,
                                      list
  ezmesure-admin spaces <command>     Manage spaces <command>: get, add, edit,
                                      delete, list
  ezmesure-admin sushi <command>      Manage roles <command>: add, delete, list,
                                      report, test
  ezmesure-admin users <command>      Manage users <command>: list, roles

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
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
  ezmesure-admin reporting list    List all reporting tasks
  ezmesure-admin reporting report  Create report

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### roles

```sh
$ ezmesure-admin roles --help
```

Help output:

```
ezmesure-admin roles <command>

Manage roles <command>: get, add, delete, list

Commands:
  ezmesure-admin roles add <role>         Create new role
  ezmesure-admin roles delete [roles...]  Delete role(s)
  ezmesure-admin roles get <role>         Get and display role informations
  ezmesure-admin roles list               List all roles

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
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
  ezmesure-admin cluster <command>    Manage cluster <command>: settings, flush,
                                      shard
  ezmesure-admin reporting <command>  Manage reporting <command>: list, report
  ezmesure-admin roles <command>      Manage roles <command>: get, add, delete,
                                      list
  ezmesure-admin spaces <command>     Manage spaces <command>: get, add, edit,
                                      delete, list
  ezmesure-admin sushi <command>      Manage roles <command>: add, delete, list,
                                      report, test
  ezmesure-admin users <command>      Manage users <command>: list, roles

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
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
  ezmesure-admin spaces add <space>     Create new space
  ezmesure-admin spaces delete <space>  Delete a space
  ezmesure-admin spaces edit <space>    Edit space
  ezmesure-admin spaces get <space>     Display information for one space
  ezmesure-admin spaces list            List all spaces

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
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
  ezmesure-admin cluster <command>    Manage cluster <command>: settings, flush,
                                      shard
  ezmesure-admin reporting <command>  Manage reporting <command>: list, report
  ezmesure-admin roles <command>      Manage roles <command>: get, add, delete,
                                      list
  ezmesure-admin spaces <command>     Manage spaces <command>: get, add, edit,
                                      delete, list
  ezmesure-admin sushi <command>      Manage roles <command>: add, delete, list,
                                      report, test
  ezmesure-admin users <command>      Manage users <command>: list, roles

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### sushi

```sh
$ ezmesure-admin sushi --help
```

Help output:

```
ezmesure-admin sushi <command>

Manage roles <command>: add, delete, list, report, test

Commands:
  ezmesure-admin sushi add     Create new sushi
  ezmesure-admin sushi delete  Delete a sushi
  ezmesure-admin sushi list    List SUSHI informations of institutions
  ezmesure-admin sushi report  Create report
  ezmesure-admin sushi test    Test SUSHI informations of institutions

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
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
  ezmesure-admin cluster <command>    Manage cluster <command>: settings, flush,
                                      shard
  ezmesure-admin reporting <command>  Manage reporting <command>: list, report
  ezmesure-admin roles <command>      Manage roles <command>: get, add, delete,
                                      list
  ezmesure-admin spaces <command>     Manage spaces <command>: get, add, edit,
                                      delete, list
  ezmesure-admin sushi <command>      Manage roles <command>: add, delete, list,
                                      report, test
  ezmesure-admin users <command>      Manage users <command>: list, roles

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

### users

```sh
$ ezmesure-admin users --help
```

Help output:

```
ezmesure-admin users <command>

Manage users <command>: list, roles

Commands:
  ezmesure-admin users list <users>     List users
  ezmesure-admin users roles <command>  Manage spaces <command>: add, delete,
                                        list

Options:
      --version  Show version number                                   [boolean]
  -t, --token    Auth token
  -m, --timeout  Request timeout in milliseconds                        [number]
      --help     Show help                                             [boolean]
```

## License

MIT.