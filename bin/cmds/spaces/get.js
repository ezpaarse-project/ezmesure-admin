const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');
const spacesLib = require('../../../lib/spaces');

exports.command = 'get <space>';
exports.desc = i18n.t('spaces.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('spaces.get.options.space'),
    type: 'string',
  }).option('j', {
    alias: 'json',
    describe: i18n.t('spaces.get.options.json'),
  }).option('a', {
    alias: 'all',
    describe: i18n.t('spaces.get.options.all'),
  });
};
exports.handler = async function handler(argv) {
  let spaces;
  try {
    const { data } = await spacesLib.findById(argv.space);
    // eslint-disable-next-line prefer-destructuring
    spaces = data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!spaces) {
    console.log(i18n.t('spaces.notFound'));
    process.exit(0);
  }

  if (argv && argv.json) {
    console.log(JSON.stringify(spaces, null, 2));
    process.exit(0);
  }

  let header = [i18n.t('spaces.id'), i18n.t('spaces.name'), i18n.t('spaces.descr')];
  if (argv.all) {
    header = header.concat([i18n.t('spaces.initials'), i18n.t('spaces.color')]);
  }

  spaces = Array.isArray(spaces) ? spaces : [spaces];

  const lines = spaces.map((el) => {
    let arr = [el.id, el.name, el.description];
    if (argv.all) {
      const color = el.color ? chalk.bgHex(el.color).bold(` ${el.color} `) : '';
      arr = arr.concat([el.initials, color]);
    }
    return arr;
  });
  console.log(table([header, ...lines]));
};
