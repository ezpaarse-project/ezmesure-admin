const { i18n } = global;

exports.command = 'dashboard <command>';
exports.desc = i18n.t('dashboard.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('dashboard')
    .demandCommand(1, 'You need at least one command before moving on')
    .parse();
};
