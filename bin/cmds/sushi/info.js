const get = require('lodash.get');
const path = require('path');
const fs = require('fs-extra');
const Papa = require('papaparse');
const { format } = require('date-fns');
const { getAll, getInstitution } = require('../../../lib/institutions');
const { getSushi, sushiTest } = require('../../../lib/sushi');

exports.command = 'info [institution]';
exports.desc = 'Get SUSHI informations';
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: 'Institution name, case sensitive',
    type: 'string',
  }).option('token', {
    describe: 'ezMESURE token',
  }).option('e', {
    alias: 'export',
    describe: 'Export format (json, csv)',
  }).option('o', {
    alias: 'output',
    describe: 'Output path',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  const exportFormat = argv.export ? argv.export.toLowerCase() : 'json';

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  let institutions;

  if (argv.institution) {
    let institution;
    try {
      const { body } = await getInstitution(argv.institution);
      if (body) { institution = get(body, 'hits.hits[0]'); }
    } catch (error) {
      console.error(error);
    }

    if (!institution) {
      console.log(`Institution [${argv.institution}] not found`);
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
      const { data } = await getAll(options);
      if (data) { institutionsData = data; }
    } catch (error) {
      console.error(error);
    }

    if (!institutionsData) {
      console.log('No institutions found');
      process.exit(0);
    }

    institutions = institutionsData.map(({ id, name }) => ({ id, name }));
  }

  const report = [];

  for (let i = 0; i < institutions.length; i += 1) {
    try {
      const { id, name } = institutions[i];
      const { data } = await getSushi(id);

      const success = [];
      const failed = [];

      for (let j = 0; j < data.length; j += 1) {
        try {
          const res = await sushiTest(data[j], options);
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
    const fields = ['Institution', 'Package', 'Vendor', 'Status', 'Message', 'Took (ms)', 'Endpoint', 'Reports'];
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
