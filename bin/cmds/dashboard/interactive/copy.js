const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const spacesLib = require('../../../../lib/spaces');
const dashboardLib = require('../../../../lib/dashboards');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

module.exports = async function it() {
  let spaces;
  try {
    const { data } = await spacesLib.findAll();
    spaces = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  const { spaceSelected } = await inquirer.prompt([{
    type: 'autocomplete',
    pageSize: 20,
    name: 'spaceSelected',
    message: i18n.t('spaces.spaceSelect'),
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input ? input.toLowerCase() : '';

      const result = spaces
        .map(({ id, name }) => ({ name, value: id }))
        .filter(({ name }) => name.toLowerCase().includes(input));

      resolve(result);
    }),
  }]);
  const spaceId = spaceSelected === 'default' ? null : spaceSelected;

  let dashboards;
  try {
    const { data } = await dashboardLib.findAll(spaceId);
    dashboards = data;
  } catch (error) {
    console.error(error);
  }

  const { dashboardId } = await inquirer.prompt([{
    type: 'autocomplete',
    pageSize: 20,
    name: 'dashboardId',
    message: i18n.t('dashboard.dashboardsCheckbox'),
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input ? input.toLowerCase() : '';

      const result = dashboards
        .map(({ id, attributes }) => ({ name: attributes.title, value: id }))
        .filter(({ name }) => name.toLowerCase().includes(input));

      resolve(result);
    }),
  }]);

  if (!dashboardId.length) {
    console.log(i18n.t('dashboard.noDashaboardsSelected'));
    process.exit(0);
  }

  const { targetSelected } = await inquirer.prompt([{
    type: 'autocomplete',
    pageSize: 20,
    name: 'targetSelected',
    message: i18n.t('spaces.spaceSelect'),
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input ? input.toLowerCase() : '';

      const result = spaces
        .map(({ id, name }) => ({ name, value: id }))
        .filter(({ name }) => name.toLowerCase().includes(input));

      resolve(result);
    }),
  }]);
  const targetId = targetSelected === 'default' ? null : targetSelected;

  const { indexPattern } = await inquirer.prompt([{
    type: 'input',
    name: 'indexPattern',
    message: 'Index pattern',
  }]);

  return {
    spaceId, dashboardId, targetId, indexPattern,
  };
};
