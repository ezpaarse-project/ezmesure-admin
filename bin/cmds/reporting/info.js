const { i18n } = global;

const get = require('lodash.get');
const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const reportingLib = require('../../../lib/reporting');
const dashboardLib = require('../../../lib/dashboard');

exports.command = 'info';
exports.desc = i18n.t('reporting.info');
exports.builder = function builder(yargs) {
  return yargs.option('s', {
    alias: 'status',
    describe: i18n.t('reporting.info.options.status'),
    type: 'array',
  }).option('o', {
    alias: 'output',
    describe: i18n.t('reporting.info.options.output'),
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

  for (let i = 0; i < reporting.length; i += 1) {
    let dashboard;
    try {
      const { body } = await dashboardLib.findById(reporting[i].space, reporting[i].dashboardId);
      if (body) { dashboard = body.dashboard.title; }
    } catch (error) {
      console.error(error);
    }

    if (!dashboard) {
      console.log(i18n.t('reporting.info.dashboardNotFound', { reportingId: reporting[i].id }));
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
          .sort((a, b) => a.startTime - b.startTime)
          .pop(),
      };
    }
  }

  let report = [];

  if (argv.status) {
    report = [];
    for (let i = 0; i < reporting.length; i += 1) {
      const lastHistory = reporting[i].history;
      if (lastHistory?.status && argv.status.includes(lastHistory?.status)) {
        report.push(reporting);
      }
    }
  }

  const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
  const fileName = `reporting_info_${currentDate}`;

  if (!argv.output) {
    console.log(JSON.stringify(report, null, 2));
  }

  if (argv.output) {
    try {
      await fs.writeJson(path.resolve(argv.output, `${fileName}.json`), report, { spaces: 2 });
      console.log(i18n.t('reporting.info.exported', { dest: path.resolve(argv.output, `${fileName}.json`) }));
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
};
