const { i18n } = global;

exports.command = 'queues <command>';
exports.desc = i18n.t('queues.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('queues')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
