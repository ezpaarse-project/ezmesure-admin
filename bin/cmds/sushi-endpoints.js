const { i18n } = global;

exports.command = 'sushi-endpoints <command>';
exports.desc = i18n.t('sushiEndpoints.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('sushi-endpoints')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
