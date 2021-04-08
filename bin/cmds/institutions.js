exports.command = 'institutions <command>';
exports.desc = 'Manage institutions <command>: list, get, export, import';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('institutions');
};
