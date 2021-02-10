exports.command = 'shard <command>';
exports.desc = 'Manage shards <command>: allocation';
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('shard');
};
