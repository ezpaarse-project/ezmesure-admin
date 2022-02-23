const { i18n } = global;

const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const institutionsLib = require('../../../lib/institutions');
const spaces = require('../../../lib/spaces');
const roles = require('../../../lib/roles');
const { config } = require('../../../lib/app/config');
const itMode = require('./interactive/export');

exports.command = 'export [output]';
exports.desc = i18n.t('institutions.export.description');
exports.builder = function builder(yargs) {
  return yargs.positional('output', {
    describe: i18n.t('institutions.export.options.output'),
    type: 'string',
  }).option('a', {
    alias: 'all',
    describe: i18n.t('institutions.export.options.all'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const { output, all, verbose } = argv;

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    institutions = data.map((institution) => ({ institution }));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!all) {
    try {
      institutions = await itMode(institutions);
    } catch (error) {
      console.error(error);
    }
  }

  if (!institutions.length) {
    console.log(i18n.t('institutions.export.noInstitutionsSelected'));
    process.exit(0);
  }

  for (let i = 0; i < institutions.length; i += 1) {
    const { institution } = institutions[i];

    // Get space informations
    if (verbose) {
      console.log(`* Get space [${institution.space}] informations for institution [${institution.name}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await spaces.findById(institution.space);
      delete data.disabledFeatures;
      institutions[i].space = data;
    } catch (error) {
      institutions[i].space = null;
      if (verbose) {
        console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'space' }));
      }
    }

    // Get index-pattern informations
    if (verbose) {
      console.log(`* Get index-pattern informations for space [${institution.space}] for institution [${institution.name}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await spaces.getIndexPatterns(institution.space);
      institutions[i].indexPattern = data.map(({ attributes }) => attributes);
    } catch (error) {
      institutions[i].indexPattern = null;
      if (verbose) {
        console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'index-pattern' }));
      }
    }

    // Get roles informations
    if (verbose) {
      console.log(`* Get role [${institution.role}] for institution [${institution.name}] from ${config.ezmesure.baseUrl}`);
    }

    institutions[i].roles = [];
    try {
      const { data } = await roles.findByName(institution.role);
      const role = {
        elasticsearch: {
          indices: data.elasticsearch.indices
            .map(({ name, privileges }) => ({ name, privileges })),
        },
        kibana: data.kibana
          .map((kbn) => ({ base: kbn.base, spaces: kbn.spaces })),
      };
      institutions[i].roles.push({
        name: institution.role,
        role,
      });
    } catch (error) {
      if (verbose) {
        console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'roles (all)' }));
      }
    }

    if (verbose) {
      console.log(`* Get role [${institution.role}_read_only] for institution [${institution.name}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await roles.findByName(`${institution.role}_read_only`);
      const role = {
        elasticsearch: {
          indices: data.elasticsearch.indices
            .map(({ names, privileges }) => ({ names, privileges })),
        },
        kibana: data.kibana
          .map((kbn) => ({ base: kbn.base, spaces: kbn.spaces })),
      };
      institutions[i].roles.push({
        name: `${institution.role}_read_only`,
        role,
      });
    } catch (error) {
      if (verbose) {
        console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'roles (read only)' }));
      }
    }

    // Get SUSHI informations
    if (verbose) {
      console.log(`* Get sushi informations for institution [${institution.name}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await institutionsLib.getSushi(institution.id);
      institutions[i].sushi = data;
    } catch (error) {
      institutions[i].sushi = [];
      if (verbose) {
        console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'sushi' }));
      }
    }

    delete institution.id;

    if (output) {
      const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
      const fileName = `export_${institutions[i].institution.name.toLowerCase()}_${currentDate}`;

      if (verbose) {
        console.log(`* Export file [${fileName}]`);
      }

      try {
        await fs.writeJson(path.resolve(output, `${fileName}.json`), institutions[i], { spaces: 2 });
        console.log(i18n.t('institutions.export.exported', { name: institutions[i].institution.name.toLowerCase() }));
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (!output) {
    if (verbose) {
      console.log('* Display institutions data');
    }

    console.log(JSON.stringify(institutions, null, 2));
  }
};
