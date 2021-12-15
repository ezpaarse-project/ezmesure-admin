const { i18n } = global;

const get = require('lodash.get');
const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const reportingLib = require('../../../lib/reporting');
const dashboardLib = require('../../../lib/dashboards');
const { config } = require('../../../lib/app/config');

exports.command = 'info';
exports.desc = i18n.t('reporting.info.description');
exports.builder = function builder(yargs) {
  return yargs.option('s', {
    alias: 'status',
    describe: i18n.t('reporting.info.options.status'),
    type: 'string',
  }).option('o', {
    alias: 'output',
    describe: i18n.t('reporting.info.options.output'),
  }).option('n', {
    alias: 'ndjson',
    describe: i18n.t('reporting.list.options.ndjson'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  if (verbose) {
    console.log(`* Retrieving reporting tasks from ${config.elastic.baseUrl}`);
  }

  let reporting;
  try {
    const { body } = await reportingLib.getAll();
    if (body) { reporting = get(body, 'hits.hits'); }
  } catch (error) {
    console.error(error);
  }

  if (!reporting) {
    console.log(i18n.t('reporting.noTasksFound'));
    process.exit(0);
  }

  reporting = reporting.map(({ _id, _source }) => ({
    id: _id,
    ..._source,
  }));

  const dashboards = {};
  for (let i = 0; i < reporting.length; i += 1) {
    let dashboard;
    if (!dashboards[reporting[i].space]) {
      if (verbose) {
        console.log(`* Retrieving dashboards from space [${reporting[i].space}] from ${config.ezmesure.baseUrl}`);
      }

      try {
        const { data } = await dashboardLib.getAll(reporting[i].space);
        dashboards[reporting[i].space] = data || [];
      } catch (error) {
        console.error(i18n.t('reporting.cannotGetDashboards', { space: reporting[i].space }));
      }
    }

    if (dashboards[reporting[i]?.space]?.length) {
      const dsh = dashboards[reporting[i].space].find(({ id, type }) => type === 'dashboard' && id === reporting[i].dashboardId);
      dashboard = dsh?.attributes?.title;
    }

    if (verbose) {
      console.log(`* Retrieving reporting history form reporting [${reporting[i].id}] from space [${reporting[i].space}] from ${config.elastic.baseUrl}`);
    }

    let history;
    try {
      const { body } = await reportingLib.findHistoryById(reporting[i].id);
      if (body) { history = get(body, 'hits.hits'); }
    } catch (error) {
      console.error(error);
    }

    if (!history) {
      console.log(i18n.t('reporting.info.noHistoryFor', { reportingId: reporting[i].id }));
    }

    if (history) {
      reporting[i] = {
        ...reporting[i],
        dashboard,
        history: history
          .map(({ _source }) => ({ ..._source }))
          .sort((a, b) => b.startTime - a.startTime)
          .pop(),
      };
    }
  }

  let report = reporting;

  if (argv.status) {
    report = [];
    for (let i = 0; i < reporting.length; i += 1) {
      const lastHistory = reporting[i].history;
      if (lastHistory?.status && argv.status.includes(lastHistory?.status)) {
        report.push(reporting[i]);
      }
    }
  }

  const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
  const fileName = `reporting_info_${currentDate}`;

  if (!argv.output) {
    if (argv.ndjson) {
      if (verbose) {
        console.log('* Display reportings data in ndjson format');
      }

      report.forEach((r) => console.log(JSON.stringify(r)));
      process.exit(0);
    }

    if (verbose) {
      console.log('* Display reportings data in json format');
    }

    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  if (argv.output) {
    const outputPath = path.resolve(argv.output, `${fileName}`);
    if (argv.ndjson) {
      if (verbose) {
        console.log('* Export reportings data in ndjson format');
      }

      try {
        report.forEach((r) => fs.appendFileSync(path.resolve(argv.output, `${fileName}.ndjson`), `${JSON.stringify(r)}\r\n`));
      } catch (error) {
        console.error(error);
        process.exit(1);
      }

      console.log(i18n.t('reporting.info.exported', { dest: path.resolve(argv.output, `${fileName}.njson`) }));
      process.exit(0);
    }

    if (verbose) {
      console.log('* Export reportings data in json format');
    }

    try {
      await fs.writeJson(path.resolve(`${outputPath}.json`), report, { spaces: 2 });
      console.log(i18n.t('reporting.info.exported', { dest: path.resolve(`${outputPath}.json`) }));
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
};
