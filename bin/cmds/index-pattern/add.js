const { i18n } = global;

const spacesLib = require('../../../lib/spaces');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'add <space> <title> [timeFieldName]';
exports.desc = i18n.t('indexPattern.add.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('indexPattern.add.options.space'),
    type: 'string',
  }).positional('title', {
    describe: i18n.t('indexPattern.add.options.title'),
    type: 'string',
  }).positional('timeFieldName', {
    describe: i18n.t('indexPattern.add.options.timeFieldName'),
    type: 'string',
    default: 'datetime',
  }).option('json', {
    describe: i18n.t('indexPattern.add.options.json'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const {
    space, title, timeFieldName, verbose, json,
  } = argv;

  if (verbose) {
    console.log(`* Create index-pattern [${title}] for space [${space}] with datetime field [${timeFieldName}] from ${config.ezmesure.baseUrl}`);
  }

  let patternId;

  try {
    const { data } = await spacesLib.addIndexPatterns(space, {
      title,
      timeFieldName,
    });

    patternId = data?.id;
  } catch (error) {
    if (json) {
      console.log(JSON.stringify({
        space,
        title,
        error: formatApiError(error, { prefix: false, colorize: false }),
      }, null, 2));
    } else {
      console.error(formatApiError(error));
    }
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ space, title, id: patternId }, null, 2));
  } else {
    console.log(i18n.t('indexPattern.add.created', { space, title, id: patternId }));
  }
};
