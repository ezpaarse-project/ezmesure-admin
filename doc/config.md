# config

## Usage

```bash
$ ezmesure-admin config --help
```

## Commands

| Name | Description |
| --- | --- |
| [delete](#delete) <key> | Delete a key in the config |
| [edit](#edit) | Edit configuration |
| [get](#get) <key> | Get the value of a key in the config |
| [set](#set) <key> <value> | Set the value of a key in the config |
| [view](#view) | Set the value of a key in the config |

## Commands details

### delete

```bash
$ ezmesure-admin config delete <key>
```

Example :

```bash
$ ezmesure-admin config delete space.template
```

### edit

> This command open notpad of vi in interactive mode

#### Options
| Name | Type | Description |
|--- | --- | --- |
| -g, --global | Boolean | Edit global config |
| -i, --interactive | Boolean | Intractive mode |
| -e, --editor | String | The editor command to use. Defaults to EDITOR environment variable if set, or "vi" on Posix, or "notepad" on Windows', |

```bash
$ ezmesure-admin config edit
```
### get

```bash
$ ezmesure-admin config get <key>
```

Example :

```bash
$ ezmesure-admin config get space.template
```

Example of result :

```bash
$ org-template
```

### set

#### Options
| Name | Type | Description |
|--- | --- | --- |
| -g, --global | Boolean | Set config globally |

```bash
$ ezmesure-admin config set <key> <value>
```

Example :

```bash
$ ezmesure-admin config set space.template org-template
```

### view

```bash
$ ezmesure-admin config view
```

Example of result :

```bash
[Global]
{
  "elastic": {
    "user": "elastic",
    "pass": "changeme"
  }
}

[Local]
{
  "space": {
    "template": "org-template"
  }
}
```