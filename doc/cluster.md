# cluster

## Usage

```bash
$ ezmesure-admin cluster --help
```

## Commands

| Name | Description |
| --- | --- |
| [flush](#flush) | Flush all data streams and indices in the cluster |
| [settings](#settings) | Show cluster settings |
| [shard](#shard) <command> | Manage shards |

## Commands details

### flush

```bash
$ ezmesure-admin cluster flush
```

Example of result :

```bash
Total: 3
Successful: 3
Failed: 0
```

### settings

```bash
$ ezmesure-admin cluster settings
```

Example of result : 

```bash
{
  "persistent": {
    "xpack": {
      "monitoring": {
        "collection": {
          "enabled": "true"
        }
      }
    }
  },
  "transient": {}
}
```

### shard

```bash
$ ezmesure-admin shard <command>
```

| Command | Description |
| --- | --- |
| [allocation](#allocation) <type> | Enable or disable allocation for specific kinds of elasticsearch shards |

#### allocation

Type :
- all
- primaries
- new_primaries
- none
- null

```bash
$ ezmesure-admin shard allocation <type>
```

Example of result :

```bash
Cluster settings applied
```