const fs = require('fs-extra');
const path = require('path');
const { importInstitution } = require('../../../lib/institutions');

exports.command = 'import';
exports.desc = 'Import institution(s)';
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'files',
    describe: 'Files path',
  }).array('files');
};
exports.handler = async function handler(argv) {
  const options = {};

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
      console.error(`Cannot read file : ${files[i]}`, err);
    }

    if (content) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error(`Cannot parse : ${files[i]}`, e);
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
      id: `${id}`,
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
        role,
        indexPrefix,
        docContactName,
        techContactName,
        updatedAt,
        createdAt,
      },
    };

    const sushiDocs = institutions[i].sushi.map((sushi) => ({
      id: `${sushi.id}`,
      type: 'sushi',
      doc: sushi,
    }));

    try {
      const result = await importInstitution(institutionDoc, sushiDocs);
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
};
