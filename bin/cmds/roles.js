const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const { table } = require('table');
const logger = require('../../lib/app/logger');
const usersLib = require('../../lib/users');
const rolesLib = require('../../lib/roles');
const indiciesLib = require('../../lib/indicies');

const updateRoles = async (user) => {
  await usersLib.update(user)
    .then(() => logger.info(`user ${user.username} updated`))
    .catch(error => logger.error(error));
};

const createRoleMenu = async () => {
  let indices;
  try {
    const { data: indicesData } = await indiciesLib.getIndicies();
    if (indicesData) {
      indices = indicesData.split('\n').filter(indice => (indice.charAt(0) !== '.'));
    }
  } catch (error) {
    return logger.error('An error occured to get indicies');
  }

  inquirer.registerPrompt('checkbox-plus', checkboxPlus);
  inquirer.registerPrompt('autocomplete', autocomplete);

  const indicePrivileges = [
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
      type: 'autocomplete',
      name: 'indice',
      pageSize: 20,
      message: '[Elastic] Indice :',
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = indices
          .filter(indice => indice.includes(input));

        resolve(result);
      }),
    },
    {
      type: 'checkbox-plus',
      name: 'indicePrivileges',
      message: '[Elastic] Indice privileges :',
      pageSize: indicePrivileges.length,
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = indicePrivileges
          .filter(privilege => privilege.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    },
    {
      type: 'list',
      name: 'minimumRolePrivileges',
      message: '[Kibana] Minimum privileges for all spaces (default: none) :',
      choices: ['none', 'read'],
      default: ['none'],
    },
    {
      type: 'list',
      name: 'rolePrivileges',
      message: '[Kibana] Role privileges :',
      choices: ['read', 'all'],
    },
  ]);
};

module.exports = {
  getRoles: async (role, opts) => {
    // curl -X GET 'http://localhost:9200/_security/roles' -H 'kbn-xsrf: true'

    try {
      const { data: rolesData } = await rolesLib.getRoles(role);

      if (!rolesData) {
        logger.error('No role(s) found');
        return null;
      }

      if (rolesData) {
        if (opts && opts.json) {
          return console.log(JSON.stringify(rolesData, null, 2));
        }

        if (opts && !opts.json) {
          const header = ['role', 'indices', 'applications'];

          const lines = Object.keys(rolesData).map((roleName) => {
            const { indices, applications } = rolesData[roleName];

            const [indicesNames, indicesPrivileges] = indices.map(indice => [
              indice.names, indice.privileges,
            ]);

            const [application, appPrivileges, appResources] = applications.map(appli => [
              appli.application, appli.privileges, appli.resources,
            ]);

            return [
              roleName,
              `Names: ${indicesNames || '-'}\nPrivileges: ${indicesPrivileges || '-'}`,
              `Application: ${application || '-'}\nPrivileges: ${appPrivileges || '-'}\nResources: ${appResources || '-'}`,
            ];
          });

          console.log(table([header, ...lines]));
        }
      }
    } catch (error) {
      return logger.error(error);
    }
    return null;
  },

  manageRole: async (role, usernames, addition) => {
    // curl -X GET 'http://localhost:9200/_security/user' -H 'kbn-xsrf: true'

    for (let i = 0; i < usernames.length; i += 1) {
      try {
        const { data: userData } = await usersLib.getUsers(usernames[i]);

        if (!userData) {
          logger.error('No user(s) found');
        }

        if (userData) {
          const user = Object.values(userData)[0];

          if (addition) {
            user.roles.push(role);
          }

          if (!addition) {
            user.roles = user.roles.find(userRole => userRole !== role);
          }

          await updateRoles(user);
        }
      } catch (error) {
        logger.error(`An error occurred when update role ${role} for ${usernames[i]}`);
      }
    }
    return null;
  },

  createRole: async (role) => {
    let result;
    try {
      result = await createRoleMenu(role);
    } catch (error) {
      return logger.error('Error to display interface');
    }

    if (!result) {
      return logger.warn('An error occured to create role');
    }

    const data = {
      cluster: [],
      indices: [
        {
          names: result.indice,
          privileges: result.indicePrivileges,
        },
      ],
      applications: [
        {
          application: 'kibana-.kibana',
          privileges: [`space_${result.rolePrivileges}`],
          resources: [`space:${role}`],
        },
      ],
    };

    try {
      const { data: response } = await rolesLib.createRole(role, data);
      if (response && response.role) {
        if (response.role.created) {
          return logger.info('Role created succefully');
        }

        return logger.error('An error occured during role creation');
      }
    } catch (error) {
      logger.error(error);
      return process.exit(1);
    }
    return null;
  },

};
