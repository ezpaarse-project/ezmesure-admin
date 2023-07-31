const { i18n } = global;

const Joi = require('joi');
const logger = require('../../../lib/logger');
const institutions = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');

exports.command = 'add <name>';
exports.desc = i18n.t('institutions.add.description');
exports.builder = function builder(yargs) {
  yargs
    .option('namespace', {
      describe: i18n.t('institutions.add.options.namespace'),
      type: 'string',
    })
    .option('type', {
      describe: i18n.t('institutions.add.options.type'),
      type: 'string',
    })
    .option('acronym', {
      describe: i18n.t('institutions.add.options.acronym'),
      type: 'string',
    })
    .option('validated', {
      describe: i18n.t('institutions.add.options.space'),
      type: 'string',
    })
    .option('spaces', {
      describe: i18n.t('institutions.add.options.space'),
      type: 'string',
    })
    .option('v', {
      alias: 'verbose',
      describe: i18n.t('institutions.get.options.verbose'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    name,
    namespace,
    type,
    acronym,
    validated,
    spaces,
    verbose,
  } = argv;

  if (verbose) { logger.setLevel('verbose'); }

  logger.verbose(`Host: ${config.ezmesure.baseUrl}`);

  const schema = Joi.object({
    name: Joi.string().trim().required(),
    namespace: Joi.string().trim(),
    type: Joi.string().trim(),
    acronym: Joi.string().trim(),
    validated: Joi.boolean().allow(null),
    spaces: Joi.array().allow(null),
  });

  const { error } = schema.validate({
    name, namespace, type, acronym, validated, spaces,
  });

  if (error) {
    logger.error(`[syntax]: ${error.message}`);
    process.exit(1);
  }

  let institutionsData;
  logger.verbose('Get all institutions');
  try {
    institutionsData = await institutions.getAll();
  } catch (err) {
    logger.error(`Cannot get all institutions - ${error.response.status}`);
    process.exit(1);
  }

  logger.verbose(`Get if institution [${name}] already exist`);
  const institution = institutionsData?.data?.find((el) => el.name === name);

  if (institution) {
    logger.error(`Institution [${name}] already exist`);
    process.exit(1);
  }

  if (!institution) {
    logger.verbose(`Create institution [name: ${name}, namespace: ${namespace}, type: ${type}, acronym: ${acronym}, validated: ${validated}, spaces: ${spaces}]`);
    try {
      await institutions.create({
        name, namespace, type, acronym, validated, spaces,
      });
    } catch (err) {
      logger.error(`Cannote create institution [${name}]`);
      process.exit(1);
    }
  }
  logger.info(`Institution [${name}] is created`);
};
