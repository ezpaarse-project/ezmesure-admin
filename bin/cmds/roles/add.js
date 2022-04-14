const { i18n } = global;

const rolesLib = require('../../../lib/roles');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'add <role>';
exports.desc = i18n.t('roles.add.description');
exports.builder = function builder(yargs) {
  return yargs.positional('role', {
    describe: i18n.t('roles.add.options.role'),
    type: 'string',
  })
    .option('i', {
      alias: 'index-pattern',
      describe: i18n.t('roles.add.options.indexPattern'),
      type: 'string',
    })
    .option('s', {
      alias: 'space',
      describe: i18n.t('roles.add.options.space'),
      type: 'string',
    })
    .option('p', {
      alias: 'privileges',
      describe: i18n.t('roles.add.options.privileges'),
      type: 'string',
    })
    .option('r', {
      alias: 'read-only',
      describe: i18n.t('roles.add.options.readOnly'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    role, indexPattern, space, readOnly, privileges, verbose,
  } = argv;

  let hasError = false;

  if (verbose) {
    console.log(`* Create or update role [${role}] with index-pattern [${indexPattern}] for space [${space}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    await rolesLib.createOrUpdate(role, {
      elasticsearch: {
        indices: [
          {
            names: [indexPattern],
            privileges: [privileges],
          },
        ],
      },
      kibana: [
        {
          spaces: [space],
          base: [privileges],
        },
      ],
    });
    console.log(i18n.t('roles.add.roleCreated', { roleName: role }));
  } catch (err) {
    console.error(formatApiError(err));
    hasError = true;
  }

  if (readOnly) {
    if (verbose) {
      console.log(`* Create or update role [${role}_read_only] with index-pattern [${indexPattern}] for space [${space}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await rolesLib.createOrUpdate(`${role}_read_only`, {
        elasticsearch: {
          indices: [
            {
              names: [indexPattern],
              privileges: ['read'],
            },
          ],
        },
        kibana: [
          {
            spaces: [space],
            base: ['read'],
          },
        ],
      });
      console.log(i18n.t('roles.add.roleCreated', { roleName: `${role}_read_only` }));
    } catch (err) {
      console.error(formatApiError(err));
      hasError = true;
    }
  }

  process.exit(hasError ? 1 : 0);
};
