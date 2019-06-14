const { table } = require('table');
const logger = require('../../lib/app/logger');
const usersLib = require('../../lib/users');


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
      console.error(error);
      logger.error(error);
      return process.exit(1);
    }
    return null;
  },
};
