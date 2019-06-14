const { table } = require('table');
const logger = require('../../lib/app/logger');
const rolesLib = require('../../lib/roles');
const usersLib = require('../../lib/users');

const roleAndUserExists = async (role, user) => {
  try {
    const { data: roleData } = await rolesLib.getRoles(role);
    if (!roleData) {
      logger.error('No role(s) found');
      return null;
    }

    if (roleData) {
      const { data: userData } = await usersLib.getUsers(user);
      if (!userData) {
        logger.error('No user(s) found');
        return null;
      }

      if (userData) { return userData; }
    }
  } catch (error) {
    console.error(error);
    logger.error(error);
    process.exit(1);
    return null;
  }
  return null;
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
            // console.log(roleName, application, appPrivileges, appResources)

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
      console.error(error);
      logger.error(error);
      return process.exit(1);
    }
    return null;
  },

  addRole: async (role, usernames) => {
    // curl -X GET 'http://localhost:9200/_security/user' -H 'kbn-xsrf: true'

    try {
      for (let i = 0; i < usernames.length; i += 1) {
        const userData = await roleAndUserExists(role, usernames[i]);
        if (userData) {
          userData[usernames[i]].roles.push(role);
          const response = await usersLib.update(usernames[i], {
            roles: userData[usernames[i]].roles,
          });
          if (response.status === 200) {
            logger.info(`Role ${role} added to ${usernames[i]}`);
          } else {
            logger.error(`An error occurred when adding the role ${role}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      logger.error(error);
      return process.exit(1);
    }
    return null;
  },

  delRole: async (role, usernames) => {
    // curl -X GET 'http://localhost:9200/_security/user' -H 'kbn-xsrf: true'

    try {
      for (let i = 0; i < usernames.length; i += 1) {
        const userData = await roleAndUserExists(role, usernames[i]);
        if (userData) {
          const roles = userData[usernames[i]].roles.find(r => r !== role);
          const response = await usersLib.update(usernames[i], { roles });
          if (response.status === 200) {
            logger.info(`Role ${role} deleted to ${usernames[i]}`);
          } else {
            logger.error(`An error occurred when deleting the role ${role}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      logger.error(error);
      return process.exit(1);
    }
    return null;
  },
};
