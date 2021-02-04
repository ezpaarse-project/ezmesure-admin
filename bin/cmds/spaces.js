exports.command = 'spaces <command>';
exports.desc = 'Manage spaces <command>: get, add, edit, delete, list';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('spaces');
};
