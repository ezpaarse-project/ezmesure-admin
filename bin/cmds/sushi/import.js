const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const sushiLib = require('../../../lib/sushi');
const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');

const itMode = require('./interactive/list');

exports.command = 'import [institutionName]';
exports.desc = i18n.t('sushi.import.description');
exports.builder = function builder(yargs) {
  return yargs
    .positional('institutionName', {
      describe: i18n.t('sushi.import.options.institution'),
      type: 'string',
    })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('sushi.import.options.interactive'),
      type: 'boolean',
    })
    .option('o', {
      alias: 'overwrite',
      describe: i18n.t('sushi.import.options.overwrite'),
      type: 'boolean',
    })
    .option('f', {
      alias: 'files',
      describe: i18n.t('sushi.import.options.filesPath'),
    })
    .array('files');
};
exports.handler = async function handler(argv) {
  const {
    interactive,
    files,
    verbose,
    institutionName,
    overwrite,
  } = argv;

  if (!files || !files.length) {
    console.error('Please specify files with "--files" argument');
    process.exit(1);
  }
  if (!institutionName && !interactive) {
    console.error('Please specify an institution');
    process.exit(1);
  }

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  let currentInstitution;

  try {
    const { data } = await institutionsLib.getAll();
    if (data) { institutions = data; }
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  if (!institutions) {
    console.log(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  if (institutionName) {
    if (verbose) {
      console.log(`* Retrieving institution [${institutionName}]`);
    }

    currentInstitution = institutions
      .find(({ name }) => name.toLowerCase() === institutionName.toLowerCase());

    if (!currentInstitution) {
      console.error(i18n.t('institution.notFound', { id: institutionName }));
      process.exit(1);
    }
  }

  if (interactive) {
    const { institutionSelected } = await itMode.selectInstitutions(institutions);

    currentInstitution = institutions.find(({ id }) => institutionSelected === id);

    if (!currentInstitution) {
      console.error(i18n.t('institution.notFound', { id: institutionSelected }));
      process.exit(1);
    }
  }

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

    const ext = path.extname(files[i]).substr(1);
    if (ext === 'ndjson') {
      const rl = readline.createInterface({
        input: fs.createReadStream(files[i]),
        crlfDelay: Infinity,
      });

      // eslint-disable-next-line no-restricted-syntax
      for await (const line of rl) {
        sushiCredentials.push(JSON.parse(line));
      }
      // eslint-disable-next-line no-continue
      continue;
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

  sushiCredentials = sushiCredentials.map((item) => {
    if (verbose) {
      console.log(`* Import SUSHI credentials [${item.vendor}] for institution [${currentInstitution.name}]`);
    }

    return {
      ...item,
      institutionId: undefined,
    };
  });

  let res;
  try {
    res = await sushiLib.import(sushiCredentials, {
      params: {
        institutionId: currentInstitution.id,
        overwrite,
      },
    });
  } catch (error) {
    const errMsg = error?.response?.data?.error || error?.response?.statusText;
    console.log(`[Error#${error?.response?.status}] ${errMsg}`);
  }

  const {
    errors,
    conflicts,
    created,
    items,
  } = (res?.data || {});

  if (Array.isArray(items)) {
    items.forEach((item) => {
      switch (item?.status) {
        case 'error':
          console.error(i18n.t('sushi.import.itemError', {
            vendor: item?.data?.vendor || 'N/A',
            message: item?.message,
          }));
          break;
        case 'conflict':
          console.log(i18n.t('sushi.import.itemConflict', { vendor: item?.data?.vendor || 'N/A' }));
          break;
        case 'created':
          console.log(i18n.t('sushi.import.itemCreated', { vendor: item?.data?.vendor || 'N/A' }));
          break;
        default:
      }
    });
  }

  if (Number.isInteger(created) && created > 0) {
    console.log(i18n.t('sushi.import.nbImported', { n: created }));
  }
  if (Number.isInteger(conflicts) && conflicts > 0) {
    console.log(i18n.t('sushi.import.nbConflicts', { n: conflicts }));
  }
  if (Number.isInteger(errors) && errors > 0) {
    console.log(i18n.t('sushi.import.nbErrors', { n: errors }));
    process.exit(1);
  }
};
