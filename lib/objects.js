const config = require('config');
const instance = require('./app/api');

module.exports = {
  findObjects: async (type, opts) => {
    // curl -X GET 'http://localhost:5601/api/saved_objects/_find' -H 'kbn-xsrf: true'

    const url = (opts && opts.space) ? `${config.kibanaUrl}/s/${opts.space}/api/saved_objects/_find` : `${config.kibanaUrl}/api/saved_objects/_find`;
    return instance.get(url, {
      params: {
        type,
        search_fields: (opts && opts.title) ? 'title' : null,
        search: (opts && opts.title) || null,
      },
    });
  },
};
