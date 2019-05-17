const config = require('config');
const instance = require('./app/api');

module.exports = {
  getSpaces: (space) => {
    const url = space ? (`${config.kibanaUrl}/api/spaces/space/${space}`) : `${config.kibanaUrl}/api/spaces/space`;
    return instance.get(url);
  },

  addSpaces: defaultSpace => instance.post(`${config.kibanaUrl}/api/spaces/space`, defaultSpace),

  delSpaces: space => instance.delete(`${config.kibanaUrl}/api/spaces/space/${space}`),

  buildSpace: (space, opts) => {
    const build = {
      id: space,
      name: space,
      description: `This is the space : ${space}`,
    };

    if (opts && opts.desc) {
      build.description = opts.desc;
    }
    if (opts && opts.color) {
      if (!/^(#{1}[a-f0-9]{6})$/i.test(opts.color)) {
        return Promise.reject(new Error('Invalid color, ex: #aabbcc'));
      }
      build.color = opts.color;
    }
    if (opts && opts.initials) {
      if (!/^([a-z0-9]{0,2})$/i.test(opts.initials)) {
        return Promise.reject(new Error('Initials must be have two characters'));
      }
      build.initials = opts.initials;
    }

    return build;
  },
};
