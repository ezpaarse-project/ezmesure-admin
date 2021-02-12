const { getAll } = require('../../../lib/institutions');

exports.command = 'reports';
exports.desc = 'Get availables reports';
exports.builder = {};
exports.handler = async function handler(argv) {
  console.log(argv);
};
