exports.command = 'export [institution]';
exports.desc = 'Export sushi data';
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: 'Institution name, case sensitive',
    type: 'string',
  }).option('o', {
    alias: 'output',
    describe: 'Output path',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }
};
