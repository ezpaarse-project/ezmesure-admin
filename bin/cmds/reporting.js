exports.command = 'reporting <command>';
exports.desc = 'Manage reporting <command>: list, report';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('reporting');
};
