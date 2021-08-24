const exec = require('child_process').execFileSync;
const path = require('path');

const config = require('../../lib/app/config');

config.loadEnv();

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const { EZMESURE_ADMIN_USERNAME, EZMESURE_ADMIN_PASSWORD } = process.env;

module.exports = () => {
  expect(EZMESURE_ADMIN_USERNAME).toBeDefined();
  expect(EZMESURE_ADMIN_PASSWORD).toBeDefined();

  const res = exec(commandFile, [
    'login',
    '--username',
    EZMESURE_ADMIN_USERNAME,
    '--password',
    EZMESURE_ADMIN_PASSWORD,
  ]).toString();

  expect(res).toContain(`user [${EZMESURE_ADMIN_USERNAME}] logged in successfully`);
};
