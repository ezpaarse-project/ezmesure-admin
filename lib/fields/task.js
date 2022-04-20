const chalk = require('chalk');

exports.available = [
  'id',
  'type',
  'status',
  'updatedAt',
  'createdAt',
  'startedAt',
  'runningTime',
  'params.sushiId',
  'params.endpointId',
  'params.institutionId',
  'params.harvestId',
  'params.username',
  'params.reportType',
  'params.index',
  'params.beginDate',
  'params.endDate',
  'params.forceDownload',
  'params.endpointVendor',
  'params.sushiLabel',
  'params.sushiPackage',
  'params.institutionName',
  'result.inserted',
  'result.updated',
  'result.failed',
  'result.errors',
  'result.coveredPeriods',
];

exports.format = {
  runningTime: { type: 'duration' },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' },
  startedAt: { type: 'date' },
  status: {
    type: 'colorize',
    default: 'white',
    colors: {
      running: chalk.blue,
      cancelled: chalk.yellow,
      interrupted: chalk.red,
      error: chalk.red,
      finished: chalk.green,
    },
  },
};
