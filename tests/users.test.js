const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const testUser = {
  full_name: 'ezmesure-admin unit tests',
  username: 'ezmesure-admin-unit-tests',
  password: 'ezmesure-admin-unit-tests',
  email: 'ezmesure-admin@unit.tests.fr',
  roles: ['new_user'],
  enabled: true,
};

describe('Users tests', () => {
  beforeEach(() => login());

  test(`Create new user [${testUser.username}]`, () => {
    const res = exec(commandFile, [
      'users',
      'add',
      testUser.username,
      testUser.password,
      '--email',
      testUser.email,
      '--full-name',
      testUser.full_name,
      '--roles',
      testUser.roles.join(','),
      '--enabled',
      testUser.enabled,
    ]).toString();

    expect(res).toMatch(`user [${testUser.username}] created or updated`);
  });

  test(`Add role [new_user] to user [${testUser.username}]`, () => {
    const res = exec(commandFile, [
      'users',
      'roles',
      'add',
      testUser.username,
      '--roles',
      'new_user',
    ]).toString();

    expect(res).toMatch(`role(s) [new_user] added to user [${testUser.username}]`);
  });

  test(`Get user [${testUser.username}]`, () => {
    const res = exec(commandFile, ['users', 'get', testUser.username, '--json']);

    let user = res.toString();

    try {
      user = JSON.parse(user);
    } catch (error) {
      console.error(error);
    }

    user = user.pop();

    expect(user.username).toMatch(testUser.username);
    expect(user.email).toMatch(testUser.email);
    expect(user.full_name).toMatch(testUser.full_name);
    expect(user.roles).toStrictEqual(testUser.roles);
  });

  test('Get all users', () => {
    const res = exec(commandFile, ['users', 'get', '--size', 1, '--json']);

    let users = res.toString();

    try {
      users = JSON.parse(users);
    } catch (error) {
      console.error(error);
    }

    const fields = ['metadata', 'full_name', 'roles', 'email', 'username'];

    expect(users.length).toBe(1);
    expect(Object.keys(users[0])).toEqual(fields);
    expect(Object.keys(users[0]).length).toEqual(fields.length);
  });
});
