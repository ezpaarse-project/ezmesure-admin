const exec = require('child_process').execFileSync;
const path = require('path');

const usersLib = require('../../lib/users');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const login = require('../utils/login');

describe('[users]: Test add features', () => {
  const userTest = {
    username: 'user.test',
    email: 'user.test@test.fr',
    fullName: 'User test',
    isAdmin: false,
  };
  beforeAll(async () => {
    await login();
  });

  describe('eza users add', () => {
    describe('Add new user', () => {
      it('Should add user', () => {
        const res = exec(commandFile, ['users', 'add', userTest.username, userTest.fullName, userTest.email, userTest.isAdmin]).toString();

        const testMessage = res.includes(`User [${userTest.username}] is upserted`);
        expect(testMessage).toBe(true);
      });

      it('Should get user', async () => {
        const { data } = await usersLib.getByUsername(userTest.username, userTest);

        const user = data;

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

    describe('Update new user', () => {
      const userTestUpdated = {
        username: 'user.test',
        email: 'user.test.updated@test.fr',
        fullName: 'User test updated',
        isAdmin: false,
      };
      beforeAll(async () => {
        await usersLib.createOrUpdate(userTest.username, userTest);
      });

      it('Should add user', () => {
        const res = exec(commandFile, ['users', 'add', userTest.username, userTestUpdated.fullName, userTestUpdated.email, userTest.isAdmin]).toString();

        const testMessage = res.includes(`User [${userTest.username}] is upserted`);
        expect(testMessage).toBe(true);
      });

      it('Should get user', async () => {
        const { data } = await usersLib.getByUsername(userTest.username);

        const user = data;

        expect(user).toHaveProperty('username', userTestUpdated.username);
        expect(user).toHaveProperty('fullName', userTestUpdated.fullName);
        expect(user).toHaveProperty('email', userTestUpdated.email);
        expect(user).toHaveProperty('isAdmin', false);
        expect(user?.createdAt).not.toBeNull();
        expect(user?.updatedAt).not.toBeNull();
      });

      afterAll(async () => {
        await usersLib.delete(userTest.username);
      });
    });
  });
});
