const { i18n } = global;

const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const institutionsLib = require('../../../lib/institutions');
const spaces = require('../../../lib/spaces');
const roles = require('../../../lib/roles');
const it = require('./interactive/export');

exports.command = 'export [output]';
exports.desc = i18n.t('institutions.export.description');
exports.builder = function builder(yargs) {
  return yargs.positional('output', {
    describe: i18n.t('institutions.export.options.output'),
    type: 'string',
  }).option('a', {
    alias: 'all',
    describe: i18n.t('institutions.export.options.all'),
  });
};
exports.handler = async function handler(argv) {
  const { output, all } = argv;

  let institutions;
  try {
    const { data } = await institutionsLib.findAll();
    institutions = data.map((institution) => ({ institution }));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!all) {
    try {
      institutions = await it(institutions);
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
    try {
      const { data } = await spaces.findById(institution.space);
      delete data.disabledFeatures;
      institutions[i].space = data;
    } catch (error) {
      console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'space' }));
    }

    // Get index-pattern informations
    try {
      const { data } = await spaces.getIndexPatterns(institution.space);
      institutions[i].indexPattern = data.map(({ attributes }) => attributes);
    } catch (error) {
      console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'index-pattern' }));
    }

    // Get roles informations
    institutions[i].roles = [];
    try {
      const { data } = await roles.findByName(institution.role);
      const role = {
        elasticsearch: {
          indices: data.elasticsearch.indices
            .map(({ names, privileges }) => ({ names, privileges })),
        },
        kibana: data.kibana
          .map((kbn) => ({ base: kbn.base, spaces: kbn.spaces })),
      };
      institutions[i].roles.push(role);
    } catch (error) {
      console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'roles (all)' }));
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
      institutions[i].roles.push(role);
    } catch (error) {
      console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'roles (read only)' }));
    }

    // Get SUSHI informations
    try {
      const { data } = await institutionsLib.getSushi(institution.id);
      institutions[i].sushi = data.map(({ attributes }) => attributes);
    } catch (error) {
      console.error(i18n.t('institutions.export.cannotGetField', { institutionName: institution.name, field: 'sushi' }));
    }

    delete institution.id;

    if (output) {
      const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
      const fileName = `export_${institutions[i].institution.name.toLowerCase()}_${currentDate}`;
      try {
        await fs.writeJson(path.resolve(output, `${fileName}.json`), institutions[i], { spaces: 2 });
        console.log(i18n.t('institutions.export.exported', { name: institutions[i].institution.name.toLowerCase() }));
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (!output) {
    console.log(institutions);
  }
};
