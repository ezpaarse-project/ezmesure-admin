const { i18n } = global;

exports.command = 'migrate <command>';
exports.desc = i18n.t('migrate.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('migrate')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
