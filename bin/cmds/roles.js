const { i18n } = global;

exports.command = 'roles <command>';
exports.desc = i18n.t('roles.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('roles');
};
