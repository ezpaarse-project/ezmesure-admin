exports.command = 'sushi <command>';
exports.desc = 'Manage sushi <command>: add, delete, list, info, test, export, import';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('sushi');
};
