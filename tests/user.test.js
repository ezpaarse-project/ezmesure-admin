const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const { EZMESURE_ADMIN_USERNAME } = process.env;

describe('ezMESURE user tests', () => {
  beforeAll(() => login());

  it('#1 Get ezMESURE profile', () => {
    const res = exec(commandFile, ['profile']).toString();

    expect(res).toContain(`You are authenticated as ${EZMESURE_ADMIN_USERNAME}`);
  });

  it('#2 Logout ezMESURE user', () => {
    const res = exec(commandFile, ['logout']).toString();

    expect(res).toContain('Removing login credentials for');
  });
});
