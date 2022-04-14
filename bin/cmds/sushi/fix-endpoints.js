const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const { config } = require('../../../lib/app/config');
const endpointsLib = require('../../../lib/endpoints');
const sushiLib = require('../../../lib/sushi');
const { formatApiError } = require('../../../lib/utils');
const itMode = require('./interactive/fix-endpoints');

exports.command = 'fix-endpoints';
exports.desc = i18n.t('sushi.fixEndpoints.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('from-files', {
      alias: 'f',
      describe: i18n.t('sushi.fixEndpoints.options.fromFiles'),
      type: 'array',
    })
    .option('output', {
      alias: 'o',
      describe: i18n.t('sushi.fixEndpoints.options.output'),
      type: 'string',
    });
};

/**
 * Read a list of JSON files and returns a concatenated array of all objects
 * @param {Array<String>} files a list of JSON files paths
 * @returns {Array<Object>} a concatenated array of JSON objects
 */
async function readJsonFiles(files) {
  const fileContents = await Promise.all(
    files.map((file) => fs.readFile(path.resolve(file), 'utf8').then((content) => ({ file, content }))),
  );

  return fileContents.flatMap(({ file, content }) => {
    let items;
    try {
      items = JSON.parse(content);
    } catch (e) {
      console.error(i18n.t('global.invalidJsonFile', { file }));
      process.exit(1);
    }
    return Array.isArray(items) ? items : [];
  });
}

/**
 * Ask the user for endpoint data and create the endpoint
 * The form is prefilled with data from a SUSHI item
 * @param {Object} sushiItem an object representing SUSHI credentials
 * @returns {Object} the created endpoint
 */
async function createEndpointFromSushi(sushiItem) {
  const vendor = await itMode.input(
    i18n.t('sushi.fixEndpoints.enterEndpointVendor'),
    sushiItem?.vendor,
  );
  const sushiUrl = await itMode.input(
    i18n.t('sushi.fixEndpoints.enterEndpointUrl'),
    sushiItem?.sushiUrl,
  );

  const requireCustomerId = await itMode.confirm(i18n.t('sushi.fixEndpoints.requireCustomerId'), !!sushiItem?.customerId);
  const requireRequestorId = await itMode.confirm(i18n.t('sushi.fixEndpoints.requireRequestorId'), !!sushiItem?.requestorId);
  const requireApiKey = await itMode.confirm(i18n.t('sushi.fixEndpoints.requireApiKey'), !!sushiItem?.apiKey);
  const isSushiCompliant = await itMode.confirm(i18n.t('sushi.fixEndpoints.isSushiCompliant'), !!sushiItem?.connection?.success);
  const validated = await itMode.confirm(i18n.t('sushi.fixEndpoints.validated'), false);

  const { data } = await endpointsLib.add({
    params: sushiItem.params,
    sushiUrl,
    validated,
    requireCustomerId,
    requireRequestorId,
    requireApiKey,
    isSushiCompliant,
    vendor,
  });

  return data;
}

exports.handler = async function handler(argv) {
  const {
    verbose,
    fromFiles,
    output,
  } = argv;

  let sushiItems;
  let endpoints;

  // Read and concatenate all JSON files if provided
  if (Array.isArray(fromFiles)) {
    if (verbose) { console.log(`* Retrieving SUSHI credentials from ${fromFiles.length} files`); }

    try {
      sushiItems = await readJsonFiles(fromFiles);
    } catch (e) {
      if (e.code === 'ENOENT') {
        console.error(i18n.t('global.fileNotFound', { file: e.path }));
      } else {
        console.error(e);
      }
      process.exit(1);
    }
  }

  // Fetch all credentials and endpoints
  try {
    if (!Array.isArray(fromFiles)) {
      if (verbose) { console.log(`* Retrieving SUSHI credentials from ${config.ezmesure.baseUrl}`); }
      ({ data: sushiItems } = await sushiLib.getAll());
    }

    if (verbose) { console.log(`* Retrieving endpoints from ${config.ezmesure.baseUrl}`); }
    ({ data: endpoints } = await endpointsLib.getAll());
  } catch (e) {
    console.error(formatApiError(e));
    process.exit(1);
  }

  if (!Array.isArray(sushiItems)) {
    console.log(i18n.t('sushi.fixEndpoints.sushiInvalidResponse'));
    process.exit(1);
  }

  if (!Array.isArray(endpoints)) {
    console.log(i18n.t('sushi.fixEndpoints.endpointInvalidResponse'));
    process.exit(1);
  }

  const sortByVendor = (a, b) => (a?.vendor?.toLowerCase?.() < b?.vendor?.toLowerCase?.() ? -1 : 1);
  endpoints.sort(sortByVendor);
  sushiItems.sort(sortByVendor);

  const endpointsById = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint]));
  const endpointsByVendor = new Map();

  endpoints.forEach((endpoint) => {
    const vendor = endpoint?.vendor?.toLowerCase?.();
    if (typeof vendor !== 'string') { return; }

    const vendorEndpoints = endpointsByVendor.get(vendor) || [];
    endpointsByVendor.set(vendor, [...vendorEndpoints, endpoint]);
  });

  const hasEndpointIssue = (item) => (!item?.endpointId || !endpointsById.has(item?.endpointId));
  const groupByFixable = (issues, item) => {
    const vendor = item?.vendor?.toLowerCase?.();

    if (vendor && endpointsByVendor.get(vendor)?.length === 1) {
      issues.fixable.push(item);
    } else {
      issues.unfixable.push(item);
    }
    return issues;
  };

  const { fixable: fixableIssues, unfixable: unfixableIssues } = sushiItems
    .filter(hasEndpointIssue)
    .reduce(groupByFixable, { fixable: [], unfixable: [] });

  const proceed = await itMode.confirm(i18n.t('sushi.fixEndpoints.nbIssuesDetected', {
    total: chalk.blue(fixableIssues.length + unfixableIssues.length),
    unfixable: chalk.blue(unfixableIssues.length),
  }));

  if (!proceed) {
    process.exit(0);
  }

  // We put fixable issues first so that we can address all of them first
  const badSushiItems = [...fixableIssues, ...unfixableIssues];
  const choices = new Map();

  for (let i = 0; i < badSushiItems.length; i += 1) {
    console.log(`\n[${i + 1} / ${badSushiItems.length}]`);

    const sushiItem = badSushiItems[i];
    const endpointId = sushiItem?.endpointId;
    const sushiLabel = sushiItem?.vendor || sushiItem?.id;
    let endpoint;

    if (endpointId) {
      console.log(i18n.t('sushi.fixEndpoints.unexistingEndpoint', { label: chalk.blue(sushiLabel) }));
    } else {
      console.log(i18n.t('sushi.fixEndpoints.notAssociatedToEndpoint', { label: chalk.blue(sushiLabel) }));
    }

    if (sushiItem?.sushiUrl) {
      console.log(i18n.t('sushi.fixEndpoints.sushiUrl', { url: chalk.yellow(sushiItem?.sushiUrl) }));
    }
    if (sushiItem?.params?.length) {
      const params = sushiItem.params
        .map((param) => `[${param?.name || ''} = ${param?.value || ''}]`)
        .join(' ');
      console.log(i18n.t('sushi.fixEndpoints.sushiParams', { params: chalk.yellow(params) }));
    }

    if (sushiItem?.vendor) {
      endpoint = choices.get(sushiItem.vendor.toLowerCase());
    }

    // Find an endpoint that match the vendor name
    // If multiple endpoints are found, let the user decide
    if (!endpoint && typeof sushiItem?.vendor === 'string') {
      const matchingEndpoints = endpointsByVendor.get(sushiItem.vendor.toLowerCase()) || [];

      if (matchingEndpoints.length === 1) {
        console.log(i18n.t('sushi.fixEndpoints.foundExactMatch'));
        [endpoint] = matchingEndpoints;
      } else if (matchingEndpoints.length > 1) {
        console.log(i18n.t('sushi.fixEndpoints.foundMultiple'));
      }
    }

    if (!endpoint) {
      const selectedId = await itMode.selectEndpoint(endpoints);

      if (selectedId === '$ignoreItem') {
        endpoint = null;
      } else if (selectedId === '$createEndpoint') {
        try {
          endpoint = await createEndpointFromSushi(sushiItem);
        } catch (e) {
          console.error(formatApiError(e));
          process.exit(1);
        }
        endpoints.push(endpoint);
        console.log(i18n.t('sushi.fixEndpoints.endpointCreated', { label: chalk.blue(endpoint?.vendor || endpoint?.id) }));
      } else {
        endpoint = endpointsById.get(selectedId);
      }

      if (endpoint && sushiItem?.vendor) {
        const remember = await itMode.confirm(i18n.t('sushi.fixEndpoints.rememberChoice'));

        if (remember) {
          choices.set(sushiItem.vendor.toLowerCase(), endpoint);
        }
      }
    }

    if (!endpoint?.id) {
      if (verbose) {
        console.log(`* Ignoring SUSHI item [${sushiItem.id}] (no endpoint selected)`);
      }
    } else {
      if (verbose) {
        console.log(`* Associating SUSHI item [${sushiItem.id}] with endpoint [${endpoint?.id}]`);
      }

      try {
        if (output) {
          sushiItem.endpointId = endpoint?.id;
          await fs.writeFile(path.resolve(output), JSON.stringify(sushiItems, null, 2));
        } else {
          await sushiLib.update(sushiItem.id, { endpointId: endpoint?.id });
        }
      } catch (e) {
        console.error(formatApiError(e));
        process.exit(1);
      }

      console.log(i18n.t('sushi.fixEndpoints.associatedToEndpoint', {
        sushi: chalk.blue(sushiLabel),
        endpoint: chalk.blue(endpoint?.vendor || endpoint?.id),
      }));
    }
  }

  console.log();
  console.log(i18n.t('sushi.fixEndpoints.noMoreIssues'));
};
