const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const usersLib = require('../lib/users');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const user = {
  full_name: 'eza ut user',
  username: 'eza-ut-user',
  password: 'eza-ut-user',
  email: 'eza@unit.tests.fr',
  roles: ['new_user'],
  enabled: true,
};

describe('users tests', () => {
  beforeAll(() => login());

  it(`#1 Create new user [${user.username}]`, () => {
    const res = exec(commandFile, [
      'users',
      'add',
      user.username,
      user.password,
      '--email', user.email,
      '--full-name', user.full_name,
      '--roles', user.roles.join(','),
      '--enabled', user.enabled,
    ]).toString();

    expect(res).toMatch(`user [${user.username}] created or updated`);
  });

  it(`#2 Add role [new_user] to user [${user.username}]`, () => {
    const res = exec(commandFile, [
      'users',
      'roles',
      'add',
      user.username,
      '--roles',
      'new_user',
    ]).toString();

    expect(res).toMatch(`role(s) [new_user] added to user [${user.username}]`);
  });

  it(`#3 Get user [${user.username}]`, () => {
    const res = exec(commandFile, ['users', 'get', user.username, '--json']);

    let userData = res.toString();

    try {
      userData = JSON.parse(userData);
    } catch (error) {
      console.error(error);
    }

    userData = userData.pop();

    expect(userData).toHaveProperty('username', user.username);
    expect(userData).toHaveProperty('email', user.email);
    expect(userData).toHaveProperty('full_name', user.full_name);
    expect(userData.roles).toStrictEqual(user.roles);
  });

  it('#4 Get all users', () => {
    const res = exec(commandFile, ['users', 'get', '--size', 1, '--json']);

    let users = res.toString();

    try {
      users = JSON.parse(users);
    } catch (error) {
      console.error(error);
    }

    const fields = ['metadata', 'full_name', 'roles', 'email', 'username'];

    expect(users).toHaveLength(1);
    expect(Object.keys(users[0])).toStrictEqual(expect.arrayContaining(fields));
    expect(Object.keys(users[0])).toHaveLength(fields.length);
  });

  afterAll(async () => {
    // Delete user after tests
    const res = await usersLib.delete(user.username);
    expect(res).toHaveProperty('status', 204);
  });
});
