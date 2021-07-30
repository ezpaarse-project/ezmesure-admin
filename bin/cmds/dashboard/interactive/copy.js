const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const spacesLib = require('../../../../lib/spaces');
const dashboardLib = require('../../../../lib/dashboards');

const { handler: createIndex } = require('../../indices/add');
const { handler: createIndexPattern } = require('../../index-pattern/add');

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
  const spaceId = spaceSelected === '' ? undefined : spaceSelected;

  let dashboards;
  try {
    const { data } = await dashboardLib.findAll(spaceId);
    dashboards = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  const { dashboardsId } = await inquirer.prompt([{
    type: 'checkbox-plus',
    pageSize: 20,
    name: 'dashboardsId',
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

  if (!dashboardsId.length) {
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

  let indexPattern;
  let indexPatternList;
  try {
    const { data } = await spacesLib.getIndexPatterns(targetId);
    indexPatternList = data.map(({ id, attributes }) => ({ id, name: attributes.title }));
  // eslint-disable-next-line no-empty
  } catch (error) {}

  if (indexPatternList.length) {
    const { indexPatternSelected } = await inquirer.prompt([{
      type: 'autocomplete',
      pageSize: 20,
      name: 'indexPatternSelected',
      message: i18n.t('dashboard.copy.indexPatternSelect'),
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input ? input.toLowerCase() : '';

        const result = indexPatternList
          .map(({ id, name }) => ({ name, value: id }))
          .filter(({ name }) => name.toLowerCase().includes(input));

        resolve(result);
      }),
    }]);

    const indexPatternData = indexPatternList.find(({ id }) => id === indexPatternSelected);

    indexPattern = indexPatternData?.name;
  }

  if (!indexPatternList.length) {
    const { indexPatternSelected } = await inquirer.prompt([{
      type: 'input',
      name: 'indexPatternSelected',
      message: i18n.t('dashboard.copy.indexPatternInput'),
    }]);

    console.log(i18n.t('dashboard.copy.indexDoesNotExists', { index: indexPatternSelected }));

    // create indice and index-pattern
    let index = indexPatternSelected;
    if (indexPatternSelected.substr(indexPatternSelected.length - 2) === '-*') {
      index = indexPatternSelected.substr(indexPatternSelected.length - 2);
    }
    await createIndex({ index });
    await createIndexPattern({ space: targetId, title: indexPatternSelected });

    indexPattern = indexPatternSelected;
  }

  return {
    spaceId, dashboardsId, targetId, indexPattern,
  };
};
