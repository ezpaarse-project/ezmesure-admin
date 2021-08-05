const { i18n } = global;

const rolesLib = require('../../../lib/roles');

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
    spaceRemove, spaceAdd, indexRemove, indexAdd,
  } = argv;

  let current;
  try {
    const { data } = await rolesLib.findByName(argv.role);
    current = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  if (spaceRemove?.length) {
    for (let i = 0; i < current?.kibana?.length; i += 1) {
      const kbnSpace = current?.kibana[i];
      if (kbnSpace?.spaces?.length === 1 && spaceRemove?.includes(kbnSpace?.spaces)) {
        current?.kibana?.splice(i, i + 1);
      }

      if (kbnSpace?.spaces?.length > 1) {
        const spacesNames = spaceRemove?.split(',');
        current.kibana[i].spaces = kbnSpace?.spaces
          .filter((space) => !spacesNames?.includes(space));
      }
    }
  }

  if (indexRemove?.length) {
    for (let i = 0; i < current?.elasticsearch?.indices?.length; i += 1) {
      const index = current?.elasticsearch?.indices[i];
      if (index?.names?.length === 1 && indexRemove?.includes(index?.names)) {
        current?.elasticsearch?.indices?.splice(i, i + 1);
      }

      if (index?.names?.length > 1) {
        const indicesNames = indexRemove?.split(',');
        current.elasticsearch.indices[i].names = index?.names
          .filter((name) => !indicesNames?.includes(name));
      }
    }
  }

  if (spaceAdd && spaceAdd.length) {
    const spacesAdd = Array.isArray(spaceAdd) ? spaceAdd?.map((space) => space?.split(':')) : [spaceAdd?.split(':')];

    spacesAdd.forEach(([spaceName, spacePrivileges]) => {
      const exists = current?.kibana?.find((space) => space?.spaces?.includes(spaceName));

      if (exists && exists?.spaces?.length === 1) {
        exists.base = [spacePrivileges];
      } else if (exists && exists?.spaces?.length > 1) {
        exists.spaces = exists?.spaces?.filter((s) => s !== spaceName);
        current.kibana.push({
          base: [spacePrivileges],
          spaces: [spaceName],
        });
      } else {
        current.kibana.push({
          base: [spacePrivileges],
          spaces: [spaceName],
        });
      }
    });
  }

  if (indexAdd && indexAdd.length) {
    const indicesAdd = Array.isArray(indexAdd) ? indexAdd?.map((index) => index?.split(':')) : [indexAdd?.split(':')];

    indicesAdd.forEach(([indexName, indexPrivileges]) => {
      const indexCustomPrivileges = indexPrivileges?.includes(',') ? indexPrivileges?.split(',') : null;

      // eslint-disable-next-line max-len
      const exists = current?.elasticsearch?.indices?.find((index) => index?.names?.includes(indexName));

      if (exists && exists?.names?.length === 1) {
        // eslint-disable-next-line max-len
        exists.privileges = indexCustomPrivileges?.length ? indexCustomPrivileges : [indexPrivileges];
      } else if (exists && exists?.names?.length > 1) {
        exists.names = exists?.names?.filter((name) => name !== indexName);
        current.elasticsearch.indices.push({
          names: [indexName],
          privileges: indexCustomPrivileges?.length ? indexCustomPrivileges : [indexPrivileges],
        });
      } else {
        current.elasticsearch.indices.push({
          names: [indexName],
          privileges: indexCustomPrivileges?.length ? indexCustomPrivileges : [indexPrivileges],
        });
      }
    });
  }

  console.log(JSON.stringify(current, null, 2));
};
