exports.command = 'sushi <command>';
exports.desc = 'Manage roles <command>: add, delete, list, report, test';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('sushi');
};
