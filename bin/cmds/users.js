exports.command = 'users <command>';
exports.desc = 'Manage users <command>: list, get, roles';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('users');
};
