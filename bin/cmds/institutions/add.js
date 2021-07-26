const { i18n } = global;

const Joi = require('joi');

const indices = require('../../../lib/indices');
const institutions = require('../../../lib/institutions');
const roles = require('../../../lib/roles');
const spaces = require('../../../lib/spaces');

exports.command = 'add <name>';
exports.desc = i18n.t('institutions.add.description');
exports.builder = function builder(yargs) {
  yargs.positional('name', {
    describe: i18n.t('institutions.add.options.name'),
    type: 'string',
  })
    .option('i', {
      alias: 'index',
      describe: i18n.t('institutions.add.options.index'),
      type: 'string',
    })
    .option('s', {
      alias: 'space',
      describe: i18n.t('institutions.add.options.space'),
      type: 'string',
    })
    .option('ezpaarse', {
      describe: i18n.t('institutions.add.options.ezpaarse'),
      type: 'boolean',
    })
    .option('ezmesure', {
      describe: i18n.t('institutions.add.options.ezmesure'),
      type: 'boolean',
    })
    .option('reporting', {
      describe: i18n.t('institutions.add.options.reporting'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    name, ezpaarse, ezmesure, reporting,
  } = argv;

  let { index, space } = argv;

  const schema = Joi.object({
    name: Joi.string().trim().required(),
    index: Joi.string().trim().required(),
    space: Joi.string().trim().required(),
    ezpaarse: Joi.boolean().allow(null),
    ezmesure: Joi.boolean().allow(null),
    reporting: Joi.boolean().allow(null),
  });

  const { error } = schema.validate({
    name, index, space, ezpaarse, ezmesure, reporting,
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  index = index.toLowerCase();
  space = space.toLowerCase();

  let institution;
  try {
    const { data } = await institutions.findAll();
    institution = data
      .filter((el) => el.name === name)
      .pop();
  } catch (err) {
    if (err?.response?.data) {
      console.error(`[${i18n.t('institutions.add.getInstitutions')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      process.exit(1);
    }
    console.error(`[${i18n.t('institutions.add.getInstitutions')}]`, err);
    process.exit(1);
  }

  if (!institution) {
    try {
      const { data } = await institutions.create({
        name,
        indexPrefix: index,
        space,
        role: space,
        auto: {
          ezpaarse,
          ezmesure,
          report: reporting,
        },
      }, false);
      institution = data;
      console.log(i18n.t('institutions.add.institutionCreated', { name }));
    } catch (err) {
      console.error(`[${i18n.t('institutions.add.createInstitution')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      process.exit(1);
    }
  }

  try {
    await institutions.validate(institution.id, true);
    console.log(i18n.t('institutions.add.institutionValidated', { name }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.validate')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
  }

  try {
    await spaces.create({
      id: space,
      name: space,
    });
    console.log(i18n.t('institutions.add.spaceCreated', { space }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.createSpace')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
  }

  try {
    await indices.create(index);
    console.log(i18n.t('institutions.add.indexCreated', { index }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.createIndex')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
  }

  try {
    await spaces.addIndexPatterns(space, {
      title: `${index}*`,
    });
    console.log(i18n.t('institutions.add.indexPatternCreated', { indexPattern: index }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.createIndexPattern')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
  }

  // Create all privileges role
  try {
    await roles.createOrUpdate(space, {
      elasticsearch: {
        indices: [
          {
            names: [`${index}*`],
            privileges: ['all'],
          },
        ],
      },
      kibana: [
        {
          spaces: [space],
          base: ['all'],
        },
      ],
    });
    console.log(i18n.t('institutions.add.roleCreated', { roleName: space }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.createRole')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
  }

  // Create read_only privileges role
  try {
    await roles.createOrUpdate(`${space}_read_only`, {
      elasticsearch: {
        indices: [
          {
            names: [`${space}*`],
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
    console.log(i18n.t('institutions.add.roleCreated', { roleName: `${space}_read_only` }));
  } catch (err) {
    console.log(err);
    console.error(`[${i18n.t('institutions.add.createRole')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
  }
};
