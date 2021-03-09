const client = require('./app/elastic');
const instance = require('./app/kibana');
const { config } = require('./app/config');

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

dashboard.getById = (space, dashboardId) => client.getSource({
  index: '.kibana',
  id: `${space ? `${space}:` : ''}dashboard:${dashboardId}`,
});

module.exports = dashboard;
