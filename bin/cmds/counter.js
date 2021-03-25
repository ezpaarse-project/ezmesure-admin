exports.command = 'counter4 <JR1file>';
exports.desc = 'output an expanded JSON file or load a COUNTER 4 JR1 file into ezMESURE / KIBANA (bluk)';
exports.builder = function builder(yargs) {
  return yargs.option('b', {
    alias: 'bulk',
    describe: 'bulk index JR1 data',
    type: 'string',
  }).option('c', {
    alias: 'counter-package',
    describe: 'JR1 package (do not try to guess from file name)',
    type: 'string',
  }).option('d', {
    alias: 'depositor',
    describe: 'Index prefix name for publisher index',
    type: 'string',
  }).option('n', {
    alias: 'ndjson',
    describe: 'only output newline delimited JSON file',
    type: 'boolean',
  });
};
exports.handler = function handler(argv) {
  
};
