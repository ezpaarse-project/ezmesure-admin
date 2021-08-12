const { i18n } = global;

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
      content = require(files[i]);
    } catch (error) {
      console.error(i18n.t('cannotReadFile', { file: files[i] }));
    }

    const { name, space, indexPrefix } = content.institution;

    if (verbose) {
      console.log(`* Retrieving institution [${name}] data from ${config.ezmesure.baseUrl}`);
    }

    let institution;
    try {
      const { data } = await institutions.findAll();
      institution = data
        .filter((el) => el.name === name)
        .pop();
    } catch (err) {
      console.error(`[${i18n.t('institutions.add.getInstitutions')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      process.exit(1);
    }

    if (institution) {
      console.log(i18n.t('institutions.import.institutionAlreadyExists', { name }));
    }

    // eslint-disable-next-line no-continue
    if (!institution) {
      // Create institution
      if (verbose) {
        console.log(`* Create institution [${name}] from ${config.ezmesure.baseUrl}`);
      }

      try {
        const { data } = await institutions.create(content.institution);
        institution = data;
        console.log(i18n.t('institutions.add.institutionImported', { name }));
      } catch (err) {
        console.error(`[${i18n.t('institutions.add.importInstitution')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
        process.exit(1);
      }
    }

    // Create space
    if (verbose) {
      console.log(`* Create institution [${name}] space [${space}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await spaces.create({
        id: space,
        name: space,
      });
      console.log(i18n.t('institutions.add.institutionImported', { space }));
    } catch (err) {
      console.error(`[${i18n.t('institutions.add.importSpace')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    }

    // Create index
    if (verbose) {
      console.log(`* Create institution [${name}] index [${indexPrefix}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await indices.create(indexPrefix);
      console.log(i18n.t('institutions.add.indexCreated', { index: indexPrefix }));
    } catch (err) {
      console.error(`[${i18n.t('institutions.add.importIndex')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    }

    // Create index-patterns
    for (let j = 0; j < content?.indexPattern.length; j += 1) {
      if (verbose) {
        console.log(`* Create institution [${name}] index-pattern [${content?.indexPattern[j]}] from ${config.ezmesure.baseUrl}`);
      }

      try {
        await spaces.addIndexPatterns(space, content?.indexPattern[j]);
        console.log(i18n.t('institutions.add.indexPatternImported', { indexPattern: content.indexPattern[j].title }));
      } catch (err) {
        console.error(`[${i18n.t('institutions.add.importIndexPattern')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      }
    }

    // Create roles
    for (let j = 0; j < content.roles.length; j += 1) {
      if (verbose) {
        console.log(`* Create institution [${name}] role [${content.roles[j].name}] from ${config.ezmesure.baseUrl}`);
      }

      try {
        await roles.createOrUpdate(content.roles[j].name, content.roles[j]);
        console.log(i18n.t('institutions.add.roleImported'));
        console.log(`roles [${space}] imported (created or updated).`);
      } catch (err) {
        console.error(err);
        console.error(`[${i18n.t('institutions.add.importRole')}][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      }
    }

    // Import SUSHI Data
    // TODO : import sushi data
    if (verbose) {
      console.log(`* Import institution [${name}] sushi data from ${config.ezmesure.baseUrl}`);
    }
  }
};
