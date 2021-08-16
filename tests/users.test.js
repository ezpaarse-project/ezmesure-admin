const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');
const { userTest } = require('./utils/data');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('Users tests', () => {
  beforeEach(() => login());

  it(`Create new user [${userTest.username}]`, () => {
    const res = exec(commandFile, [
      'users',
      'add',
      userTest.username,
      userTest.password,
      '--email', userTest.email,
      '--full-name', userTest.full_name,
      '--roles', userTest.roles.join(','),
      '--enabled', userTest.enabled,
    ]).toString();

    expect(res).toMatch(`user [${userTest.username}] created or updated`);
  });

  it(`Add role [new_user] to user [${userTest.username}]`, () => {
    const res = exec(commandFile, [
      'users',
      'roles',
      'add',
      userTest.username,
      '--roles',
      'new_user',
    ]).toString();

    expect(res).toMatch(`role(s) [new_user] added to user [${userTest.username}]`);
  });

  it(`Get user [${userTest.username}]`, () => {
    const res = exec(commandFile, ['users', 'get', userTest.username, '--json']);

    let user = res.toString();

    try {
      user = JSON.parse(user);
    } catch (error) {
      console.error(error);
    }

    user = user.pop();

    expect(user).toHaveProperty('username', userTest.username);
    expect(user).toHaveProperty('email', userTest.email);
    expect(user).toHaveProperty('full_name', userTest.full_name);
    expect(user.roles).toStrictEqual(userTest.roles);
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

    expect(users.length).toBe(1);
    expect(Object.keys(users[0])).toEqual(fields);
    expect(Object.keys(users[0]).length).toEqual(fields.length);
  });
});
