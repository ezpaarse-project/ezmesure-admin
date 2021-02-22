const instance = require('./app/kibana');

module.exports = {
  getSpaces: (space) => instance.get(space ? (`/api/spaces/space/${space}`) : '/api/spaces/space'),

  addSpaces: (defaultSpace) => instance.post('/api/spaces/space', defaultSpace),

  delSpaces: (space) => instance.delete(`/api/spaces/space/${space}`),

  buildSpace: (space, opts) => {
    const build = {
      id: space,
      name: space,
      description: `Espace dédié à ${space}`,
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
