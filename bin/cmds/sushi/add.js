const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const autocomplete = require('inquirer-autocomplete-prompt');
const institutionsLib = require('../../../lib/institutions');
const { addSushi } = require('../../../lib/sushi');

inquirer.registerPrompt('autocomplete', autocomplete);

exports.command = 'add';
exports.desc = i18n.t('sushi.add.description');
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'files',
    describe: i18n.t('sushi.add.options.filesPath'),
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
      console.error(i18n.t('sushi.cannotReadFile', { file: credentialFiles[i] }), err);
    }

    if (content) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error(i18n.t('sushi.cannotParse', { file: credentialFiles[i] }), e);
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
    console.log(i18n.t('sushi.noCredentialsFound'));
    process.exit(0);
  }

  credentials = credentials.flatMap((credential) => credential);

  console.log(i18n.t('sushi.add.nCredentialsFound', { count: credentials.length }));

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    institutions = data;
  } catch (error) {
    console.error(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  const institutionsName = institutions.map(({ name }) => name);
  const { institutionSelected } = await inquirer.prompt([{
    type: 'autocomplete',
    pageSize: 20,
    name: 'institutionSelected',
    message: i18n.t('institutions.institutionsSelect'),
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

  console.log(i18n.t('sushi.add.insertionCompleted'));
};
