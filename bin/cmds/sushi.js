/* eslint-disable no-plusplus */
/* eslint-disable prefer-destructuring */
const fs = require('fs');
const md5 = require('md5');
const sushiLib = require('../../lib/sushi');
const counterLib = require('../../lib/counter');

function transformItem(resItems, item, opts) {
  const resItem = {};

  if (item.Item_ID) {
    for (let i = 0; i < item.Item_ID.length; i++) {
      if (item.Item_ID[i].Value) {
        resItem[item.Item_ID[i].Type] = item.Item_ID[i].Value;
      }
    }
  }
  // console.dir(item, { depth: 5 });
  if (item.Platform) { resItem.Platform = item.Platform; }
  if (item.Title) { resItem.Title = item.Title; }
  if (item.Publisher) { resItem.Publisher = item.Publisher; }
  if (item.Section_Type) { resItem.Section_Type = item.Section_Type; }
  if (item.Access_Method) { resItem.Access_Method = item.Access_Method; }
  if (item.Access_Type) { resItem.Access_Type = item.Access_Type; }
  if (item.YOP) { resItem.YOP = item.YOP; }
  if (item.Publisher_ID) {
    for (let i = 0; i < item.Publisher_ID.length; i++) {
      if (item.Publisher_ID[i].Value) {
        resItem.Publisher_ID = `${item.Publisher_ID[i].Type}:${item.Publisher_ID[i].Value}`;
      }
    }
  }
  if (item.Performance) {
    for (let i = 0; i < item.Performance.length; i++) {
      const period = item.Performance[i].Period.Begin_Date;
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
  let sushiActions;
  try {
    data = fs.readFileSync(sushiFile);
    sushiActions = JSON.parse(data);
    // console.log(sushiActions);
  } catch (err) {
    if (err.code === 'ENOENT') { console.error('no ', sushiFile, ' file'); } else { console.error(err); }
  }
  return sushiActions;
}

module.exports = {
  // getReport: async (sushiURL, report, requestorId, customerId, beginDate, endDate) =>
  // sushiURL, report, requestorId, customerId, beginDate, endDate

  sushi5: async (sushiFile, opts) => {
    const sushiActions = readSushiFile(sushiFile);
    const sushiIndexPrefix = 'bibcnrs-sushi-5';

    let reportItems = [];
    // let reportHeader = {};
    const reportFile = opts.reportFile;
    if (!sushiActions) {
      console.error('Ficher sushi JSON non conforme : ', sushiFile);
      process.exit(1);
    }
    for (let action = 0; action < sushiActions.length; action++) {
      console.log('Recuperation sushi : ', sushiActions[action].accounts.length, 'operation(s) a effectuer');
      opts.report = sushiActions[action].report;
      opts.beginDate = sushiActions[action].beginDate;
      opts.endDate = sushiActions[action].endDate;
      opts.package = sushiActions[action].package;
      opts.vendor = sushiActions[action].vendor;
      for (let account = 0; account < sushiActions[action].accounts.length; account++) {
        opts.requestorId = sushiActions[action].accounts[account].requestorId;
        opts.customerId = sushiActions[action].accounts[account].customerId;
        if (sushiActions[action].accounts[account].package) {
          opts.package = sushiActions[action].accounts[account].package;
        }
        if (sushiActions[action].accounts[account].vendor) {
          opts.package = sushiActions[action].accounts[account].vendor;
        }
        console.log('Rapport : ', opts.report, '- debut : ', opts.beginDate, '- fin :', opts.endDate);
        console.log('Package : ', opts.package, '- vendor : ', opts.vendor);
        if (opts.reportFile) {
          // set filename for downloaded report
          opts.reportFile = `${reportFile}-${opts.report}-${opts.package}-${opts.vendor}`;
          opts.reportFile = `${opts.reportFile}-${opts.beginDate}-${opts.endDate}.json`;
        }
        try {
          const res = await sushiLib.getReport(sushiActions[action].sushiURL, opts);
          let resItems = [];
          if (res.status === 200) {
            if (res.data) {
              if (res.data.Report_Items && res.data.Report_Items.length) {
                reportItems = res.data.Report_Items;
                console.log('Rapport sushi : ', reportItems.length, 'elements reçus');
                if (!opts.bulk && opts.reportFile) {
                  // write sushi report file
                  writeReport(opts.reportFile, res.data);
                  console.log('Sauvegarde du rapport ', opts.reportFile);
                }
              } else {
                console.error('No items in report');
                console.dir(res.data, { depth: 5 });
              }
              // if (res.data.Report_Header) {
              //   reportHeader = res.data.Report_Header;
              //   console.dir(reportHeader);
              // } else {
              //   console.error('No header in report');
              // }
              if (opts.bulk) {
                for (let i = 0; i < reportItems.length; i++) {
                  // console.dir(reportItems[i], { depth: 5 });
                  resItems = transformItem(resItems, reportItems[i], opts);
                }
                // console.dir(resItems);
                let response = {};
                response = await counterLib.bulkInsertIndex(sushiIndexPrefix, resItems);
                if (response) {
                  console.log(response, ' insertion/mises à jour');
                } else {
                  console.log('Aucune insertion/mise à jour');
                }
              }
            }
          }
        } catch (error) {
          console.error(error);
          process.exit(1);
        }
      }
    }
  },
};
