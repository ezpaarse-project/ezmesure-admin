const { i18n } = global;

const Joi = require('joi');

const spaces = require('../../../lib/spaces');
const itMode = require('./interactive/add');
const kibana = require('../../../lib/app/kibana');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'add <name>';
exports.desc = i18n.t('spaces.add.description');
exports.builder = function builder(yargs) {
  return yargs.positional('name', {
    describe: i18n.t('spaces.add.options.name'),
    type: 'string',
  })
    .option('c', {
      alias: 'color',
      type: 'string',
      describe: i18n.t('spaces.add.options.color'),
    })
    .option('d', {
      alias: 'description',
      type: 'string',
      describe: i18n.t('spaces.add.options.description'),
    })
    .option('i', {
      alias: 'initials',
      type: 'string',
      describe: i18n.t('spaces.add.options.initials'),
    })
    .option('it', {
      alias: 'interactive',
      type: 'boolean',
      describe: i18n.t('spaces.add.options.interactive'),
    })
    .option('f', {
      alias: 'features',
      type: 'string',
      describe: i18n.t('spaces.add.options.features'),
    });
};
exports.handler = async function handler(argv) {
  const {
    name,
    color,
    description,
    initials,
    interactive,
    features,
    verbose,
  } = argv;

  if (verbose) {
    console.log(`* Validating fields that describe the space [${name}]`);
  }

  const schema = Joi.object({
    id: Joi.string().trim(),
    name: Joi.string().trim().required(),
    color: Joi.string().trim(),
    description: Joi.string().trim(),
    initials: Joi.string().trim(),
  });

  const { error } = schema.validate({
    name, color, description, initials,
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const space = {
    id: name.toLowerCase(),
    name,
    color,
    description: description || 'homepage',
    initials,
    disabledFeatures: features && kibana.features.filter((feature) => !features.includes(feature)),
  };

  if (interactive) {
    const { spaceDescr, spaceInitials, spaceColor } = await itMode();

    space.description = spaceDescr;
    space.initials = spaceInitials;
    space.color = spaceColor;
  }

  if (verbose) {
    console.log(`* Creation of space [${name}]`);
  }

  try {
    await spaces.create(space);
  } catch (err) {
    console.error(formatApiError(err));
    process.exit(1);
  }

  console.log(i18n.t('spaces.add.created', { space: space.name }));
};
