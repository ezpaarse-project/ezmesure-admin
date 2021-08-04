# login

## Usage

**This command allows to connect an ezMESURE user to the ezmesure-admin command by retrieving his ezMESURE token.**

```bash
$ ezmesure-admin login --help
```

## Options
| Name | Type | Description |
| --- | --- | --- |
| -u, --username | String | ezMESURE username |
| -p, --password | String | ezMESURE password |
| --password-stdin | Boolean | ezMESURE password from stdin |

> NB : Prefer to use the --pasword-stdin option

## Commands details
Examples :

### Basi authentification

```bash
$ ezmesure-admin login
? Username myUser
? Password ********

user [myUser] logged in successfully
```

### --password-stdin

```bash
$ cat password.txt | ezmesure-admin login --username myUser --password-stdin
# or
$ ezmesure-admin login --username myUser --password-stdin < password.txt

user [myUser] logged in successfully
```
