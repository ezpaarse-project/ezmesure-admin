const { i18n } = global;

exports.command = 'config <command>';
exports.desc = i18n.t('config.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('config')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
