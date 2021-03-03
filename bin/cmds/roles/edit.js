const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const tableprompt = require('inquirer-table-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);
inquirer.registerPrompt('table', tableprompt);

const { updateRole, getRoles } = require('../../../lib/roles');
const { getSpaces } = require('../../../lib/spaces');
const { findObjects } = require('../../../lib/objects');

const createRoleMenu = async (dataRole) => {
  const indices = [];
  try {
    const { data } = await findObjects('index-pattern');
    data.saved_objects.forEach((object) => {
      if (object) {
        indices.push(object.attributes.title);
      }
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  let spaces;
  try {
    const { data } = await getSpaces();
    spaces = data.map(({ id }) => id);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  const { indicesSelected } = await inquirer.prompt([{
    type: 'checkbox-plus',
    name: 'indicesSelected',
    pageSize: 20,
    searchable: true,
    highlight: true,
    message: '[Elastic] Indice :',
    source: (answersSoFar, input) => new Promise((resolve) => {
      const result = indices
        .filter((indice) => indice.includes(input));

      resolve(result);
    }),
  }]);

  let indicesPrivileges;
  if (indicesSelected.length) {
    const { indicePrivileges } = await inquirer.prompt([
      {
        type: 'table',
        name: 'indicePrivileges',
        message: 'Elastic] Indices privileges :',
        pageSize: indicesSelected.length,
        columns: [
          {
            name: 'all',
            value: 'all',
          },
          {
            name: 'create',
            value: 'create',
          },
          {
            name: 'create_index',
            value: 'create_index',
          },
          {
            name: 'index',
            value: 'index',
          },
          {
            name: 'manage',
            value: 'manage',
          },
          {
            name: 'manage_follow_index',
            value: 'manage_follow_index',
          },
          {
            name: 'manage_ilm',
            value: 'manage_ilm',
          },
          {
            name: 'manage_leader_index',
            value: 'manage_leader_index',
          },
          {
            name: 'monitor',
            value: 'monitor',
          },
          {
            name: 'read',
            value: 'read',
          },
          {
            name: 'read_cross_cluster',
            value: 'read_cross_cluster',
          },
          {
            name: 'view_index_metadata',
            value: 'view_index_metadata',
          },
          {
            name: 'write',
            value: 'write',
          },
        ],
        rows: indicesSelected.map((space, index) => ({ name: space, value: index })),
      },
    ]);

    indicesPrivileges = indicePrivileges;
  }

  const { spacesSelected } = await inquirer.prompt([{
    type: 'checkbox-plus',
    name: 'spacesSelected',
    pageSize: 20,
    searchable: true,
    highlight: true,
    message: '[Kibana] Spaces :',
    source: (answersSoFar, input) => new Promise((resolve) => {
      const result = spaces
        .filter((space) => space.includes(input));

      resolve(result);
    }),
  }]);

  let spacesPrivileges;
  if (spacesSelected.length) {
    const { spacePrivileges } = await inquirer.prompt([
      {
        type: 'table',
        name: 'spacePrivileges',
        message: 'Space privileges',
        pageSize: spacesSelected.length,
        columns: [
          {
            name: 'All',
            value: 'all',
          },
          {
            name: 'Read',
            value: 'read',
          },
          {
            name: 'None',
            value: undefined,
          },
        ],
        rows: spacesSelected.map((space, index) => ({ name: space, value: index })),
      },
    ]);

    spacesPrivileges = spacePrivileges;
  }

  return {
    indicesSelected,
    indicesPrivileges,
    spacesSelected,
    spacesPrivileges,
  };
};

exports.command = 'edit [role]';
exports.desc = 'Edit role';
exports.builder = function builder(yargs) {
  return yargs.positional('role', {
    describe: 'Role name, case sensitive',
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const { role: roleName } = argv;

  let dataRole;
  try {
    const { body } = await getRoles(roleName);
    if (body) { dataRole = body[roleName]; }
  } catch (error) {
    console.log(`role [${roleName}] does not exists`);
    process.exit(0);
  }

  let result;
  try {
    result = await createRoleMenu(dataRole);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!result) {
    console.error('An error occured to edit role');
    process.exit(1);
  }

  const {
    indicesSelected,
    indicesPrivileges,
    spacesSelected,
    spacesPrivileges,
  } = result;

  const indices = [];
  indicesPrivileges.forEach((privilege, index) => {
    if (!privilege) { return; }

    indices.push(
      {
        names: [indicesSelected[index]],
        privileges: [
          privilege,
        ],
      },
    );
  });

  const applications = [];
  spacesPrivileges.forEach((privilege, index) => {
    if (!privilege) { return; }

    applications.push({
      application: 'kibana-.kibana',
      privileges: [`space_${privilege}`],
      resources: [
        `space:${spacesSelected[index]}`,
      ],
    });
  });

  const data = {
    cluster: [],
    indices,
    applications,
  };

  let response;
  try {
    const { body } = await updateRole(roleName, data);
    response = body;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (response && response.role) {
    if (!response.role.created) {
      console.log(`role [${roleName}] updated succefully`);
      process.exit(0);
    }

    console.error(`role [${roleName}] update failed`);
    process.exit(1);
  }
};
