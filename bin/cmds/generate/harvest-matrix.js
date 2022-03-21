const { i18n } = global;

const Papa = require('papaparse');

const tasksLib = require('../../../lib/tasks');

exports.command = 'harvest-matrix';
exports.desc = i18n.t('generate.harvestMatrix.description');
exports.builder = function builder(yargs) {
  return yargs;
};
exports.handler = async function handler() {
  let tasks;

  try {
    ({ data: tasks } = await tasksLib.getAll({ collapse: 'params.sushiId' }));
  } catch (e) {
    const errorMessage = e?.response?.data?.error;
    const status = e?.response?.status;
    const statusMessage = e?.response?.statusMessage;

    console.error(`[${status}] ${errorMessage || statusMessage || e.message}`);
    process.exit(1);
  }

  const lines = tasks.map((task) => {
    const params = task?.params || {};
    const result = task?.result || {};
    const steps = Array.isArray(task?.steps) ? task.steps : [];

    const downloadStep = steps.find((step) => step?.label === 'download');
    const validationStep = steps.find((step) => step?.label === 'validation');
    const insertStep = steps.find((step) => step?.label === 'insert');

    return [
      params.institutionName,
      params.endpointVendor,

      Number.isInteger(task?.runningTime) ? task.runningTime : '',
      Number.isInteger(downloadStep?.took) ? downloadStep.took : '',
      Number.isInteger(validationStep?.took) ? validationStep.took : '',
      Number.isInteger(insertStep?.took) ? insertStep.took : '',

      Number.isInteger(result?.inserted) ? result.inserted : '',
      Number.isInteger(result?.updated) ? result.updated : '',
      Number.isInteger(result?.failed) ? result.failed : '',
    ];
  });

  console.log(Papa.unparse(lines));
};
