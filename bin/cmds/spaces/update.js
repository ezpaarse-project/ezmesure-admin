const { i18n } = global;

const Joi = require('joi');

const spaces = require('../../../lib/spaces');
const it = require('./interactive/add');
const kibanaFeatures = require('../../../lib/app/kibana');

exports.command = 'update <name>';
exports.desc = i18n.t('spaces.update.description');
exports.builder = function builder(yargs) {
  return yargs.positional('name', {
    describe: i18n.t('spaces.update.options.name'),
    type: 'string',
  })
    .option('n', {
      alias: 'new-name',
      type: 'string',
      describe: i18n.t('spaces.update.options.name'),
    })
    .option('c', {
      alias: 'color',
      type: 'string',
      describe: i18n.t('spaces.update.options.color'),
    })
    .option('d', {
      alias: 'description',
      type: 'string',
      describe: i18n.t('spaces.update.options.description'),
    })
    .option('i', {
      alias: 'initials',
      type: 'string',
      describe: i18n.t('spaces.update.options.initials'),
    })
    .option('it', {
      alias: 'interactive',
      type: 'boolean',
      describe: i18n.t('spaces.update.options.interactive'),
    })
    .option('f', {
      alias: 'features',
      type: 'string',
      describe: i18n.t('spaces.update.options.features'),
    });
};
exports.handler = async function handler(argv) {
  const {
    name,
    newName,
    color,
    description,
    initials,
    interactive,
    features,
  } = argv;

  const schema = Joi.object({
    id: Joi.string().trim(),
    name: Joi.string().trim().required(),
    color: Joi.string().trim(),
    description: Joi.string().trim(),
    initials: Joi.string().trim(),
  });

  const { error } = schema.validate({
    name: (newName || name), color, description, initials,
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const space = {
    id: name.toLowerCase(),
    name: (newName || name),
    color,
    initials,
    disabledFeatures: features && kibanaFeatures.filter((feature) => !features.includes(feature)),
  };

  if (interactive) {
    const { spaceDescr, spaceInitials, spaceColor } = await it();

    space.description = spaceDescr;
    space.initials = spaceInitials;
    space.color = spaceColor;
  }

  try {
    await spaces.update(name.toLowerCase(), space);
  } catch (err) {
    console.error(`[Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    process.exit(1);
  }

  console.log(i18n.t('spaces.update.updated', { space: space.name }));
};
