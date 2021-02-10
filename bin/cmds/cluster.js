exports.command = 'cluster <command>';
exports.desc = 'Manage cluster <command>: settings, flush, shard';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('cluster');
};
