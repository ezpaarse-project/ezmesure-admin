const chalk = require('chalk');

const red = chalk.hex('#e55039').bold;
const green = chalk.hex('#78e08f').bold;
const blue = chalk.hex('#3498DB').bold;
const yellow = chalk.hex('#F4D03F').bold;

let level = 2;

async function setLevel(newLogLevel) {
  if (typeof newLogLevel === 'string') {
    if (newLogLevel === 'error') {
      level = 0;
    }
    if (newLogLevel === 'warn') {
      level = 1;
    }
    if (newLogLevel === 'info') {
      level = 2;
    }
    if (newLogLevel === 'verbose') {
      level = 3;
    }
  }
  if (typeof newLogLevel === 'number') {
    if (newLogLevel >= 0 && newLogLevel < 4) {
      level = newLogLevel;
    }
  }
}

async function error(message) {
  if (level >= 0) {
    const levelMessage = red('error:');
    console.log(`${levelMessage} ${message}`);
  }
}

async function warn(message) {
  if (level >= 1) {
    const levelMessage = yellow('warn:');
    console.log(`${levelMessage} ${message}`);
  }
}

async function info(message) {
  if (level >= 2) {
    const levelMessage = green('info:');
    console.log(`${levelMessage} ${message}`);
  }
}

async function verbose(message) {
  if (level >= 3) {
    const levelMessage = blue('verbose:');
    console.log(`${levelMessage} ${message}`);
  }
}

module.exports = {
  level,
  setLevel,
  info,
  error,
  warn,
  verbose,
};
