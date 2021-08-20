# ezmesure-admin

## Prerequisite

- git >= 2.27.0
- NodeJS >= 14.15.0
- npm >= 6.14.8

## Install

```sh
$ npm i @ezpaarse-project/ezmesure-admin
```

## Usage

```bash
$ ezmesure-admin --help
$ ezadmin --help
$ eza --help
```

## Global options

| Name | Type | Description |
| --- | --- | --- |
| -t, --timeout | String | Request timeout in milliseconds |
| -v, --verbose | Boolean | Make the operation more talkative |
| --version | Boolean | Print the version number |
| --help | Boolean | Show some help |

## Commands

| Name | Description |
| --- | --- |
| [cluster](/doc/cluster.md) | Manage cluster |
| [completion](/doc/completion.md) | Use auto completion |
| [config](/doc/config.md) | Manage ezmesure-admin config |
| [counter4](/doc/counter4.md) (deprecated) | Load counter4 files in Kibana | 
| [counter5](/doc/counter5.md) | COUNTER5 commands | 
| [dashboard](/doc/dashboard.md) | Manage Kibana dashboards |
| [indices](/doc/indices.md) | Manager ezMESURE/Kibana users |
| [index-pattern](/doc/index-pattern.md) | Manager ezMESURE/Kibana users |
| [institutions](/doc/institutions.md) | Manage ezMESURE institutions |
| [login](/doc/login.md) | Login user in commands |
| [logout](/doc/logout.md) | Log out from ezMESURE |
| [ping](/doc/ping.md) | Ping ElasticSearch and ezMESURE |
| [profile](/doc/profile.md) | Displays the person who is connected to the command |
| [reporting](/doc/reporting.md) | Manage ezMESURE reporting |
| [roles](/doc/roles.md) | Manage Kibana roles |
| [spaces](/doc/spaces.md) | Manage Kibana spaces |
| [sushi](/doc/sushi.md) | Manage ezMESURE sushi |
| [users](/doc/users.md) | Manage ezMESURE/Kibana users |

## Development

```bash
$ git clone https://github.com/ezpaarse-project/ezmesure-admin.git
$ cd ezmesure-admin
$ npm install
```

To use the command in development mode simply use it as follows: ``./ezmesure-admin <command>``

## Tests

Set ``EZMESURE_ADMIN_USERNAME`` and ``EZMESURE_ADMIN_PASSWORD`` envrionment variables.

> The user cannot be a reserved user (ex: elastic, ...). He must have ``superuser'' rights to perform the tests
> It can be the default user created at the initialization of ezMESURE using the same environment variables.

```bash
$ npm run test
```

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

CeCILL.