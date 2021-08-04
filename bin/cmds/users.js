const { i18n } = global;

exports.command = 'users <command>';
exports.desc = i18n.t('users.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('users').parse();
};
