const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');

const sushiLib = require('../../../lib/sushi');
const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');

const itMode = require('./interactive/list');

exports.command = 'import [institution]';
exports.desc = i18n.t('sushi.import.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: i18n.t('sushi.import.options.institution'),
    type: 'string',
  }).option('it', {
    alias: 'interactive',
    describe: i18n.t('sushi.import.options.interactive'),
    type: 'boolean',
  }).option('f', {
    alias: 'files',
    describe: i18n.t('sushi.import.options.filesPath'),
  }).array('files');
};
exports.handler = async function handler(argv) {
  const {
    institution, interactive, files, verbose,
  } = argv;

  if (!files || !files.length) {
    console.error('Please specify files with "--files" argument');
    process.exit(1);
  }

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    if (data) { institutions = data; }
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
  }

  if (!institutions) {
    console.log(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  if (institution) {
    if (verbose) {
      console.log(`* Retrieving institution [${institution}]`);
    }

    institutions = institutions
      .filter(({ name }) => name.toLowerCase() === institution.toLowerCase());
  }

  if (interactive) {
    const { institutionSelected } = await itMode.selectInstitutions(institutions);

    institutions = institutions.filter(({ id }) => institutionSelected === id);
  }

  const currentInstitution = institutions.pop();

  let sushiCredentials = [];
  for (let i = 0; i < files.length; i += 1) {
    let content;
    try {
      content = await fs.readFile(path.resolve(files[i]), 'utf8');
    } catch (err) {
      console.error(err);
      console.error(i18n.t('sushi.cannotReadFile', { file: files[i] }), err);
    }

    if (!content && verbose) {
      console.log(`* No content in file [${files[i]}]`);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (verbose) {
      console.log(`* Parse file [${files[i]}]`);
    }

    try {
      content = JSON.parse(content);
    } catch (e) {
      console.error(i18n.t('sushi.cannotParse', { file: files[i] }), e);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (!Array.isArray(content)) {
      sushiCredentials.push(content);
    }

    if (Array.isArray(content)) {
      sushiCredentials = [...content, ...sushiCredentials];
    }
  }

  for (let i = 0; i < sushiCredentials.length; i += 1) {
    sushiCredentials[i].institutionId = currentInstitution.id;

    if (verbose) {
      console.log(`* Import SUSHI credentials [${sushiCredentials[i].vendor}] for institution [${currentInstitution.name}]`);
    }

    try {
      await sushiLib.add(sushiCredentials[i]);
      console.log(`SUSHI credentials [${sushiCredentials[i].vendor}] for institution [${currentInstitution.name}] imported`);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
  }
};
