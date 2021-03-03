exports.command = 'roles <command>';
exports.desc = 'Manage roles <command>: get, add, edit, delete, list';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('roles');
};
