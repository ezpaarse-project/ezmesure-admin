const { i18n } = global;

const path = require('path');

const institutions = require('../../../lib/institutions');
const spaces = require('../../../lib/spaces');
const indices = require('../../../lib/indices');
const roles = require('../../../lib/roles');
const { config } = require('../../../lib/app/config');

exports.command = 'import';
exports.desc = i18n.t('institutions.import.description');
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'files',
    describe: 'Files path',
  }).array('files');
};
exports.handler = async function handler(argv) {
  const { files, verbose } = argv;

  if (!files) {
    console.log(i18n.t('institutions.import.sepecifyJSONFile'));
    process.exit(0);
  }

  for (let i = 0; i < files.length; i += 1) {
    if (verbose) {
      console.log(`* Read and parse file [${files[i]}] content`);
    }

    let content;
    try {
      // eslint-disable-next-line
      content = require(path.resolve(files[i]));
    } catch (error) {
      console.log(error);
      console.error(i18n.t('institutions.import.cannotReadFile', { file: files[i] }));
      process.exit(1);
    }

    const { institution, space } = content;

    if (verbose) {
      console.log(`* Retrieving institution [${institution.name}] data from ${config.ezmesure.baseUrl}`);
    }

    let institutionData;
    try {
      const { data } = await institutions.getAll();
      institutionData = data
        .filter((el) => el.name === institution.name)
        .pop();
    } catch (err) {
      console.error(`[Find institutions][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      process.exit(1);
    }

    if (institutionData) {
      console.log(i18n.t('institutions.import.institutionAlreadyExists', { name: institution.name }));
    }

    // eslint-disable-next-line no-continue
    if (!institutionData) {
      // Create institution
      if (verbose) {
        console.log(`* Create institution [${institution.name}] from ${config.ezmesure.baseUrl}`);
      }

      try {
        const { data } = await institutions.create(content.institution);
        institutionData = data;
        console.log(i18n.t('institutions.import.institutionImported', { name: institution.name }));
      } catch (err) {
        console.error(`[Import institution][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
        process.exit(1);
      }
    }

    // Create space
    if (verbose) {
      console.log(`* Create institution [${institution.name}] space [${space.name}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await spaces.create(space);
      console.log(i18n.t('institutions.import.spaceImported', { space: space.name }));
    } catch (err) {
      console.error(`[Import space][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    }

    // Create index
    if (verbose) {
      console.log(`* Create institution [${institution.name}] index [${institution.indexPrefix}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await indices.create(institution.indexPrefix);
      console.log(i18n.t('institutions.import.indexCreated', { index: institution.indexPrefix }));
    } catch (err) {
      console.error(`[Import index][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    }

    // Create index-patterns
    for (let j = 0; j < content?.indexPattern.length; j += 1) {
      if (verbose) {
        console.log(`* Create institution [${institution.name}] index-pattern [${content?.indexPattern[j].title}] from ${config.ezmesure.baseUrl}`);
      }

      try {
        await spaces.addIndexPatterns(space.name, {
          title: content?.indexPattern[j].title,
          timeFieldName: content?.indexPattern[j].timeFieldName,
        });
        console.log(i18n.t('institutions.import.indexPatternImported', { indexPattern: content.indexPattern[j].title }));
      } catch (err) {
        console.error(`[Import index-pattern][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      }
    }

    // Create roles
    for (let j = 0; j < content.roles.length; j += 1) {
      if (verbose) {
        console.log(`* Create institution [${institution.name}] roles [${content.roles[j].name}] from ${config.ezmesure.baseUrl}`);
      }

      try {
        await roles.createOrUpdate(content.roles[j].name, content.roles[j].role);
        console.log(`roles [${space.name}] imported (created or updated).`);
      } catch (err) {
        console.error(err);
        console.error(`[Import role][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      }
    }

    // Import SUSHI Data
    // TODO : import sushi data
    if (verbose) {
      console.log(`* Import institution [${institution.name}] sushi data from ${config.ezmesure.baseUrl}`);
    }
  }
};
