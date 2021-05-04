const { i18n } = global;

exports.command = 'spaces <command>';
exports.desc = i18n.t('spaces.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('spaces');
};
