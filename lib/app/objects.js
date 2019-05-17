const config = require('config');
const { table } = require('table');
const logger = require('../logger');
const instance = require('../api');

module.exports = {
  findObjects: async (type, opts) => {
    // curl -X GET 'http://localhost:5601/api/saved_objects/_find' -H 'kbn-xsrf: true'

    let response;
    const url = (opts && opts.space) ? `${config.kibanaUrl}/s/${opts.space}/api/saved_objects/_find` : `${config.kibanaUrl}/api/saved_objects/_find`;
    try {
      response = await instance.get(url, {
        params: {
          type,
          search_fields: (opts && opts.title) ? 'title' : null,
          search: opts.title || null,
        },
      });
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }

    if (response && response.data) {
      if (opts && opts.json) {
        return console.log(JSON.stringify(response.data.saved_objects, null, 2));
      }

      const result = [
        ['ID', 'Title', 'Description'],
      ];
      response.data.saved_objects.forEach((object) => {
        result.push([object.id, object.attributes.title, object.attributes.description]);
      });

      return console.log(table(result));
    }

    return logger.error('No objects found');
  },
};
