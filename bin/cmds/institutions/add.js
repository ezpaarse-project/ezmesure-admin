const { i18n } = global;

const Joi = require('joi');
const logger = require('../../../lib/logger');
const institutions = require('../../../lib/institutions');

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

  let institution;
  try {
    const { data } = await institutions.getAll();
    institution = data.find((el) => el.name === name);
    if (verbose) {
      logger.info('[institution]: get all institution');
    }
  } catch (err) {
    logger.error(`[institution]: Cannot get all institution - ${error.response.status}`);
    process.exit(1);
  }

  if (!institution) {
    try {
      const { data } = await institutions.create({
        name, namespace, type, acronym, validated, spaces,
      });
      institution = data;
    } catch (err) {
      logger.error(`[institutions]: Cannote create institution [${name}]`);
      process.exit(1);
    }
  }
  logger.info(`[institutions]: institution [${name}] is created`);
};
