const { i18n } = global;

const rolesLib = require('../../../lib/roles');
const spacesLib = require('../../../lib/spaces');

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
    spaceRemove = '', spaceAdd, indexRemove = '', indexAdd,
  } = argv;

  let role;
  try {
    const { data } = await rolesLib.findByName(argv.role);
    role = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  // Spaces management
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

  role.kibana = role?.kibana?.map((spaceRights) => {
    // eslint-disable-next-line max-len
    spaceRights.spaces = spaceRights?.spaces?.filter((space) => !spacesNamesToRemove?.includes(space));
    return spaceRights;
  }).filter(({ spaces }) => spaces?.length > 0);

  for (let i = 0; i < spacesNamesToAdd.length; i += 1) {
    try {
      await spacesLib.findById(spacesNamesToAdd[i]);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
      process.exit(1);
    }
  }

  spacesToAdd?.forEach(([spaceName, spacePrivileges]) => {
    role?.kibana?.push({
      base: [spacePrivileges],
      spaces: [spaceName],
    });
  });

  // Indices management
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

  if (indicesNamesToRemove?.length) {
    role.elasticsearch.indices = role?.elasticsearch?.indices?.map((indicesRights) => {
      // eslint-disable-next-line max-len
      indicesRights.names = indicesRights?.names?.filter((index) => !indicesNamesToRemove?.includes(index));
      return indicesRights;
    }).filter(({ names }) => names?.length > 0);
  }

  indicesToAdd?.forEach(([indexName, indexPrivileges]) => {
    role.elasticsearch.indices.push({
      names: [indexName],
      privileges: indexPrivileges.split(','),
    });
  });

  try {
    await rolesLib.createOrUpdate(role.name, role);
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }
};
