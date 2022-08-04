const ezmesure = require('./app/ezmesure');

function ns(spaceId) {
  const space = spaceId ? `/s/${spaceId}` : '';
  return `/kibana${space}/api`;
}

exports.spaces = {
  getAll: () => ezmesure.get(`${ns()}/spaces/space`),
  get: ({ id } = {}) => ezmesure.get(`${ns()}/spaces/space/${id}`),
  create: ({ body } = {}) => ezmesure.post(`${ns()}/spaces/space`, body),
  update: ({ id, body } = {}) => ezmesure.put(`${ns()}/spaces/space/${id}`, body),
  delete: ({ id } = {}) => ezmesure.delete(`${ns()}/spaces/space/${id}`),
};

exports.indexPatterns = {
  create: ({ space, body } = {}) => ezmesure.post(`${ns(space)}/index_patterns/index_pattern`, body),
  get: ({ id } = {}) => ezmesure.get(`${ns()}/index_patterns/index_pattern/${id}`),
  update: ({ id, space, body } = {}) => ezmesure.put(`${ns(space)}/index_patterns/index_pattern/${id}`, body),
  delete: ({ id, space } = {}) => ezmesure.delete(`${ns(space)}/index_patterns/index_pattern/${id}`),
  getDefault: ({ space }) => ezmesure.get(`${ns(space)}/index_patterns/default`),
  setDefault: ({ space, body }) => ezmesure.post(`${ns(space)}/index_patterns/default`, body),
};

exports.savedObjects = {
  find: ({ space, params } = {}) => ezmesure.get(`${ns(space)}/saved_objects/_find`, { params }),
};
