const exec = require('child_process').execFileSync;
const path = require('path');

const config = require('../../lib/app/config');

config.loadEnv();

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

module.exports = () => {
  exec(commandFile, [
    'login',
    '--username',
    'ezmesure-admin',
    '--password',
    'changeme',
  ]).toString();
};
