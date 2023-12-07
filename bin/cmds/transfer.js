const { i18n } = global;

const https = require('https');
const chalk = require('chalk');
const axios = require('axios');
const inquirer = require('inquirer');

const institutionsLib = require('../../lib/institutions');
const rolesLib = require('../../lib/roles');
const usersLib = require('../../lib/users');
const endpointsLib = require('../../lib/endpoints');
const sushiLib = require('../../lib/sushi');
const ezmesure = require('../../lib/app/ezmesure');
const { config } = require('../../lib/app/config');
const { formatApiError } = require('../../lib/utils');

/**
 * @typedef {import('axios').AxiosInstance} AxiosInstance
 */

/**
 * @typedef {object} ImportOptions
 * @property {number} bulkSize - Number of items that should be imported at once
 * @property {boolean} overwrite - Whether items should be updated if they exist
 * @property {string} itemNameKey - Property that should be displayed as item name
 * @property {'sushi'|'sushi-endpoints'|'institutions'|'users'} itemType - The type of items
 * @property {Array<object>} items - Items to be imported
 */

/**
 * @typedef {object} ImportResult
 * @property {number} errors - Number of items that failed to be imported
 * @property {number} conflicts - Number of items that already exist
 * @property {number} created - Number of items that were actually imported
 */

exports.command = 'transfer';
exports.desc = i18n.t('transfer.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('to', {
      describe: i18n.t('transfer.options.to'),
      type: 'string',
      required: true,
    })
    .option('b', {
      alias: 'bulk-size',
      describe: i18n.t('transfer.options.bulkSize'),
      type: 'number',
      default: 20,
    })
    .option('k', {
      alias: 'insecure',
      describe: i18n.t('transfer.options.insecure'),
      type: 'boolean',
    })
    .option('o', {
      alias: 'overwrite',
      describe: i18n.t('transfer.options.overwrite'),
      type: 'boolean',
    });
};

/**
 * Ask for credentials, login to given ezMESURE instance and set Authorization header
 * @param {AxiosInstance} ezmesureInstance  the instance to log into
 * @returns {void}
 */
async function login(ezmesureInstance) {
  const { username, password } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: i18n.t('login.username'),
    },
    {
      type: 'password',
      name: 'password',
      mask: '*',
      message: i18n.t('login.password'),
    },
  ]);

  let destToken;
  try {
    const res = await ezmesureInstance.post('/login/local', { username, password });
    destToken = /^eztoken=([a-z0-9._\-\w]+)/i.exec(res?.headers['set-cookie'])?.[1];
  } catch (error) {
    console.error(formatApiError(error));
    console.error(i18n.t('login.loginFailed', { username }));
    process.exit(1);
  }

  ezmesureInstance.defaults.headers.common.Authorization = `Bearer ${destToken}`;
}

/**
 * Imports a list of items into ezMESURE
 * @param {AxiosInstance} ezm - the ezMESRUE API instance
 * @param {ImportOptions} options
 * @returns {ImportResult}
 */
async function bulkImport(ezm, options) {
  const {
    bulkSize = 20,
    overwrite = false,
    itemNameKey = 'name',
    itemType,
    items: itemsToImport,
  } = options;

  const pages = Math.floor(itemsToImport.length / bulkSize);

  const results = {
    errors: 0,
    conflicts: 0,
    created: 0,
  };

  for (let i = 0; i <= pages; i += 1) {
    const toImport = itemsToImport.slice(bulkSize * i, bulkSize * (i + 1));
    const result = await ezm.post(`/${itemType}/_import`, toImport, { params: { overwrite } });

    const {
      errors,
      conflicts,
      created,
      items,
    } = (result?.data || {});

    items?.forEach((item) => {
      switch (item?.status) {
        case 'error':
          console.error(i18n.t('transfer.itemError', {
            type: itemType,
            name: item?.data?.[itemNameKey] || 'N/A',
            message: item?.message,
          }));
          break;
        case 'conflict':
          console.log(i18n.t('transfer.itemConflict', {
            type: itemType,
            name: item?.data?.[itemNameKey] || 'N/A',
          }));
          break;
        case 'created':
          console.log(i18n.t('transfer.itemCreated', {
            type: itemType,
            name: item?.data?.[itemNameKey] || 'N/A',
          }));
          break;
        default:
      }
    });

    if (Number.isInteger(created) && created > 0) {
      results.created += created;
    }
    if (Number.isInteger(conflicts) && conflicts > 0) {
      results.conflicts += conflicts;
    }
    if (Number.isInteger(errors) && errors > 0) {
      results.errors += errors;
    }
  }

  return results;
}

/**
 * Transfer SUSHI endpoints in the destination ezMESURE instance
 * @param {AxiosInstance} ezm  the ezmesure API instance
 * @param {Pick<ImportOptions, 'overwrite' | 'bulkSize'>} options
 * @returns {ImportResult}
 */
async function transferSushiEndpoints(ezm, options = {}) {
  let endpoints;
  try {
    const { data } = await endpointsLib.getAll();

    if (Array.isArray(data)) {
      endpoints = data.map((endpoint) => ({
        ...endpoint,
        validated: undefined,
        isSushiCompliant: undefined,
      }));
    }
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  console.log('Importing SUSHI endpoints...');

  return bulkImport(ezm, {
    items: endpoints,
    itemType: 'sushi-endpoints',
    itemNameKey: 'vendor',
    ...options,
  });
}

/**
 * Transfer institutions and their repositories/spaces in the destination ezMESURE instance
 * @param {AxiosInstance} ezm  the ezmesure API instance
 * @param {Array<object>} institutions  the institutions from the source ezMESURE
 * @param {Pick<ImportOptions, 'overwrite' | 'bulkSize'>} options
 * @returns {ImportResult}
 */
async function transferInstitutions(ezm, institutions, options) {
  const newInstitutions = [];

  const sushiCredentials = new Map(institutions.map(({ id }) => [id, []]));
  try {
    const { data } = await sushiLib.getAll();

    data?.forEach?.((item) => {
      sushiCredentials.get(item?.institutionId)?.push({
        ...item,
        tags: [item.package],
        vendor: undefined,
        package: undefined,
        connection: undefined,
      });
    });
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  let roles;
  try {
    const { data } = await rolesLib.getAll();
    roles = new Map(data.map((role) => ([role.name, role])));
  } catch (error) {
    if (error?.response?.status !== 404) {
      console.error(formatApiError(error));
      process.exit(1);
    }
  }

  for (const institution of institutions) {
    console.group(chalk.bold(institution.name));

    const { logoId, role: roleName } = institution;

    const newInstitution = {
      id: institution.id,
      name: institution.name,
      namespace: institution.space,
      type: institution.type,
      acronym: institution.acronym,
      websiteUrl: institution.websiteUrl,
      city: institution.city,
      uai: institution.uai,

      social: {
        twitterUrl: institution.twitterUrl,
        linkedinUrl: institution.linkedinUrl,
        youtubeUrl: institution.youtubeUrl,
        facebookUrl: institution.facebookUrl,
      },

      sushiReadySince: institution.sushiReadySince,
      validated: institution.validated,
      hidePartner: institution.hidePartner,
      tags: [],

      spaces: [],
      repositories: [],
      memberships: [],
      sushiCredentials: sushiCredentials.get(institution.id) || [],
    };

    if (logoId) {
      console.log(`Fetching logo ${logoId}`);

      try {
        const { data: logo, status } = await ezmesure.get(
          `/assets/logos/${logoId}`,
          {
            responseType: 'text',
            responseEncoding: 'base64',
            validateStatus: (statusCode) => statusCode === 200 || statusCode === 404,
          },
        );

        if (status === 404) {
          console.log(`Logo ${logoId} not found`);
        } else {
          newInstitution.logo = logo;
        }
      } catch (error) {
        console.error(formatApiError(error));
        process.exit(1);
      }
    }

    if (roleName) {
      const role = roles.get(roleName);

      if (role) {
        const patterns = role?.elasticsearch?.indices?.flatMap?.((indices) => indices?.names || []);
        const spaces = role?.kibana?.flatMap?.((kibanaPerms) => kibanaPerms?.spaces || []);

        newInstitution.repositories = Array.from(new Set(patterns)).map((pattern) => ({
          pattern,
          type: pattern.includes('publisher') ? 'counter5' : 'ezpaarse',
        }));
        newInstitution.spaces = Array.from(new Set(spaces)).map((spaceId) => ({
          id: spaceId,
          name: spaceId, // FIXME
          type: spaceId.includes('publisher') ? 'counter5' : 'ezpaarse',
        }));
      }
    }

    console.log(`Repositories: ${newInstitution.repositories.map((r) => r.pattern).join(', ')}`);
    console.log(`Spaces: ${newInstitution.spaces.map((s) => s.id).join(', ')}`);

    newInstitutions.push(newInstitution);

    console.groupEnd();
    console.log();
  }

  console.log('Importing institutions...');

  return bulkImport(ezm, {
    items: newInstitutions,
    itemType: 'institutions',
    itemNameKey: 'name',
    ...options,
  });
}

/**
 * Transfer users and their memberships in the destination ezMESURE instance
 * @param {AxiosInstance} ezm  the ezmesure API instance
 * @param {Array<object>} institutions  the institutions from the source ezMESURE
 * @param {Pick<ImportOptions, 'overwrite' | 'bulkSize'>} options
 * @returns {ImportResult}
 */
async function transferUsers(ezm, institutions, options) {
  let users;
  try {
    ({ data: users } = await usersLib.getAll({ size: 10000, source: '*' }));
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  const institutionsByRole = new Map(institutions.map((i) => [i.role, i]));

  const newUsers = users
    .filter((user) => user.username && user?.email)
    .map((user) => {
      const userRoles = new Set(user.roles || []);

      const userData = {
        username: user.username,
        fullName: user.full_name || user.username,
        email: user.email,
        isAdmin: userRoles.has('superuser'),
        memberships: [],
      };

      user.roles?.forEach?.((role) => {
        const institution = institutionsByRole.get(role);
        if (!institution) { return; }

        const memberRoles = [];
        if (userRoles.has('doc_contact')) { memberRoles.push('contact:doc'); }
        if (userRoles.has('tech_contact')) { memberRoles.push('contact:tech'); }

        userData.memberships.push({
          institutionId: institution.id,
          username: userData.username,
          roles: memberRoles,
        });
      });

      return userData;
    });

  console.log('Importing users...');
  return bulkImport(ezm, {
    items: newUsers,
    itemType: 'users',
    itemNameKey: 'username',
    ...options,
  });
}

exports.handler = async function handler(argv) {
  const {
    to: destinationUrl,
    verbose,
    overwrite,
    bulkSize,
    insecure,
  } = argv;

  /** @type {AxiosInstance} */
  const destEzmesure = axios.create({
    timeout: 3000,
    baseURL: destinationUrl,
    headers: {
      'User-Agent': ezmesure.defaults.headers.common['User-Agent'],
    },
  });

  if (insecure) {
    ezmesure.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    destEzmesure.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  console.log(i18n.t('transfer.authenticating', { url: destinationUrl }));
  await login(destEzmesure);

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    institutions = data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (!Array.isArray(institutions)) {
    console.error(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  const results = [
    {
      label: 'SUSHI endpoints',
      data: await transferSushiEndpoints(
        destEzmesure,
        { overwrite, bulkSize },
      ),
    },
    {
      label: 'Institutions',
      data: await transferInstitutions(
        destEzmesure,
        institutions,
        { overwrite, bulkSize },
      ),
    },
    {
      label: 'Users',
      data: await transferUsers(
        destEzmesure,
        institutions,
        { overwrite, bulkSize },
      ),
    },
  ];

  results.forEach(({ label, data }) => {
    console.log();
    console.group(chalk.bold(label));

    if (data?.created > 0) {
      console.log(i18n.t('transfer.nbImported', { n: data.created }));
    }
    if (data?.conflicts > 0) {
      console.log(i18n.t('transfer.nbConflicts', { n: data.conflicts }));
    }
    if (data?.errors > 0) {
      console.log(i18n.t('transfer.nbErrors', { n: data.errors }));
      process.exit(1);
    }

    console.groupEnd();
  });
};
