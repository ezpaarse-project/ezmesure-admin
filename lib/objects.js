const instance = require('./app/kibana');

module.exports = {
  findObjects: async (type, opts) => {
    // curl -X GET 'http://localhost:5601/api/saved_objects/_find' -H 'kbn-xsrf: true'

    const url = (opts && opts.space) ? `/s/${opts.space}/api/saved_objects/_find` : '/api/saved_objects/_find';
    return instance.get(url, {
      params: {
        type,
        search_fields: (opts && opts.title) ? 'title' : null,
        search: (opts && opts.title) || null,
        per_page: (opts && opts.perPage) || 10000,
      },
    });
  },
};
