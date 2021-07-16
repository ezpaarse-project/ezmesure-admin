const { i18n } = global;

const indicesLib = require('../../../lib/indices');

exports.command = 'add <index>';
exports.desc = i18n.t('indices.add.description');
exports.builder = function builder(yargs) {
  return yargs.positional('index', {
    describe: i18n.t('indices.add.options.index'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const { index } = argv;

  try {
    await indicesLib.create(index);
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  console.log(i18n.t('indices.add.create', { index }));
};
