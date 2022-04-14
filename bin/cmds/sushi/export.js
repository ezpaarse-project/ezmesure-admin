const { i18n } = global;

const path = require('path');
const fs = require('fs-extra');
const Papa = require('papaparse');
const { format } = require('date-fns');

const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');
const itMode = require('./interactive/info');

exports.command = 'export <output> [institutions...]';
exports.desc = i18n.t('sushi.export.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('sushi.export.options.institutions'),
    type: 'string',
  })
    .positional('output', {
      describe: i18n.t('sushi.export.options.output'),
      type: 'string',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('sushi.export.options.ndjson'),
      type: 'boolean',
    })
    .option('c', {
      alias: 'csv',
      describe: i18n.t('sushi.export.options.csv'),
      type: 'boolean',
    })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('sushi.export.options.interactive'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    ndjson, csv, output, interactive, verbose,
  } = argv;

  if (!output) {
    console.error('Please specify an output path');
    process.exit(1);
  }

  await fs.ensureDir(path.resolve(output));

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    institutions = data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (!institutions) {
    console.error(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  if (argv.institutions && argv.institutions.length) {
    const institutionsList = argv.institutions.map((i) => i.toLowerCase());
    institutions = institutions
      // eslint-disable-next-line max-len
      .filter(({ id, name }) => institutionsList.includes(name.toLowerCase()) || institutionsList.includes(id));
  }

  if (interactive) {
    const { institutionsSelected } = await itMode.selectInstitutions(institutions);

    institutions = institutions.filter(({ id }) => institutionsSelected.includes(id));
  }

  for (let i = 0; i < institutions.length; i += 1) {
    if (verbose) {
      console.log(`* Retrieving SUSHI credentials for institution [${institutions[i].name}] from ${config.ezmesure.baseUrl}`);
    }

    let sushiData;
    try {
      const { data } = await institutionsLib.getSushi(institutions[i].id);
      if (data) { sushiData = data; }
    } catch (error) {
      console.error(formatApiError(error));
    }

    if (!sushiData || !sushiData.length) {
      console.log(`No SUSHI credentials found for institution [${institutions[i].name}] from ${config.ezmesure.baseUrl}`);
      // eslint-disable-next-line no-continue
      continue;
    }

    const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
    const fileName = `sushi_export_${institutions[i].name.replace(/\s/g, '_')}_${currentDate}`;
    const filePath = path.resolve(argv.output, `${fileName}`);

    if (ndjson) {
      if (verbose) {
        console.log('* Export SUSHI crendentials in ndjson format');
      }

      const writeStream = fs.createWriteStream(path.resolve(`${filePath}.ndjson`));
      sushiData.forEach((sushi) => writeStream.write(`${JSON.stringify(sushi)}\r\n`));
      writeStream.close();

      console.log(i18n.t('sushi.export.exported', {
        file: path.resolve(`${filePath}.ndjson`),
        institution: institutions[i].name,
      }));

      // eslint-disable-next-line no-continue
      continue;
    }

    if (csv) {
      if (verbose) {
        console.log('* Export SUSHI crendentials in csv format');
      }

      const fields = [
        i18n.t('sushi.export.id'),
        i18n.t('sushi.export.vendor'),
        i18n.t('sushi.export.sushiUrl'),
        i18n.t('sushi.export.requestorId'),
        i18n.t('sushi.export.customerId'),
        i18n.t('sushi.export.apiKey'),
        i18n.t('sushi.export.comment'),
        i18n.t('sushi.export.params'),
        i18n.t('sushi.export.package'),
        i18n.t('sushi.export.insitutionId'),
        i18n.t('sushi.export.updatedAt'),
        i18n.t('sushi.export.createdAt'),
      ];

      const data = [];
      sushiData.forEach(({
        id,
        vendor,
        sushiUrl,
        requestorId,
        customerId,
        apiKey,
        comment,
        params,
        package: pkg,
        insitutionId,
        updatedAt,
        createdAt,
      }) => {
        data.push([
          id,
          vendor,
          sushiUrl,
          requestorId,
          customerId,
          apiKey,
          comment,
          params.join(' '),
          pkg,
          insitutionId,
          updatedAt,
          createdAt,
        ]);
      });
      const csvData = Papa.unparse({ fields, data });

      try {
        await fs.writeFile(path.resolve(`${filePath}.csv`), csvData);
      } catch (error) {
        console.log(error);
        // eslint-disable-next-line no-continue
        continue;
      }
      console.log(i18n.t('sushi.export.exported', {
        file: path.resolve(`${filePath}.csv`),
        institution: institutions[i].name,
      }));

      // eslint-disable-next-line no-continue
      continue;
    }

    if (verbose) {
      console.log('* Export SUSHI crendentials in json format');
    }

    try {
      if (verbose) {
        console.log(`* Export JSON file [${filePath}]`);
      }
      await fs.writeJson(path.resolve(`${filePath}.json`), sushiData, { spaces: 2 });
    } catch (error) {
      console.log(error);
      // eslint-disable-next-line no-continue
      continue;
    }

    console.log(i18n.t('sushi.export.exported', {
      file: path.resolve(`${filePath}.json`),
      institution: institutions[i].name,
    }));
  }
};
