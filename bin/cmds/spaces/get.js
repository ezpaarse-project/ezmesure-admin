const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');
const spacesLib = require('../../../lib/spaces');
const { config } = require('../../../lib/app/config');
const it = require('./interactive/get');

exports.command = 'get [spaces...]';
exports.desc = i18n.t('spaces.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('spaces', {
    describe: i18n.t('spaces.get.options.spaces'),
    type: 'string',
  })
    .option('j', {
      alias: 'json',
      describe: i18n.t('spaces.get.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('spaces.get.options.ndjson'),
      type: 'boolean',
    })
    .option('a', {
      alias: 'all',
      describe: i18n.t('spaces.get.options.all'),
      type: 'boolean',
    })
    .option('it', {
      describe: i18n.t('spaces.get.options.interactive'),
      boolean: true,
    });
};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  let spaces = [];

  if (verbose) {
    console.log(`* Spaces retrieval [${spaces.join(',')}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    const { data } = await spacesLib.findAll();
    spaces = data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!argv.all && argv.spaces.length) {
    spaces = spaces.filter(({ id }) => argv.spaces.includes(id));
  }

  if (argv.it) {
    try {
      spaces = await it(spaces);
    } catch (error) {
      console.error(error);
    }
  }

  if (!spaces) {
    console.log(i18n.t('spaces.notFound'));
    process.exit(0);
  }

  for (let i = 0; i < spaces.length; i += 1) {
    if (verbose) {
      console.log(`* Get index-pattern for the space [${spaces[i].id}] from ${config.ezmesure.baseUrl}`);
    }
    try {
      const { data } = await spacesLib.getIndexPatterns(spaces[i].id);
      if (data && data.length) {
        spaces[i].indexPatterns = data.map(({ attributes }) => attributes.title);
      }
    } catch (error) {
      console.log(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
      spaces[i].indexPatterns = [];
    }
  }

  if (argv && argv.ndjson) {
    if (verbose) {
      console.log('* Export space to ndjson format');
    }

    spaces.forEach((space) => console.log(JSON.stringify(space)));
    process.exit(0);
  }

  if (argv && argv.json) {
    if (verbose) {
      console.log('* Export spaces to json format');
    }

    console.log(JSON.stringify(spaces, null, 2));
    process.exit(0);
  }

  if (verbose) {
    console.log('* Display spaces in graphical form in a table');
  }

  const header = [
    i18n.t('spaces.get.id'),
    i18n.t('spaces.get.name'),
    i18n.t('spaces.get.descr'),
    i18n.t('spaces.get.initials'),
    i18n.t('spaces.get.color'),
    i18n.t('spaces.get.indexPatterns'),
  ];

  const lines = spaces.map((el) => {
    const color = el.color ? chalk.hex(el.color).bold(` ${el.color} `) : '';
    return [
      el.id || '',
      el.name || '',
      el.description || '',
      el.initials || '',
      color || '',
      (el.indexPatterns && el.indexPatterns.join(', ')) || '',
    ];
  });
  console.log(table([header, ...lines]));
};
