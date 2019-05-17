const { table } = require('table');
const logger = require('../../lib/app/logger');
const objectsLib = require('../../lib/objects');

module.exports = {
  findObjects: async (type, opts) => {
    // curl -X GET 'http://localhost:5601/api/saved_objects/_find' -H 'kbn-xsrf: true'

    let response;
    try {
      response = await objectsLib.findObjects(type, opts);
    } catch (error) {
      console.error(error);
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
