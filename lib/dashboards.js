const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: (space) => ezmesure.get(`/dashboards?space=${space}`),
  copy: ({ source, target, force = false }) => ezmesure.post('/dashboards/_copy', {
    source, target,
  }, {
    params: {
      force,
    },
  }),
  export: ({ space, dashboard }) => ezmesure.get('/dashboards/_export', {
    params: {
      space,
      dashboard,
    },
  }),
  import: ({
    space, dashboard, indexPattern, force = false,
  }) => ezmesure.post('/dashboards/_import', dashboard, {
    params: {
      space,
      'index-pattern': indexPattern,
      force,
    },
  }),
};
