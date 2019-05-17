const config = require('config');
const { table } = require('table');
const logger = require('../logger');
const instance = require('../api');

module.exports = {
  getSpaces: async (space, opts) => {
    const url = space ? (`${config.kibanaUrl}/api/spaces/space/${space}`) : `${config.kibanaUrl}/api/spaces/space`;

    let data;
    try {
      const response = await instance.get(url);
      // eslint-disable-next-line prefer-destructuring
      data = response.data;
    } catch (error) {
      console.error(error);
      logger.error(error);
      process.exit(1);
    }

    if (!data) {
      logger.error('No space(s) found');
      return null;
    }

    if (opts && opts.json) {
      console.log(JSON.stringify(data, null, 2));
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
    const defaultSpace = {
      id: space,
      name: space,
      description: `This is the space : ${space}`,
    };

    if (opts && opts.desc) {
      defaultSpace.description = opts.desc;
    }
    if (opts && opts.color) {
      if (!/^(#{1}[a-f0-9]{6})$/i.test(opts.color)) {
        logger.error('Invalid color, ex: #aabbcc');
        return null;
      }
      defaultSpace.color = opts.color;
    }
    if (opts && opts.initials) {
      if (!/^([a-z0-9]{0,2})$/i.test(opts.initials)) {
        logger.error('Initials must be have two characters');
        return null;
      }
      defaultSpace.initials = opts.initials;
    }

    let response;
    try {
      response = await instance.post(`${config.kibanaUrl}/api/spaces/space`, defaultSpace);
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }

    if (response.status === 200) {
      logger.info(`Space ${space} created`);
      return response.data;
    }
    logger.error({ statusText: response.statusText, status: response.status });
    return null;
  },

  delSpaces: async (spaces) => {
    // curl -X DELETE "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'

    try {
      for (let i = 0; i < spaces.length; i += 1) {
        const response = await instance.delete(`${config.kibanaUrl}/api/spaces/space/${spaces[i]}`);

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
