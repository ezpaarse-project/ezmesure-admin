const { i18n } = global;

const get = require('lodash.get');

const reportingLib = require('../../../lib/reporting');
const dashboardLib = require('../../../lib/dashboards');
const { config } = require('../../../lib/app/config');

exports.command = 'delete [ids...]';
exports.desc = i18n.t('reporting.delete.description');
exports.builder = function builder(yargs) {
  return yargs.positional('ids', {
    describe: i18n.t('reporting.list.options.spaces'),
    type: 'array',
  }).option('no-dashboard', {
    describe: i18n.t('reporting.delete.options.noDashboard'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  const dashboardsId = [
    ...argv.ids,
  ];

  if (verbose) {
    console.log(`* Retrieving reporting tasks from ${config.elastic.baseUrl}`);
  }

  let tasks;
  try {
    const { body } = await reportingLib.findAll();
    if (body) { tasks = get(body, 'hits.hits'); }
  } catch (error) {
    console.log(i18n.t('reporting.noTasksFound'));
    process.exit(0);
  }

  if (!tasks.length) {
    console.log(i18n.t('reporting.noTasksFound'));
    process.exit(0);
  }

  tasks = tasks.map(({ _id, _source }) => ({ id: _id, ..._source }));

  // correspond to --no-dashboard
  if (!argv.dashboard) {
    const dashboards = {};

    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i];
      if (!dashboards[task?.space]) {
        if (verbose) {
          console.log(`* Retrieving dashboards from space [${task?.space}] from ${config.ezmesure.baseUrl}`);
        }

        try {
          const { data } = await dashboardLib.findAll(task?.space);
          dashboards[task?.space] = data || [];
        } catch (error) {
          console.error(i18n.t('reporting.cannotGetDashboards', { space: task?.space }));
        }
      }

      if (dashboards[task?.space] && dashboards[task?.space].length) {
        const dashboard = dashboards[task?.space].find(({ type, id }) => (type === 'dashboard' && id === task.dashboardId));
        if (!dashboard) {
          dashboardsId.push(task.id);
        }
      }
    }
  }

  try {
    if (verbose) {
      console.log(`* Delete dashboards [${dashboardsId.join(',')}] from ${config.ezmesure.baseUrl}`);
    }

    const res = await reportingLib.delete(dashboardsId);
    res?.body?.items?.forEach((result) => {
      if (result?.delete?.status === 200) {
        console.log(i18n.t('reporting.delete.deleted', { taskId: result?.delete?._id }));
      }
      if (result?.delete?.status === 404) {
        console.log(i18n.t('reporting.delete.notFound', { taskId: result?.delete?._id }));
      }
    });
  } catch (error) {
    console.log(`[Error#${error?.response?.status}] ${error?.response?.statusText}`);
    process.exit(1);
  }
};
