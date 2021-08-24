const exec = require('child_process').execFileSync;
const path = require('path');

const login = require('./utils/login');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

describe('configuation tests', () => {
  beforeAll(() => login());

  it('#1 Set locally key:value', () => {
    const res = exec(commandFile, ['config', 'set', 'locally', 'local']).toString();

    expect(res).toBeDefined();
    expect(res).toBe('');
  });

  it('#2 Get local configuration', () => {
    let res = exec(commandFile, ['config', 'view', '--local']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toBeDefined();
    expect(res).toHaveProperty('locally', 'local');
  });

  it('#3 Set globally key:value', () => {
    const res = exec(commandFile, ['config', 'set', '--global', 'globaly', 'global']).toString();

    expect(res).toBe('');
  });

  it('#4 Get global configuration', () => {
    let res = exec(commandFile, ['config', 'view', '--global']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toHaveProperty('globaly', 'global');
  });

  it('#5 Delete local and global key from configuration', () => {
    const local = exec(commandFile, ['config', 'delete', 'locally']).toString();
    expect(local).toContain('Config key [locally] has been removed successfully');

    const global = exec(commandFile, ['config', 'delete', '--global', 'globaly']).toString();
    expect(global).toContain('Config key [globaly] has been removed successfully');
  });

  it('#6 Get merged configuration', () => {
    let res = exec(commandFile, ['config', 'view']).toString();

    try {
      res = JSON.parse(res);
    } catch (error) {
      console.error(error);
    }

    expect(res).toHaveProperty('elastic');
    expect(res).toHaveProperty('ezmesure');
  });
});
