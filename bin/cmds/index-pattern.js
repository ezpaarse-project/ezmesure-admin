const { i18n } = global;

exports.command = 'index-pattern <command>';
exports.desc = i18n.t('indexPattern.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('index-pattern')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
