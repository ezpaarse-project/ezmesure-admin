# counter4 (deprecated)

## Usage

```bash
$ ezmesure-admin counter5 --help
```

## Commands

| Name | Description |
| --- | --- |
| [reports check](#reports-check) [institutions...] | Get COUNTER5 reports for one or more institutions |

## Commands details

### reports check

### Usage

```bash
$ ezmesure-admin counter5 reports check --help
```

## Options
| Name | Type | Description |
| --- | --- | --- |
| -o, --output | String | Output path |
| -a, --all | Boolean | Use all institutions |
| -m, --merge | Boolean | Merge in one file |

Examples :

```bash
$ ezmesure-admin counter5 reports check BigInstitutio -o ~/Documents

SUSHI COUNTER5 reports available file : /home/wilmouth/Documents/sushi_counter5_BigInstitution_reports_check.csv exported succesfully
```

```bash
$ ezmesure-admin counter5 reports check --all -o ~/Documents

institution [My institution] sushi reports not found
SUSHI COUNTER5 reports available file : /home/wilmouth/Documents/sushi_counter5_BigInstitution_reports_check.csv exported succesfully
```

```bash
$ ezmesure-admin counter5 reports check --all --merge -o ~/Documents

institution [My institution] sushi reports not found
SUSHI COUNTER5 reports available file : /home/wilmouth/Documents/sushi_counter5_BigInstitution_reports_check.csv exported succesfully
```