const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const { table } = require('table');
const logger = require('../../lib/app/logger');
const usersLib = require('../../lib/users');
const rolesLib = require('../../lib/roles');
const objectsLib = require('../../lib/objects');

const updateUserRoles = async (user) => {
  await usersLib.update(user)
    .then(() => logger.info(`user ${user.username} updated`))
    .catch(error => logger.error(error));
};

const createRoleMenu = async () => {
  const indices = [];
  try {
    const { data: indicesData } = await objectsLib.findObjects('index-pattern');
    if (indicesData) {
      indicesData.saved_objects.forEach((object) => {
        if (object) {
          indices.push(object.attributes.title);
        }
      });
    }
  } catch (error) {
    return logger.error('An error occured to get indicies');
  }

  inquirer.registerPrompt('checkbox-plus', checkboxPlus);
  inquirer.registerPrompt('autocomplete', autocomplete);

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
      pageSize: Math.ceil(indices.length / 2),
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

          await updateUserRoles(user);
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

    let errors = false;
    Object.keys(result).forEach((key) => {
      if (Array.isArray(result[key]) && result[key].length <= 0) {
        logger.error(`${key} must be defined`);
        errors = true;
      }
    });

    if (errors) {
      return process.exit(1);
    }

    const data = {
      cluster: [],
      indices: [
        {
          names: result.indices,
          privileges: result.indicesPrivileges,
        },
      ],
      applications: [
        {
          application: 'kibana-.kibana',
          privileges: [`space_${result.rolePrivileges}`],
          resources: [`space:${role}`],
        },
        {
          application: 'kibana-.kibana',
          privileges: ['space_read'],
          resources: ['space:default'],
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
