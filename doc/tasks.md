# tasks

## Usage

```bash
$ ezmesure-admin tasks --help
```

## Commands

| Name | Description |
| --- | --- |
| [get](#get) <taskIds...> | Get one or more tasks |
| [list](#list) | List tasks |
| [cancel](#cancel) | Cancel one or more tasks |

## Commands details

### get

Get one or more tasks from their IDs.

#### Usage
```bash
$ ezmesure-admin tasks get --help
$ ezmesure-admin tasks get <taskIds...>
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --available-fields | Flag | List fields that can be displayed in the table view |
| -f, --fields | Array | A list of fields to display in the table view |
| -j, --json | Flag | Print result(s) as JSON |

Example :
```bash
$ eza tasks get ca1d98a0-cf85-11ec-a07b-815ee82c0b9b

╔══════════════════════════════════════╤═══════════════╤════════╤══════════════╤══════════════════════╗
║ ID                                   │ Type          │ Status │ Running time │ Created at           ║
╟──────────────────────────────────────┼───────────────┼────────┼──────────────┼──────────────────────╢
║ ca1d98a0-cf85-11ec-a07b-815ee82c0b9b │ sushi-harvest │ error  │ 1s           │ 05/09/2022, 12:50 PM ║
╚══════════════════════════════════════╧═══════════════╧════════╧══════════════╧══════════════════════╝

```

### list

Get a list of tasks, based on a query. If no filter is provided, all tasks are returned.

#### Usage
```bash
$ ezmesure-admin tasks list --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --available-fields  | Flag    | List fields that can be displayed in the table view |
| -f, --fields        | Array   | A list of fields to display in the table view |
| -u, --status        | String  | Filter tasks by status (comma-separated list) |
| --size              | Integer | Maximum number of tasks to get |
| -t, --type          | String  | Filter tasks by type (comma-separated list) |
| --id                | String  | Filter tasks by ID (comma-separated list) |
| --harvestId, --hid  | String  | Filter tasks by harvest ID (comma-separated list) |
| -s, --sushiId       | String  | Filter tasks by SUSHI ID (comma-separated list) |
| -i, --institutionId | String  | Filter tasks by institution ID (comma-separated list) |
| -e, --endpointId    | String  | Filter tasks by SUSHI endpoint ID (comma-separated list) |
| -c, --collapse      | String  | Return only one task for each distinct value of the given field |
| -j, --json          | Flag    | Print result(s) in json |
| -n, --ndjson        | Flag    | Print result(s) in ndjson |

#### Examples:

List the latest task of each SUSHI item.

```bash
$ eza tasks list --collapse params.sushiId
```

List tasks that have been delayed for a given harvest ID.

```bash
$ eza tasks list --harvestId some-id -u delayed
```

List failed tasks with their error logs (using JQ).

```bash
$ eza tasks list -u error --ndjson | jq '{ vendor: .params.endpointVendor, runningTime, createdAt, logs: .logs | map(select(.type | match("error|warning"))) | map(.type + ": " + .message) }'
```


### cancel

**Cancel a list of tasks based on a query**

#### Usage
```bash
$ ezmesure-admin tasks cancel --help
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| --force             | Flag   | Try to cancel tasks that are not in waiting status |
| -u, --status        | String | Filter tasks by status (comma-separated list) |
| -t, --type          | String | Filter tasks by type (comma-separated list) |
| --id                | String | Filter tasks by ID (comma-separated list) |
| --harvestId, --hid  | String | Filter tasks by harvest ID (comma-separated list) |
| -s, --sushiId       | String | Filter tasks by SUSHI ID (comma-separated list) |
| -i, --institutionId | String | Filter tasks by institution ID (comma-separated list) |
| -e, --endpointId    | String | Filter tasks by SUSHI endpoint ID (comma-separated list) |
| -j, --json          | Flag   | Print result(s) in json |
| -n, --ndjson        | Flag   | Print result(s) in ndjson |
