#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable max-len */


const program = require('commander');
const axios = require('axios');
const config = require('config');
const winston = require('winston');

winston.addColors({
  verbose: 'green',
  info: 'green',
  warn: 'yellow',
  error: 'red',
});
const { format } = winston;
const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf((info) => {
      if (typeof info.message === 'object') {
        // eslint-disable-next-line no-param-reassign
        info.message = JSON.stringify(info.message);
      }
      // return `${info.timestamp} ${info.level}: ${info.message}`;
      return `${info.level}: ${info.message}`;
    }),
  ),
  exitOnError: true,
  transports: [
    new (winston.transports.Console)(),
    new winston.transports.File({ filename: 'log/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'log/combined.log', level: 'info' }),
  ],
});

const instance = axios.create({
  auth: {
    username: config.elasticsearchUser,
    password: config.elasticsearchPassword,
  },
  timeout: config.timeout || 5000,
  headers: { 'kbn-xsrf': 'true' },
  proxy: false,
});

async function getSpaces(space) {
  const url = space ? (`${config.kibanaUrl}/api/spaces/space/${space}`) : `${config.kibanaUrl}/api/spaces/space`;

  try {
    const response = await instance.get(url);
    const { data } = response;
    if (Array.isArray(data)) {
      data.forEach(el => logger.info(JSON.stringify(el)));
    }
    if (!Array.isArray(data)) {
      logger.info(JSON.stringify(data));
    }
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

async function addSpaces(space) {
  // curl -X PUT "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'

  const defaultSpace = {
    id: space,
    name: space,
    description: 'This is the Test Space',
    color: '#aabbcc',
    initials: 'MK',
  };

  try {
    const response = await instance.post(`${config.kibanaUrl}/api/spaces/space`, defaultSpace);
    if (response.status === 200) {
      logger.info(`Espace ${space} crée`);
    } else {
      logger.warn({ statusText: response.statusText, status: response.status });
    }
    return response.data;
  } catch (error) {
    logger.error(error);
    process.exit(1);
    return false;
  }
}

async function delSpaces(space) {
  // curl -X DELETE "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'

  try {
    const response = await instance.delete(`${config.kibanaUrl}/api/spaces/space/${space}`);

    if (response.status === 204) {
      logger.info(`Espace ${space} supprimé`);
    } else {
      logger.warn({ statusText: response.statusText, status: response.status });
    }
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

async function findObjects(type) {
  // curl -X GET "http://localhost:5601/api/saved_objects/_find" -H 'kbn-xsrf: true'

  if (type) {
    try {
      const response = await instance.get(`${config.kibanaUrl}/api/saved_objects/_find`, { params: { type } });
      console.dir(response.data, { depth: null });
    } catch (error) {
      logger.error(error);
      process.exit(1);
    }
  } else {
    logger.error('Type required');
  }
}

async function exportDashboard(dashboardId) {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'

  if (dashboardId) {
    try {
      const response = await instance.get(`${config.kibanaUrl}/api/kibana/dashboards/export`, { params: { dashboard: dashboardId } });
      if (response.status === 200) {
        logger.info(`Dashboard ${dashboardId} exporté`);
      } else {
        logger.warn(`Problème à l'export de ${dashboardId}`);
      }
      return response.data;
    } catch (error) {
      logger.error(error);
      process.exit(1);
      return false;
    }
  } else {
    logger.error('dashboardId required');
    return false;
  }
}

async function importDashboardInSpace(dashboardId, space) {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'
  // http://localhost:5601/s/sales/api/kibana/dashboards/import --data-binary @export.json
  let exportedDashboard;
  let objects;

  if (dashboardId) {
    try {
      exportedDashboard = await exportDashboard(dashboardId);
      await addSpaces(space);
      objects = await instance.post(`${config.kibanaUrl}/s/${space
      }/api/kibana/dashboards/import`, exportedDashboard);
      if (objects.status === 200) {
        logger.info(`Dashboard ${dashboardId} importé`);
      } else {
        logger.warn(`Problème à l'export de ${dashboardId}`);
      }
    } catch (error) {
      logger.error(error);
    }
  } else {
    logger.error('dashboardId required');
  }
}

program.on('command:*', () => {
  logger.error(`Invalid command: ${program.args.join(' ')}\nSee --help for a list of available commands.`);
  process.exit(1);
});

program
  .version('0.0.1')
  .command('spaces [space]')
  .description('List all KIBANA spaces or [space] space attributes')
  .action((space) => {
    getSpaces(space);
  });

program
  .command('space-add <space>')
  .description('Add a KIBANA space with default attributes')
  .action((space) => {
    addSpaces(space);
  });

program
  .command('space-del <space>')
  .description('Delete a KIBANA space')
  .action((space) => {
    delSpaces(space);
  });

program
  .command('objects-find <type>')
  .description('Find KIBANA objects')
  .action((type) => {
    findObjects(type);
  });

program
  .command('dashboard-export <dasboardId>')
  .description('Export dashboard by Id')
  .action((dasboardId) => {
    exportDashboard(dasboardId);
  });

program
  .command('dashboard-move-in-space <dashboardId> <space>')
  .description('Move dashboard by Id in another space')
  .action((dashboardId, space) => {
    importDashboardInSpace(dashboardId, space);
  });

program.parse(process.argv);
// console.log(program.args);
