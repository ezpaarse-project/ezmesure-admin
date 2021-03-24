const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const get = require('lodash.get');

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const { getInstitutions } = require('../../../lib/institutions');
const { findAll } = require('../../../lib/sushi');
const rolesLib = require('../../../lib/roles');

exports.command = 'export [institutions...]';
exports.desc = 'Export institution(s)';
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: 'Institution(s) name, case sensitive',
    type: 'string',
  }).option('o', {
    alias: 'output',
    describe: 'Output path',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  let institutions;
  try {
    const { body } = await getInstitutions();
    if (body) { institutions = get(body, 'hits.hits'); }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!institutions) {
    console.error('No institutions found');
    process.exit(0);
  }

  institutions = institutions.map(({ _id, _source }) => ({
    _id,
    ..._source.institution,
  }));

  if (argv.institutions.length) {
    institutions = institutions
      .filter((institution) => argv.institutions.includes(institution.name));

    if (!institutions.length) {
      console.log(`institution(s) [${argv.insitutions.join(', ')}] not found`);
      process.exit(0);
    }
  }

  let institutionsId = [];
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
      process.exit(0);
    }
  }

  for (let i = 0; i < institutions.length; i += 1) {
    try {
      const { body } = await findAll(institutions[i].id);
      const sushiData = get(body, 'hits.hits');
      if (sushiData) {
        institutions[i].sushi = sushiData.map(({ _id, _source }) => ({
          _id,
          ..._source.sushi,
        }));
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const { body } = await rolesLib.findByName(institutions[i].role);
      institutions[i].role = {
        name: institutions[i].role,
        data: body[institutions[i].role],
      };
    } catch (error) {
      console.error(error);
    }

    if (argv.output) {
      const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
      const fileName = `export_${institutions[i].name.toLowerCase()}_${currentDate}`;
      try {
        await fs.writeJson(path.resolve(argv.output, `${fileName}.json`), institutions[i], { spaces: 2 });
      } catch (error) {
        console.log(error);
      }
    }

    if (!argv.output) {
      console.log(institutions);
    }
  }
};
