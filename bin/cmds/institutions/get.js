const { table } = require('table');
const chalk = require('chalk');
const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const { getAll } = require('../../../lib/institutions');

exports.command = 'get [institutions...]';
exports.desc = 'Get institution(s) informations';
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: 'Institution(s) name, case sensitive',
    type: 'string',
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

  if (argv.institutions.length) {
    institutions = institutions
      .filter((institution) => argv.institutions.includes(institution.name));

    if (!institutions.length) {
      console.log(`institution(s) [${argv.insitutions.join(', ')}] not found`);
      process.exit(0);
    }
  }

  let institutionsId;
  if (!argv.institutions.length) {
    const { ids } = await inquirer.prompt([
      {
        type: 'checkbox-plus',
        name: 'ids',
        pageSize: 20,
        searchable: true,
        highlight: true,
        message: 'Institutions :',
        source: (answersSoFar, input) => new Promise((resolve) => {
          const result = institutions
            .map(({ id, name }) => ({ name, value: id }))
            .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

          resolve(result);
        }),
      },
    ]);
    institutionsId = ids;
  }

  if (institutionsId.length) {
    institutions = institutions.filter(({ id }) => institutionsId.includes(id));

    if (!institutions) {
      console.error('No institutions found');
    }
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
