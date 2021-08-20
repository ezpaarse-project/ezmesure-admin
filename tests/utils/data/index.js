const institution = {
  name: 'eza ut institution',
  index: 'eza-ut-institution',
  space: 'eza-ut-institution',
};

const user = {
  full_name: 'eza ut user',
  username: 'eza-ut-user',
  password: 'eza-ut-user',
  email: 'eza@unit.tests.fr',
  roles: ['new_user'],
  enabled: true,
};

const space = {
  name: 'eza-ut-space',
  color: '#c0392b',
  description: 'Space for eza unit tests',
  initials: 'UT',
  features: 'discover,dashboard',
  index: 'eza-ut-index',
  indexPattern: 'eza-ut-index*',
};

const role = {
  name: 'eza-role-ut',
  indexPattern: space.indexPattern,
  space: space.name,
  privileges: 'read',
};

module.exports = {
  institution,
  user,
  space,
  role,
};
