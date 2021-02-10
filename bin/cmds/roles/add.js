const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const tableprompt = require('inquirer-table-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);
inquirer.registerPrompt('table', tableprompt);

const { createRole, getRoles } = require('../../../lib/roles');
const { getSpaces } = require('../../../lib/spaces');
const { findObjects } = require('../../../lib/objects');

exports.command = 'add <role>';
exports.desc = 'Create new role';
exports.builder = {};

const createRoleMenu = async () => {
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

  const indicesPrivileges = [
    'all',
    'create',
    'create_index',
    'index',
    'manage',
    'manage_follow_index',
    'manage_ilm',
    'manage_leader_index',
    'monitor',
    'read',
    'read_cross_cluster',
    'view_index_metadata',
    'write',
  ];

  return inquirer.prompt([
    {
      type: 'checkbox-plus',
      name: 'indices',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: '[Elastic] Indice :',
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = indices
          .filter(indice => indice.includes(input));

        resolve(result);
      }),
    },
    {
      type: 'checkbox-plus',
      name: 'indicesPrivileges',
      message: '[Elastic] Indices privileges :',
      pageSize: indicesPrivileges.length,
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = indicesPrivileges
          .filter(privilege => privilege.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    },
    {
      type: 'checkbox-plus',
      name: 'spaces',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: '[Kibana] Spaces :',
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = spaces
          .filter(space => space.includes(input));

        resolve(result);
      }),
    },
  ]);
};

exports.handler = async function handler(argv) {
  const { role: roleName } = argv;

  try {
    await getRoles(roleName);
    console.log(`role [${roleName}] already exists`);
    process.exit(0);
  } catch (error) {
    console.log(`role [${roleName}] can be create`);
  }

  let result;
  try {
    result = await createRoleMenu(roleName);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!result) {
    console.error('An error occured to create role');
    process.exit(1);
  }

  const { spacePrivileges } = await inquirer.prompt([
    {
      type: 'table',
      name: 'spacePrivileges',
      message: 'Space privileges',
      pageSize: result.spaces.length,
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
      rows: result.spaces.map((space, index) => ({ name: space, value: index })),
    },
  ]);

  const applications = [];
  spacePrivileges.forEach((privilege, index) => {
    if (!privilege) { return; }

    applications.push({
      application: 'kibana-.kibana',
      privileges: [`space_${privilege}`],
      resources: [
        `space:${result.spaces[index]}`,
      ],
    });
  });

  const data = {
    cluster: [],
    indices: [
      {
        names: result.indices,
        privileges: result.indicesPrivileges,
      },
    ],
    applications,
  };

  let response;
  try {
    const { body } = await createRole(roleName, data);
    response = body;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (response && response.role) {
    if (response.role.created) {
      console.log(`role [${roleName}] created succefully`);
      process.exit(0);
    }

    console.error(`role [${roleName}] creation failed`);
    process.exit(1);
  }
};
