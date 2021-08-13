const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const { EZMESURE_ADMIN_USERNAME } = process.env;

describe('ezMESURE user tests', () => {
  test(`Login ezMESURE user [${EZMESURE_ADMIN_USERNAME}]`, () => {
    const res = login().toString();

    expect(res).toContain('logged in successfully');
  });

  test('Get ezMESURE profile', () => {
    const res = exec(commandFile, ['profile']).toString();

    expect(res).toContain('You are authenticated as');
  });

  test('Logout ezMESURE user', () => {
    const res = exec(commandFile, ['logout']).toString();

    expect(res).toContain('Removing login credentials for');
  });
});
