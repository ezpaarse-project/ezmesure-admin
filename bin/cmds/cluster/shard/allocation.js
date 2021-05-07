const { i18n } = global;

const { setShardAllocation } = require('../../../../lib/cluster');

exports.command = 'allocation <type>';
exports.desc = i18n.t('cluster.shard.allocation.description');
exports.builder = function builder(yargs) {
  return yargs.positional('type', {
    describe: i18n.t('cluster.shard.allocation.options.type'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const validValues = new Set(['primaries', 'new_primaries', 'all', 'none', 'null']);

  let { type } = argv;

  if (!validValues.has(type)) {
    console.log().error(i18n.t('cluster.shard.allocation.invalidValue', { type, values: Array.from(validValues).join(', ') }));
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
    console.error(i18n.t('cluster.shard.allocation.failedToApply'));
    console.error(dataError || e.message);
    process.exit(1);
  }

  if (!response || response.acknowledged !== true) {
    console.error(i18n.t('cluster.invalidReponse'));
    console.error(response);
    process.exit(1);
  }

  console.info(i18n.t('cluster.shard.allocation.applied'));
  process.exit(0);
};
