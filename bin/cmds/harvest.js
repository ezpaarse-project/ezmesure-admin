const { i18n } = global;

exports.command = 'harvest [command]';
exports.desc = i18n.t('harvest.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('harvest')
    .strictCommands(false);
};
