const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const { user } = require('./utils/data');
const usersLib = require('../lib/users');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('Users tests', () => {
  beforeEach(() => login());

  it(`Create new user [${user.username}]`, () => {
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

  it(`Add role [new_user] to user [${user.username}]`, () => {
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

  it(`Get user [${user.username}]`, () => {
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

  it('Get all users', () => {
    const res = exec(commandFile, ['users', 'get', '--size', 1, '--json']);

    let users = res.toString();

    try {
      users = JSON.parse(users);
    } catch (error) {
      console.error(error);
    }

    const fields = ['metadata', 'full_name', 'roles', 'email', 'username'];

    expect(users.length).not.toBe(0);
    expect(Object.keys(users[0])).toEqual(fields);
    expect(Object.keys(users[0]).length).toEqual(fields.length);
  });

  it(`Delete user [${user.username}]`, async () => {
    const res = await usersLib.delete(user.username);
    expect(res.status).toBe(204);
  });
});
