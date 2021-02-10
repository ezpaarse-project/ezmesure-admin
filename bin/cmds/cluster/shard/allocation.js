const { setShardAllocation } = require('../../../../lib/cluster');

exports.command = 'allocation <type>';
exports.desc = 'Enable or disable allocation for specific kinds of elasticsearch shards.';
exports.builder = function builder(yargs) {
  return yargs.positional('type', {
    describe: 'Can be : all, primaries, new_primaries, none, null',
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const validValues = new Set(['primaries', 'new_primaries', 'all', 'none', 'null']);

  let { type } = argv;

  if (!validValues.has(type)) {
    console.log().error(`Invalid value "${type}", valid values are : ${Array.from(validValues).join(', ')}`);
    process.exit(1);
  }

  if (type === 'null') {
    type = null;
  }

  let response;
  try {
    const { body } = await setShardAllocation(type);
    response = body;
  } catch (e) {
    const dataError = e.response && e.response.body && e.response.body.error;
    console.error('Failed to apply cluster settings');
    console.error(dataError || e.message);
    process.exit(1);
  }

  if (!response || response.acknowledged !== true) {
    console.error('Invalid elasticsearch response body');
    console.error(response);
    process.exit(1);
  }

  console.info('Cluster settings applied');
  process.exit(0);
};
