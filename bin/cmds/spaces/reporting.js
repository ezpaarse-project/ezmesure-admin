const { i18n } = global;

exports.command = 'reporting <command>';
exports.desc = i18n.t('spaces.reporting.description');
exports.handler = function handler() {};
exports.builder = function builder(yargs) {
  return yargs.commandDir('reporting');
};
