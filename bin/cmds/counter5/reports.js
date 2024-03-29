const { i18n } = global;

const Papa = require('papaparse');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const institutionsLib = require('../../../lib/institutions');
const { sushiTest } = require('../../../lib/sushi');

exports.command = 'reports check [institutions...]';
exports.desc = i18n.t('counter5.report.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('counter5.report.options.institutions'),
    type: 'array',
  })
    .option('o', {
      alias: 'output',
      describe: i18n.t('counter5.report.options.output'),
      type: 'string',
    })
    .option('a', {
      alias: 'all',
      describe: i18n.t('counter5.report.options.all'),
      type: 'boolean',
    })
    .option('m', {
      alias: 'merge',
      describe: i18n.t('counter5.report.options.merge'),
      type: 'boolean',
    });
};

async function generateCSV(opts) {
  const header = [
    'Vendor / Reports',
    opts.counterReportsAvailable.length,
    ...opts.counterReportsAvailable,
  ];

  // eslint-disable-next-line no-loop-func
  const data = Object.keys(opts.rows).map((k) => ([
    opts.rows[k].vendor,
    opts.rows[k].reportsAvailable,
    ...opts.rows[k].reports,
  ]));

  data.push([
    Object.keys(opts.rows).length,
    opts.totalReports,
    ...opts.totalReportsCount,
  ]);

  const csv = Papa.unparse({ fields: header, data });

  if (!opts.output) {
    console.log(csv);
  }

  if (opts.output) {
    try {
      const fileName = `sushi_counter5_${opts.name}_reports_check.csv`;
      await fs.writeFile(path.resolve(opts.output, fileName), csv);
      console.log(i18n.t('counter5.report.exported', { dest: path.resolve(opts.output, fileName) }));
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
}

exports.handler = async function handler(argv) {
  let institutions;

  try {
    const { data } = await institutionsLib.getAll();
    institutions = data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!institutions) {
    console.error(i18n.t('counter5.report.institutionsNotFound'));
  }

  if (argv.institutions.length && !argv.all) {
    institutions = institutions
      .filter((institution) => argv.institutions.includes(institution.name));

    if (!institutions.length) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: argv.institutions.join(', ') }));
      process.exit(0);
    }
  }

  if (!argv.institutions.length && !argv.all) {
    const { institutionsSelected } = await inquirer.prompt([
      {
        type: 'checkbox-plus',
        name: 'institutionsSelected',
        pageSize: 20,
        searchable: true,
        highlight: true,
        message: i18n.t('institutions.institutionsCheckbox'),
        source: (answersSoFar, input) => new Promise((resolve) => {
          const result = institutions
            .map((institution) => ({ name: institution.name, value: institution }))
            .filter((institution) => institution.name.toLowerCase().includes(input.toLowerCase()));

          resolve(result);
        }),
      },
    ]);

    institutions = institutionsSelected;
  }

  if (!institutions.length) {
    console.error(i18n.t('institutions.institutionsNotFound'));
  }

  const counterReportsAvailable = [
    'CR_IR', 'CR_IR_A1', 'CR_IR_M1',
    'CR_PR', 'CR_PR_P1', 'CR_TR',
    'CR_TR_B1', 'CR_TR_B2', 'CR_TR_B3',
    'CR_TR_J1', 'CR_TR_J2', 'CR_TR_J3',
    'CR_TR_J4', 'DR', 'DR_D1',
    'DR_D2', 'IR', 'IR_A1',
    'IR_M1', 'PR', 'PR_P1',
    'TR', 'TR_B1', 'TR_B2',
    'TR_B3', 'TR_J1', 'TR_J2',
    'TR_J3', 'TR_J4', 'TR_SJ1',
    'TR_SJ2', 'TR_SJ3', 'TR_SJ4',
    'TR_SJ5', 'TR_SJ6',
  ];

  let rows = [];
  let totalReports = 0;
  let totalReportsCount = Array(counterReportsAvailable.length).fill(0);

  for (let i = 0; i < institutions.length; i += 1) {
    let credentials;
    try {
      const { data } = await institutionsLib.getSushi(institutions[i].id);
      if (data) { credentials = data; }
    } catch (err) {
      console.error(`institution [${institutions[i].name}] no sushi found`);
    }

    for (let j = 0; j < credentials.length; j += 1) {
      let sushi;
      const reports = Array(counterReportsAvailable.length).fill(0);
      try {
        sushi = await sushiTest(credentials[j]);
      } catch (err) {
        rows.push([credentials[j].vendor, 0, ...reports]);
      }

      if (sushi && sushi.reports) {
        sushi.reports = sushi.reports.sort((a, b) => a.localeCompare(b));

        let reportsAvailable = 0;
        for (let k = 0; k < sushi.reports.length; k += 1) {
          const index = counterReportsAvailable.indexOf(sushi.reports[k]);
          if (index !== -1) {
            reports[index] = 1;
            reportsAvailable += 1;
            if (rows[credentials[j].vendor]) {
              totalReportsCount[index] += 1;
            }
          }
        }

        if (!rows[credentials[j].vendor]) {
          totalReports += reportsAvailable;
          rows[credentials[j].vendor] = {
            vendor: credentials[j].vendor,
            reportsAvailable,
            reports,
          };
        }
      }
    }

    if (!Object.keys(rows).length) {
      console.log(i18n.t('counter5.report.noSushiReports', { name: institutions[i].name }));
    }

    if (!argv.merge) {
      if (Object.keys(rows).length) {
        try {
          await generateCSV({
            counterReportsAvailable,
            rows,
            totalReports,
            totalReportsCount,
            output: argv.output,
            name: institutions[i].name,
          });
        } catch (error) {
          console.log(error);
        }

        if (!argv.merge) {
          rows = [];
          totalReports = 0;
          totalReportsCount = Array(counterReportsAvailable.length).fill(0);
        }
      }
    }
  }

  if (argv.merge) {
    try {
      await generateCSV({
        counterReportsAvailable,
        rows,
        totalReports,
        totalReportsCount,
        output: argv.output,
        name: 'counter5_sushi_reports_merge',
      });
    } catch (error) {
      console.log(error);
    }
  }
};
