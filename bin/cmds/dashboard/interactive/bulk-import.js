const inquirer = require('inquirer');
const autocomplete = require('inquirer-autocomplete-prompt');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

exports.autocomplete = async ({ message, choices, custom }) => inquirer.prompt([{
  type: 'autocomplete',
  pageSize: 20,
  name: 'choice',
  message,
  searchable: true,
  highlight: true,
  source: (answersSoFar, input) => new Promise((resolve) => {
    const results = choices.filter(
      ({ name }) => name?.toLowerCase?.().includes(input?.toLowerCase?.() || ''),
    );

    if (typeof custom === 'function' && input) {
      results.push(custom(input));
    }

    resolve(results);
  }),
}]).then((answers) => answers?.choice);

exports.selectMultiple = async ({ message, choices, default: defaultValue }) => inquirer.prompt([{
  type: 'checkbox-plus',
  pageSize: 20,
  name: 'choice',
  message,
  default: defaultValue,
  searchable: true,
  highlight: true,
  source: (answersSoFar, input) => new Promise((resolve) => {
    input = input ? input.toLowerCase() : '';

    resolve(choices.filter(({ name }) => name?.toLowerCase?.().includes(input)));
  }),
}]).then((answers) => answers?.choice);

exports.list = async ({ message, choices, default: defaultValue }) => inquirer.prompt([{
  type: 'list',
  name: 'choice',
  message,
  choices,
  default: defaultValue || 0,
}]).then((answers) => answers?.choice);
