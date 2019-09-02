const rison = require('rison-node');
const fs = require('fs');
const moment = require('moment');
const slugify = require('slugify');
const { smtp } = require('config');
const inquirer = require('inquirer');
const logger = require('../../lib/app/logger');
const reportingLib = require('../../lib/reporting');
const objectsLib = require('../../lib/objects');
const { sendMail, templates } = require('../../lib/app/mailer');

const generateRelativeUrl = (dashboard) => {
  try {
    const sourceJSON = JSON.parse(dashboard.attributes.kibanaSavedObjectMeta.searchSourceJSON);
    const panelsJSON = JSON.parse(dashboard.attributes.panelsJSON);
    const referencesData = dashboard.references;

    const filters = sourceJSON.filter;

    if (filters && filters.length > 0  && filters[0].meta) {
      const index = referencesData.find(ref => ref.name === filters[0].meta.indexRefName);
      filters[0].meta.index = index.id;
      delete filters[0].meta.indexRefName;
    }

    panelsJSON.forEach((panel) => {
      const reference = referencesData.find(ref => ref.name === panel.panelRefName);
      panel.type = reference.type;
      panel.id = reference.id;

      delete panel.panelRefName;
    });

    const _gData = {};

    if (dashboard.attributes.timeRestore) {
      _gData.refreshInterval = dashboard.attributes.refreshInterval;
      _gData.time = {
        from: dashboard.attributes.timeFrom,
        to: dashboard.attributes.timeTo,
      };
    }

    const _aData = {
      description: dashboard.attributes.description,
      filters,
      fullScreenMode: false,
      options: JSON.parse(dashboard.attributes.optionsJSON),
      panels: panelsJSON,
      query: sourceJSON.query,
      timeRestore: dashboard.attributes.timeRestore,
      title: dashboard.attributes.title,
      viewMode: 'view',
    };

    return `/app/kibana#/dashboard/${dashboard.id}?_g=${rison.encode(_gData)}&_a=${rison.encode(_aData)}`;
  } catch (error) {
    logger.error('An error occured during relativeUrl generation');
    return process.exit(1);
  }
};

const loadDashboards = async (opts) => {
  try {
    const { data: dashboards } = await objectsLib.findObjects('dashboard', opts);

    if (dashboards) {
      const choices = dashboards.saved_objects.map(dashboard => dashboard.attributes.title);
      let dashboardsToUse;

      if (choices) {
        await inquirer.prompt([{
          type: 'list',
          pageSize: 20,
          name: 'dashboardName',
          message: 'Dashboards',
          choices,
          highlight: true,
        }]).then((answers) => {
          dashboardsToUse = answers.dashboardName;
        });

        return dashboardsToUse;
      }
    }
  } catch (error) {
    logger.error('An error occured during dashboards recovery');
    return process.exit(1);
  }
  return null;
};

module.exports = {
  report: async (emails, opts) => {
    if (!Array.isArray(emails) || !emails) {
      logger.error('Please enter the target emails');
      return process.exit(1);
    }

    const dashboardName = await loadDashboards(opts);

    if (!dashboardName) {
      logger.error('No dashboard name selected');
      return process.exit(1);
    }

    let dashboard;
    try {
      dashboard = await objectsLib.findObjects('dashboard', { space: opts.space, title: dashboardName });
      if (dashboard && dashboard.data) {
        dashboard = dashboard.data.saved_objects.shift();
      }

      if (!dashboard) {
        logger.error('Dashboard doesn\'t exists');
        return process.exit(1);
      }
    } catch (error) {
      logger.error('Dashboard doesn\'t exists');
      return process.exit(1);
    }

    const relativeUrl = generateRelativeUrl(dashboard);

    const jobParams = rison.encode({
      objectType: 'dashboard',
      title: dashboard.attributes.title,
      browserTimezone: 'Europe/Paris',
      relativeUrls: [
        encodeURIComponent(relativeUrl),
      ],
      layout: {
        id: 'print',
      },
      timeout: '120000',
    });

    let reportJob;
    try {
      logger.info('Launching reporting generation');
      reportJob = await reportingLib.genereateReporting(jobParams, opts.space);
      reportJob = reportJob.data;
    } catch (error) {
      logger.error('Reporting generation failed');
      return process.exit();
    }

    if (!reportJob) {
      logger.error('Reporting generation failed');
      return process.exit();
    }

    if (reportJob && reportJob.path) {
      logger.info('Reporting generation started');

      let status = 'started';
      while (status === 'started' || status === 'pending' || status === 'processing') {
        logger.info(`Status: ${status}`);
        try {
          const { data: jobInfos } = await reportingLib.getJobInfos(reportJob.job.id, opts.space);
          // eslint-disable-next-line prefer-destructuring
          status = jobInfos.status;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          logger.error('Cannot get job infos');
          return process.exit();
        }
      }

      if (status === 'failed') {
        logger.info('Status: failed');
        logger.error('Reporting generation failed');
        return process.exit();
      }

      if (status === 'completed') {
        logger.info('Status: completed');
        logger.info('Donwloading reporting');

        const currentDate = moment().format('L');

        const reportName = slugify(`report_${currentDate}_${dashboard.attributes.title}.pdf`, '_');
        try {
          await reportingLib.downloadReporting(reportJob.job.id, opts.space).then(report => report.data.pipe(fs.createWriteStream(`./reports/${reportName}`)));
        } catch (error) {
          logger.error('An error occured during report downloading');
          return process.exit();
        }

        let shortUrl;
        try {
          shortUrl = await reportingLib.shortenUrl(relativeUrl, opts.space);
          shortUrl = shortUrl.data.urlId;
        } catch (error) {
          logger.error('An error occured during url shorten');
          return process.exit();
        }

        logger.info('Sending mail');
        try {
          const url = (opts.space ? `/s/${opts.space}` : '');

          await sendMail({
            from: smtp.sender,
            to: emails,
            cc: smtp.carbonCopy,
            subject: `Rapport PDF du ${currentDate}`,
            ...templates('report', {
              currentDate,
              shortUrl,
              url,
            }),
          }, `${reportName}`);
        } catch (error) {
          console.log(error)
          logger.error('An error occured during mail sending');
          return process.exit();
        }
      }
    }
    return null;
  },
};
