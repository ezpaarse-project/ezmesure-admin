const { table } = require('table');
const chalk = require('chalk');
const config = require('config');
const logger = require('../../lib/app/logger');
const spacesLib = require('../../lib/spaces');
const dashboardLib = require('../../lib/dashboard');

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
          const color = el.color ? chalk.bgHex(el.color).bold(` ${el.color} `) : '';
          arr = arr.concat([el.initials, color]);
        }
        return arr;
      });
      console.log(table([header, ...lines]));
    }
    return data;
  },

  addSpaces: async (space, opts) => {
    try {
      let template = config.defaultTemplate || 'homepage';

      if (opts && opts.template) {
        // eslint-disable-next-line prefer-destructuring
        template = opts.template;
      }

      const defaultSpace = spacesLib.buildSpace(space, opts);

      const response = await spacesLib.addSpaces(defaultSpace);
      if (response.status === 200) {
        logger.info(`Space ${space} created`);
      }

      const { data: exportedDashboard } = await dashboardLib.export(template,
        config.templateSpace ? { space: config.templateSpace } : null);

      if (exportedDashboard && exportedDashboard.objects) {
        exportedDashboard.objects[exportedDashboard.objects.length - 2].attributes.title = space;

        const objects = await dashboardLib.import(space, exportedDashboard);
        if (objects.status !== 200) {
          return logger.error(`Problem with import in ${space}`);
        }
        return logger.info('Dashboard imported');
      }
    } catch (error) {
      logger.error(error.response.data.message);
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
      return process.exit(1);
    }
    return null;
  },
};
