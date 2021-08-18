const { i18n } = global;

const rolesLib = require('../../../lib/roles');
const spacesLib = require('../../../lib/spaces');
const kibana = require('../../../lib/app/kibana');
const { config } = require('../../../lib/app/config');

exports.command = 'update <role>';
exports.desc = i18n.t('roles.update.description');
exports.builder = function builder(yargs) {
  return yargs.positional('role', {
    describe: i18n.t('roles.update.options.role'),
    type: 'string',
  })
    .option('space-remove', {
      describe: i18n.t('roles.update.options.spaceRemove'),
      type: 'string',
    })
    .option('space-add', {
      describe: i18n.t('roles.update.options.spaceAdd'),
      type: 'string',
    })
    .option('index-remove', {
      describe: i18n.t('roles.update.options.indexRemove'),
      type: 'string',
    })
    .option('index-add', {
      describe: i18n.t('roles.update.options.indexAdd'),
      type: 'string',
    });
};
exports.handler = async function handler(argv) {
  const {
    spaceRemove = '', spaceAdd, indexRemove = '', indexAdd, verbose,
  } = argv;

  if (verbose) {
    console.log(`* Retrieving roles [${argv.role}] from ${config.ezmesure.baseUrl}`);
  }

  let role;
  try {
    const { data } = await rolesLib.findByName(argv.role);
    role = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  // Spaces management
  // Adding a space relies on deleting a space in the role
  // when it exists to add it again with the right parameters.
  let spacesToAdd = Array.isArray(spaceAdd) ? spaceAdd : [spaceAdd];
  spacesToAdd = spacesToAdd.filter((x) => x).map((space) => space?.split(':'));

  const spacesNamesToAdd = spacesToAdd.map(([spaceName]) => spaceName)
    .map((x) => x.trim())
    .filter((x) => x);

  let spacesNamesToRemove = Array.isArray(spaceRemove) ? spaceRemove : (spaceRemove || '').split(',');

  spacesNamesToRemove = [
    ...spacesNamesToRemove.filter((x) => x),
    ...spacesNamesToAdd,
  ];

  // Remove space
  role.kibana = role?.kibana?.map((spaceRights) => {
    // eslint-disable-next-line max-len
    spaceRights.spaces = spaceRights?.spaces?.filter((space) => !spacesNamesToRemove?.includes(space));
    return spaceRights;
  }).filter(({ spaces }) => spaces?.length > 0);

  // Add space
  // Check if space exists
  for (let i = 0; i < spacesNamesToAdd.length; i += 1) {
    try {
      await spacesLib.findById(spacesNamesToAdd[i]);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
      process.exit(1);
    }
  }

  spacesToAdd?.forEach(([spaceName, spacePrivileges]) => {
    const spaceRights = {
      base: [spacePrivileges],
      feature: {},
      spaces: [spaceName],
    };

    const customSpacePrivlieges = spacePrivileges?.split(',')
      .map((x) => x.trim())
      .filter((x) => x)
      .filter((x) => !(x === 'all' || x === 'read'))
      .map((privileges) => privileges?.split('-')
        .map((x) => x.trim())
        .filter((x) => x)
        .slice(0, 2));

    if (customSpacePrivlieges.length) {
      customSpacePrivlieges.forEach(([feature, featureRights]) => {
        if (kibana.features.includes(featureRights)) {
          spaceRights.feature[feature] = [featureRights];
        } else {
          console.error(`Kibana [${feature}] feature dose not exist.`);
          process.exit(1);
        }
      });
      spaceRights.base = [];
    }

    role?.kibana?.push(spaceRights);
  });

  // Indices management
  // Adding an index relies on deleting an index in the role
  // when it exists to add it again with the right parameters.
  let indicesToAdd = Array.isArray(indexAdd) ? indexAdd : [indexAdd];
  indicesToAdd = indicesToAdd.filter((x) => x).map((space) => space?.split(':'));

  const indicesNamesToAdd = indicesToAdd.map(([spaceName]) => spaceName)
    .map((x) => x.trim())
    .filter((x) => x);

  let indicesNamesToRemove = Array.isArray(indexRemove) ? indexRemove : (indexRemove || '').split(',');

  indicesNamesToRemove = [
    ...indicesNamesToRemove.filter((x) => x),
    ...indicesNamesToAdd,
  ];

  // Remove index
  role.elasticsearch.indices = role?.elasticsearch?.indices?.map((indicesRights) => {
    // eslint-disable-next-line max-len
    indicesRights.names = indicesRights?.names?.filter((index) => !indicesNamesToRemove?.includes(index));
    return indicesRights;
  }).filter(({ names }) => names?.length > 0);

  // Add index
  indicesToAdd?.forEach(([indexName, indexPrivileges]) => {
    role.elasticsearch.indices.push({
      names: [indexName],
      privileges: indexPrivileges.split(','),
    });
  });

  Object.keys(role).forEach((key) => {
    if (key.startsWith('_')) {
      delete role[key];
    }
  });

  if (verbose) {
    console.log(`* Update role [${argv.role}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    await rolesLib.createOrUpdate(role.name, role);
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  console.log(`role [${argv.role}] updated successfully`);
};
