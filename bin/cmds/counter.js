/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const md5 = require('md5');
const papa = require('papaparse');
const counterLib = require('../../lib/counter');

const counterJR1 = {};
const counterMR = {};
const flatJR1 = [];
let row = [];
let month;
// let counterJR1.dataRow = [];

function trimQuotes(string) {
  return string.replace(/^"/, '').replace(/"$/, '');
}

function makeID(MRfile, journalMonthRow) {
  const idString = path.basename(MRfile) + JSON.stringify(journalMonthRow);
  journalMonthRow._id = md5(idString);
}

function checkJR1(info) {
  let check;
  if ((info.type === 'Journal Report 1 (R4)'
    || info.type === 'Journal Report 1'
    || info.type === 'Rapport Journalier 1 (R4)')
    && (info.title.toLowerCase() === 'Number of Successful Full-Text Article Requests by Month and Journal'.toLowerCase()
    || info.title.toLowerCase() === 'Number of Successful Full-text Article Requests by Year and Article'.toLowerCase()
    || info.title.toLowerCase() === 'Nombre de documents consommés par mois et source'.toLowerCase())
    && info.startDate && info.endDate) {
    check = true;
  } else { check = false; }
  return check;
}

async function process4(results, opts, JR1file) {
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
      // const idString = path.basename(JR1file) + journalMonthRow.JR1package + journalMonthRow.Journal
      // + journalMonthRow.FTADate + journalMonthRow.FTACount;
      const idString = path.basename(JR1file) + JSON.stringify(journalMonthRow);

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
        // eslint-disable-next-line max-len
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
    } else {
      console.log('Aucune insertion/mise à jour');
    }
  } else {
    const jsonFile = `${JR1file}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(flatJR1));
    console.log('Ecriture de ', jsonFile, ' avec ', flatJR1.length, ' objets');
  }
}

function checkMR(info) {
  let check;
  if (info.Report_Name === 'Title Master Report'
    && info.Begin_Date && info.End_Date) {
    check = true;
  } else { check = false; }
  return check;
}

async function process5(results, opts, MRfile) {
  let MRpackage; let match; let publisherIndex;
  if (opts.counterPackage) {
    MRpackage = opts.counterPackage;
    match = /_([a-zA-Z0-9]+)_/i.exec(path.basename(MRfile));
  } else if (Array.isArray(match)) {
    MRpackage = match[1];
  } else {
    console.error('impossible to guess MR package with ', MRfile, ' file');
  }

  if (opts.depositor) {
    publisherIndex = `${opts.depositor}-publisher-5`;
  } else {
    publisherIndex = 'publisher-5';
  }

  counterMR.info = {};
  counterMR.dataRows = [];
  for (let i = 0; i < results.data.length; i++) {
    row = results.data[i];
    // console.log(row);
    if (i >= 0 && i <= 10) {
      counterMR.info[trimQuotes(row[0].trim())] = trimQuotes(row[1].trim());
      // counterMR.info.title = trimQuotes(row[1]);
    } else if (i === 13) {
      counterMR.headerRows = row.map(trimQuotes);
    } else if (i === 14) {
      if (counterMR.info.Reporting_Period) {
        const d = counterMR.info.Reporting_Period.split('; ');
        const d1 = d[0].split('=');
        const d2 = d[1].split('=');
        counterMR.info[d1[0]] = d1[1];
        counterMR.info[d2[0]] = d2[1];
      }
      if (!checkMR(counterMR.info)) {
        console.log('Fichier ', MRfile, ' non conforme COUNTER 5 MR');
        console.dir(counterMR.info);
        return;
      }
    } else if (i >= 14 && row) {
      // console.dir(row);
      counterMR.dataRows.push(row.map(trimQuotes));
    }
  }

  month = counterMR.headerRows.length - 12;
  // console.dir(counterMR.info);
  // console.dir(counterMR.dataRows[0]);
  console.log('Fichier ', MRfile, 'contient ', month, 'mois exportés [', MRpackage, ' package]');

  // for (let i = 0; i < 3; i++) {
  for (let i = 0; i < counterMR.dataRows.length; i++) {
    month = counterMR.headerRows.length - 12;
    for (let j = 0; j < month; j++) {
      const journalMonthRow = {};
      journalMonthRow.MRpackage = MRpackage;
      journalMonthRow.customer = counterMR.info.customer;
      journalMonthRow.identifier = counterMR.info.identifier;
      for (let k = 0; k < 11; k++) {
        journalMonthRow[counterMR.headerRows[k]] = counterMR.dataRows[i][k];
      }
      journalMonthRow.FTADate = moment.utc(counterMR.headerRows[12 + j], 'MMM-YYYY');
      journalMonthRow.FTACount = parseInt(counterMR.dataRows[i][12 + j], 10);
      // eslint-disable-next-line max-len
      // const idString = path.basename(MRfile) + journalMonthRow.MRpackage + journalMonthRow.Journal
      // + journalMonthRow.FTADate + journalMonthRow.FTACount;
      makeID(MRfile, journalMonthRow);

      flatJR1.push(journalMonthRow);
    }
  }
  // console.dir(counterMR.info);
  if (opts.ndjson) {
    const ndjsonFile = `${MRfile}.ndjson`;
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
        // eslint-disable-next-line max-len
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
    } else {
      console.log('Aucune insertion/mise à jour');
    }
  } else {
    const jsonFile = `${MRfile}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(flatJR1));
    console.log('Ecriture de ', jsonFile, ' avec ', flatJR1.length, ' objets');
  }
}

module.exports = {
  counter4: async (JR1file, opts) => {
    let data;

    try {
      data = fs.createReadStream(JR1file);
      papa.parse(data, {
        complete(results) {
          process4(results, opts, JR1file);
        },
      });
    } catch (err) {
      if (err.code === 'ENOENT') { console.error('no ', JR1file, ' file'); } else { console.error(err); }
    }
  },
  counter5: async (MRfile, opts) => {
    let data;

    try {
      data = fs.createReadStream(MRfile);
      papa.parse(data, {
        complete(results) {
          process5(results, opts, MRfile);
        },
      });
    } catch (err) {
      if (err.code === 'ENOENT') { console.error('no ', MRfile, ' file'); } else { console.error(err); }
    }
  },
};