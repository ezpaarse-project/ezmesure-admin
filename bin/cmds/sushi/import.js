const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const get = require('lodash.get');

const { importSushi } = require('../../../lib/sushi');
const { getInstitution } = require('../../../lib/institutions');

exports.command = 'import [institution]';
exports.desc = i18n.t('sushi.import.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: i18n.t('sushi.import.options.institution'),
    type: 'string',
  }).option('f', {
    alias: 'files',
    describe: i18n.t('sushi.import.options.filesPath'),
  }).array('files');
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }

  let files = [];

  if (argv.files) { files = argv.files; }

  let institutionId;
  if (argv.institution) {
    try {
      const { body } = await getInstitution(argv.institution);
      if (body) { institutionId = get(body, 'hits.hits[0]._id'); }
    } catch (error) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: argv.institution }));
      process.exit(1);
    }
  }

  if (!institutionId) {
    console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: argv.institution }));
    process.exit(1);
  }

  const sushi = [];
  for (let i = 0; i < files.length; i += 1) {
    let content;
    try {
      content = await fs.readFile(path.resolve(files[i]), 'utf8');
    } catch (err) {
      console.error(err);
      console.error(i18n.t('sushi.cannotReadFile', { file: files[i] }), err);
    }

    if (content) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error(i18n.t('sushi.cannotParse', { file: files[i] }), e);
      }

      if (!Array.isArray(content)) {
        sushi.push(content);
      }

      if (Array.isArray(content)) {
        content.forEach((data) => sushi.push(data));
      }
    }
  }

  if (!sushi.length) {
    console.log(i18n.t('sushi.noDataFound'));
    process.exit(1);
  }

  const sushiDocs = sushi.map((doc) => {
    doc.institutionId = institutionId ? institutionId.split(':').pop() : doc.institutionId;
    return {
      _id: `${doc._id}`,
      type: 'sushi',
      doc,
    };
  });

  try {
    await importSushi(sushiDocs);
    console.log(i18n.t('sushi.import.imported'));
  } catch (error) {
    console.error(error);
  }
};
