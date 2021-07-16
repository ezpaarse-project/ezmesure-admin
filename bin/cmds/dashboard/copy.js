const { i18n } = global;

const Joi = require('joi');

const dashboards = require('../../../lib/dashboards');
const it = require('./interactive/copy');

exports.command = 'copy';
exports.builder = function builder(yargs) {
  return yargs.option('s', {
    alias: 'source',
    describe: i18n.t('dashboard.copy.options.source'),
    type: 'string',
  })
    .option('d', {
      alias: 'dashboard',
      describe: i18n.t('dashboard.copy.options.dashboard'),
      type: 'string',
    })
    .option('t', {
      alias: 'target',
      describe: i18n.t('dashboard.copy.options.target'),
      type: 'string',
    })
    .option('i', {
      alias: 'index-pattern',
      describe: i18n.t('dashboard.copy.options.indexPattern'),
      type: 'string',
    })
    .option('f', {
      alias: 'force',
      describe: i18n.t('dashboard.copy.options.force'),
      type: 'boolean',
    })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('dashboard.copy.options.interactive'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  let source = {
    space: argv.source,
    dashboard: argv.dashboard,
  };

  let target = {
    space: argv.target,
    indexPattern: argv.indexPattern,
  };

  if (argv.interactive) {
    const {
      spaceId, dashboardId, targetId, indexPattern,
    } = await it();
    source = {
      space: spaceId,
      dashboard: dashboardId,
    };
    target = {
      space: targetId,
      indexPattern,
    };
  }

  const schema = Joi.object({
    source: Joi.object({
      space: Joi.string().trim(),
      dashboard: Joi.string().trim().required().error(new Error(i18n.t('dashboard.copy.dashboardIsRequired'))),
    }).required(),
    target: Joi.object({
      space: Joi.string().trim().required().error(new Error(i18n.t('dashboard.copy.targetIsRequired'))),
      indexPattern: Joi.string().trim(),
    }).required(),
  });

  const { error } = schema.validate({ source, target });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  try {
    await dashboards.copy({ source, target, force: argv.force });
  } catch (err) {
    if (err.response.data) {
      console.error(i18n.t('dashboard.copy.error', {
        statusCode: err.response.data.status,
        message: err.response.data.error,
      }));
      process.exit(1);
    }
    console.error(err);
    process.exit(1);
  }

  console.log(i18n.t('dashboard.copy.copied', {
    source: `${source.space ? source.space : 'default'}:${source.dashboard}`,
    target: target.space,
  }));
  process.exit(0);
};
