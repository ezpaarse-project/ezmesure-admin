const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const { importInstitution } = require('../../../lib/institutions');
const rolesLib = require('../../../lib/roles');

exports.command = 'import';
exports.desc = i18n.t('institutions.import.description');
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'files',
    describe: 'Files path',
  }).array('files');
};
exports.handler = async function handler(argv) {
  const options = {};

  if (!argv.files) {
    console.log(i18n.t('institutions.import.sepecifyJSONFile'));
    process.exit(0);
  }

  if (argv.timeout) { options.timeout = argv.timeout; }

  let files = [];

  if (argv.files) { files = argv.files; }

  const institutions = [];
  for (let i = 0; i < files.length; i += 1) {
    let content;
    try {
      content = await fs.readFile(path.resolve(files[i]), 'utf8');
    } catch (err) {
      console.error(err);
      console.error(i18n.t('institutions.import.cannotRead', { file: files[i] }), err);
    }

    if (content) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error(i18n.t('institutions.import.cannotParse', { file: files[i] }), e);
      }

      if (!Array.isArray(content)) {
        institutions.push(content);
      }

      if (Array.isArray(content)) {
        content.map((item) => {
          if (!Array.isArray(item.accounts)) {
            return item;
          }
          return item.accounts.map((account) => ({
            ...item,
            ...account,
          }));
        // eslint-disable-next-line no-loop-func
        }).forEach((institution) => institutions.push(institution));
      }
    }
  }

  for (let i = 0; i < institutions.length; i += 1) {
    const {
      _id,
      id,
      name,
      auto,
      acronym,
      website,
      city,
      type,
      domains,
      creator,
      validated,
      indexCount,
      role,
      indexPrefix,
      docContactName,
      techContactName,
      updatedAt,
      createdAt,
    } = institutions[i];

    const institutionDoc = {
      _id: `${_id}`,
      type: 'institution',
      doc: {
        id,
        name,
        auto,
        acronym,
        website,
        city,
        type,
        domains,
        creator,
        validated,
        indexCount,
        role: role.name,
        indexPrefix,
        docContactName,
        techContactName,
        updatedAt,
        createdAt,
      },
    };

    const sushiDocs = institutions[i].sushi.map((sushi) => ({
      _id: `${sushi._id}`,
      type: 'sushi',
      doc: sushi,
    }));

    try {
      await rolesLib.findByName(role.name);
    } catch (error) {
      try {
        const result = await rolesLib.create(role.name, role.data);
        console.log(result);
      } catch (err) {
        console.error(err);
      }
    }

    try {
      await importInstitution(institutionDoc, sushiDocs);
      console.log(i18n.t('institutions.import.imported'));
    } catch (error) {
      console.error(error);
    }
  }
};
