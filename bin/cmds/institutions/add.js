const { i18n } = global;

const Joi = require('joi');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const kibana = require('../../../lib/kibana');
const indices = require('../../../lib/indices');
const institutions = require('../../../lib/institutions');
const roles = require('../../../lib/roles');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

const ezpaarseLogoPath = path.resolve(__dirname, '../../../assets/ezpaarse.png');
const counterLogoPath = path.resolve(__dirname, '../../../assets/counter.png');

function frenchDate(name) {
  return {
    name,
    format: {
      id: 'date',
      params: {
        pattern: 'DD-MM-yyyy',
      },
    },
  };
}

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
    .option('r', {
      alias: 'role',
      describe: i18n.t('institutions.add.options.role'),
      type: 'string',
    })
    .option('s', {
      alias: 'space',
      describe: i18n.t('institutions.add.options.space'),
      type: 'string',
    })
    .option('ezpaarse-space', {
      describe: i18n.t('institutions.add.options.ezpaarseSpace'),
      type: 'boolean',
    })
    .option('publisher-space', {
      describe: i18n.t('institutions.add.options.publisherSpace'),
      type: 'boolean',
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
    name,
    ezpaarse,
    ezmesure,
    reporting,
    verbose,
    ezpaarseSpace,
    publisherSpace,
  } = argv;

  let { index, space, role } = argv;

  if (verbose) {
    console.log(`* Validating fields that describe institution [${name}]`);
  }

  const schema = Joi.object({
    name: Joi.string().trim().required(),
    index: Joi.string().trim().required(),
    space: Joi.string().trim(),
    role: Joi.string().trim(),
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
  space = (space || index).toLowerCase();
  role = (role || index).toLowerCase();

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institution;
  try {
    const { data } = await institutions.getAll();
    institution = data.find((el) => el.name === name);
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.getInstitutions')}] ${formatApiError(err)}`);
    process.exit(1);
  }

  if (!institution) {
    if (verbose) {
      console.log(`* Create institution [${name}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await institutions.create({
        name,
        indexPrefix: index,
        space,
        role,
        auto: {
          ezpaarse,
          ezmesure,
          report: reporting,
        },
      }, false);
      institution = data;
      console.log(i18n.t('institutions.add.institutionCreated', { name }));
    } catch (err) {
      console.error(`[${i18n.t('institutions.add.createInstitution')}] ${formatApiError(err)}`);
      process.exit(1);
    }
  }

  let institutionName = institution.name;

  if (institution.acronym) {
    institutionName += ` (${institution.acronym})`;
  }

  try {
    if (verbose) {
      console.log(`* Validate institution [${name}] from ${config.ezmesure.baseUrl}`);
    }

    await institutions.validate(institution.id, true);
    console.log(i18n.t('institutions.add.institutionValidated', { name }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.validate')}] ${formatApiError(err)}`);
  }

  if (ezpaarseSpace) {
    const ezpaarseIndex = `${index}-ezpaarse`;
    const indexPattern = `${ezpaarseIndex}*`;

    try {
      if (verbose) {
        console.log(`* Create space [${space}] from ${config.ezmesure.baseUrl}`);
      }

      const logo = await fs.readFile(ezpaarseLogoPath, { encoding: 'base64' });

      await kibana.spaces.create({
        body: {
          id: space,
          name: `${institutionName} *ezpaarse*`,
          description: `Espace ezPAARSE (id: ${space})`,
          imageUrl: `data:image/png;base64,${logo}`,
        },
      });
      console.log(i18n.t('institutions.add.spaceCreated', { space }));
    } catch (err) {
      const errorMsg = formatApiError(err, {
        prefix: (err?.response?.status !== 409) || chalk.yellow('Warning: '),
      });
      console.error(`[${i18n.t('institutions.add.createSpace')}] ${errorMsg}`);
    }

    try {
      if (verbose) {
        console.log(`* Create index [${ezpaarseIndex}] from ${config.ezmesure.baseUrl}`);
      }

      await indices.create(ezpaarseIndex);
      console.log(i18n.t('institutions.add.indexCreated', { index: ezpaarseIndex }));
    } catch (err) {
      const errorMsg = formatApiError(err, {
        prefix: (err?.response?.status !== 409) || chalk.yellow('Warning: '),
      });
      console.error(`[${i18n.t('institutions.add.createIndex')}] ${errorMsg}`);
    }

    try {
      if (verbose) {
        console.log(`* Create index-pattern [${ezpaarseIndex}*] from ${config.ezmesure.baseUrl}`);
      }

      const { data: createdPattern } = await kibana.indexPatterns.create({
        space,
        body: {
          override: true,
          index_pattern: {
            title: indexPattern,
            timeFieldName: 'datetime',
            fields: {
              datetime: frenchDate('datetime'),
            },
          },
        },
      });

      const patternId = createdPattern?.index_pattern?.id;
      console.log(i18n.t('institutions.add.indexPatternCreated', { indexPattern }));

      if (verbose) { console.log(`* Setting index pattern [${patternId}] as default in space [${space}]`); }

      await kibana.indexPatterns.setDefault({
        space,
        body: {
          index_pattern_id: patternId,
          force: true,
        },
      });

      console.log(i18n.t('institutions.add.indexPatternSetAsDefault', { indexPattern }));
    } catch (err) {
      console.error(`[${i18n.t('institutions.add.createIndexPattern')}] ${formatApiError(err)}`);
    }
  }

  if (publisherSpace) {
    const publisherSpaceName = `${space}-publisher`;
    const publisherIndex = `${index}-publisher`;
    const indexPattern = `${publisherIndex}*`;

    try {
      if (verbose) {
        console.log(`* Create institution [${name}] space [${publisherSpaceName}] from ${config.ezmesure.baseUrl}`);
      }

      const logo = await fs.readFile(counterLogoPath, { encoding: 'base64' });

      await kibana.spaces.create({
        body: {
          id: publisherSpaceName,
          name: `${institutionName} *éditeur*`,
          description: `Espace éditeurs (id: ${publisherSpaceName})`,
          imageUrl: `data:image/png;base64,${logo}`,
        },
      });
      console.log(i18n.t('institutions.add.spaceCreated', { space: publisherSpaceName }));
    } catch (err) {
      const errorMsg = formatApiError(err, {
        prefix: (err?.response?.status !== 409) || chalk.yellow('Warning: '),
      });
      console.error(`[${i18n.t('institutions.add.createSpace')}] ${errorMsg}`);
    }

    try {
      if (verbose) {
        console.log(`* Create institution [${name}] index [${publisherIndex}] from ${config.ezmesure.baseUrl}`);
      }

      await indices.create(publisherIndex, { type: 'publisher' });
      console.log(i18n.t('institutions.add.indexCreated', { index: publisherIndex }));
    } catch (err) {
      const errorMsg = formatApiError(err, {
        prefix: (err?.response?.status !== 409) || chalk.yellow('Warning: '),
      });
      console.error(`[${i18n.t('institutions.add.createIndex')}] ${errorMsg}`);
    }

    try {
      if (verbose) {
        console.log(`* Create institution [${name}] index-pattern [${publisherIndex}*] from ${config.ezmesure.baseUrl}`);
      }

      const { data: createdPattern } = await kibana.indexPatterns.create({
        space: publisherSpaceName,
        body: {
          override: true,
          index_pattern: {
            title: indexPattern,
            timeFieldName: 'X_Date_Month',
            fields: {
              X_Date_Month: frenchDate('X_Date_Month'),
            },
          },
        },
      });

      const patternId = createdPattern?.index_pattern?.id;
      console.log(i18n.t('institutions.add.indexPatternCreated', { indexPattern }));

      if (verbose) { console.log(`* Setting index pattern [${patternId}] as default in space [${space}]`); }

      await kibana.indexPatterns.setDefault({
        space: publisherSpaceName,
        body: {
          index_pattern_id: patternId,
          force: true,
        },
      });

      console.log(i18n.t('institutions.add.indexPatternSetAsDefault', { indexPattern }));
    } catch (err) {
      console.error(`[${i18n.t('institutions.add.createIndexPattern')}] ${formatApiError(err)}`);
    }
  }

  // Create all privileges role
  if (verbose) {
    console.log(`* Create institution [${name}] role [${role}] from ${config.ezmesure.baseUrl}`);
  }

  const createdSpaces = [];
  if (ezpaarseSpace) { createdSpaces.push(space); }
  if (publisherSpace) { createdSpaces.push(`${space}-publisher`); }

  try {
    await roles.createOrUpdate(role, {
      elasticsearch: {
        indices: [{ names: [`${index}*`], privileges: ['all'] }],
      },
      kibana: createdSpaces.length > 0 ? [{
        spaces: createdSpaces,
        feature: {
          dashboard: ['all'],
          discover: ['all'],
          visualize: ['all'],
          maps: ['all'],
          indexPatterns: ['all'],
        },
      }] : undefined,
    });
    console.log(i18n.t('institutions.add.roleCreated', { roleName: role }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.createRole')}] ${formatApiError(err)}`);
  }

  // Create read_only privileges role
  if (verbose) {
    console.log(`* Create institution [${name}] role [${role}_read_only] from ${config.ezmesure.baseUrl}`);
  }

  try {
    await roles.createOrUpdate(`${role}_read_only`, {
      elasticsearch: {
        indices: [{ names: [`${index}*`], privileges: ['read'] }],
      },
      kibana: createdSpaces.length > 0 ? [{
        spaces: createdSpaces,
        feature: {
          dashboard: ['read'],
          discover: ['read'],
          visualize: ['read'],
          maps: ['read'],
        },
      }] : undefined,
    });
    console.log(i18n.t('institutions.add.roleCreated', { roleName: `${role}_read_only` }));
  } catch (err) {
    console.error(`[${i18n.t('institutions.add.createRole')}] ${formatApiError(err)}`);
  }
};
