// const { table } = require('table');
const logger = require('../../lib/app/logger');
const usersLib = require('../../lib/users');


module.exports = {
  getUsers: async (user) => {
    // curl -X GET 'http://localhost:9200/_security/user' -H 'kbn-xsrf: true'

    let response;
    try {
      response = await usersLib.getUsers(user);
      console.log(response);
    } catch (error) {
      console.error(error);
      logger.error(error);
      process.exit(1);
    }
  },
};
