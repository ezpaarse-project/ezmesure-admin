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

function readSushiFile(sushiFile) {
  let data;
  let sushiActions;
  try {
    data = fs.readFileSync(sushiFile);
    sushiActions = JSON.parse(data);
    console.log(sushiActions);
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

    let reportItems = [];
    let reportHeader = {};
    let resItems = [];
    console.log(sushiActions.length);
    for (let action = 0; action < sushiActions.length; action++) {
      opts.report = sushiActions[action].report;
      opts.beginDate = sushiActions[action].beginDate;
      opts.endDate = sushiActions[action].endDate;
      opts.package = sushiActions[action].package;
      for (let account = 0; account < sushiActions[action].accounts.length; account++) {
        opts.requestorId = sushiActions[action].accounts[account].requestorId;
        opts.customerId = sushiActions[action].accounts[account].customerId;
        if (sushiActions[action].accounts[account].package) {
          opts.package = sushiActions[action].accounts[account].package;
        }
        try {
          const res = await sushiLib.getReport(sushiActions[action].sushiURL, opts);
          if (res.status === 200) {
            if (res.data) {
              if (res.data.Report_Items && res.data.Report_Items.length) {
                reportItems = res.data.Report_Items;
                console.log('Rapport sushi : ', reportItems.length, 'elements reçus');
              } else {
                console.error('No items in report');
                console.dir(res.data, { depth: 5 });
              }
              if (res.data.Report_Header) {
                reportHeader = res.data.Report_Header;
                // console.dir(reportHeader);
              } else {
                console.error('No header in report');
              }
              for (let i = 0; i < reportItems.length; i++) {
                // console.dir(reportItems[i], { depth: 5 });
                resItems = transformItem(resItems, reportItems[i], opts);
              }
              // console.dir(resItems);
              const response = await counterLib.bulkInsertIndex('bibcnrs-sushi5', resItems);
              if (response) {
                console.log(response, ' insertion/mises à jour');
              } else {
                console.log('Aucune insertion/mise à jour');
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
