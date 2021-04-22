exports.command = 'counter5 <command>';
exports.desc = 'counter5 <command>: reports';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('counter5');
};
