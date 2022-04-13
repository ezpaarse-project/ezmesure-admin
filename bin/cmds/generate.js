const { i18n } = global;

exports.command = 'generate <command>';
exports.desc = i18n.t('generate.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('generate')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
