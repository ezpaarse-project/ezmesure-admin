/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
const fs = require('fs');
const moment = require('moment');
const md5 = require('md5');
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
    && info.title === 'Number of Successful Full-Text Article Requests by Month and Journal'
    && info.startDate && info.endDate) {
    check = true;
  } else { check = false; }
  return check;
}

module.exports = {
  json: async (JR1package, JR1file, opts) => {
    let data;
    try {
      data = fs.readFileSync(JR1file).toString().split(/(?:\r\n|\r|\n)/g);
    } catch (err) {
      console.error('no ', JR1file, ' file');
      return;
    }

    for (let i = 0; i < data.length; i++) {
      row = data[i].split(/\t/);
      if (i === 0) {
        counterJR1.info = {};
        counterJR1.info.type = trimQuotes(row[0]);
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
    console.log('Fichier ', JR1file, 'contient ', month, 'mois exportés');

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
        const idString = JR1file + journalMonthRow.JR1package + journalMonthRow.Journal
        + journalMonthRow.FTADate + journalMonthRow.FTACount;
        journalMonthRow._id = md5(idString);

        flatJR1.push(journalMonthRow);
      }
    }
    console.dir(counterJR1.info);
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
          const { data: response } = await counterLib.insertIndex('publisher', _id, JSON.stringify(flatJR1[i]));
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
    } else {
      const jsonFile = `${JR1file}.json`;
      fs.writeFileSync(jsonFile, JSON.stringify(flatJR1));
      console.log('Ecriture de ', jsonFile, ' avec ', flatJR1.length, ' objets');
    }
  },
};
