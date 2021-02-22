const instance = require('./app/kibana');

const dashboard = {};

dashboard.export = (dashboardId, opts) => {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'

  const url = (opts && opts.space) ? `/s/${opts.space}/api/kibana/dashboards/export` : '/api/kibana/dashboards/export';
  return instance.get(url, {
    params: {
      dashboard: dashboardId,
    },
  });
};

dashboard.import = (space, exportedDashboard) => instance.post(`/s/${space}/api/kibana/dashboards/import`, exportedDashboard);

module.exports = dashboard;
