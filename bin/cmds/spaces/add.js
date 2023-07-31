const { i18n } = global;

const logger = require('../../../lib/logger');
const { config } = require('../../../lib/app/config');

const spaces = require('../../../lib/spaces');
const itMode = require('./interactive/add');

exports.command = 'add <id> <institutionId> <type> <description> <initials>';
exports.desc = i18n.t('spaces.add.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('n', {
      alias: 'name',
      type: 'boolean',
      describe: i18n.t('spaces.add.options.name'),
    })
    .option('it', {
      alias: 'interactive',
      type: 'boolean',
      describe: i18n.t('spaces.add.options.interactive'),
    });
};
exports.handler = async function handler(argv) {
  let { name } = argv;
  const {
    id,
    institutionId,
    type,
    description,
    initials,
    interactive,
    verbose,
  } = argv;

  if (verbose) { logger.setLevel('verbose'); }

  logger.verbose(`Host: ${config.ezmesure.baseUrl}`);

  logger.verbose(`Validating fields that describe the space [${name}]`);

  if (!name) {
    name = id;
  }

  const space = {
    id,
    institutionId,
    type,
    name,
    description,
    initials,
  };

  if (interactive) {
    logger.verbose('Interactive Mode');
    const { spaceDescr, spaceInitials } = await itMode();

    space.description = spaceDescr;
    space.initials = spaceInitials;
  }

  logger.verbose(`Create space [${name}]`);

  try {
    await spaces.create(space);
  } catch (err) {
    logger.error(`Cannot create space [id: ${space?.id}, institutionId: ${space?.institutionId}, type: ${space?.type}, name: ${space?.name}, description: ${space?.description}, initials: ${space?.initials}] - ${err?.response?.status}`);
    process.exit(1);
  }

  logger.info(i18n.t('spaces.add.created', { space: space.name }));
};
