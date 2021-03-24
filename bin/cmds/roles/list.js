const { table } = require('table');
const rolesLib = require('../../../lib/roles');

exports.command = 'list';
exports.desc = 'List all roles';
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: 'Display data in json',
  });
};
exports.handler = async function handler(argv) {
  let roles;

  try {
    const { body } = await rolesLib.findAll();
    if (body) { roles = body; }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  if (!roles) {
    console.log('Roles not found.');
    process.exit(0);
  }

  if (argv && argv.json) {
    console.log(JSON.stringify(roles, null, 2));
    process.exit(0);
  }

  const header = ['role', 'indices', 'applications'];

  const rows = Object.keys(roles).map((roleName) => {
    const { indices, applications } = roles[roleName];

    const [indicesNames, indicesPrivileges] = indices.map((indice) => [
      indice.names, indice.privileges,
    ]);

    const application = applications.map((appli) => appli.application);
    return [
      roleName,
      `Names: ${indicesNames || ''}\nPrivileges: ${indicesPrivileges || ''}`,
      `Application: ${application || ''}`,
    ];
  });

  console.log(table([header, ...rows]));
};
