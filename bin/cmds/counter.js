/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const md5 = require('md5');
const papa = require('papaparse');
const counterLib = require('../../lib/counter');

const counterJR1 = {};
const counterR = {};
const flatReport = [];

let row = [];
let month;
let monthIndice;

// let counterJR1.dataRow = [];

function trimQuotes(string) {
  return string.replace(/^"/, '').replace(/"$/, '').replace(/\n/g, ' ');
}

function makeID(rFile, journalMonthRow) {
  const idString = path.basename(rFile) + JSON.stringify(journalMonthRow);
  journalMonthRow._id = md5(idString);
}

function checkJR1(info) {
  if (!(info.type.toLowerCase() === 'Journal Report 1 (R4)'.toLowerCase()
    || info.type.toLowerCase() === 'Journal Report 1'.toLowerCase()
    || info.type.toLowerCase() === 'Rapport Journalier 1 (R4)'.toLowerCase())) {
    console.error('JR1 type incorrect : ', info.type);
    return false;
  }
  if (!(info.title.toLowerCase() === 'Number of Successful Full-Text Article Requests by Month and Journal'.toLowerCase()
    || info.title.toLowerCase() === 'Number of Successful Full-text Article Requests by Year and Article'.toLowerCase()
    || info.title.toLowerCase() === 'Number of Successfull Full-Text Article Requests by Month and Journal'.toLowerCase()
    || info.title.toLowerCase() === 'Nombre de documents consommés par mois et source'.toLowerCase())) {
    console.error('JR1 title incorrect : ', info.title);
    return false;
  }
  if (!(info.startDate && info.endDate)) {
    console.error('JR1 date incorrect : ', info.startDate);
    return false;
  }
  return true;
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
      if (counterJR1.headerRows[10 + j].length < 5) {
        // year missing from header lines
        const JR1year = moment.utc(counterJR1.info.startDate, 'YYYY-MM-dd').format('YYYY');
        journalMonthRow.FTADate = moment.utc(counterJR1.headerRows[10 + j], 'MMM-YYYY').year(JR1year);
      } else {
        journalMonthRow.FTADate = moment.utc(counterJR1.headerRows[10 + j], 'MMM-YYYY');
      }
      journalMonthRow.FTACount = parseInt(counterJR1.dataRows[i][10 + j], 10);
      // eslint-disable-next-line max-len
      // const idString = path.basename(JR1file) + journalMonthRow.JR1package + journalMonthRow.Journal
      // + journalMonthRow.FTADate + journalMonthRow.FTACount;
      const idString = path.basename(JR1file) + JSON.stringify(journalMonthRow);

      journalMonthRow._id = md5(idString);

      flatReport.push(journalMonthRow);
    }
  }
  // console.dir(counterJR1.info);
  if (opts.ndjson) {
    const ndjsonFile = `${JR1file}.ndjson`;
    fs.writeFileSync(ndjsonFile, '');
    for (let i = 0; i < flatReport.length; i++) {
      fs.appendFileSync(ndjsonFile, JSON.stringify(flatReport[i]));
      fs.appendFileSync(ndjsonFile, '\r\n');
    }
    console.log('Ecriture de ', ndjsonFile, ' avec ', flatReport.length, ' lignes');
  } else if (opts.index) {
    for (let i = 0; i < flatReport.length; i++) {
      try {
        const _id = flatReport[i]._id;
        delete flatReport[i]._id;
        // eslint-disable-next-line max-len
        const { data: response } = await counterLib.insertIndex(publisherIndex, _id, JSON.stringify(flatReport[i]));
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
    const response = await counterLib.bulkInsertIndex(publisherIndex, flatReport);
    if (response) {
      console.log(response, ' insertion/mises à jour');
    } else {
      console.log('Aucune insertion/mise à jour');
    }
  } else {
    const jsonFile = `${JR1file}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(flatReport));
    console.log('Ecriture de ', jsonFile, ' avec ', flatReport.length, ' objets');
  }
}

function checkReport(info) {
  let check;
  if ((info.Report_Name === 'Title Master Report'
  || info.Report_Name === 'Journal Requests (Excluding OA_Gold)'
  || info.Report_Name === 'Journal Access Denied'
  || info.Report_Name === 'Journal Usage by Access Type'
  || info.Report_Name === 'Journal Requests by YOP (Excluding OA_Gold)'
  || info.Report_Name === 'Journal Requests by YOP (Excluding OA_Gold)')
    && info.Begin_Date && info.End_Date) {
    check = true;
  } else { check = false; }
  return check;
}

async function process5(results, opts, rFile) {
  let cPackage; let match; let publisherIndex;
  if (opts.counterPackage) {
    cPackage = opts.counterPackage;
    match = /_([a-zA-Z0-9]+)_/i.exec(path.basename(rFile));
  } else if (Array.isArray(match)) {
    cPackage = match[1];
  } else {
    console.error('impossible to guess report package with ', rFile, ' file');
  }

  if (opts.depositor) {
    publisherIndex = `${opts.depositor}-publisher-5`;
  } else {
    publisherIndex = 'publisher-5';
  }

  counterR.info = {};
  counterR.dataRows = [];
  for (let i = 0; i < results.data.length; i++) {
    row = results.data[i];
    // console.log(row);
    if (i >= 0 && i <= 10) {
      counterR.info[trimQuotes(row[0].trim())] = trimQuotes(row[1].trim());
      // counterR.info.title = trimQuotes(row[1]);
    } else if (i === 13) {
      counterR.headerRows = row.map(trimQuotes);
      if (counterR.info.Reporting_Period) {
        const d = counterR.info.Reporting_Period.split('; ');
        const d1 = d[0].split('=');
        const d2 = d[1].split('=');
        counterR.info[d1[0]] = d1[1];
        counterR.info[d2[0]] = d2[1];
      }
      // console.dir(counterR.info);
      if (!checkReport(counterR.info)) {
        console.log('Fichier ', rFile, ' non conforme COUNTER 5');
        console.dir(counterR.info);
        return;
      }
    } else if (i >= 14 && row) {
      // console.dir(row);
      counterR.dataRows.push(row.map(trimQuotes));
    }
  }

  if (Array.isArray(counterR.headerRows) && counterR.headerRows.lastIndexOf('Reporting_Period_Total')) {
    monthIndice = counterR.headerRows.lastIndexOf('Reporting_Period_Total') + 1;
    month = counterR.headerRows.length - monthIndice;
  }
  console.log('Fichier ', rFile, 'contient ', month, 'mois exportés [', cPackage, ' package]');
  console.log('Rapport : ', counterR.info.Report_ID, counterR.info.Report_Name);
  console.log('Période : debut = ', counterR.info.Begin_Date, '- fin =', counterR.info.End_Date);
  console.log('Package : ', opts.counterPackage, '- vendor : ', counterR.info.Institution_ID);
  console.log('Institution : ', counterR.info.Institution_Name);

  // for (let i = 0; i < 3; i++) {
  for (let i = 0; i < counterR.dataRows.length; i++) {
    for (let j = 0; j < month; j++) {
      const journalMonthRow = {};
      journalMonthRow.package = cPackage;
      journalMonthRow.customer = counterR.info.customer;
      journalMonthRow.identifier = counterR.info.identifier;
      journalMonthRow.report_id = counterR.info.Report_id;
      for (let k = 0; k < monthIndice - 1; k++) {
        journalMonthRow[counterR.headerRows[k]] = counterR.dataRows[i][k];
      }
      if (counterR.headerRows[monthIndice + j].match(/[0-9]{4}\/[0-9]{2}\/[0-9]{2}/)) {
        journalMonthRow.A_Date = moment.utc(counterR.headerRows[monthIndice + j], 'YYYY/MM/DD');
      } else {
        journalMonthRow.A_Date = moment.utc(counterR.headerRows[monthIndice + j], 'MMM-YYYY');
      }
      journalMonthRow.A_Count = parseInt(counterR.dataRows[i][monthIndice + j], 10);
      // eslint-disable-next-line max-len
      // const idString = path.basename(rFile) + journalMonthRow.cPackage + journalMonthRow.Journal
      // + journalMonthRow.FTADate + journalMonthRow.FTACount;
      makeID(rFile, journalMonthRow);

      flatReport.push(journalMonthRow);
    }
  }
  // console.dir(counterR.info);
  if (opts.ndjson) {
    const ndjsonFile = `${rFile}.ndjson`;
    fs.writeFileSync(ndjsonFile, '');
    for (let i = 0; i < flatReport.length; i++) {
      fs.appendFileSync(ndjsonFile, JSON.stringify(flatReport[i]));
      fs.appendFileSync(ndjsonFile, '\r\n');
    }
    console.log('Ecriture de ', ndjsonFile, ' avec ', flatReport.length, ' lignes');
  } else if (opts.index) {
    for (let i = 0; i < flatReport.length; i++) {
      try {
        const _id = flatReport[i]._id;
        delete flatReport[i]._id;
        // eslint-disable-next-line max-len
        const { data: response } = await counterLib.insertIndex(publisherIndex, _id, JSON.stringify(flatReport[i]));
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
    const response = await counterLib.bulkInsertIndex(publisherIndex, flatReport);
    if (response) {
      console.log(response);
    } else {
      console.log('Aucune insertion/mise à jour');
    }
  } else {
    const jsonFile = `${rFile}.json`;
    fs.writeFileSync(jsonFile, JSON.stringify(flatReport));
    console.log('Ecriture de ', jsonFile, ' avec ', flatReport.length, ' objets');
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
  counter5: async (rFile, opts) => {
    let data;

    try {
      data = fs.createReadStream(rFile);
      papa.parse(data, {
        complete(results) {
          process5(results, opts, rFile);
        },
      });
    } catch (err) {
      if (err.code === 'ENOENT') { console.error('no ', rFile, ' file'); } else { console.error(err); }
    }
  },
};
