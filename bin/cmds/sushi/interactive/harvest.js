const inquirer = require('inquirer');
const autocomplete = require('inquirer-autocomplete-prompt');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

exports.autocomplete = async (message, choices) => inquirer.prompt([{
  type: 'autocomplete',
  pageSize: 20,
  name: 'choice',
  message,
  searchable: true,
  highlight: true,
  source: (answersSoFar, input) => new Promise((resolve) => {
    input = input?.toLowerCase?.() || '';

    resolve(choices.filter(({ name }) => name.toLowerCase().includes(input)));
  }),
}]).then((answers) => answers?.choice);

exports.selectMultiple = async (message, choices, defaultValue) => inquirer.prompt([{
  type: 'checkbox-plus',
  pageSize: 20,
  name: 'choice',
  message,
  default: defaultValue,
  searchable: true,
  highlight: true,
  source: (answersSoFar, input) => new Promise((resolve) => {
    input = input ? input.toLowerCase() : '';

    resolve(choices.filter(({ name }) => name.toLowerCase().includes(input)));
  }),
}]).then((answers) => answers?.choice);

exports.list = async (message, choices, defaultValue) => inquirer.prompt([{
  type: 'list',
  name: 'choice',
  message,
  choices,
  default: defaultValue || 0,
}]).then((answers) => answers?.choice);

exports.input = async ({ message, default: defaultValue, validate }) => inquirer.prompt([{
  type: 'input',
  name: 'choice',
  message,
  validate,
  default: defaultValue,
}]).then((answers) => answers?.choice);

exports.confirm = async (message, defaultValue) => inquirer.prompt([{
  type: 'confirm',
  name: 'choice',
  message,
  default: defaultValue,
}]).then((answers) => answers?.choice);
