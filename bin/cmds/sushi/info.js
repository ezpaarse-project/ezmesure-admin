const { i18n } = global;

const path = require('path');
const fs = require('fs-extra');
const Papa = require('papaparse');
const { format } = require('date-fns');
const institutionsLib = require('../../../lib/institutions');
const { sushiTest } = require('../../../lib/sushi');
const itMode = require('./interactive/info');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'info [institutions...]';
exports.desc = i18n.t('sushi.info.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('sushi.info.options.institutions'),
    type: 'array',
  })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('sushi.info.options.ndjson'),
      type: 'boolean',
    })
    .option('c', {
      alias: 'csv',
      describe: i18n.t('sushi.info.options.csv'),
      type: 'boolean',
    })
    .option('o', {
      alias: 'output',
      describe: i18n.t('sushi.info.options.output'),
    })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('sushi.info.options.interactive'),
      type: 'boolean',
    })
    .option('a', {
      alias: 'all',
      describe: i18n.t('sushi.info.options.all'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    verbose, interactive, ndjson, csv,
  } = argv;

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    if (data) { institutions = data; }
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (!institutions) {
    console.log(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  if (argv?.institutions?.length) {
    institutions = institutions
      .filter(({ id, name }) => argv.institutions.includes(name) || argv.institutions.includes(id));
  }

  if (!argv?.institutions?.length && interactive) {
    const { institutionsSelected } = await itMode.selectInstitutions(institutions);

    institutions = institutions.filter(({ id }) => institutionsSelected.includes(id));
  }

  let report = [];

  for (let i = 0; i < institutions.length; i += 1) {
    try {
      const { id, name } = institutions[i];

      if (verbose) {
        console.log(`* Retrieving SUSHI information for institution [${name}] from ${config.ezmesure.baseUrl}`);
      }

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
      console.error(formatApiError(err));
    }
  }

  if (!argv.all) {
    report = report.filter((x) => x.credentials > 0);
  }

  const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
  const fileName = `sushi_info_${currentDate}`;

  if (ndjson) {
    if (!argv.output) {
      if (verbose) {
        console.log('* Export in ndjson format');
      }
      report.forEach((r) => console.log(JSON.stringify(r)));
      process.exit(0);
    }

    const filePath = path.resolve(argv.output, `${fileName}.ndjson`);
    if (verbose) {
      console.log(`* Export ndjson file [${filePath}]`);
    }
    report.forEach((r) => fs.appendFileSync(filePath, `${JSON.stringify(r)}\r\n`));
    console.log(`File saved in ndjson : ${filePath}`);
    process.exit(0);
  }

  if (csv) {
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
    const parsedCSV = Papa.unparse({ fields, data });

    if (!argv.output) {
      if (verbose) {
        console.log('* Export in CSV format');
      }
      console.log(parsedCSV);
      process.exit(0);
    }

    try {
      const csvPath = path.resolve(argv.output, `${fileName}.csv`);
      if (verbose) {
        console.log(`* Export CSV file [${csvPath}]`);
      }
      await fs.writeFile(csvPath, parsedCSV);

      console.log(`File saved CSV ndjson : ${csvPath}`);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
    process.exit(0);
  }

  if (!argv.output) {
    if (verbose) {
      console.log('* Export in json format');
    }
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  const filePath = path.resolve(argv.output, `${fileName}.json`);
  try {
    if (verbose) {
      console.log(`* Export JSON file [${filePath}]`);
    }
    await fs.writeJson(filePath, report, { spaces: 2 });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  console.log(`File saved in json : ${filePath}`);

  process.exit(0);
};
