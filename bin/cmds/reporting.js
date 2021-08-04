const { i18n } = global;

exports.command = 'reporting <command>';
exports.desc = i18n.t('reporting.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('reporting')
    .demandCommand(1, 'You need at least one command before moving on')
    .parse();
};
