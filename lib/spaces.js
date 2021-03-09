const instance = require('./app/kibana');

module.exports = {
  findAll: () => instance.get('/api/spaces/space'),

  findById: (space) => instance.get(`/api/spaces/space/${space}`),

  add: (defaultSpace) => instance.post('/api/spaces/space', defaultSpace),

  delete: (space) => instance.delete(`/api/spaces/space/${space}`),

  build: (opts) => {
    const build = {};

    if (opts && opts.description) {
      build.description = opts.description;
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

    return Promise.resolve(build);
  },
};
