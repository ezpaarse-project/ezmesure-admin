const { i18n } = global;

exports.command = 'indices <command>';
exports.desc = i18n.t('indices.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('indices');
};
