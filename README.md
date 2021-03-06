# ezmesure-admin

## Prerequisite

- git >= 2.27.0
- NodeJS >= 14.15.0
- npm >= 6.14.8

## Install

```sh
$ git clone https://github.com/ezpaarse-project/ezmesure-admin.git
$ cd ezmesure-admin
$ npm i -g .
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
| [config](/doc/config.md) | Manage ezmesure-admin config |
| [counter4](/doc/counter4.md) (deprecated) | Load counter4 files in Kibana | 
| [counter5](/doc/counter5.md) | COUNTER5 commands | 
| [dashboard](/doc/dashboard.md) | Manage Kibana dashboards |
| [institutions](/doc/institutions.md) | Manage ezMESURE institutions |
| [reporting](/doc/reporting.md) | Manage ezMESURE reporting |
| [roles](/doc/roles.md) | Manage Kibana roles |
| [spaces](/doc/spaces.md) | Manage Kibana spaces |
| [sushi](/doc/sushi.md) | Manage ezMESURE sushi |
| [users](/doc/users.md) | Manager ezMESURE/Kibana users |

## Development

```bash
$ git clone https://github.com/ezpaarse-project/ezmesure-admin.git
$ cd ezmesure-admin
$ npm install
```

To use the command in development mode simply use it as follows: ``./ezmesure-admin <command>``

## i18n

1. In ``ezmesure-admin`` file, add your locale in ``locales`` array.
2. Create your locale ``JSON`` file in ``locales`` folder.
3. ``Import i18n`` in your commande file
4. Use ``i18n.t()`` function to translate

Example :

Command file :

```js
const { i18n } = global;

exports.command = 'mycmd';
exports.desc = i18n.t('mycmd.description');
exports.builder = {};
exports.handler = async function handler() {
  console.log(i18n.t('mycmd.helloWorld'))
};
```

Locale file :

```json
{
  "mycmd": {
    "descritpion": "This is my command",
    "helloWorld": "Hello World"
  }
}
```


## License

MIT.