/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
const fs = require('fs-extra');
const path = require('path');
const md5 = require('md5');
const moment = require('moment');

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

const sushiLib = require('../../lib/sushi');
const counterLib = require('../../lib/counter');
const institutionsLib = require('../../lib/institutions');
const logger = require('../../lib/app/logger');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const sushiIndexSufix = 'sushi-5';

const now = moment();

async function selectInstitution() {
  let data;
  try {
    const { body } = await institutionsLib.getInstitutions();
    // eslint-disable-next-line prefer-destructuring
    data = body.hits.hits;
  } catch (error) {
    return Promise.reject(new Error('Institutions not found'));
  }

  data = Array.isArray(data) ? data : [data];

  const institutions = data.map(({ _source: source }) => source.institution.name);

  const { selection } = await inquirer.prompt([{
    type: 'autocomplete',
    name: 'selection',
    pageSize: 20,
    message: 'Select an institution',
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input || '';

      resolve(institutions.filter(indice => indice.includes(input)));
    }),
  }]);

  if (!selection) {
    return Promise.reject(new Error('Institution not selected'));
  }

  const selected = data.filter(({ _source }) => selection === _source.institution.name);

  if (!selected) {
    return Promise.reject(new Error('No data for the selected institution.'));
  }

  const institution = selected.pop();

  const institutionId = institution._source.institution.id;

  let sushi;
  try {
    sushi = await sushiLib.getSushi(institutionId);
  } catch (error) {
    console.log(error);
  }

  if (!sushi || !sushi.data) {
    return Promise.reject(new Error('Sushi data not found.'));
  }

  return Promise.resolve(sushi.data);
}

function transformItem(resItems, item, opts) {
  const resItem = {};

  const prop = Object.keys(item);
  for (let i = 0; i < prop.length; i++) {
    if (item[prop[i]]) { resItem[prop[i]] = item[prop[i]]; }
  }
  // console.dir(resItem, { depth: 5 });

  if (item.Item_ID) {
    delete resItem.Item_ID;
    for (let i = 0; i < item.Item_ID.length; i++) {
      if (item.Item_ID[i].Value) {
        resItem[item.Item_ID[i].Type] = item.Item_ID[i].Value;
      }
    }
  }

  if (item.Publisher_ID) {
    for (let i = 0; i < item.Publisher_ID.length; i++) {
      if (item.Publisher_ID[i].Value) {
        resItem.Publisher_ID = `${item.Publisher_ID[i].Type}:${item.Publisher_ID[i].Value}`;
      }
    }
  }
  if (item.Performance) {
    delete resItem.Performance;
    for (let i = 0; i < item.Performance.length; i++) {
      const period = item.Performance[i].Period.Begin_Date;
      const dureeD = moment(item.Performance[i].Period.Begin_Date);
      const dureeF = moment(item.Performance[i].Period.End_Date);
      const ecart = dureeF.diff(dureeD, 'days');
      // keep only monthly data
      if (ecart <= 31) {
        if (item.Performance[i].Instance) {
          for (let j = 0; j < item.Performance[i].Instance.length; j++) {
            const metricItem = JSON.parse(JSON.stringify(resItem));
            metricItem.package = opts.package;
            metricItem.A_Date = period;
            metricItem.Metric_Type = item.Performance[i].Instance[j].Metric_Type;
            metricItem.A_Count = item.Performance[i].Instance[j].Count;
            const idString = JSON.stringify(metricItem);
            metricItem._id = md5(idString);
            resItems.push(metricItem);
          }
        }
      } else {
        console.error('Période ignorée', ecart);
      }
    }
  }
  return resItems;
}

function writeReport(reportFile, jsonData) {
  try {
    fs.writeFileSync(reportFile, JSON.stringify(jsonData));
  } catch (err) {
    console.error(err);
  }
}

function readSushiFile(sushiFile) {
  let data;
  let sushi;
  try {
    data = fs.readFileSync(sushiFile);
    sushi = JSON.parse(data);
    // console.log(sushiActions);
  } catch (err) {
    if (err.code === 'ENOENT') { console.error('no ', sushiFile, ' file'); } else { console.error(err); }
  }
  return sushi;
}

module.exports = {
  sushi5: async (sushiFile, opts) => {
    const sushi = readSushiFile(sushiFile);
    // console.dir(sushi);
    let sushiActions = [];
    let sushiIndexPrefix;

    let reportItems = [];
    let reportHeader = {};
    let response = {};
    const results = {};
    const sushiRequest = [];

    const reportFile = opts.reportFile;
    if (Array.isArray(sushi)) {
      // console.log('tableau de', sushi.length);
      sushiActions = sushi;
    } else if (sushi.sushi && Array.isArray(sushi.sushi.actions)) {
      // console.log('objet avec tableau ', sushi.sushi.actions.length);
      // eslint-disable-next-line no-restricted-syntax
      for (const i of Object.keys(sushi.sushi)) {
        opts[i] = sushi.sushi[i];
      }
      // console.dir(opts);
      sushiActions = sushi.sushi.actions;
    } else {
      // console.log(Array.isArray(sushi.actions), Object.keys(sushi));
      console.error('Ficher sushi JSON non conforme : ', sushiFile);
      process.exit(1);
    }

    sushiIndexPrefix = `${opts.depositor}-${sushiIndexSufix}`;

    for (let action = 0; action < sushiActions.length; action++) {
      if (opts.verbose) { console.log('Recuperation sushi : ', sushiActions.length, 'operation(s) a effectuer'); }
      if (sushiActions[action].depositor) {
        sushiIndexPrefix = `${sushiActions[action].depositor}-${sushiIndexSufix}`;
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const i of Object.keys(sushiActions[action])) {
        opts[i] = sushiActions[action][i];
      }
      sushiRequest[action] = {};
      for (let account = 0; account < sushiActions[action].accounts.length; account++) {
        // eslint-disable-next-line no-restricted-syntax
        for (const i of Object.keys(sushiActions[action].accounts[account])) {
          opts[i] = sushiActions[action].accounts[account][i];
        }


        sushiRequest[action].report = opts.report;
        sushiRequest[action].beginDate = opts.beginDate;
        sushiRequest[action].endDate = opts.endDate;
        sushiRequest[action].package = opts.package;
        sushiRequest[action].vendor = opts.vendor;

        if (opts.verbose) {
          console.log('Rapport : ', opts.report);
          console.log('Période : debut = ', opts.beginDate, '- fin =', opts.endDate);
          console.log('requestorId : ', opts.requestorId, '- customerId : ', opts.customerId);
          console.log('Package : ', opts.package, '- vendor : ', opts.vendor);
        }

        if (opts.reportFile) {
          // set filename for downloaded report
          opts.reportFile = `${reportFile}-${opts.report}-${opts.package}-${opts.vendor}`;
          opts.reportFile = `${opts.reportFile}-${opts.beginDate}-${opts.endDate}.json`;
          sushiRequest[action].reportFile = opts.reportFile;
        }
        try {
          const nowExec = moment();
          const res = await sushiLib.getReport(sushiActions[action].sushiURL, opts);
          sushiRequest[action].took = moment() - nowExec;
          let resItems = [];
          sushiRequest[action].status = res.status;
          if (res.status === 200) {
            if (res.data) {
              if (res.data.Report_Items) {
                sushiRequest[action].reportItems = res.data.Report_Items.length;
                if (res.data.Report_Items && res.data.Report_Items.length) {
                  reportItems = res.data.Report_Items;
                  if (opts.verbose) { console.log('Rapport sushi : ', reportItems.length, 'elements reçus'); }
                  if (!opts.bulk && opts.reportFile) {
                    // write sushi report file
                    writeReport(opts.reportFile, res.data);
                    if (opts.verbose) { console.log('Sauvegarde du rapport ', opts.reportFile); }
                  }
                } else {
                  console.error('No items in report');
                  console.dir(res.data, { depth: 5 });
                }
              }
              if (res.data.Report_Header) {
                reportHeader = res.data.Report_Header;
                sushiRequest[action].reportHeader = reportHeader;
              } else {
                console.error('No header in report');
                if (opts.verbose) { console.dir(res.data); }
              }
              if (res.data.Exception) {
                console.error('Exception');
                sushiRequest[action].sushiException = res.data.Exception;
                if (opts.verbose) { console.dir(res.data.Exception); }
              }
              if (opts.bulk) {
                for (let i = 0; i < reportItems.length; i++) {
                  // console.dir(reportItems[i], { depth: 5 });
                  reportItems[i].report_id = reportHeader.Report_ID;
                  reportItems[i].report_name = reportHeader.Report_Name;
                  resItems = transformItem(resItems, reportItems[i], opts);
                }
                // console.dir(resItems);
                // process.exit();
                response = await counterLib.bulkInsertIndex(sushiIndexPrefix, resItems);
                if (response) {
                  sushiRequest[action].ezmesure = response;
                  // console.log(response);
                } else {
                  console.error('Aucune insertion/mise à jour');
                }
              }
            } else {
              console.error('No data');
              if (opts.verbose) { console.dir(res.data); }
            }
          } else {
            console.error('No 200');
            if (opts.verbose) { console.dir(res.data); }
          }
        } catch (error) {
          console.error(error);
          sushiRequest[action].sushiError = error;
          // process.exit(1);
        }
      }

      results.sushiRequests = sushiRequest;
    }
    results.took = moment() - now;
    if (opts.execLogPath) {
      // write exec report file
      const execReportTime = moment().format('YYYY-MM-DD-hh-mm-ss');
      const exectReportFile = `${opts.execLogPath}/ezmesure-admin-${execReportTime}-log.json`;
      writeReport(exectReportFile, results);
      console.log('Sauvegarde du rapport ', exectReportFile);
    }
    return (results);
  },

  delete: async () => {
    let result;
    try {
      result = await selectInstitution();
    } catch (error) {
      return logger.error(error);
    }

    const { selection } = await inquirer.prompt([{
      type: 'checkbox-plus',
      pageSize: 20,
      name: 'selection',
      message: 'Sushi vendor (space to select item)',
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input || '';

        const res = result.filter(indice => indice.vendor.includes(input)).map(item => item.vendor);

        resolve(res);
      }),
    }]);

    if (!selection) {
      return logger.warn('No credentials selected.');
    }

    const selected = result.filter(({ vendor }) => selection.includes(vendor));
    if (!selected) {
      return logger.warn('No sushi credentials found.');
    }

    const ids = selected.map(({ id }) => id);

    if (!ids) {
      return logger.warn('No ids found');
    }

    try {
      await sushiLib.deleteSushi(ids);
    } catch (err) {
      return logger.error(err);
    }

    return logger.info('Data removed successfully.');
  },

  add: async (credentialFiles) => {
    let credentials = [];
    for (let i = 0; i < credentialFiles.length; i += 1) {
      let content;
      try {
        content = await fs.readFile(path.resolve(credentialFiles[i]), 'utf8');
      } catch (err) {
        console.error(err);
        logger.error(`Cannot read file : ${credentialFiles[i]}`, err);
      }

      if (content) {
        try {
          content = JSON.parse(content);
        } catch (e) {
          logger.error(`Cannot parse : ${credentialFiles[i]}`, e);
        }

        content.map((item) => {
          if (!Array.isArray(item.accounts)) {
            return item;
          }
          return item.accounts.map(account => ({
            ...item,
            ...account,
          }));
        // eslint-disable-next-line no-loop-func
        }).forEach(credential => credentials.push(credential));
      }
    }

    if (!credentials.length) {
      return logger.info('No sushi credentials found.');
    }

    credentials = credentials.flatMap(credential => credential);

    logger.info(`${credentials.length} credentials found.`);

    let data;
    try {
      const { body } = await institutionsLib.getInstitutions();
      // eslint-disable-next-line prefer-destructuring
      data = body.hits.hits;
    } catch (error) {
      return logger.info('Institutions not found');
    }

    data = Array.isArray(data) ? data : [data];

    const institutions = data.map(({ _source: source }) => source.institution.name);

    const { selection } = await inquirer.prompt([{
      type: 'checkbox-plus',
      pageSize: 20,
      name: 'selection',
      message: 'Institutions (space to select item)',
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input || '';

        resolve(institutions.filter(indice => indice.includes(input)));
      }),
    }]);

    if (selection) {
      const selected = data.filter(({ _source }) => selection.includes(_source.institution.name));
      for (let i = 0; i < selected.length; i += 1) {
        const institutionId = selected[i]._source.institution.id;

        for (let j = 0; j < credentials.length; j += 1) {
          try {
            const res = await sushiLib.addSushi(institutionId, credentials[j]);
            logger.info(res);
          } catch (error) {
            logger.info(`${credentials[j].vendor} : ${error.response.data.error}`);
          }
        }
      }
    }

    return logger.info('Insertion successfully completed.');
  },
};
