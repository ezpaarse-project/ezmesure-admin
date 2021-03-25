const fs = require('fs-extra');
const path = require('path');
const papaparse = require('papaparse');
const chalk = require('chalk');
const { table } = require('table');
const { compareDesc, getYear, format } = require('date-fns');
const { v5: uuid5 } = require('uuid');
const counterLib = require('../../lib/counter');

exports.command = 'counter4 <file>';
exports.desc = 'output an expanded JSON file or load a COUNTER 4 JR1 file into ezMESURE / KIBANA (bulk)';
exports.builder = function builder(yargs) {
  return yargs
    .positional('files', {
      describe: 'JR1 files',
      type: 'string',
    })
    .option('p', {
      alias: 'package',
      describe: 'JR1 package',
      type: 'string',
    })
    .option('b', {
      alias: 'bulk',
      describe: 'bulk index JR1 data',
      type: 'boolean',
    })
    .option('d', {
      alias: 'depositor',
      describe: 'Index prefix name for publisher index',
      type: 'string',
    })
    .option('n', {
      alias: 'ndjson',
      describe: 'only output newline delimited JSON file',
      type: 'boolean',
    })
    .option('j', {
      alias: 'json',
      describe: 'Save in JSON file',
      type: 'boolean',
    });
};

function trimQuotes(string) {
  return string.replace(/^"/, '').replace(/"$/, '').replace(/\n/g, ' ');
}

function checkJR1({
  type, title, startDate, endDate,
}) {
  const types = [
    'Journal Report 1 (R4)',
    'Journal Report 1',
    'Rapport Journalier 1 (R4)',
  ].map((t) => t.toLowerCase());

  const titles = [
    'Number of Successful Full-Text Article Requests by Month and Journal',
    'Number of Successfull Full-Text Article Requests by Month and Journal',
    'Number of Successful Full-text Article Requests by Year and Article',
    'Nombre de documents consommés par mois et source',
  ].map((t) => t.toLowerCase());

  if (!types.includes(type.toLowerCase())) {
    return Promise.reject(new Error(`Incorrect JR1 type (${type})`));
  }

  if (!titles.includes(title.toLowerCase())) {
    return Promise.reject(new Error(`Incorrect JR1 title (${title})`));
  }

  if (!startDate || !endDate) {
    return Promise.reject(new Error(`Incorrect JR1 date (${startDate}, ${endDate})`));
  }

  if (compareDesc(new Date(startDate), new Date(endDate)) !== 1) {
    return Promise.reject(new Error(`Incorrect JR1 date (${startDate}, ${endDate})`));
  }

  return Promise.resolve();
}

const process4 = async function process4(results, argv, file) {
  const packageName = argv.package;
  const publisherIndex = argv.depositor ? `${argv.depositor}-publisher` : 'publisher';

  if (results.errors.length) {
    for (let i = 0; i < results.errors.length; i += 1) {
      const error = results.errors[i];
      console.error(`[Error#${error.code}]: ${error.message} (${error.row}, ${error.index})`);
    }
    process.exit(1);
  }

  const JR1Header = results.data.slice(0, 9);
  if (!JR1Header.length) {
    console.error('Header does not found');
    process.exit(1);
  }

  const [
    [type, title], [customer], [identifier], , [date], , [runDate], headers, total,
  ] = JR1Header;
  const [, startDate, endDate] = /^([0-9-]+)\sto\s([0-9-]+)$/i.exec(trimQuotes(date));

  const counterJR1 = {
    info: {
      type: trimQuotes(type.trim()),
      title: trimQuotes(title),
      customer: trimQuotes(customer),
      identifier: trimQuotes(identifier),
      startDate,
      endDate,
      runDate,
    },
    rows: {
      headers: headers.map(trimQuotes),
      total: total.map(trimQuotes),
      data: results.data.slice(9).map((row) => row.map(trimQuotes)),
    },
  };

  try {
    await checkJR1(counterJR1.info);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }

  const months = counterJR1.rows.headers.slice(counterJR1.rows.headers.indexOf('Jan'));

  console.log(table([
    ['File', 'Exported months', 'Package'],
    [file, chalk.bold(months.join(', ')), chalk.bold(packageName)],
  ]));

  const flatReport = [];

  counterJR1.rows.data.forEach((data) => {
    for (let i = 0; i < months.length; i += 1) {
      const elements = counterJR1.rows.headers.slice(0, 8)
        .map((header, index) => ({
          key: header,
          value: data[index],
        })).reduce((obj, item) => Object.assign(obj, { [item.key]: item.value }), {});

      let FTADate;
      const FTADateMatch = /^[a-z]{3}(\s|-)[0-9]{4}$/i.exec(months[i]);
      if (!FTADateMatch) {
        FTADate = new Date(`${getYear(new Date(startDate))}-${(i + 1) <= 9 ? `0${i + 1}` : (i + 1)}-01T00:00:00.000Z`);
      } else {
        FTADate = `${format(new Date(months[i]), 'yyyy-MM-dd')}T00:00:00.000Z`;
      }

      const counts = data.slice(9);

      const doc = {
        JR1package: packageName,
        customer: counterJR1.info.customer,
        identifier: counterJR1.info.identifier,
        FTADate,
        FTACount: Number.parseInt(counts[i], 10),
        ...elements,
      };

      flatReport.push({
        _id: uuid5(`${path.basename(file)}${JSON.stringify(doc)}`, '67123ee5-30c6-4dc3-99ad-b6cc0554ca5d'),
        doc,
      });
    }
  });

  if (!flatReport.length) {
    console.log('No reports available');
    process.exit(0);
  }

  const basename = path.basename(file, path.extname(file));
  const outputFile = path.join(path.dirname(file), `${basename}`);

  if (argv.ndjson) {
    const writeStream = fs.createWriteStream(path.resolve(`${outputFile}.ndjson`));
    flatReport.forEach((report) => writeStream.write(`${JSON.stringify({ _id: report._id, ...report.doc })}\r\n`));
    writeStream.close();
    console.log(`Writing ${chalk.bold(`${outputFile}.ndjson`)} with ${chalk.bold(flatReport.length)} objects`);
  }

  if (argv.json) {
    await fs.writeJson(path.resolve(`${outputFile}.json`), flatReport.map(({ _id, doc }) => ({ _id, ...doc })), { spaces: 2 });
    console.log(`Writing ${chalk.bold(`${outputFile}.json`)} with ${chalk.bold(flatReport.length)} objects`);
  }

  if (argv.bulk) {
    const response = await counterLib.bulkInsertIndex(publisherIndex, flatReport);
    if (response) {
      console.log(table([
        ['Took', 'Inserted', 'Updated', 'Deleted', 'Errors'],
        [
          response.took,
          response.inserted,
          response.updated,
          response.deleted,
          response.errors,
        ],
      ]));
      process.exit(1);
    }
    console.log('No insertions/updates');
  }
};

exports.handler = async function handler(argv) {
  const { file } = argv;

  const filePath = path.resolve(file);

  if (path.extname(filePath) !== '.csv') {
    console.error('Please specify a CSV file');
    process.exit(1);
  }

  try {
    await fs.stat(filePath);
  } catch (error) {
    if (error.code && error.code === 'ENOENT') {
      console.log(`${file} does not exists`);
      process.exit(1);
    }

    console.log(error);
    process.exit(1);
  }

  let readStream;
  try {
    readStream = await fs.createReadStream(filePath);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  papaparse.parse(readStream, {
    complete(results) {
      process4(results, argv, file);
    },
  });
};
