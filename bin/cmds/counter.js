/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const md5 = require('md5');
const papa = require('papaparse');
const counterLib = require('../../lib/counter');

const counterJR1 = {};
const flatJR1 = [];
let row = [];
let month;
// let counterJR1.dataRow = [];

function trimQuotes(string) {
  return string.replace(/^"/, '').replace(/"$/, '');
}

function checkJR1(info) {
  let check;
  if (info.type === 'Journal Report 1 (R4)'
    && (info.title.toLowerCase() === 'Number of Successful Full-Text Article Requests by Month and Journal'.toLowerCase()
    || info.title.toLowerCase() === 'Number of Successful Full-text Article Requests by Year and Article'.toLowerCase())
    && info.startDate && info.endDate) {
    check = true;
  } else { check = false; }
  return check;
}

async function process(results, opts, JR1file) {
  let JR1package; let match; let publisherIndex;
  if (opts.counterPackage) {
    JR1package = opts.counterPackage;
    match = /_([a-zA-Z0-9]+)_/i.exec(path.basename(JR1file));
  } else if (Array.isArray(match)) {
    JR1package = match[1];
  } else {
    console.error('impossible to guess JR1 package with ', JR1file, ' file');
  }

  if (opts.depositor) {
    publisherIndex = `${opts.depositor}-publisher`;
  } else {
    publisherIndex = 'publisher';
  }

  for (let i = 0; i < results.data.length; i++) {
    row = results.data[i];
    // console.log(row);
    if (i === 0) {
      counterJR1.info = {};
      counterJR1.info.type = trimQuotes(row[0].trim());
      counterJR1.info.title = trimQuotes(row[1]);
      counterJR1.dataRows = [];
    } else if (i === 1) {
      counterJR1.info.customer = trimQuotes(row[0]);
    } else if (i === 2) {
      counterJR1.info.identifier = trimQuotes(row[0]);
    } else if (i === 4) {
      const d = trimQuotes(row[0]).split(' to ');
      counterJR1.info.startDate = d[0];
      counterJR1.info.endDate = d[1];
    } else if (i === 6) {
      counterJR1.info.runDate = trimQuotes(row[0]);
    } else if (i === 7) {
      counterJR1.headerRows = row.map(trimQuotes);
    } else if (i === 8) {
      counterJR1.totalRows = row.map(trimQuotes);
    } else if (i >= 9) {
      if (!checkJR1(counterJR1.info)) {
        console.log('Fichier ', JR1file, ' non conforme COUNTER JR1');
        console.dir(counterJR1.info);
        return;
      }
      counterJR1.dataRows.push(row.map(trimQuotes));
    }
  }

  month = counterJR1.headerRows.length - 10;
  console.log('Fichier ', JR1file, 'contient ', month, 'mois exportés [', JR1package, ' package]');

  // for (let i = 0; i < 3; i++) {
  for (let i = 0; i < counterJR1.dataRows.length; i++) {
    month = counterJR1.headerRows.length - 10;
    for (let j = 0; j < month; j++) {
      const journalMonthRow = {};
      journalMonthRow.JR1package = JR1package;
      journalMonthRow.customer = counterJR1.info.customer;
      journalMonthRow.identifier = counterJR1.info.identifier;
      for (let k = 0; k < 7; k++) {
        journalMonthRow[counterJR1.headerRows[k]] = counterJR1.dataRows[i][k];
      }
      journalMonthRow.FTADate = moment.utc(counterJR1.headerRows[10 + j], 'MMM-YYYY');
      journalMonthRow.FTACount = parseInt(counterJR1.dataRows[i][10 + j], 10);
      // eslint-disable-next-line max-len
      const idString = path.basename(JR1file) + journalMonthRow.JR1package + journalMonthRow.Journal
      + journalMonthRow.FTADate + journalMonthRow.FTACount;
      journalMonthRow._id = md5(idString);

      flatJR1.push(journalMonthRow);
    }
  }
  // console.dir(counterJR1.info);
  if (opts.ndjson) {
    const ndjsonFile = `${JR1file}.ndjson`;
    fs.writeFileSync(ndjsonFile, '');
    for (let i = 0; i < flatJR1.length; i++) {
      fs.appendFileSync(ndjsonFile, JSON.stringify(flatJR1[i]));
      fs.appendFileSync(ndjsonFile, '\r\n');
    }
    console.log('Ecriture de ', ndjsonFile, ' avec ', flatJR1.length, ' lignes');
  } else if (opts.index) {
    for (let i = 0; i < flatJR1.length; i++) {
      try {
        const _id = flatJR1[i]._id;
        delete flatJR1[i]._id;
        const { data: response } = await counterLib.insertIndex(publisherIndex, _id, JSON.stringify(flatJR1[i]));
        if (response) {
          // eslint-disable-next-line consistent-return
          console.log(JSON.stringify(response));
        }
      } catch (error) {
        console.error(error);
        // eslint-disable-next-line consistent-return
        return process.exit(1);
      }
    }
  } else if (opts.bulk) {
    const response = await counterLib.bulkInsertIndex(publisherIndex, flatJR1);
    if (response) {
      console.log(response, ' insertion/mises à jour');
    }
  } else {
    const jsonFile = `${JR1file}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(flatJR1));
    console.log('Ecriture de ', jsonFile, ' avec ', flatJR1.length, ' objets');
  }
}

module.exports = {
  json: async (JR1file, opts) => {
    let data;

    try {
      data = fs.createReadStream(JR1file);
      papa.parse(data, {
        complete(results) {
          process(results, opts, JR1file);
        },
      });
    } catch (err) {
      if (err.code === 'ENOENT') { console.error('no ', JR1file, ' file'); } else { console.error(err); }
    }
  },
};
