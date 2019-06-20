const config = require('config');
const instance = require('./app/api');

module.exports = {
  findObjects: async (type, space, title) => {
    // curl -X GET 'http://localhost:5601/api/saved_objects/_find' -H 'kbn-xsrf: true'

    const url = (space) ? `${config.kibanaUrl}/s/${space}/api/saved_objects/_find` : `${config.kibanaUrl}/api/saved_objects/_find`;
    return instance.get(url, {
      params: {
        type,
        search_fields: (title) ? 'title' : null,
        search: title || null,
      },
    });
  },
};
