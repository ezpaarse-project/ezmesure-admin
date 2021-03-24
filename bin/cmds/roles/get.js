const { table } = require('table');
const rolesLib = require('../../../lib/roles');

exports.command = 'get <role>';
exports.desc = 'Get and display role informations';
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: 'Display data in json',
  });
};
exports.handler = async function handler(argv) {
  const { role: roleName } = argv;

  let role;

  try {
    const { body } = await rolesLib.findByName(roleName);
    if (body) { role = body; }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  if (!role) {
    console.log(`${roleName} role not found.`);
    process.exit(0);
  }

  if (argv && argv.json) {
    console.log(JSON.stringify(role, null, 2));
    process.exit(0);
  }

  const header = ['role', 'indices', 'applications'];

  const { indices, applications } = role[roleName];

  const [indicesNames, indicesPrivileges] = indices.map((indice) => [
    indice.names, indice.privileges,
  ]);

  const application = applications.map((appli) => appli.application);
  const row = [
    [
      roleName,
      `Names: ${indicesNames || ''}\nPrivileges: ${indicesPrivileges || ''}`,
      `Application: ${application || ''}`,
    ],
  ];

  console.log(table([header, ...row]));
};
