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
    // TODO
  }

  if (indexAdd && indexAdd.length) {
    const [indexName, indexPrivileges] = indexAdd?.split(':');

    const indexCustomPrivileges = indexPrivileges?.includes(',') ? indexPrivileges?.split(',') : null;

    for (let i = 0; i < current?.elasticsearch?.indices?.length; i += 1) {
      const index = current?.elasticsearch?.indices[i];

      if (index?.names?.includes(indexName.toLowerCase())) {
        if (index?.names?.length === 1) {
          // eslint-disable-next-line max-len
          index.privileges = indexCustomPrivileges?.length ? indexCustomPrivileges : [indexPrivileges];
        }

        if (index?.names?.length > 1) {
          index.names = index?.names?.filter((name) => name !== indexName);
          current.elasticsearch.indices.push({
            names: [indexName],
            privileges: indexCustomPrivileges?.length ? indexCustomPrivileges : [indexPrivileges],
          });
        }
      }
    }
  }

  console.log(JSON.stringify(current, null, 2));
};

const fakeRole = {
  elasticsearch: {
    cluster: [],
    indices: [
      {
        names: [
          'aaa',
          'univ-example',
        ],
        privileges: [
          'read',
        ],
      },
    ],
  },
  kibana: [
    {
      base: [
        'read',
      ],
      feature: {},
      spaces: [
        'bienvenue',
        'cnrs',
      ],
    },
    {
      base: [
        'all',
      ],
      feature: {},
      spaces: [
        'welcome',
      ],
    },
  ],
};
