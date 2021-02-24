const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const autocomplete = require('inquirer-autocomplete-prompt');
const { getAll } = require('../../../lib/institutions');
const { addSushi } = require('../../../lib/sushi');

inquirer.registerPrompt('autocomplete', autocomplete);

exports.command = 'add';
exports.desc = 'Create new sushi';
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'files',
    describe: 'Files path',
  }).array('files');
};
exports.handler = async function handler(argv) {
  let credentialFiles = [];

  if (argv.files) { credentialFiles = argv.files; }

  let credentials = [];
  for (let i = 0; i < credentialFiles.length; i += 1) {
    let content;
    try {
      content = await fs.readFile(path.resolve(credentialFiles[i]), 'utf8');
    } catch (err) {
      console.error(err);
      console.error(`Cannot read file : ${credentialFiles[i]}`, err);
    }

    if (content) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error(`Cannot parse : ${credentialFiles[i]}`, e);
      }

      content.map((item) => {
        if (!Array.isArray(item.accounts)) {
          return item;
        }
        return item.accounts.map((account) => ({
          ...item,
          ...account,
        }));
      // eslint-disable-next-line no-loop-func
      }).forEach((credential) => credentials.push(credential));
    }
  }

  if (!credentials.length) {
    console.log('No sushi credentials found.');
    process.exit(0);
  }

  credentials = credentials.flatMap((credential) => credential);

  console.log(`${credentials.length} credentials found.`);

  let institutions;
  try {
    const { data } = await getAll();
    institutions = data;
  } catch (error) {
    console.error('Institutions not found');
    process.exit(0);
  }

  const institutionsName = institutions.map(({ name }) => name);
  const { institutionSelected } = await inquirer.prompt([{
    type: 'autocomplete',
    pageSize: 20,
    name: 'institutionSelected',
    message: 'Institutions (enter: select institution)',
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input ? input.toLowerCase() : '';

      resolve(institutionsName.filter((indice) => indice.toLowerCase().includes(input)));
    }),
  }]);

  const { id } = institutions
    .find(({ name }) => name.toLowerCase() === institutionSelected.toLowerCase());

  for (let j = 0; j < credentials.length; j += 1) {
    try {
      const res = await addSushi(id, credentials[j]);
      console.log(res);
    } catch (error) {
      console.error(`${credentials[j].vendor} : ${error.response.data.error}`);
    }
  }

  console.log('Insertion successfully completed.');
};
