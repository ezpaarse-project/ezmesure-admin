# kibana-request

Make a request to the Kibana API through the ezMESURE API.

## Usage

```bash
$ ezmesure-admin kibana-request <apipath>
```

#### Options
| Name | Type | Description |
| --- | --- | --- |
| -X, --method  | String  |  The HTTP method to use. Defaults to `GET`. |
| -t, --timeout | Integer | Request timeout in milliseconds |
| -d, --data    | String  | Request body |

#### Examples

Get Kibana spaces

```bash
$ ezmesure-admin kibana-request /api/spaces/space
```

Create an index pattern `cnrs-ec-*` into the space `cnrs`.

```bash
$ ezmesure-admin kibana-request -X POST /s/cnrs/api/index_patterns/index-pattern -d '
{
  "index_pattern": {
     "title": "cnrs-ec-*"
  }
}
'
```

Delete an index pattern in the default space.

```bash
$ ezmesure-admin kibana-request -X DELETE /api/index_patterns/index_pattern/2a3f0190-22e9-11ed-8ba8-517fb70ae9e6
```
