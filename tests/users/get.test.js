const exec = require('child_process').execFileSync;
const path = require('path');

const usersLib = require('../../lib/users');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const login = require('../utils/login');

describe('[users]: Test get features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };
  beforeAll(async () => {
    await login();
  });

  describe('eza users get', () => {
    describe('Get all user', () => {
      beforeAll(async () => {
        await usersLib.createOrUpdate(userTest.username, userTest);
      });

      it('Should get all users', () => {
        const res = exec(commandFile, ['users', 'get', '--json']).toString();
        let users = res;

        users = JSON.parse(users);

        const [user] = users.filter((e) => e.username === userTest.username);

        expect(user).toHaveProperty('username', userTest.username);
        expect(user).toHaveProperty('fullName', userTest.fullName);
        expect(user).toHaveProperty('email', userTest.email);
        expect(user).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(user?.createdAt).not.toBeNull();
        expect(user?.updatedAt).not.toBeNull();
      });

      afterAll(async () => {
        await usersLib.delete(userTest.username);
      });
    });
  });

  describe('eza users get <username>', () => {
    describe('Get user by username', () => {
      beforeAll(async () => {
        await usersLib.createOrUpdate(userTest.username, userTest);
      });

      it('Should get user', () => {
        const res = exec(commandFile, ['users', 'get', userTest.username, '--json']).toString();
        let user = res;

        user = JSON.parse(user);
        [user] = user;

        expect(user).toHaveProperty('username', userTest.username);
        expect(user).toHaveProperty('fullName', userTest.fullName);
        expect(user).toHaveProperty('email', userTest.email);
        expect(user).toHaveProperty('isAdmin', userTest.isAdmin);
        expect(user?.createdAt).not.toBeNull();
        expect(user?.updatedAt).not.toBeNull();
      });

      afterAll(async () => {
        await usersLib.delete(userTest.username);
      });
    });
  });
});
