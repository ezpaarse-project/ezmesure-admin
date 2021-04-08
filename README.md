# ezmesure-admin

## Install

```sh
$ git clone https://github.com/ezpaarse-project/ezmesure-admin.git
$ cd ezmesure-admin
$ npm i -g
```

## Usage

```bash
$ ezmesure-admin --help
```

## Global options

| Name | Type | Description |
| --- | --- | --- |
| -t, --timeout | String | Request timeout in milliseconds |
| --version | Boolean | Print the version number |
| --help | Boolean | Show some help |

## Commands

| Name | Description |
| --- | --- |
| [cluster](/doc/cluster.md) | Manage cluster |
| [config](/doc/config.md) | Manageezmesure-admin config |
| [counter](/doc/counter.md) (deprecated) | Load counter4 files in Kibana | 
| [dashboard](/doc/dashboard.md) | Manage Kibana dashboards |
| [institutions](/doc/institutions.md) | Manage ezMESURE institutions |
| [reporting](/doc/reporting.md) | Manage ezMESURE reporting |
| [roles](/doc/roles.md) | Manage Kibana roles |
| [spaces](/doc/spaces.md) | Manage Kibana spaces |
| [sushi](/doc/sushi.md) | Manage ezMESURE sushi |
| [users](/doc/users.md) | Manager ezMESURE/Kibana users |
## License

## Development

```bash
$ git clone https://github.com/ezpaarse-project/ezmesure-admin.git
$ cd ezmesure-admin
$ npm install
```

To use the command in development mode simply use it as follows: ``./ezmesure-admin <command>``

MIT.