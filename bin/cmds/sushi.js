const { i18n } = global;

exports.command = 'sushi <command>';
exports.desc = i18n.t('sushi.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('sushi');
};
