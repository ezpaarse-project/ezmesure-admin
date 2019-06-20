const { table } = require('table');
const logger = require('../../lib/app/logger');
const objectsLib = require('../../lib/objects');

module.exports = {
  findObjects: async (type, space, title, opts) => {
    // curl -X GET 'http://localhost:5601/api/saved_objects/_find' -H 'kbn-xsrf: true'

    try {
      const { data: response } = await objectsLib.findObjects(type, space, title, opts);

      if (response) {
        if (opts && opts.json) {
          return console.log(JSON.stringify(response.saved_objects, null, 2));
        }

        const result = [
          ['ID', 'Title', 'Description'],
        ];
        response.saved_objects.forEach((object) => {
          result.push([object.id, object.attributes.title, object.attributes.description]);
        });

        return console.log(table(result));
      }

      return logger.error('No objects found');
    } catch (error) {
      console.error(error);
      logger.error(error);
      return process.exit(1);
    }
  },
};
