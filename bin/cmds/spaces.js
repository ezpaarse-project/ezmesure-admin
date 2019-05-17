const { table } = require('table');
const logger = require('../../lib/app/logger');
const spacesLib = require('../../lib/spaces');

module.exports = {
  getSpaces: async (space, opts) => {
    let data;
    try {
      const response = await spacesLib.getSpaces(space);
      // eslint-disable-next-line prefer-destructuring
      data = response.data;
    } catch (error) {
      logger.error(error);
      console.error(error);
      process.exit(1);
    }

    if (!data) {
      logger.error('No space(s) found');
      return null;
    }

    if (opts && opts.json) {
      return console.log(JSON.stringify(data, null, 2));
    }

    if (opts && !opts.json) {
      let header = ['ID', 'Name', 'Description'];
      if (opts.all) {
        header = header.concat(['Initials', 'Color']);
      }

      data = Array.isArray(data) ? data : [data];

      const lines = data.map((el) => {
        let arr = [el.id, el.name, el.description];
        if (opts.all) {
          arr = arr.concat([el.initials, el.color]);
        }
        return arr;
      });
      console.log(table([header, ...lines]));
    }
    return data;
  },

  addSpaces: async (space, opts) => {
    try {
      const defaultSpace = spacesLib.buildSpace(space, opts);

      const response = await spacesLib.addSpaces(defaultSpace);
      if (response.status === 200) {
        logger.info(`Space ${space} created`);
      }
    } catch (error) {
      logger.error(error);
      console.log(error);
      return process.exit(1);
    }
    return null;
  },

  delSpaces: async (spaces) => {
    // curl -X DELETE "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'

    try {
      for (let i = 0; i < spaces.length; i += 1) {
        const response = await spacesLib.delSpaces(spaces[i]);

        if (response.status === 204) {
          logger.info(`Space ${spaces[i]} removed`);
        } else {
          logger.warn({ statusText: response.statusText, status: response.status });
        }
      }
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  },
};
