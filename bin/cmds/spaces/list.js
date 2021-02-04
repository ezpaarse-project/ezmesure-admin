const { table } = require('table');
const chalk = require('chalk');
const { getSpaces } = require('../../../lib/spaces');

exports.command = 'list';
exports.desc = 'List all spaces';
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: 'Display data in json',
  }).option('a', {
    alias: 'all',
    describe: 'Display all data in table',
  });
};
exports.handler = async function handler(argv) {
  let spaces;
  try {
    const { data } = await getSpaces();
    // eslint-disable-next-line prefer-destructuring
    spaces = data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!spaces) {
    console.log('No space(s) found');
    process.exit(0);
  }

  if (argv && argv.json) {
    console.log(JSON.stringify(spaces, null, 2));
    process.exit(0);
  }

  let header = ['ID', 'Name', 'Description'];
  if (argv.all) {
    header = header.concat(['Initials', 'Color']);
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
