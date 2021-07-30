const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');
const spacesLib = require('../../../lib/spaces');
const it = require('./interactive/get');

exports.command = 'get [spaces...]';
exports.desc = i18n.t('spaces.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('spaces', {
    describe: i18n.t('spaces.get.options.spaces'),
    type: 'string',
  }).option('j', {
    alias: 'json',
    describe: i18n.t('spaces.get.options.json'),
    type: 'boolean',
  }).option('a', {
    alias: 'all',
    describe: i18n.t('spaces.get.options.all'),
    type: 'boolean',
  }).option('it', {
    describe: i18n.t('spaces.get.options.interactive'),
    boolean: true,
  });
};
exports.handler = async function handler(argv) {
  let spaces = [];

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
    try {
      const { data } = await spacesLib.getIndexPatterns(spaces[i].id);
      if (data && data.length) {
        spaces[i].indexPatterns = data.map(({ attributes }) => attributes.title);
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (argv && argv.json) {
    console.log(JSON.stringify(spaces, null, 2));
    process.exit(0);
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
