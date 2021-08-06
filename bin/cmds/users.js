const { i18n } = global;

exports.command = 'users <command>';
exports.desc = i18n.t('users.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('users')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
