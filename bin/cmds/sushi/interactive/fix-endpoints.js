const { i18n } = global;

const inquirer = require('inquirer');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('autocomplete', autocomplete);

exports.selectEndpoint = async (endpoints) => inquirer.prompt([{
  type: 'autocomplete',
  pageSize: 20,
  name: 'endpoint',
  message: i18n.t('sushi.fixEndpoints.selectEndpoint'),
  searchable: true,
  highlight: true,
  source: (answersSoFar, input) => new Promise((resolve) => {
    input = input?.toLowerCase?.() || '';

    let result = endpoints
      .filter(({ vendor }) => vendor.toLowerCase().includes(input))
      .map(({ vendor, id }) => ({ name: vendor, value: id }));

    if (result.length === 0) {
      result = [
        {
          name: i18n.t('sushi.fixEndpoints.createEndpoint'),
          value: '$createEndpoint',
        },
        {
          name: i18n.t('sushi.fixEndpoints.ignoreSushiItem'),
          value: '$ignoreItem',
        },
      ];
    }

    resolve(result);
  }),
}]).then((answers) => answers?.endpoint);

exports.input = async (message, defaultValue) => inquirer.prompt([{
  type: 'input',
  name: 'choice',
  message,
  default: defaultValue,
}]).then((answers) => answers?.choice);

exports.confirm = async (message, defaultValue) => inquirer.prompt([{
  type: 'confirm',
  name: 'choice',
  message,
  default: defaultValue,
}]).then((answers) => answers?.choice);
