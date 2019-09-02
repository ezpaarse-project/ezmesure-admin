/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
const fs = require('fs');

const counterJR1 = {};
const flatJR1 = [];
let row = [];
let month;
// let counterJR1.dataRow = [];

function trimQuotes(string) {
  return string.replace(/^"/, '').replace(/"$/, '');
}

module.exports = {
  json: async (JR1file, opts) => {
    let data;
    try {
      data = fs.readFileSync(JR1file).toString().split(/(?:\r\n|\r|\n)/g);
    } catch (err) {
      console.error('no ', JR1file, ' file');
      return;
    }

    for (let i = 0; i < data.length; i++) {
      row = data[i].split(/\t|,|;/);
      if (i === 0) {
        counterJR1.info = {};
        counterJR1.info.type = trimQuotes(row[0]);
        counterJR1.info.title = trimQuotes(row[1]);
        counterJR1.dataRows = [];
      } else if (i === 1) {
        counterJR1.info.profile = trimQuotes(row[0]);
      } else if (i === 4) {
        let d = trimQuotes(row[0]).split(' to ');
        counterJR1.info['startDate'] = d[0];
        counterJR1.info['endDate'] = d[1];
      } else if (i === 6) {
        counterJR1.info.runDate = trimQuotes(row[0]);
      } else if (i === 7) {
        counterJR1.headerRows = row.map(trimQuotes);
      } else if (i === 8) {
        counterJR1.totalRows = row.map(trimQuotes);
      } else if (i >= 9) {
        counterJR1.dataRows.push(row.map(trimQuotes));
      }
    }

    month = counterJR1.headerRows.length - 10;
    console.log('Fichier ', JR1file, 'contient ', month, 'mois exportés');

    for (let i = 0; i < counterJR1.dataRows.length; i++) {
      month = counterJR1.headerRows.length - 10;
      for (let j = 0; j < month; j++) {
        let journalMonthRow = {};
        for (let k = 0; k < 7; k++) {
          journalMonthRow[counterJR1.headerRows[k]] = counterJR1.dataRows[i][k];
        }
        journalMonthRow['FTAMonth'] = counterJR1.headerRows[10 + j];
        journalMonthRow['FTATotal'] = counterJR1.dataRows[i][10 + j];
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
    } else {
      const jsonFile = `${JR1file}.json`;
      fs.writeFileSync(jsonFile, JSON.stringify(flatJR1));
      console.log('Ecriture de ', jsonFile, ' avec ', flatJR1.length, ' objets');
    }
  },
};
