const { table } = require('table');
const chalk = require('chalk');
const { getAll } = require('../../../lib/institutions');

exports.command = 'list';
exports.desc = 'List all institutions';
exports.builder = function builder(yargs) {
  return yargs.option('token', {
    describe: 'ezMESURE token',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  let institutions;
  try {
    const { data } = await getAll(options);
    institutions = data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!institutions) {
    console.error('No institutions found');
  }

  const header = ['Name', 'City', 'Website', 'Domains', 'Auto', 'Validate', 'Index prefix', 'Role', 'Contact'];
  const row = institutions.map(({
    name, city, website, domains, auto, validated,
    indexPrefix, role, docContactName, techContactName,
  }) => ([
    name,
    city,
    website,
    domains.join(', '),
    [
      chalk.hex(auto.ezpaarse ? '#78e08f' : '#e55039').bold('ezPAARSE'),
      chalk.hex(auto.ezmesure ? '#78e08f' : '#e55039').bold('ezMESURE'),
      chalk.hex(auto.report ? '#78e08f' : '#e55039').bold('Reporting'),
    ].join('\n'),
    validated ? chalk.hex('#78e08f').bold('Validated') : chalk.hex('#e55039').bold('Not validated'),
    indexPrefix,
    role,
    [`Doc : ${docContactName}`, `Tech : ${techContactName}`].join('\n'),
  ]));

  console.log(table([header, ...row]));
};
