const fs = require('fs-extra');
const path = require('path');
const papaparse = require('papaparse');
const chalk = require('chalk');
const { compareDesc, getYear, format } = require('date-fns');
const { v5: uuid5 } = require('uuid');
const { table } = require('table');
const cliProgress = require('cli-progress');
const counterLib = require('../../lib/counter');

exports.command = 'counter4 <files...>';
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

  if (compareDesc(new Date(startDate), new Date(endDate)) === -1) {
    return Promise.reject(new Error(`Incorrect JR1 date (${startDate}, ${endDate})`));
  }

  return Promise.resolve();
}

async function process4(results, argv, file) {
  const packageName = argv.package;
  const publisherIndex = argv.depositor ? `${argv.depositor}-publisher` : 'publisher';

  if (results.errors.length) {
    const errors = [];
    for (let i = 0; i < results.errors.length; i += 1) {
      const error = results.errors[i];
      errors.push(`[Error#${error.code}]: ${error.message} (${error.row}, ${error.index})`);
    }
    return Promise.reject(new Error(JSON.stringify(errors)));
  }

  const JR1Header = results.data.slice(0, 9);
  if (!JR1Header.length) {
    return Promise.reject(new Error('Header does not found'));
  }

  const [
    [type, title], [customer], [identifier], , [date], , [runDate], headers, total,
  ] = JR1Header;
  let [, startDate, endDate] = /^([0-9-]+)\sto\s([0-9-]+)$/i.exec(trimQuotes(date));

  const startDateIsInvalid = /^([0-9]{6})$/i.test(startDate);
  if (startDateIsInvalid) {
    startDate = `${startDate.substring(0, 4)}-${startDate.substring(4)}-01`;
  }
  const endDateIsInvalid = /^([0-9]{6})$/i.test(endDate);
  if (endDateIsInvalid) {
    endDate = `${endDate.substring(0, 4)}-${endDate.substring(4)}-01`;
  }

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
    return Promise.reject(error);
  }

  let months = counterJR1.rows.headers.slice(10);
  if (months[0].length === 0) {
    months = counterJR1.rows.total.slice(10);
    counterJR1.rows.headers = counterJR1.rows.total;
    counterJR1.rows.data = results.data.slice(10).map((row) => row.map(trimQuotes));
  }

  const flatReport = [];

  counterJR1.rows.data.forEach((data) => {
    for (let i = 0; i < months.length; i += 1) {
      const element = counterJR1.rows.headers.slice(0, 8)
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
        ...element,
      };

      flatReport.push({
        _id: uuid5(`${path.basename(file)}${JSON.stringify(doc)}`, '67123ee5-30c6-4dc3-99ad-b6cc0554ca5d'),
        doc,
      });
    }
  });

  if (!flatReport.length) {
    return Promise.reject(new Error('No reports available'));
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
    return counterLib.bulkInsertIndex(publisherIndex, flatReport, packageName);
  }

  return Promise.resolve();
}

exports.handler = async function handler(argv) {
  const { files } = argv;

  const progressBar = new cliProgress.SingleBar({
    format: '{bar} {percentage}% | {value}/{total} Files | File : {file}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });
  progressBar.start(files.length, 0, { file: 'N/A' });

  const filesContent = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];

    const filePath = path.resolve(file);

    let isCSV = true;

    if (path.extname(filePath) !== '.csv') {
      console.error(`${file} is not a CSV file`);
      isCSV = false;
    }

    if (isCSV) {
      let fileExists = true;

      try {
        await fs.stat(filePath);
      } catch (error) {
        if (error.code && error.code === 'ENOENT') {
          console.log(`${file} does not exists`);
          fileExists = false;
        }

        console.log(error);
        fileExists = false;
      }

      if (fileExists) {
        try {
          const readStream = await fs.createReadStream(filePath);
          const result = new Promise((resolve) => {
            papaparse.parse(readStream, {
              complete(results) {
                return resolve({ file, results });
              },
            });
          });
          filesContent.push(await result);
        } catch (error) {
          console.log(error);
        }
      }
    }
  }

  const processResults = [];
  for (let i = 0; i < filesContent.length; i += 1) {
    const fileContent = filesContent[i];
    try {
      const res = await process4(fileContent.results, argv, fileContent.file);
      processResults.push({
        file: fileContent.file,
        ...res,
      });
      progressBar.update(i + 1, { file: path.basename(fileContent.file) });
    } catch (error) {
      console.error(error);
    }
  }

  progressBar.stop();

  const header = ['File', 'Index', 'Package', 'Took (ms)', 'Inserted', 'Updated', 'Deleted', 'Errors', 'Total'];
  const rows = [];

  const metrics = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
    all: 0,
  };

  processResults.forEach((result) => {
    metrics.inserted += result.inserted;
    metrics.updated += result.updated;
    metrics.deleted += result.deleted;
    metrics.errors += result.errors;
    metrics.all += result.total;

    rows.push([
      path.basename(result.file),
      result.publisherIndex,
      result.packageName,
      result.took,
      result.inserted,
      result.updated,
      result.deleted,
      result.errors,
      result.total,
    ]);
  });

  console.log(table([header, ...rows]));
  console.log(`${chalk.bold(processResults.length)} / ${chalk.bold(files.length)} files processed`);
  console.log('Metrics :');
  console.log(`  - Inserted: ${metrics.inserted}`);
  console.log(`  - Updated: ${metrics.updated}`);
  console.log(`  - Deleted: ${metrics.deleted}`);
  console.log(`  - Errors: ${metrics.errors}`);
  console.log(`  - Total: ${metrics.total}`);
};
