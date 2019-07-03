const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const { table } = require('table');
const logger = require('../../lib/app/logger');
const usersLib = require('../../lib/users');
const rolesLib = require('../../lib/roles');

const updateRoles = async (user) => {
  await usersLib.update(user)
    .then(() => logger.info(`user ${user.username} updated`))
    .catch(error => logger.error(error));
};

const displayRoles = async (user, roles) => {
  const { roles: results } = await inquirer.prompt([{
    type: 'checkbox-plus',
    pageSize: 50,
    name: 'roles',
    message: 'Roles',
    searchable: true,
    highlight: true,
    default: user.roles.slice(),
    source: (answersSoFar, input) => new Promise((resolve) => {
      const result = roles
        .filter(role => role.toLowerCase().includes(input.toLowerCase()));

      resolve(result);
    }),
  }]);

  if (results.length === 0) {
    return logger.error('No role(s) selected !');
  }

  user.roles = results;
  return updateRoles(user);
};

const manageRole = async (usernames) => {
  let roles;
  try {
    roles = await rolesLib.getRoles();
    roles = Object.keys(roles.data);
  } catch (error) {
    return logger.error('No role(s) found');
  }

  for (let i = 0; i < usernames.length; i += 1) {
    try {
      const { data: userData } = await usersLib.getUsers(usernames[i]);
      if (!userData) {
        return logger.error('No user(s) found');
      }

      const user = Object.values(userData)[0];

      if (!user) {
        return logger.warn(`User ${user.username} not found`);
      }

      displayRoles(user, roles);
    } catch (error) {
      logger.error(error);
    }
  }
  return null;
};

const listUsers = async (callback) => {
  try {
    const { data: users } = await usersLib.getUsers();
    const choices = Object.values(users)
      .filter(user => !user.metadata._reserved)
      .map(user => ({ name: `${user.full_name || user.username} <${user.email || ''}>`, value: user.username }));

    if (!users) {
      return logger.error('No users founds');
    }

    inquirer.registerPrompt('checkbox-plus', checkboxPlus);

    await inquirer.prompt([{
      type: 'checkbox-plus',
      pageSize: 50,
      name: 'users',
      message: 'Users',
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = choices
          .filter(choice => choice.name.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    }]).then((answers) => {
      if (answers.users.length === 0) {
        return logger.error('No user(s) selected !');
      }
      return callback(answers);
    });
  } catch (error) {
    return logger.error(error);
  }
  return null;
};

module.exports = {
  getUsers: async (users, opts) => {
    // curl -X GET 'http://localhost:9200/_security/user' -H 'kbn-xsrf: true'

    try {
      const { data: usersData } = await usersLib.getUsers(users);

      if (!usersData) {
        logger.error('No user(s) found');
        return null;
      }

      if (usersData) {
        if (opts && opts.json) {
          return console.log(JSON.stringify(usersData, null, 2));
        }

        if (opts && !opts.json) {
          const header = ['Full name', 'username', 'roles', 'email'];

          const lines = Object.keys(usersData).map(user => [
            usersData[user].full_name,
            usersData[user].username,
            usersData[user].roles,
            usersData[user].email,
          ]);

          console.log(table([header, ...lines]));
        }
      }
    } catch (error) {
      logger.error(error);
      return process.exit(1);
    }
    return null;
  },

  userRoles: () => listUsers(answers => manageRole(answers.users)),
};
