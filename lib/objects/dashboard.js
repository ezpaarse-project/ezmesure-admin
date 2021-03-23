const client = require('../app/elastic');
const instance = require('../app/kibana');

const dashboard = {};

dashboard.exportOne = (dashboardId, space) => {
  const url = `${space ? `/s/${space}` : ''}/api/kibana/dashboards/export`;
  return instance.get(url, {
    params: {
      dashboard: dashboardId,
    },
  });
};

dashboard.importOne = (space, exportedDashboard, overwrite) => instance.post(`/s/${space}/api/kibana/dashboards/import${overwrite ? '?force=true' : ''}`, exportedDashboard);

dashboard.findById = (space, dashboardId) => client.getSource({
  index: '.kibana',
  id: `${space ? `${space}:` : ''}dashboard:${dashboardId}`,
});

dashboard.findBySpace = (space) => {
  const body = {
    query: {
      bool: {
        filter: [{
          term: {
            type: 'dashboard',
          },
        }],
      },
    },
  };

  const must = [
    {
      match: {
        namespace: space,
      },
    },
  ];

  if (space && space !== 'default') {
    body.query.bool.must = must;
  }

  return client.search({
    index: '.kibana',
    size: 10000,
    body,
  });
};

module.exports = dashboard;
