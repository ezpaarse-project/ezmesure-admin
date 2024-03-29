const { i18n } = global;

exports.command = 'counter5 <command>';
exports.desc = i18n.t('counter5.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('counter5')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
