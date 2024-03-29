const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const lget = require('lodash.get');
const lset = require('lodash.set');
const lmerge = require('lodash.merge');

const config = {
  timeout: 10000,
  ezmesure: {
    baseUrl: 'https://ezmesure.couperin.org/api',
    token: '',
  },
  elastic: {
    baseUrl: 'https://ezmesure.couperin.org/elastic',
    user: 'elastic',
    pass: 'changeme',
  },
};

let scopes;

/**
 * Find the nearest config file
 * @param <String> startPath  optional start path, defaults to working dir
 */
function findLocalConfig(startPath) {
  const dir = path.resolve(startPath || process.cwd());

  try {
    fs.statSync(path.resolve(dir, '.ezmesurerc'));
    return path.resolve(dir, '.ezmesurerc');
  } catch (err) {
    if (err.code !== 'ENOENT') { return Promise.reject(err); }
  }

  if (path.dirname(dir) !== dir) {
    return findLocalConfig(path.dirname(dir));
  }

  return null;
}

function watch(requiredConfigVars) {
  const emptyConfigVars = requiredConfigVars.filter((configVar) => !lget(config, configVar));

  if (emptyConfigVars.length) {
    console.log('*** Please, configure me before use.\n');
    console.log('Run\n');

    emptyConfigVars.forEach((conf) => {
      console.log(`  ezmesure-admin config set --global ${conf} <value>`);
    });

    console.log('\nDelete --global to make settings only in this repository.');
    process.exit(1);
  }
}

/**
 * Load config files
 */
function loadEnv() {
  scopes = {
    global: { location: path.resolve(os.homedir(), '.config', 'ezmesure-admin', 'config.json') },
    local: { location: findLocalConfig() || path.resolve(process.cwd(), '.ezmesurerc') },
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const type of Object.keys(scopes)) {
    try {
      const content = JSON.parse(fs.readFileSync(scopes[type].location, 'utf-8'));
      lmerge(config, content);
      scopes[type].config = content;
    } catch (e) {
      if (e.code === 'ENOENT') {
        scopes[type].config = {};
      } else {
        throw e;
      }
    }
  }

  return scopes;
}

/**
 * Get config scopes, load environment if necessary
 */
function getScopes() {
  return scopes || loadEnv();
}

module.exports = {
  config,
  loadEnv,
  getScopes,
  watch,
  get(param, defaultValue) { return lget(config, param, defaultValue); },
  set(param, value) { return lset(config, param, value); },
};
