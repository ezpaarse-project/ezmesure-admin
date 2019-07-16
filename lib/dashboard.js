const config = require('config');
const instance = require('./app/api');

const dashboard = {};

dashboard.export = (dashboardId, opts) => {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'

  const url = (opts && opts.space) ? `${config.kibanaUrl}/s/${opts.space}/api/kibana/dashboards/export` : `${config.kibanaUrl}/api/kibana/dashboards/export`;
  return instance.get(url, {
    params: {
      dashboard: dashboardId,
    },
  });
};

dashboard.import = (space, exportedDashboard) => instance.post(`${config.kibanaUrl}/s/${space}/api/kibana/dashboards/import`, exportedDashboard);

module.exports = dashboard;
