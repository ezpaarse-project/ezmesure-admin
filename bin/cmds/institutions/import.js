const { i18n } = global;

const institutions = require('../../../lib/institutions');
const spaces = require('../../../lib/spaces');
const indices = require('../../../lib/indices');
const roles = require('../../../lib/roles');

exports.command = 'import';
exports.desc = i18n.t('institutions.import.description');
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'files',
    describe: 'Files path',
  }).array('files');
};
exports.handler = async function handler(argv) {
  const { files } = argv;

  if (!files) {
    console.log(i18n.t('institutions.import.sepecifyJSONFile'));
    process.exit(0);
  }

  for (let i = 0; i < files.length; i += 1) {
    let content;
    try {
      // eslint-disable-next-line
      content = require(files[i]);
    } catch (error) {
      console.error(i18n.t('cannotReadFile', { file: files[i] }));
    }

    const { name, space, indexPrefix } = content.institution;

    let institution;

    // Create institution
    try {
      const { data } = await institutions.create(content.institution);
      institution = data;
      console.log(`institution [${name}] created`);
    } catch (err) {
      console.error(`[Import institution][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      process.exit(1);
    }

    // Validate institution
    try {
      await institutions.validate(institution.id, true);
      console.log(`institution [${name}] validated.`);
    } catch (err) {
      console.error(`[Validate][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    }

    // Create space
    try {
      await spaces.create({
        id: space,
        name: space,
      });
      console.log(`space [${space}] created.`);
    } catch (err) {
      console.error(`[Import space][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    }

    // Create index
    try {
      const { data } = await indices.create(indexPrefix);
      console.log(`index [${indexPrefix}] ${data.message === 'Nothing to do' ? 'already exists' : 'imported'}`);
    } catch (err) {
      console.error(`[Import index][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
    }

    // Create index-patterns
    for (let j = 0; j < content.indexPattern.length; j += 1) {
      try {
        await spaces.addIndexPatterns(space, content.indexPattern[j]);
        console.log(`index-pattern [${space}] imported.`);
      } catch (err) {
        console.error(`[Import index-pattern][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      }
    }

    // Create roles
    for (let j = 0; j < content.roles.length; j += 1) {
      try {
        await roles.createOrUpdate(content.roles[j].name, content.roles[j]);
        console.log(`roles [${space}] imported (created or updated).`);
      } catch (err) {
        console.error(err);
        console.error(`[Import all role][Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      }
    }

    // Import SUSHI Data
  }
};
