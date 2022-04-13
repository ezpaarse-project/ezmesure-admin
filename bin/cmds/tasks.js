const { i18n } = global;

exports.command = 'tasks <command>';
exports.desc = i18n.t('tasks.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('tasks')
    .strictCommands(false)
    .demandCommand(1, 'You need at least one command before moving on');
};
