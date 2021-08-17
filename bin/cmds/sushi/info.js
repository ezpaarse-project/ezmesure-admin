const { i18n } = global;

const get = require('lodash.get');
const path = require('path');
const fs = require('fs-extra');
const Papa = require('papaparse');
const { format } = require('date-fns');
const institutionsLib = require('../../../lib/institutions');
const { sushiTest } = require('../../../lib/sushi');

exports.command = 'info [institution]';
exports.desc = i18n.t('sushi.info.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: i18n.t('sushi.info.options.institution'),
    type: 'string',
  }).option('e', {
    alias: 'export',
    describe: i18n.t('sushi.info.options.export'),
  }).option('o', {
    alias: 'output',
    describe: i18n.t('sushi.info.options.output'),
  });
};
exports.handler = async function handler(argv) {
  const exportFormat = (argv.export || 'json').toLowerCase();

  let institutions;

  if (argv.institution) {
    let institution;
    try {
      const { body } = await institutionsLib.getOne(argv.institution);
      if (body) { institution = get(body, 'hits.hits[0]'); }
    } catch (error) {
      console.error(error);
    }

    if (!institution) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: argv.institution }));
      process.exit(0);
    }

    institutions = [{
      id: get(institution, '_source.institution.id'),
      name: argv.institution,
    }];
  }

  if (!argv.institution) {
    let institutionsData;
    try {
      const { data } = await institutionsLib.getAll();
      if (data) { institutionsData = data; }
    } catch (error) {
      console.error(error);
    }

    if (!institutionsData) {
      console.log(i18n.t('institutions.institutionsNotFound'));
      process.exit(0);
    }

    institutions = institutionsData.map(({ id, name }) => ({ id, name }));
  }

  const report = [];

  for (let i = 0; i < institutions.length; i += 1) {
    try {
      const { id, name } = institutions[i];
      const { data } = await institutionsLib.getSushi(id);

      const success = [];
      const failed = [];

      for (let j = 0; j < data.length; j += 1) {
        try {
          const res = await sushiTest(data[j]);
          success.push({
            ...res,
            vendor: data[j].vendor,
            package: data[j].package,
            sushiUrl: data[j].sushiUrl,
          });
        } catch (error) {
          failed.push({
            ...JSON.parse(error.message),
            vendor: data[j].vendor,
            package: data[j].package,
            sushiUrl: data[j].sushiUrl,
          });
        }
      }

      report.push({
        id,
        name,
        credentials: data.length,
        success,
        failed,
      });
    } catch (err) {
      console.error(err);
    }
  }

  const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
  const fileName = `sushi_info_${currentDate}`;

  if (exportFormat === 'json') {
    if (!argv.output) {
      console.log(JSON.stringify(report, null, 2));
    }

    if (argv.output) {
      try {
        await fs.writeJson(path.resolve(argv.output, `${fileName}.json`), report, { spaces: 2 });
      } catch (error) {
        console.log(error);
        process.exit(1);
      }
    }
  }

  if (exportFormat === 'csv') {
    const fields = [
      i18n.t('sushi.info.institution'),
      i18n.t('sushi.info.package'),
      i18n.t('sushi.info.vendor'),
      i18n.t('sushi.info.status'),
      i18n.t('sushi.info.message'),
      i18n.t('sushi.info.took'),
      i18n.t('sushi.info.endpoint'),
      i18n.t('sushi.info.reports'),
    ];
    const data = [];
    report.forEach(({
      name, success, failed,
    }) => {
      success.forEach(({
        vendor, package: packageName, status, took, sushiUrl, reports,
      }) => {
        data.push([name, packageName, vendor, status, '-', took, sushiUrl, reports.join(', ')]);
      });
      failed.forEach(({
        vendor, package: packageName, status, error, took, sushiUrl,
      }) => {
        data.push([name, packageName, vendor, status, error, took, sushiUrl, '']);
      });
    });
    const csv = Papa.unparse({ fields, data });

    if (!argv.output) {
      console.log(csv);
    }

    if (argv.output) {
      try {
        await fs.writeFile(path.resolve(argv.output, `${fileName}.csv`), csv);
      } catch (error) {
        console.log(error);
        process.exit(1);
      }
    }
  }
};
