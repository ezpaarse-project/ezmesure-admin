exports.command = 'roles <command>';
exports.desc = 'Manage users roles <command>: add, delete, list';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('roles');
};
