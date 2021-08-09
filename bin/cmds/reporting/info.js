const { i18n } = global;

const get = require('lodash.get');
const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const reportingLib = require('../../../lib/reporting');
const dashboardLib = require('../../../lib/dashboards');

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
  let reporting;
  try {
    const { body } = await reportingLib.findAll();
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
      try {
        const { data } = await dashboardLib.findAll(reporting[i].space);
        dashboards[reporting[i].space] = data || [];
      } catch (error) {
        console.error(i18n.t('reporting.list.connotGetDashboards', { space: reporting[i].space }));
      }
    }

    if (dashboards[reporting[i].space] && dashboards[reporting[i].space].length) {
      const dsh = dashboards[reporting[i].space].find(({ type }) => type === 'dashboard');
      dashboard = dsh?.attributes?.title;
    }

    if (!dashboard) {
      console.log(i18n.t('reporting.info.dashboardNotFound', {
        dashboard: reporting[i].dashboardId,
        space: reporting[i].space,
        reportingId: reporting[i].id,
      }));
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

    if (dashboard && history) {
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
      report.forEach((r) => console.log(JSON.stringify(r)));
      process.exit(0);
    }

    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  if (argv.output) {
    const outputPath = path.resolve(argv.output, `${fileName}`);
    if (argv.ndjson) {
      try {
        report.forEach((r) => fs.appendFileSync(path.resolve(argv.output, `${fileName}.njson`), `${JSON.stringify(r)}\r\n`));
      } catch (error) {
        console.error(error);
        process.exit(1);
      }

      console.log(i18n.t('reporting.info.exported', { dest: path.resolve(argv.output, `${fileName}.njson`) }));
      process.exit(0);
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
