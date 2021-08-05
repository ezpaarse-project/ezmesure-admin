const { i18n } = global;

exports.command = 'cluster <command>';
exports.desc = i18n.t('cluster.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('cluster')
    .demandCommand(1, 'You need at least one command before moving on');
};
