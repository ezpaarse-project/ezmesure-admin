exports.command = 'dashboard <command>';
exports.desc = 'Manage dashboard with a <command>: import, export';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('dashboard');
};
