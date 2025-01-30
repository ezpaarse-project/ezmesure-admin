const { i18n } = global;

const { resolve } = require('node:path');
const { createWriteStream } = require('node:fs');
const chalk = require('chalk');
const { parseISO, format: formatDate, formatDistance } = require('date-fns');

const { formatApiError, readAllStdinAsJson } = require('../../../lib/utils');
const tasksLib = require('../../../lib/tasks');

exports.command = 'summary [harvestId]';
exports.desc = i18n.t('harvest.summary.description');
exports.builder = (yargs) => yargs
  .positional('harvestId', {
    describe: i18n.t('harvest.status.options.harvestId'),
    type: 'string',
  }).option('output-details', {
    describe: i18n.t('harvest.summary.options.outputDetails'),
    alias: 'od',
    type: 'string',
  }).option('output-reharvest', {
    describe: i18n.t('harvest.summary.options.outputReharvest'),
    alias: 'or',
    type: 'string',
  });

const numberFormatter = new Intl.NumberFormat();

/**
 * Is given job in error state
 *
 * @param {object} job
 * @param {string} job.status
 *
 * @returns {boolean} Is job in error state
 */
const isJobError = (job) => !['finished', 'running', 'delayed', 'waiting'].includes(job.status);

/**
 * Format a number
 *
 * @param {number} value
 *
 * @returns {string} Formatted number
 */
const formatValue = (value) => numberFormatter.format(value).padStart(6, ' ');

/**
 * Format a percentage
 *
 * @param {number} value
 * @param {number} total
 *
 * @returns {string} Formatted percentage
 */
const formatPercentage = (value, total) => `${((value / total) * 100).toFixed(2)}%`.padStart(7, ' ');

/**
 * Format a job's status count
 *
 * @param {number} count Count of jobs with given status
 * @param {number} total Total number of jobs
 *
 * @returns {string} Formatted status count
 */
const formatStatusCount = (count, total) => `${formatValue(count)} (${formatPercentage(count, total)})`;

/**
 * Format an error count
 *
 * @param {string} code Code of the error
 * @param {number} count Count of jobs with given error
 * @param {number} total Total number of jobs
 *
 * @returns {string} Formatted error count
 */
const formatErrorCount = (code, count, total) => `${code.padEnd(30, ' ')} ${formatValue(count)} (${formatPercentage(count, total)})`;

/**
 * Print general informations about jobs
 *
 * @param {object[]} jobs List of jobs
 */
function printGeneralInformations(jobs) {
  let minTime = Number.MAX_SAFE_INTEGER;
  let maxTime = Number.MIN_SAFE_INTEGER;
  for (const job of jobs) {
    if (job.updatedAt) {
      const jobTime = parseISO(job.updatedAt).getTime();
      minTime = Math.min(minTime, jobTime);
      maxTime = Math.max(maxTime, jobTime);
    }
  }

  const hasMinTime = minTime !== Number.MAX_SAFE_INTEGER;
  const hasMaxTime = maxTime !== Number.MIN_SAFE_INTEGER;

  console.group();
  console.log([
    hasMinTime && `${chalk.underline('Started:')} ${formatDate(minTime, 'dd/MM/yyyy HH:mm:ss')}`,
    hasMaxTime && `${chalk.underline('Ended:')} ${formatDate(maxTime, 'dd/MM/yyyy HH:mm:ss')}`,
    hasMinTime && hasMaxTime && `${chalk.underline('Duration:')} ${formatDistance(maxTime, minTime)}`,
  ].filter((e) => !!e).join(' | '));
  console.groupEnd();
}

/**
 * Print statuses count
 *
 * @param {object[]} jobs List of jobs
 */
function printStatusesCount(jobs) {
  const statuses = {
    success: 0,
    running: 0,
    pending: 0,
    error: 0,
  };

  // Group jobs by status
  for (const job of jobs) {
    let status;
    switch (job.status) {
      case 'finished':
        status = 'success';
        break;
      case 'running':
      case 'delayed':
        status = 'running';
        break;
      case 'waiting':
        status = 'pending';
        break;
      default:
        status = 'error';
        break;
    }

    const count = statuses[status] || 0;
    statuses[status] = count + 1;
  }

  // Print counts
  console.group();
  if (statuses.success) { console.log(chalk.green(`✓ ${formatStatusCount(statuses.success, jobs.length)}`)); }
  if (statuses.error) { console.log(chalk.red(`x ${formatStatusCount(statuses.error, jobs.length)}`)); }
  if (statuses.running) { console.log(chalk.blue(`▶ ${formatStatusCount(statuses.running, jobs.length)}`)); }
  if (statuses.pending) { console.log(chalk.grey(`. ${formatStatusCount(statuses.pending, jobs.length)}`)); }
  console.groupEnd();
}

/**
 * Print errors count
 *
 * @param {object[]} jobs List of jobs
 */
function printErrors(jobs) {
  const errors = new Map();

  // Count errors
  for (const job of jobs) {
    // eslint-disable-next-line no-continue
    if (!isJobError(job)) { continue; }

    const code = job.errorCode || 'unknown';
    const count = errors.get(code) || 0;
    errors.set(code, count + 1);
  }

  // Print counts
  console.group();
  for (const [code, count] of Array.from(errors.entries()).sort(([, a], [, b]) => b - a)) {
    console.log(formatErrorCount(code, count, jobs.length));
  }
  console.groupEnd();
}

/**
 * Group jobs by endpoint
 *
 * @param {object[]} jobs
 *
 * @returns A map with endpoint id as key, and endpoint (with jobs) as value
 */
function groupJobsByEndpoint(jobs) {
  const endpoints = new Map();

  for (const job of jobs) {
    const { jobs: jobsOfEndpoint } = endpoints.get(job.credentials.endpointId) || { jobs: [] };
    jobsOfEndpoint.push(job);
    endpoints.set(
      job.credentials.endpointId,
      { ...job.credentials.endpoint, jobs: jobsOfEndpoint },
    );
  }

  return new Map(
    Array.from(endpoints.entries()).sort(([, a], [, b]) => a.vendor.localeCompare(b.vendor)),
  );
}

/**
 * Group jobs by credentials
 *
 * @param {object[]} jobs
 *
 * @returns A map with credentials id as key, and credentials (with jobs) as value
 */
function groupJobsByCredential(jobs) {
  const credentials = new Map();

  for (const job of jobs) {
    const { jobs: jobsOfCredentials } = credentials.get(job.credentialsId) || { jobs: [] };
    jobsOfCredentials.push(job);
    credentials.set(job.credentialsId, { ...job.credentials, jobs: jobsOfCredentials });
  }

  return new Map(
    Array.from(credentials.entries()).sort(
      ([, a], [, b]) => a.institution.name.localeCompare(b.institution.name)
        || a.packages.join(',').localeCompare(b.packages.join(',')),
    ),
  );
}

/**
 * Group jobs by report
 *
 * @param {object[]} jobs
 *
 * @returns A map with report id as key, jobs as value
 */
function groupJobsByReport(jobs) {
  const reports = new Map();

  for (const job of jobs) {
    const jobsOfReport = reports.get(job.reportType) || [];
    jobsOfReport.push(job);
    reports.set(job.reportType, jobsOfReport);
  }

  return new Map(
    Array.from(reports.entries()).sort(([a], [b]) => a.localeCompare(b)),
  );
}

/**
 * Group jobs by error code
 *
 * @param {object[]} jobs
 *
 * @returns A map with error code as key, jobs as value
 */
function groupJobsByError(jobs) {
  const errors = new Map();

  for (const job of jobs) {
    // eslint-disable-next-line no-continue
    if (!isJobError(job)) { continue; }

    const jobsOfError = errors.get(job.errorCode) || [];
    jobsOfError.push(job);
    errors.set(job.errorCode, jobsOfError);
  }

  return errors;
}

/**
 * Print endpoints with unsupported reports
 *
 * @param {object[]} jobs List of jobs
 */
async function printUnsupportedReports(jobs) {
  console.group();
  const endpoints = groupJobsByEndpoint(jobs);
  for (const [, endpoint] of endpoints) {
    const reports = groupJobsByReport(endpoint.jobs);
    const unsupportedReports = new Set();

    for (const [report, jobsOfReport] of reports) {
      // If endpoint specify report as unsupported for everyone
      if (jobsOfReport.every((job) => job.errorCode === 'sushi:3000')) {
        unsupportedReports.add(report);
      }

      // If endpoint says there's no data, for everyone
      if (jobsOfReport.length > 1 && jobsOfReport.every((job) => job.errorCode === 'sushi:3030')) {
        const { 'x-total-count': totalCount } = (await tasksLib.getAll({
          endpointId: endpoint.id,
          reportType: report,
          status: 'finished',
        })).headers;

        // If we never succeed to harvest that report for that endpoint,
        // we can safely say it's unsupported
        if (totalCount === '0') {
          unsupportedReports.add(report);
        }
      }
    }

    if (unsupportedReports.size > 0) {
      console.log(`${chalk.underline(endpoint.vendor)}: ${Array.from(unsupportedReports).join(chalk.grey(', '))}`);
    }
  }
  console.groupEnd();
}

/**
 * Print endpoints with problematic reports, i.e. reports with invalid JSON
 *
 * @param {object[]} jobs
 * @param {string} errorCode The error code to look for
 */
function printProblematicReports(jobs, errorCode) {
  console.group();
  const endpoints = groupJobsByEndpoint(jobs);
  for (const [, endpoint] of endpoints) {
    const invalidJSONJobs = endpoint.jobs.filter((job) => job.errorCode === errorCode);
    const errors = [];

    if (invalidJSONJobs.length > 0) {
      const totalCount = groupJobsByCredential(endpoint.jobs).size;
      const credentials = groupJobsByCredential(invalidJSONJobs);

      const invalidReports = [];
      const credStr = [];
      for (const [, creds] of credentials) {
        const reports = new Set(creds.jobs.map((job) => job.reportType));
        invalidReports.push(...reports);

        let str = creds.institution.name;
        if (creds.packages.length > 0) {
          str += chalk.grey(` ${creds.packages.join(chalk.grey(', '))}`);
        }
        credStr.push(`${str} : ${Array.from(reports).join(chalk.grey(', '))}`);

        errors.push(...creds.jobs.flatMap(
          (job) => job.logs
            .filter((l) => l.level === 'error')
            .map((l) => l.message),
        ));
      }

      console.log(chalk.underline(endpoint.vendor));
      console.log(`* Affected credentials: ${formatPercentage(credentials.size, totalCount)}`);
      console.log(`* Reports: ${Array.from(new Set(invalidReports.sort())).join(chalk.grey(', '))}`);
      console.log(`* Errors: ${Array.from(new Set(errors)).join(chalk.grey(' | '))}`);
      console.group();
      credStr.map((str) => console.log(str));
      console.groupEnd();
    }
  }
  console.groupEnd();
}

function writeHarvestableCredentials(jobs, path) {
  const credentials = groupJobsByCredential(jobs);

  const failedInstitutions = new Map();

  for (const [, creds] of credentials) {
    const reports = groupJobsByReport(creds.jobs);

    const failedReports = new Map();
    for (const [report, jobsOfReport] of reports) {
      if (creds.endpoint.ignoredReports.includes(report)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (jobsOfReport.every((j) => isJobError(j))) {
        failedReports.set(report, jobsOfReport);
      }
    }

    if (failedReports.size > 0) {
      const institution = failedInstitutions.get(creds.institutionId)
        || { ...creds.institution, failedEndpoints: new Map() };

      const endpoint = institution.failedEndpoints.get(creds.endpointId)
        || { ...creds.endpoint, failedReports: undefined };

      endpoint.failedReports = failedReports;

      institution.failedEndpoints.set(creds.endpointId, endpoint);
      failedInstitutions.set(creds.institutionId, institution);
    }
  }

  const sessions = [];
  for (const [, institution] of failedInstitutions) {
    const failedEndpoints = Array.from(institution.failedEndpoints.values());
    const reports = failedEndpoints.flatMap(
      (endpoint) => Array.from(endpoint.failedReports.keys()),
    );

    sessions.push({
      // TODO: id
      // TODO: start
      // TODO: end
      reportTypes: Array.from(new Set(reports)),
      institutions: [
        {
          id: institution.id,
          name: institution.name,
        },
      ],
      endpoints: failedEndpoints.map((endpoint) => ({
        id: endpoint.id,
        vendor: endpoint.vendor,
        failedReports: Array.from(endpoint.failedReports.keys()).sort().map((r) => r.toUpperCase()),
      })),
    });
  }
  const stream = createWriteStream(path);
  stream.write(JSON.stringify(sessions, null, 2));
  stream.close();
}

function writeDetails(jobs, path, format) {
  const endpoints = groupJobsByEndpoint(jobs);
  const endpointsWithErrors = [];

  for (const [, endpoint] of endpoints) {
    const reports = groupJobsByReport(endpoint.jobs);
    let credentialCount = 0;
    const reportsWithErrors = [];

    for (const [report, jobsOfReport] of reports) {
      const errors = groupJobsByError(jobsOfReport);
      if (errors.size > 0) {
        credentialCount = new Set(jobsOfReport.map((j) => j.credentialsId)).size;
        reportsWithErrors.push({
          report,
          jobCount: jobsOfReport.length,
          errors,
        });
      }
    }

    if (reportsWithErrors.length > 0) {
      endpointsWithErrors.push({
        endpoint: { ...endpoint, jobs: undefined },
        credentialCount,
        reports: reportsWithErrors,
      });
    }
  }

  const stream = createWriteStream(path);

  if (format === 'json') {
    stream.write(JSON.stringify(endpointsWithErrors, null, 2));
  }

  if (format === 'text') {
    for (const { endpoint, credentialCount, reports } of endpointsWithErrors) {
      stream.write(`${endpoint.vendor}\n`);
      stream.write(`* Count of credentials: ${credentialCount}\n`);
      for (const { report, jobCount, errors } of reports) {
        stream.write(`\t${report}\n`);
        for (const [errorCode, jobsOfError] of errors) {
          stream.write(`\t\t${(errorCode || 'unknown').padEnd(20)} ${formatValue(jobsOfError.length)} (${formatPercentage(jobsOfError.length, jobCount)})\n`);
        }
      }
    }
  }

  stream.close();
}

exports.handler = async function handler(argv) {
  const {
    harvestId,
    verbose,
    outputReharvest,
    outputDetails,
  } = argv;

  let sessions = [];
  if (harvestId) {
    sessions = [{ harvestId }];
  }

  const stdinSessions = await readAllStdinAsJson();
  if (stdinSessions) {
    sessions = Array.isArray(stdinSessions) ? stdinSessions : [stdinSessions];
  }

  // Get jobs of every session provided
  const jobs = [];
  for (const params of sessions) {
    try {
      const hid = params.harvestId || params.id;
      if (verbose) {
        process.stderr.write(`${chalk.stderr.grey(`Getting jobs of ${hid}...`)}\n`);
      }

      const tasks = (await tasksLib.getAll({
        sessionId: hid,
        include: ['credentials.endpoint', 'credentials.institution', 'logs'],
      })).data;
      jobs.push(...tasks);
    } catch (error) {
      console.error(chalk.red(formatApiError(error)));
      process.exit(1);
    }
  }

  console.log();

  console.log(chalk.bold('About session(s):'));
  printGeneralInformations(jobs);

  console.log(chalk.bold('Status:'));
  printStatusesCount(jobs);

  console.log(chalk.bold('Errors:'));
  printErrors(jobs);

  console.log('-----');
  console.log(chalk.bold('Endpoints with unsupported reports:'));
  await printUnsupportedReports(jobs);

  console.log(chalk.bold('Reports with invalid JSON:'));
  printProblematicReports(jobs, 'invalid_json');

  console.log(chalk.bold('Reports with invalid data:'));
  printProblematicReports(jobs, 'invalid_report');

  if (outputReharvest) {
    writeHarvestableCredentials(jobs, outputReharvest);
    console.log();
    console.log(chalk.bgBlue(`Wrote reharvest in ${resolve(outputReharvest)}`));
  }

  if (outputDetails) {
    writeDetails(jobs, outputDetails);
    console.log();
    console.log(chalk.bgBlue(`Wrote details in ${resolve(outputDetails)}`));
  }
};
