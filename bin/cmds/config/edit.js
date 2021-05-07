const { i18n } = global;

const fs = require('fs-extra');
const { prompt } = require('enquirer');
const { spawn } = require('child_process');
const scopes = require('../../../lib/app/config').getScopes();

exports.command = 'edit';
exports.desc = i18n.t('config.edit.description');
exports.builder = function builder(yargs) {
  return yargs.option('global', {
    alias: 'g',
    describe: i18n.t('config.edit.options.global'),
    boolean: true,
  }).option('interactive', {
    alias: 'i',
    describe: i18n.t('config.edit.options.interactive'),
    boolean: true,
  }).option('editor', {
    alias: 'e',
    describe: i18n.t('config.edit.options.editor'),
  });
};
exports.handler = async function handler(argv) {
  const scope = scopes[argv.global ? 'global' : 'local'];
  const editor = argv.editor || process.env.EDITOR || (/^win/.test(process.platform) ? 'notepad' : 'vi');

  if (!argv.interactive) {
    const args = editor.split(/\s+/);
    const bin = args.shift();

    spawn(bin, [...args, scope.location], { stdio: 'inherit' });
    return;
  }

  await fs.ensureFile(scope.location);

  /**
   * Select an option to edit
   */
  function selectAction() {
    const options = [
      {
        type: 'input',
        name: 'baseUrl',
        message: i18n.t('config.edit.baseUrl'),
        initial: scope.config.baseUrl,
      },
      {
        type: 'input',
        name: 'token',
        message: i18n.t('config.edit.token'),
        initial: scope.config.token,
      },
      {
        type: 'numeral',
        name: 'timeout',
        message: i18n.t('config.edit.timeout'),
        initial: scope.config.timeout,
        result: (val) => Number.parseInt(val, 10),
      },
    ];

    return prompt({
      type: 'select',
      name: 'action',
      message: i18n.t('config.edit.whatDoYouWant'),
      choices: options.map((o) => ({
        name: o.name,
        hint: o.message,
      })),
      result(name) {
        return options.find((opt) => opt.name === name);
      },
    });
  }

  let action;
  try {
    ({ action } = await selectAction());
  } catch (e) {
    action = null;
  }

  while (action) {
    let response;
    try {
      response = await prompt(action);
    } catch (e) {
      response = {};
    }

    if (Object.hasOwnProperty.call(response, action.name)) {
      scope.config[action.name] = response[action.name];
    }

    await fs.writeFile(scope.location, JSON.stringify(scope.config, null, 2));

    try {
      ({ action } = await selectAction());
    } catch (e) {
      action = null;
    }
  }
};
