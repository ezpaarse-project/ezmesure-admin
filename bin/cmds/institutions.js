const { i18n } = global;

exports.command = 'institutions <command>';
exports.desc = i18n.t('institutions.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('institutions')
    .demandCommand(1, 'You need at least one command before moving on');
};
