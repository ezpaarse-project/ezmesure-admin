const { i18n } = global;

const kibana = require('../../lib/kibana');
const { config } = require('../../lib/app/config');
const { formatApiError } = require('../../lib/utils');

exports.command = 'kibana-request <apiPath>';
exports.desc = i18n.t('kibanaRequest.description');
exports.builder = function builder(yargs) {
  return yargs
    .positional('apiPath', {
      describe: i18n.t('kibanaRequest.options.apiPath'),
      type: 'string',
    })
    .option('X', {
      alias: 'method',
      type: 'string',
      describe: i18n.t('kibanaRequest.options.method'),
    })
    .option('t', {
      alias: 'timeout',
      type: 'number',
      describe: i18n.t('kibanaRequest.options.timeout'),
    })
    .option('d', {
      alias: 'data',
      type: 'string',
      describe: i18n.t('kibanaRequest.options.data'),
      coerce: (value) => {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      },
    });
};
exports.handler = async function handler(argv) {
  const {
    verbose,
    apiPath: url,
    data,
    method,
  } = argv;

  if (verbose) {
    console.log(`* Executing [${method || 'GET'} ${url}] from ${config.ezmesure.baseUrl}`);
  }

  let response;
  try {
    response = await kibana.request({
      url,
      method,
      data,
    });
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (typeof response?.data === 'object') {
    console.log(JSON.stringify(response?.data, null, 2));
  } else {
    console.log(response?.data);
  }
};
