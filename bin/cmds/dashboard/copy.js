const { i18n } = global;

const Joi = require('joi');

const dashboards = require('../../../lib/dashboards');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');
const itMode = require('./interactive/copy');

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
  const { verbose } = argv;

  if (verbose) {
    console.log('* Validating required fields');
  }

  const copy = async ({ source, target }) => {
    const schema = Joi.object({
      source: Joi.object({
        space: Joi.string().trim(),
        dashboard: Joi.string().trim().required().error(new Error(i18n.t('dashboard.copy.dashboardIsRequired'))),
      }).required(),
      target: Joi.object({
        space: Joi.string().trim(),
        indexPattern: Joi.string().trim(),
      }).required(),
    });

    const { error } = schema.validate({ source, target });

    if (source?.space === 'default') { source.space = undefined; }
    if (target?.space === 'default') { target.space = undefined; }

    if (error) {
      console.error(error.message);
      process.exit(1);
    }

    try {
      if (verbose) {
        console.log(`* Copy dashboard [${source.dashboard}] from space [${source.space}] to target space [${target.space}] with index-pattern [${target.indexPattern}] from ${config.ezmesure.baseUrl}`);
      }

      await dashboards.copy({ source, target, force: argv.force });
    } catch (err) {
      console.error(formatApiError(err));
      process.exit(1);
    }

    console.log(i18n.t('dashboard.copy.copied', {
      source: `${source.space ? source.space : 'default'}:${source.dashboard}`,
      target: target.space,
    }));
  };

  if (!argv.interactive) {
    await copy({
      source: {
        space: argv.source,
        dashboard: argv.dashboard,
      },
      target: {
        space: argv.target,
        indexPattern: argv.indexPattern,
      },
    });
    process.exit(0);
  }

  if (argv.interactive) {
    const {
      spaceId, dashboardsId, targetId, indexPattern,
    } = await itMode();

    for (let i = 0; i < dashboardsId.length; i += 1) {
      if (verbose) {
        console.log(`* Copyy dashboard [${spaceId}] from space [${dashboardsId[i]}] to target space [${targetId}] with index-pattern [${indexPattern}] from ${config.ezmesure.baseUrl}`);
      }
      await copy({
        source: {
          space: spaceId,
          dashboard: dashboardsId[i],
        },
        target: {
          space: targetId,
          indexPattern,
        },
      });
    }

    process.exit(0);
  }
};
